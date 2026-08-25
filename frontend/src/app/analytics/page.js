'use client';

import { useState, useEffect } from 'react';
import Navigation from '../../../components/layout/Navigation';
import api from '../../../lib/api';
import './analytics.css';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('all');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [totalExtraExpenses, setTotalExtraExpenses] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const periods = [
    { value: 'today', label: 'Сегодня' },
    { value: 'yesterday', label: 'Вчера' },
    { value: 'week', label: '7 дней' },
    { value: 'month', label: '30 дней' },
    { value: 'current_month', label: 'Текущий месяц' },
    { value: 'last_month', label: 'Прошлый месяц' },
    { value: 'all', label: 'Всё время' },
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const salesResponse = await api.get(`/sales/analytics/?period=${period}`);
      setAnalytics(salesResponse.data);

      const allSales = await api.get('/sales/');
      setSales(allSales.data);

      const allPurchases = await api.get('/purchases/');
      setPurchases(allPurchases.data);

      let extraSum = 0;
      if (period === 'all') {
        allPurchases.data.forEach(p => {
          extraSum += Number(p.extra_expenses) || 0;
        });
      } else {
        const now = new Date();
        let startDate = new Date();
        if (period === 'today') {
          startDate.setHours(0, 0, 0, 0);
        } else if (period === 'yesterday') {
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
        } else if (period === 'week') {
          startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
          startDate.setDate(startDate.getDate() - 30);
        } else if (period === 'current_month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (period === 'last_month') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        }

        allPurchases.data.forEach(p => {
          const pDate = new Date(p.created_at);
          if (pDate >= startDate) {
            extraSum += Number(p.extra_expenses) || 0;
          }
        });
      }
      setTotalExtraExpenses(extraSum);

    } catch (error) {
      console.error('Ошибка загрузки аналитики:', error);
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
      <div className="stat-card-inner">
        <div className="stat-card-header">
          <span className="stat-card-icon">{icon}</span>
          <h3 className="stat-card-title">{title}</h3>
        </div>
        <div className={`stat-card-value ${small ? 'stat-card-value-small' : ''}`}>
          {value}
        </div>
        {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
      </div>
    </div>
  );

  const InfoItem = ({ label, value, highlight = false }) => (
    <div className={`info-item ${highlight ? 'info-item-highlight' : ''}`}>
      <span className="info-item-label">{label}</span>
      <span className="info-item-value">{value}</span>
    </div>
  );

  const totalPurchasesAmount = purchases.reduce((sum, p) => sum + (p.total_price || 0), 0);
  const totalPurchasesExtra = purchases.reduce((sum, p) => sum + (Number(p.extra_expenses) || 0), 0);
  const totalDevices = purchases.reduce((sum, p) => sum + (p.total_count || 0), 0);
  const avgProfit = analytics?.total_count > 0 ? analytics.total_profit / analytics.total_count : 0;
  const avgPrice = analytics?.total_count > 0 ? analytics.total_revenue / analytics.total_count : 0;
  const margin = analytics?.total_revenue > 0 ? (analytics.total_profit / analytics.total_revenue) * 100 : 0;
  const avgExtra = purchases.length > 0 ? totalExtraExpenses / purchases.length : 0;

  return (
    <>
      <Navigation />
      <div className="analytics-container">
        <header className="analytics-header">
          <div className="analytics-header-left">
            <h1 className="analytics-title">📊 Аналитика</h1>
            <p className="analytics-subtitle">
              {periods.find(p => p.value === period)?.label || 'Все время'}
            </p>
          </div>
          <button
            onClick={loadAnalytics}
            className="btn-refresh"
            disabled={loading}
            type="button"
          >
            <span className="btn-refresh-icon">🔄</span>
            <span className="btn-refresh-text">Обновить</span>
          </button>
        </header>

        {/* Фильтр периода */}
        <div className="period-filter">
          <div className="period-filter-scroll">
            {periods.map(p => (
              <button
                key={p.value}
                className={`period-btn ${period === p.value ? 'active' : ''}`}
                onClick={() => setPeriod(p.value)}
                type="button"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p className="loading-text">Загрузка аналитики...</p>
          </div>
        ) : analytics && (
          <>
            {/* Основные показатели */}
            <div className="stats-grid stats-grid-4">
              <StatCard
                icon="📱"
                title="Продано"
                value={analytics.total_count || 0}
                color="blue"
              />
              <StatCard
                icon="💰"
                title="Выручка"
                value={formatMoney(analytics.total_revenue)}
                color="green"
              />
              <StatCard
                icon="📦"
                title="Себестоимость"
                value={formatMoney(analytics.total_cost)}
                color="orange"
              />
              <StatCard
                icon="💵"
                title="Прибыль"
                value={formatMoney(analytics.total_profit)}
                color={analytics.total_profit >= 0 ? 'green' : 'red'}
              />
            </div>

            {/* Дополнительные расходы */}
            <div className="extra-expenses-card">
              <div className="extra-expenses-content">
                <div className="extra-expenses-left">
                  <span className="extra-expenses-icon">📊</span>
                  <div>
                    <div className="extra-expenses-label">Дополнительные расходы за период</div>
                    <div className="extra-expenses-value">{formatMoney(totalExtraExpenses)}</div>
                  </div>
                </div>
                <div className="extra-expenses-period">
                  {periods.find(p => p.value === period)?.label || 'Все время'}
                </div>
              </div>
            </div>

            {/* Дополнительная статистика */}
            <div className="info-grid">
              <div className="info-card">
                <h3 className="info-card-title">📊 Средние показатели</h3>
                <div className="info-list">
                  <InfoItem
                    label="Средняя прибыль с товара"
                    value={formatMoney(avgProfit)}
                  />
                  <InfoItem
                    label="Средняя цена продажи"
                    value={formatMoney(avgPrice)}
                  />
                  <InfoItem
                    label="Маржинальность"
                    value={margin > 0 ? `${Math.round(margin)}%` : '0%'}
                    highlight={margin > 0}
                  />
                  <InfoItem
                    label="Средние доп. расходы"
                    value={formatMoney(avgExtra)}
                  />
                </div>
              </div>

              <div className="info-card">
                <h3 className="info-card-title">📦 Информация по приходам</h3>
                <div className="info-list">
                  <InfoItem
                    label="Всего приходов"
                    value={purchases.length}
                  />
                  <InfoItem
                    label="Всего вложено в товар"
                    value={formatMoney(totalPurchasesAmount)}
                  />
                  <InfoItem
                    label="Всего доп. расходов"
                    value={formatMoney(totalPurchasesExtra)}
                    highlight
                  />
                  <InfoItem
                    label="Всего устройств"
                    value={totalDevices}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}