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
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          <div>
            <h1 className="purchases-title">📋 История приходов</h1>
            <p className="purchases-subtitle">
              Всего приходов: <strong>{totalPurchases}</strong> |
              Товаров: <strong>{totalItems}</strong> шт. |
              Сумма: <strong>{totalAmount.toLocaleString()}</strong> сум
            </p>
          </div>
          <a href="/purchases/new" className="btn-primary-link">
            ➕ Новый приход
          </a>
        </header>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Фильтры */}
        <div className="filters-bar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Поиск по ID или поставщику..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                className="search-clear"
                onClick={() => setSearchTerm('')}
                title="Очистить"
              >
                ✕
              </button>
            )}
          </div>
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
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={loadPurchases}
            className="btn-refresh"
            title="Обновить"
          >
            🔄
          </button>
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
            <table className="purchases-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Дата</th>
                  <th>Поставщик</th>
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
                        {formatDate(purchase.created_at)}
                      </span>
                    </td>
                    <td>
                      <span className="purchase-supplier">
                        {purchase.supplier_name || '—'}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="purchase-count">
                        {purchase.total_count || 0} шт.
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="purchase-amount">
                        {(purchase.total_price || 0).toLocaleString()} сум
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn-receipt"
                        onClick={() => openReceipt(purchase)}
                        title="Показать чек"
                      >
                        🧾 Чек
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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