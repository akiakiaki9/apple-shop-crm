'use client';

import { useState, useEffect } from 'react';
import Navigation from '../../../components/layout/Navigation';
import api from '../../../lib/api';
import Modal from '../../../components/ui/Modal';
import './inventory.css';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [isMobile, setIsMobile] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const productsResponse = await api.get('/products/');
      const productsData = productsResponse.data;

      const devicesResponse = await api.get('/devices/');
      const devicesData = devicesResponse.data;

      const countMap = {};
      devicesData.forEach(device => {
        if (device.status === 'IN_STOCK') {
          const key = device.product;
          if (!countMap[key]) countMap[key] = 0;
          countMap[key]++;
        }
      });

      const productsWithCount = productsData.map(product => ({
        ...product,
        in_stock_count: countMap[product.id] || 0,
        devices: devicesData.filter(d => d.product === product.id)
      }));

      setProducts(productsWithCount);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      setError('Не удалось загрузить остатки. Пожалуйста, обновите страницу.');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDevices = async (productId) => {
    if (expandedProduct === productId) {
      setExpandedProduct(null);
      setExpandedMobile(null);
      setAvailableDevices([]);
      return;
    }

    try {
      setLoadingDevices(true);
      const response = await api.get(`/products/${productId}/available_imeis/`);
      setAvailableDevices(response.data.devices || []);
      setExpandedProduct(productId);
      if (isMobile) {
        setExpandedMobile(productId);
      }
    } catch (error) {
      console.error('Ошибка загрузки устройств:', error);
    } finally {
      setLoadingDevices(false);
    }
  };

  const showDeviceInfo = async (deviceId) => {
    try {
      const response = await api.get(`/devices/${deviceId}/`);
      setSelectedDevice(response.data);
      setIsDeviceModalOpen(true);
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const formatMoney = (amount) => {
    if (!amount) return '0 сум';
    return Number(amount).toLocaleString() + ' сум';
  };

  const getTypeIcon = (type) => {
    return type === 'PHONE' ? '📱' : '🎧';
  };

  const getTypeLabel = (type) => {
    return type === 'PHONE' ? 'Телефон' : 'Аксессуар';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'IN_STOCK': 'badge-success',
      'SOLD': 'badge-danger',
      'RESERVED': 'badge-warning'
    };
    return badges[status] || 'badge-secondary';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'IN_STOCK': 'В наличии',
      'SOLD': 'Продано',
      'RESERVED': 'Зарезервирован'
    };
    return labels[status] || status;
  };

  // Фильтрация продуктов
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.serial_number && product.serial_number.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'ALL' || product.product_type === filterType;
    return matchesSearch && matchesType;
  });

  const totalInStock = products.reduce((sum, p) => sum + (p.in_stock_count || 0), 0);

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="inventory-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Загрузка остатков...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="inventory-container">
        <header className="inventory-header">
          <div className="inventory-header-left">
            <h1 className="inventory-title">📱 Остатки товаров</h1>
            <p className="inventory-subtitle">
              Всего товаров: <strong>{products.length}</strong> &nbsp;|&nbsp;
              В наличии: <strong className="text-success">{totalInStock}</strong> шт.
            </p>
          </div>
          <button onClick={loadInventory} className="btn-refresh">
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

        {/* Фильтры */}
        <div className="filters-bar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder={isMobile ? "Поиск..." : "Поиск по названию или серийному номеру..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-select">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-input"
            >
              <option value="ALL">Все типы</option>
              <option value="PHONE">📱 Телефоны</option>
              <option value="ACCESSORY">🎧 Аксессуары</option>
            </select>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3 className="empty-title">Товары не найдены</h3>
            <p className="empty-text">
              {searchTerm || filterType !== 'ALL'
                ? 'Попробуйте изменить параметры поиска'
                : 'Добавьте товары через приход'
              }
            </p>
            {!searchTerm && filterType === 'ALL' && (
              <a href="/purchases/new" className="btn btn-primary">
                📦 Добавить приход
              </a>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Тип</th>
                  <th>Товар</th>
                  <th className="hide-mobile">Характеристики</th>
                  <th className="hide-mobile">Серийный номер</th>
                  <th className="text-center">Остаток</th>
                  <th className="text-center">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <>
                    <tr key={product.id} className="product-row">
                      <td>
                        <span className="product-type">
                          {getTypeIcon(product.product_type)}
                          <span className="type-label">{getTypeLabel(product.product_type)}</span>
                        </span>
                      </td>
                      <td>
                        <div className="product-name">
                          {product.name}
                          {/* Мобильная версия - показываем характеристики под названием */}
                          {isMobile && (product.ram || product.storage || product.color) && (
                            <div className="product-specs-mobile">
                              {product.ram && <span className="spec">{product.ram}</span>}
                              {product.storage && <span className="spec">{product.storage}</span>}
                              {product.color && <span className="spec">{product.color}</span>}
                            </div>
                          )}
                          {isMobile && product.serial_number && (
                            <div className="product-serial-mobile">
                              SN: {product.serial_number}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="hide-mobile">
                        <div className="product-specs">
                          {product.ram && <span className="spec">RAM: {product.ram}</span>}
                          {product.storage && <span className="spec">Память: {product.storage}</span>}
                          {product.color && <span className="spec">Цвет: {product.color}</span>}
                          {!product.ram && !product.storage && !product.color && (
                            <span className="spec-muted">—</span>
                          )}
                        </div>
                      </td>
                      <td className="hide-mobile">
                        <span className="serial-number">
                          {product.serial_number || '—'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`stock-badge ${product.in_stock_count > 0 ? 'in-stock' : 'out-of-stock'}`}>
                          {product.in_stock_count || 0} шт.
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className={`btn-details ${expandedProduct === product.id ? 'active' : ''}`}
                          onClick={() => loadAvailableDevices(product.id)}
                          disabled={loadingDevices}
                        >
                          {loadingDevices && expandedProduct !== product.id ? (
                            <span className="spinner-small"></span>
                          ) : expandedProduct === product.id ? (
                            isMobile ? '✕' : '📕 Скрыть'
                          ) : (
                            isMobile ? '📋' : '📋 Номера'
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedProduct === product.id && (
                      <tr>
                        <td colSpan="6">
                          <div className="devices-expand">
                            <div className="devices-header">
                              <strong>
                                Доступные {product.product_type === 'PHONE' ? 'IMEI' : 'номера'}
                                <span className="devices-count">({availableDevices.length} шт.)</span>
                              </strong>
                            </div>
                            <div className="devices-list">
                              {loadingDevices ? (
                                <div className="devices-loading">
                                  <span className="spinner-small"></span>
                                  Загрузка номеров...
                                </div>
                              ) : availableDevices.length === 0 ? (
                                <div className="devices-empty">
                                  <span className="empty-icon-small">📭</span>
                                  <span>Нет доступных номеров</span>
                                </div>
                              ) : (
                                availableDevices.map(device => (
                                  <div
                                    key={device.id}
                                    className="device-chip"
                                    onClick={() => showDeviceInfo(device.id)}
                                  >
                                    <span className="device-chip-icon">📱</span>
                                    <span className="device-chip-id">
                                      {device.identifier || device.imei || `ID: ${device.id}`}
                                    </span>
                                    {!isMobile && device.purchase_price && (
                                      <span className="device-chip-price">
                                        {formatMoney(device.purchase_price)}
                                      </span>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        title="📱 Информация о товаре"
      >
        {selectedDevice && (
          <div className="device-modal">
            <div className="device-modal-header">
              <h2 className="device-modal-title">{selectedDevice.product_name}</h2>
              <span className="device-modal-type">
                {getTypeIcon(selectedDevice.product_type)} {getTypeLabel(selectedDevice.product_type)}
              </span>
              {selectedDevice.product_type === 'PHONE' && (
                <div className="device-modal-specs">
                  {selectedDevice.product_ram} • {selectedDevice.product_storage} • {selectedDevice.product_color}
                </div>
              )}
            </div>

            <div className="device-modal-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">
                    {selectedDevice.product_type === 'PHONE' ? 'IMEI' : 'Номер'}
                  </span>
                  <span className="info-value monospace">
                    {selectedDevice.imei || 'Без номера'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Статус</span>
                  <span className={`badge ${getStatusBadge(selectedDevice.status)}`}>
                    {getStatusLabel(selectedDevice.status)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Закупочная цена</span>
                  <span className="info-value">{formatMoney(selectedDevice.purchase_price)}</span>
                </div>
                {selectedDevice.extra_expenses > 0 && (
                  <div className="info-item">
                    <span className="info-label">Доп. расходы</span>
                    <span className="info-value">{formatMoney(selectedDevice.extra_expenses)}</span>
                  </div>
                )}
                <div className="info-item highlight">
                  <span className="info-label">Себестоимость</span>
                  <span className="info-value strong">{formatMoney(selectedDevice.total_cost)}</span>
                </div>
                {selectedDevice.sale_price && (
                  <>
                    <div className="info-item">
                      <span className="info-label">Цена продажи</span>
                      <span className="info-value">{formatMoney(selectedDevice.sale_price)}</span>
                    </div>
                    <div className="info-item highlight">
                      <span className="info-label">Прибыль</span>
                      <span className={`info-value strong ${selectedDevice.profit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                        {formatMoney(selectedDevice.profit)}
                      </span>
                    </div>
                  </>
                )}
                <div className="info-item">
                  <span className="info-label">Дата прихода</span>
                  <span className="info-value">
                    {new Date(selectedDevice.created_at).toLocaleString('ru-RU')}
                  </span>
                </div>
                {selectedDevice.sold_at && (
                  <div className="info-item">
                    <span className="info-label">Дата продажи</span>
                    <span className="info-value">
                      {new Date(selectedDevice.sold_at).toLocaleString('ru-RU')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {selectedDevice.status === 'IN_STOCK' && (
              <div className="device-modal-footer">
                <a
                  href={`/sales/new?device=${selectedDevice.id}`}
                  className="btn btn-success btn-full"
                >
                  🛒 Продать этот товар
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}