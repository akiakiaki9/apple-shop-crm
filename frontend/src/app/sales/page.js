'use client';

import { useState, useEffect } from 'react';
import Navigation from '../../../components/layout/Navigation';
import api from '../../../lib/api';
import SaleReceipt from '../../../components/sales/SaleReceipt';
import './sales.css';

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/sales/');
      setSales(response.data);
    } catch (error) {
      console.error('Ошибка:', error);
      setError('Не удалось загрузить историю продаж');
    } finally {
      setLoading(false);
    }
  };

  const openReceipt = (sale) => {
    setSelectedSale(sale);
    setIsReceiptOpen(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Фильтрация
  const filteredSales = sales.filter(sale => {
    const productName = sale.device_info?.product_name?.toLowerCase() || '';
    const imei = sale.device_info?.imei?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    const matchesSearch = productName.includes(search) || imei.includes(search);

    if (filterDate) {
      const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
      return matchesSearch && saleDate === filterDate;
    }
    return matchesSearch;
  });

  // Статистика
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.sale_price || 0), 0);
  const totalProfit = sales.reduce((sum, s) => sum + Number(s.profit || 0), 0);
  const totalItems = sales.reduce((sum, s) => sum + 1, 0);

  const formatMoney = (amount) => {
    if (!amount) return '0 сум';
    return Number(amount).toLocaleString() + ' сум';
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="sales-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Загрузка истории продаж...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="sales-container">
        <header className="sales-header">
          <div className="sales-header-left">
            <h1 className="sales-title">💰 История продаж</h1>
            <p className="sales-subtitle">
              <span className="subtitle-item">
                Всего продаж: <strong>{totalSales}</strong>
              </span>
              <span className="subtitle-divider">|</span>
              <span className="subtitle-item">
                Товаров: <strong>{totalItems}</strong> шт.
              </span>
              <span className="subtitle-divider desktop-only">|</span>
              <span className="subtitle-item desktop-only">
                Выручка: <strong>{formatMoney(totalRevenue)}</strong>
              </span>
              <span className="subtitle-divider desktop-only">|</span>
              <span className="subtitle-item desktop-only">
                Прибыль: <strong className={totalProfit >= 0 ? 'text-success' : 'text-danger'}>
                  {formatMoney(totalProfit)}
                </strong>
              </span>
            </p>
            {/* Мобильная версия статистики */}
            <p className="sales-subtitle-mobile">
              <span className="subtitle-item">
                Выручка: <strong>{formatMoney(totalRevenue)}</strong>
              </span>
              <span className="subtitle-divider">|</span>
              <span className="subtitle-item">
                Прибыль: <strong className={totalProfit >= 0 ? 'text-success' : 'text-danger'}>
                  {formatMoney(totalProfit)}
                </strong>
              </span>
            </p>
          </div>
          <a href="/sales/new" className="btn-primary-link">
            <span className="btn-primary-icon">➕</span>
            <span className="btn-primary-text">Новая продажа</span>
          </a>
        </header>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">{error}</span>
          </div>
        )}

        {/* Фильтры */}
        <div className="filters-bar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder={isMobile ? "Поиск..." : "Поиск по названию или IMEI..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                className="search-clear"
                onClick={() => setSearchTerm('')}
                title="Очистить"
                type="button"
              >
                ✕
              </button>
            )}
          </div>
          <div className="filter-group">
            <div className="filter-date">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="date-input"
                title="Фильтр по дате"
              />
              {filterDate && (
                <button
                  className="filter-clear"
                  onClick={() => setFilterDate('')}
                  title="Сбросить фильтр"
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={loadSales}
              className="btn-refresh"
              title="Обновить"
              type="button"
            >
              <span className="btn-refresh-icon">🔄</span>
              <span className="btn-refresh-text">Обновить</span>
            </button>
          </div>
        </div>

        {filteredSales.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3 className="empty-title">
              {searchTerm || filterDate ? 'Продажи не найдены' : 'Нет продаж'}
            </h3>
            <p className="empty-text">
              {searchTerm || filterDate
                ? 'Попробуйте изменить параметры поиска'
                : 'Оформите первую продажу'
              }
            </p>
            {!searchTerm && !filterDate && (
              <a href="/sales/new" className="btn btn-success">
                💰 Оформить продажу
              </a>
            )}
          </div>
        ) : (
          <div className="table-container">
            <div className="table-scroll">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Товар</th>
                    <th className="hide-mobile">IMEI</th>
                    <th className="hide-mobile text-right">Закупка</th>
                    <th className="text-right">Продажа</th>
                    <th className="text-right">Прибыль</th>
                    <th className="text-center">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map(sale => {
                    const profit = Number(sale.profit || 0);
                    const isProfitable = profit >= 0;

                    return (
                      <tr key={sale.id} className="sale-row">
                        <td>
                          <span className="sale-date">
                            {isMobile ? formatDateShort(sale.created_at) : formatDate(sale.created_at)}
                          </span>
                          {isMobile && (
                            <span className="sale-date-time">
                              {new Date(sale.created_at).toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="sale-product">
                            <span className="product-name">{sale.device_info?.product_name}</span>
                            {/* Мобильная версия - показываем IMEI под названием */}
                            {isMobile && sale.device_info?.imei && (
                              <span className="product-imei-mobile">
                                IMEI: {sale.device_info?.imei}
                              </span>
                            )}
                            {sale.device_info?.product_type === 'PHONE' ? (
                              <span className="product-specs">
                                {sale.device_info?.product_ram} • {sale.device_info?.product_storage} • {sale.device_info?.product_color}
                              </span>
                            ) : (
                              <span className="product-specs">Аксессуар</span>
                            )}
                          </div>
                        </td>
                        <td className="hide-mobile">
                          <span className="sale-imei">
                            {sale.device_info?.imei || '—'}
                          </span>
                        </td>
                        <td className="hide-mobile text-right">
                          <span className="sale-price purchase">
                            {formatMoney(sale.device_info?.purchase_price)}
                          </span>
                        </td>
                        <td className="text-right">
                          <span className="sale-price sale">
                            {formatMoney(sale.sale_price)}
                          </span>
                        </td>
                        <td className="text-right">
                          <span className={`sale-profit ${isProfitable ? 'profit-positive' : 'profit-negative'}`}>
                            {formatMoney(profit)}
                            <span className="profit-icon">
                              {isProfitable ? '📈' : '📉'}
                            </span>
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            className="btn-receipt"
                            onClick={() => openReceipt(sale)}
                            title="Показать чек"
                            type="button"
                          >
                            <span className="btn-receipt-icon">🧾</span>
                            <span className="btn-receipt-text">Чек</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Информация о количестве записей */}
            <div className="table-footer">
              <span className="footer-info">
                Показано: <strong>{filteredSales.length}</strong> из {sales.length} продаж
              </span>
              {filteredSales.length > 0 && (
                <span className="table-total">
                  Итого: <strong>{formatMoney(filteredSales.reduce((sum, s) => sum + Number(s.sale_price || 0), 0))}</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <SaleReceipt
        sale={selectedSale}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </>
  );
}