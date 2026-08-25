'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import Navigation from '../../../components/layout/Navigation';
import PurchaseReceipt from '../../../components/purchases/PurchaseReceipt';
import './purchases.css';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
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
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/purchases/');
      setPurchases(response.data);
    } catch (error) {
      console.error('Ошибка:', error);
      setError('Не удалось загрузить историю приходов');
    } finally {
      setLoading(false);
    }
  };

  const openReceipt = (purchase) => {
    setSelectedPurchase(purchase);
    setIsReceiptOpen(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isMobile) {
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
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
  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.id?.toString().includes(searchTerm);

    if (filterDate) {
      const purchaseDate = new Date(purchase.created_at).toISOString().split('T')[0];
      return matchesSearch && purchaseDate === filterDate;
    }
    return matchesSearch;
  });

  // Статистика
  const totalPurchases = purchases.length;
  const totalItems = purchases.reduce((sum, p) => sum + (p.total_count || 0), 0);
  const totalAmount = purchases.reduce((sum, p) => sum + (p.total_price || 0), 0);

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="purchases-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Загрузка истории приходов...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="purchases-container">
        <header className="purchases-header">
          <div className="purchases-header-left">
            <h1 className="purchases-title">📋 История приходов</h1>
            <p className="purchases-subtitle">
              <span className="subtitle-item">
                Всего приходов: <strong>{totalPurchases}</strong>
              </span>
              <span className="subtitle-divider">|</span>
              <span className="subtitle-item">
                Товаров: <strong>{totalItems}</strong> шт.
              </span>
              <span className="subtitle-divider desktop-only">|</span>
              <span className="subtitle-item desktop-only">
                Сумма: <strong>{totalAmount.toLocaleString()}</strong> сум
              </span>
            </p>
            {/* Мобильная версия суммы */}
            <p className="purchases-subtitle-mobile">
              Сумма: <strong>{totalAmount.toLocaleString()}</strong> сум
            </p>
          </div>
          <a href="/purchases/new" className="btn-primary-link">
            <span className="btn-primary-icon">➕</span>
            <span className="btn-primary-text">Новый приход</span>
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
              placeholder={isMobile ? "Поиск..." : "Поиск по ID или поставщику..."}
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
              onClick={loadPurchases}
              className="btn-refresh"
              title="Обновить"
              type="button"
            >
              <span className="btn-refresh-icon">🔄</span>
              <span className="btn-refresh-text">Обновить</span>
            </button>
          </div>
        </div>

        {filteredPurchases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3 className="empty-title">
              {searchTerm || filterDate ? 'Приходы не найдены' : 'Нет приходов'}
            </h3>
            <p className="empty-text">
              {searchTerm || filterDate
                ? 'Попробуйте изменить параметры поиска'
                : 'Добавьте первый приход товаров'
              }
            </p>
            {!searchTerm && !filterDate && (
              <a href="/purchases/new" className="btn btn-primary">
                📦 Добавить приход
              </a>
            )}
          </div>
        ) : (
          <div className="table-container">
            <div className="table-scroll">
              <table className="purchases-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Дата</th>
                    <th className="hide-mobile">Поставщик</th>
                    <th className="text-center">Кол-во</th>
                    <th className="text-right">Сумма</th>
                    <th className="text-center">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map(purchase => (
                    <tr key={purchase.id} className="purchase-row">
                      <td>
                        <span className="purchase-id">#{purchase.id}</span>
                      </td>
                      <td>
                        <span className="purchase-date">
                          {isMobile ? formatDateShort(purchase.created_at) : formatDate(purchase.created_at)}
                        </span>
                        {isMobile && (
                          <span className="purchase-date-time">
                            {new Date(purchase.created_at).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </td>
                      <td className="hide-mobile">
                        <span className="purchase-supplier">
                          {purchase.supplier_name || '—'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="purchase-count">
                          {purchase.total_count || 0}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="purchase-amount">
                          {(purchase.total_price || 0).toLocaleString()}
                          <span className="currency-symbol"> сум</span>
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn-receipt"
                          onClick={() => openReceipt(purchase)}
                          title="Показать чек"
                          type="button"
                        >
                          <span className="btn-receipt-icon">🧾</span>
                          <span className="btn-receipt-text">Чек</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Информация о количестве записей */}
            <div className="table-footer">
              <span>
                Показано: <strong>{filteredPurchases.length}</strong> из {purchases.length} приходов
              </span>
            </div>
          </div>
        )}
      </div>

      <PurchaseReceipt
        purchase={selectedPurchase}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </>
  );
}