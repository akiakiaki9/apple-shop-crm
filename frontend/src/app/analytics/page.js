'use client';

import { useState, useEffect } from 'react';
import Navigation from '../../../components/layout/Navigation';
import api from '../../../lib/api';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('all');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [totalExtraExpenses, setTotalExtraExpenses] = useState(0);

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
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Загружаем аналитику продаж
      const salesResponse = await api.get(`/sales/analytics/?period=${period}`);
      setAnalytics(salesResponse.data);

      // Загружаем все продажи
      const allSales = await api.get('/sales/');
      setSales(allSales.data);

      // Загружаем все приходы
      const allPurchases = await api.get('/purchases/');
      setPurchases(allPurchases.data);

      // Считаем общие доп расходы по приходам за период
      let extraSum = 0;
      if (period === 'all') {
        allPurchases.data.forEach(p => {
          extraSum += Number(p.extra_expenses) || 0;
        });
      } else {
        // Фильтруем по периоду
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

  return (
    <>
      <Navigation />
      <div className="container" style={{ padding: '20px' }}>
        <h1>📊 Аналитика</h1>

        {/* Фильтр периода */}
        <div className="card">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {periods.map(p => (
              <button
                key={p.value}
                className={`btn ${period === p.value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPeriod(p.value)}
                style={{ fontSize: '14px' }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="card">Загрузка...</div>
        ) : analytics && (
          <>
            {/* Основные показатели */}
            <div className="grid-4">
              <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
                <h3 style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>📱 Продано</h3>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                  {analytics.total_count || 0}
                </div>
              </div>
              <div className="card" style={{ borderLeft: '4px solid #22c55e' }}>
                <h3 style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>💰 Выручка</h3>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a' }}>
                  {formatMoney(analytics.total_revenue)}
                </div>
              </div>
              <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <h3 style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>📦 Себестоимость</h3>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d97706' }}>
                  {formatMoney(analytics.total_cost)}
                </div>
              </div>
              <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
                <h3 style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>💵 Прибыль</h3>
                <div style={{ 
                  fontSize: '28px', 
                  fontWeight: 'bold', 
                  color: (analytics.total_profit || 0) >= 0 ? '#16a34a' : '#dc2626' 
                }}>
                  {formatMoney(analytics.total_profit)}
                </div>
              </div>
            </div>

            {/* Дополнительные расходы */}
            <div className="card" style={{ borderLeft: '4px solid #8b5cf6', background: '#f5f3ff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>📊 Дополнительные расходы за период</h3>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed' }}>
                    {formatMoney(totalExtraExpenses)}
                  </div>
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {periods.find(p => p.value === period)?.label || 'Все время'}
                </div>
              </div>
            </div>

            {/* Дополнительная статистика */}
            <div className="grid-2">
              <div className="card">
                <h3 className="card-title">📊 Средние показатели</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '13px' }}>Средняя прибыль с телефона</div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>
                      {analytics.total_count > 0 
                        ? formatMoney(analytics.total_profit / analytics.total_count)
                        : '0 сум'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '13px' }}>Средняя цена продажи</div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>
                      {analytics.total_count > 0 
                        ? formatMoney(analytics.total_revenue / analytics.total_count)
                        : '0 сум'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '13px' }}>Маржинальность</div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>
                      {analytics.total_revenue > 0 
                        ? `${Math.round((analytics.total_profit / analytics.total_revenue) * 100)}%`
                        : '0%'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '13px' }}>Средние доп. расходы</div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>
                      {purchases.length > 0 
                        ? formatMoney(totalExtraExpenses / purchases.length)
                        : '0 сум'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="card-title">📦 Информация по приходам</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '13px' }}>Всего приходов</div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>{purchases.length}</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '13px' }}>Всего вложено в товар</div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>
                      {formatMoney(purchases.reduce((sum, p) => sum + (p.total_price || 0), 0))}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '13px' }}>Всего доп. расходов</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#7c3aed' }}>
                      {formatMoney(purchases.reduce((sum, p) => sum + (Number(p.extra_expenses) || 0), 0))}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '13px' }}>Всего устройств</div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>
                      {purchases.reduce((sum, p) => sum + (p.total_count || 0), 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}