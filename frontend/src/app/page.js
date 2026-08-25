'use client';

import { useState, useEffect } from 'react';
import Navigation from '../../components/layout/Navigation';
import api from '../../lib/api';
import './dashboard.css';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total_products: 0,
    total_devices: 0,
    in_stock: 0,
    sold: 0,
    total_extra_expenses: 0,
    stock_value: 0,
    total_revenue: 0,
    total_profit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setError(null);
      const productsRes = await api.get('/products/');
      const devicesRes = await api.get('/devices/');
      const devices = devicesRes.data;
      const salesRes = await api.get('/sales/');
      const sales = salesRes.data;
      const purchasesRes = await api.get('/purchases/');
      const purchases = purchasesRes.data;

      const inStock = devices.filter(d => d.status === 'IN_STOCK');
      const sold = devices.filter(d => d.status === 'SOLD');
      const stockValue = inStock.reduce((sum, d) => sum + Number(d.total_cost || d.purchase_price), 0);
      const totalExtra = purchases.reduce((sum, p) => sum + (Number(p.extra_expenses) || 0), 0);

      let totalRevenue = 0;
      let totalProfit = 0;
      sales.forEach(s => {
        totalRevenue += Number(s.sale_price);
        totalProfit += Number(s.profit || 0);
      });

      setStats({
        total_products: productsRes.data.length,
        total_devices: devices.length,
        in_stock: inStock.length,
        sold: sold.length,
        total_extra_expenses: totalExtra,
        stock_value: stockValue,
        total_revenue: totalRevenue,
        total_profit: totalProfit,
        total_sales: sales.length,
      });
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      setError('Не удалось загрузить данные. Пожалуйста, обновите страницу.');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    if (!amount) return '0 сум';
    return Number(amount).toLocaleString() + ' сум';
  };

  const StatCard = ({ icon, title, value, color, subtitle, small = false }) => (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <div className={`stat-value ${small ? 'stat-value-small' : ''}`}>
          {value}
        </div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="dashboard-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Загрузка данных...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <h1 className="dashboard-title">📊 Панель управления</h1>
            <p className="dashboard-subtitle">Общая статистика вашего магазина</p>
          </div>
          <button onClick={loadDashboard} className="btn-refresh">
            <span className="btn-refresh-icon">🔄</span>
            <span className="btn-refresh-text">Обновить</span>
          </button>
        </header>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">{error}</span>
          </div>
        )}

        {/* Основная статистика */}
        <div className="stats-grid stats-grid-4">
          <StatCard
            icon="📦"
            title="Всего товаров"
            value={stats.total_products}
            color="blue"
          />
          <StatCard
            icon="📱"
            title="В наличии"
            value={stats.in_stock}
            color="green"
          />
          <StatCard
            icon="💰"
            title="Продано"
            value={stats.sold}
            color="red"
          />
          <StatCard
            icon="📊"
            title="Доп. расходы"
            value={formatMoney(stats.total_extra_expenses)}
            color="purple"
            small
          />
        </div>

        {/* Финансовая статистика */}
        <div className="stats-grid stats-grid-3">
          <StatCard
            icon="💎"
            title="Деньги в товаре"
            value={formatMoney(stats.stock_value)}
            color="orange"
            small
          />
          <StatCard
            icon="💵"
            title="Общая выручка"
            value={formatMoney(stats.total_revenue)}
            color="teal"
            small
          />
          <StatCard
            icon="📈"
            title="Общая прибыль"
            value={formatMoney(stats.total_profit)}
            color={stats.total_profit >= 0 ? 'green' : 'red'}
            small
          />
        </div>

        {/* Быстрые действия */}
        <div className="quick-actions">
          <h2 className="quick-actions-title">🚀 Быстрые действия</h2>
          <div className="quick-actions-grid">
            <a href="/purchases/new" className="action-card action-card-blue">
              <span className="action-icon">📦</span>
              <span className="action-label">Новый приход</span>
              <span className="action-arrow">→</span>
            </a>
            <a href="/sales/new" className="action-card action-card-green">
              <span className="action-icon">💰</span>
              <span className="action-label">Новая продажа</span>
              <span className="action-arrow">→</span>
            </a>
            <a href="/imei" className="action-card action-card-purple">
              <span className="action-icon">🔍</span>
              <span className="action-label">Поиск IMEI</span>
              <span className="action-arrow">→</span>
            </a>
            <a href="/inventory" className="action-card action-card-orange">
              <span className="action-icon">📱</span>
              <span className="action-label">Управление остатками</span>
              <span className="action-arrow">→</span>
            </a>
          </div>
        </div>

        {/* Краткая информация */}
        <div className="info-section">
          <div className="info-card">
            <div className="info-card-header">
              <span className="info-icon">📋</span>
              <h3>Всего устройств</h3>
            </div>
            <p className="info-number">{stats.total_devices}</p>
            <div className="info-details">
              <span className="info-detail-item">
                <span className="info-detail-label">В наличии:</span>
                <strong className="info-detail-value">{stats.in_stock}</strong>
              </span>
              <span className="info-detail-item">
                <span className="info-detail-label">Продано:</span>
                <strong className="info-detail-value">{stats.sold}</strong>
              </span>
            </div>
          </div>
          <div className="info-card">
            <div className="info-card-header">
              <span className="info-icon">📊</span>
              <h3>Финансовые показатели</h3>
            </div>
            <div className="info-stats">
              <div className="info-stat-item">
                <span className="info-label">Средний чек</span>
                <span className="info-value">
                  {stats.sold > 0
                    ? formatMoney(stats.total_revenue / stats.sold)
                    : '0 сум'
                  }
                </span>
              </div>
              <div className="info-stat-item">
                <span className="info-label">Маржинальность</span>
                <span className="info-value">
                  {stats.total_revenue > 0
                    ? Math.round((stats.total_profit / stats.total_revenue) * 100) + '%'
                    : '0%'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}