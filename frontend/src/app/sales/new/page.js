'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '../../../../components/layout/Navigation';
import api from '../../../../lib/api';
import Modal from '../../../../components/ui/Modal';
import './new-sale.css';

function NewSaleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedDeviceId = searchParams.get('device');

  const [loading, setLoading] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [comment, setComment] = useState('');
  const [deviceInfo, setDeviceInfo] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatMoney = (amount) => {
    if (!amount) return '0 сум';
    return Number(amount).toLocaleString() + ' сум';
  };

  useEffect(() => {
    api.get('/products/')
      .then(response => {
        setProducts(response.data);
      })
      .catch(error => {
        console.error('Ошибка загрузки товаров:', error);
      });
  }, []);

  useEffect(() => {
    if (preselectedDeviceId) {
      loadDeviceInfo(preselectedDeviceId);
    }
  }, [preselectedDeviceId]);

  useEffect(() => {
    if (selectedProduct) {
      setLoadingDevices(true);
      setError('');

      api.get(`/products/${selectedProduct}/available_imeis/`)
        .then(response => {
          setAvailableDevices(response.data.devices || []);
          setSelectedDevice('');
          setDeviceInfo(null);
          setSalePrice('');
          setLoadingDevices(false);
        })
        .catch(error => {
          console.error('Ошибка загрузки устройств:', error);
          setError('Не удалось загрузить доступные товары');
          setLoadingDevices(false);
        });
    } else {
      setAvailableDevices([]);
      setSelectedDevice('');
      setDeviceInfo(null);
      setSalePrice('');
    }
  }, [selectedProduct]);

  const loadDeviceInfo = async (deviceId) => {
    try {
      const response = await api.get(`/devices/${deviceId}/`);
      const device = response.data;
      setDeviceInfo(device);
      setSelectedDevice(deviceId);
      const recommendedPrice = Math.round(Number(device.purchase_price) * 1.2);
      setSalePrice(recommendedPrice.toString());
      if (device.status === 'SOLD') {
        setError('Этот товар уже продан!');
        setSelectedDevice('');
      }
    } catch (error) {
      console.error('Ошибка загрузки товара:', error);
      setError('Товар не найден');
    }
  };

  const handleDeviceSelect = async (deviceId) => {
    if (!deviceId) {
      setSelectedDevice('');
      setDeviceInfo(null);
      setSalePrice('');
      return;
    }
    await loadDeviceInfo(deviceId);
  };

  const calculateProfit = () => {
    if (!deviceInfo || !salePrice) return null;
    const totalCost = Number(deviceInfo.purchase_price) + Number(deviceInfo.extra_expenses || 0);
    const profit = Number(salePrice) - totalCost;
    return profit;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedDevice) {
      setError('Выберите товар');
      return;
    }

    if (!salePrice || Number(salePrice) <= 0) {
      setError('Введите корректную цену продажи');
      return;
    }

    setShowConfirm(true);
  };

  const confirmSale = async () => {
    setShowConfirm(false);
    setLoading(true);
    setError('');
    setSuccess(null);

    try {
      const response = await api.post('/sales/create_sale/', {
        device_id: selectedDevice,
        sale_price: Number(salePrice),
        comment: comment,
      });

      setSuccess({
        message: '✅ Продажа успешно оформлена!',
        device: response.data.device_info,
        sale_price: response.data.sale_price,
        profit: response.data.profit,
      });

      setSelectedProduct('');
      setAvailableDevices([]);
      setSelectedDevice('');
      setDeviceInfo(null);
      setSalePrice('');
      setComment('');

      setTimeout(() => {
        router.push('/sales/new');
        router.refresh();
      }, 4000);

    } catch (err) {
      console.error('Ошибка:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Произошла ошибка при оформлении продажи');
      }
    } finally {
      setLoading(false);
    }
  };

  const profit = calculateProfit();

  const getDeviceDisplayName = (device) => {
    if (device.product_type === 'PHONE') {
      return device.imei || 'Без IMEI';
    } else {
      if (device.identifier) return device.identifier;
      if (device.imei) return device.imei;
      if (device.serial_number) return device.serial_number;
      return `ID: ${device.id}`;
    }
  };

  const isAccessory = (productId) => {
    const product = products.find(p => p.id === Number(productId));
    return product?.product_type === 'ACCESSORY';
  };

  const getRecommendedPrice = () => {
    if (!deviceInfo) return 0;
    return Math.round(Number(deviceInfo.purchase_price) * 1.2);
  };

  const getProductLabel = (product) => {
    let label = `${product.product_type === 'PHONE' ? '📱' : '🎧'} ${product.name}`;
    if (product.product_type === 'PHONE') {
      label += ` - ${product.ram} - ${product.storage} - ${product.color}`;
    } else if (product.serial_number) {
      label += ` - ${product.serial_number}`;
    }
    return label;
  };

  if (success) {
    return (
      <>
        <Navigation />
        <div className="sale-container">
          <div className="success-state">
            <div className="success-icon">✅</div>
            <h2 className="success-title">Продажа оформлена!</h2>
            <p className="success-message">{success.message}</p>
            <div className="success-details">
              <div className="success-item">
                <span className="success-label">Товар</span>
                <span className="success-value">{success.device?.product_name}</span>
              </div>
              {success.device?.product_type === 'PHONE' ? (
                <>
                  <div className="success-item">
                    <span className="success-label">Характеристики</span>
                    <span className="success-value">
                      {success.device?.product_ram} - {success.device?.product_storage} - {success.device?.product_color}
                    </span>
                  </div>
                  <div className="success-item">
                    <span className="success-label">IMEI</span>
                    <span className="success-value monospace">{success.device?.imei}</span>
                  </div>
                </>
              ) : (
                <div className="success-item">
                  <span className="success-label">Серийный номер</span>
                  <span className="success-value monospace">
                    {success.device?.product_serial || success.device?.imei || 'Не указан'}
                  </span>
                </div>
              )}
              <div className="success-item highlight">
                <span className="success-label">Цена продажи</span>
                <span className="success-value highlight-value">
                  {formatMoney(success.sale_price)}
                </span>
              </div>
              <div className="success-item highlight">
                <span className="success-label">Прибыль</span>
                <span className={`success-value highlight-value ${success.profit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                  {formatMoney(success.profit)}
                </span>
              </div>
            </div>
            <div className="success-actions">
              <a href="/sales/new" className="btn btn-primary">
                🔄 Новая продажа
              </a>
              <a href="/inventory" className="btn btn-secondary">
                📱 Остатки
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="sale-container">
        <header className="sale-header">
          <div className="sale-header-left">
            <h1 className="sale-title">💰 Новая продажа</h1>
            <p className="sale-subtitle">Оформление продажи товара</p>
          </div>
          <a href="/sales" className="btn-history">
            <span className="btn-history-icon">📋</span>
            <span className="btn-history-text">История продаж</span>
          </a>
        </header>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">❌</span>
            <span className="alert-text">{error}</span>
          </div>
        )}

        <div className="sale-card">
          <form onSubmit={handleSubmit} className="sale-form">
            {/* Выбор товара */}
            <div className="form-group">
              <label className="form-label">
                Товар *
                {isMobile && <span className="form-hint">обязательно</span>}
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="form-select"
                required
                disabled={loading}
              >
                <option value="">Выберите товар</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {getProductLabel(product)}
                  </option>
                ))}
              </select>
            </div>

            {/* Выбор устройства */}
            {selectedProduct && (
              <div className="form-group">
                <label className="form-label">
                  {isAccessory(selectedProduct) ? 'Номер товара' : 'IMEI'} (доступные) *
                  {isMobile && <span className="form-hint">обязательно</span>}
                </label>
                {loadingDevices ? (
                  <div className="loading-devices">
                    <span className="spinner-small"></span>
                    Загрузка доступных товаров...
                  </div>
                ) : availableDevices.length === 0 ? (
                  <div className="empty-devices">
                    <span className="empty-icon-small">📭</span>
                    <span>Нет доступных товаров</span>
                    <a href="/purchases/new" className="empty-link">
                      Добавить приход
                    </a>
                  </div>
                ) : (
                  <select
                    value={selectedDevice}
                    onChange={(e) => handleDeviceSelect(e.target.value)}
                    className="form-select"
                    required
                    disabled={loading}
                  >
                    <option value="">Выберите товар</option>
                    {availableDevices.map(device => (
                      <option key={device.id} value={device.id}>
                        {getDeviceDisplayName(device)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Информация о товаре */}
            {deviceInfo && deviceInfo.status === 'IN_STOCK' && (
              <>
                <div className="device-info-card">
                  <div className="device-info-header">
                    <span className="device-info-icon">📱</span>
                    <h3>Информация о товаре</h3>
                    <span className="device-status in-stock">В наличии</span>
                  </div>
                  <div className="device-info-grid">
                    <div className="device-info-item">
                      <span className="device-info-label">Тип</span>
                      <span className="device-info-value">
                        {deviceInfo.product_type === 'PHONE' ? '📱 Телефон' : '🎧 Аксессуар'}
                      </span>
                    </div>
                    <div className="device-info-item">
                      <span className="device-info-label">Товар</span>
                      <span className="device-info-value highlight">{deviceInfo.product_name}</span>
                    </div>
                    {deviceInfo.product_type === 'PHONE' ? (
                      <>
                        <div className="device-info-item">
                          <span className="device-info-label">RAM</span>
                          <span className="device-info-value">{deviceInfo.product_ram}</span>
                        </div>
                        <div className="device-info-item">
                          <span className="device-info-label">Память</span>
                          <span className="device-info-value">{deviceInfo.product_storage}</span>
                        </div>
                        <div className="device-info-item">
                          <span className="device-info-label">Цвет</span>
                          <span className="device-info-value">{deviceInfo.product_color}</span>
                        </div>
                        <div className="device-info-item">
                          <span className="device-info-label">IMEI</span>
                          <span className="device-info-value monospace">{deviceInfo.imei || 'Не указан'}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="device-info-item">
                          <span className="device-info-label">Серийный номер</span>
                          <span className="device-info-value monospace">
                            {deviceInfo.product_serial || deviceInfo.imei || 'Не указан'}
                          </span>
                        </div>
                        {deviceInfo.imei && deviceInfo.product_serial !== deviceInfo.imei && (
                          <div className="device-info-item">
                            <span className="device-info-label">IMEI</span>
                            <span className="device-info-value monospace">{deviceInfo.imei}</span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="device-info-item">
                      <span className="device-info-label">Закупочная цена</span>
                      <span className="device-info-value">{formatMoney(deviceInfo.purchase_price)}</span>
                    </div>
                    {deviceInfo.extra_expenses > 0 && (
                      <div className="device-info-item">
                        <span className="device-info-label">Доп. расходы</span>
                        <span className="device-info-value">{formatMoney(deviceInfo.extra_expenses)}</span>
                      </div>
                    )}
                    <div className="device-info-item highlight">
                      <span className="device-info-label">Себестоимость</span>
                      <span className="device-info-value strong">{formatMoney(deviceInfo.total_cost)}</span>
                    </div>
                  </div>
                </div>

                {/* Цена продажи */}
                <div className="form-group">
                  <label className="form-label">
                    Цена продажи (сум) *
                    {isMobile && <span className="form-hint">обязательно</span>}
                  </label>
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="10 000 000"
                    className="form-input"
                    required
                    disabled={loading}
                    min="0"
                    step="1"
                  />
                  <div className="price-hint">
                    <span className="price-hint-icon">💡</span>
                    <span className="price-hint-text">Рекомендуемая цена:</span>
                    <strong>{getRecommendedPrice().toLocaleString()} сум</strong>
                    <span className="price-hint-note">(закупка + 20%)</span>
                  </div>
                </div>

                {/* Прибыль */}
                {profit !== null && (
                  <div className={`profit-preview ${profit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                    <div className="profit-label">Прибыль:</div>
                    <div className="profit-value">{formatMoney(profit)}</div>
                    <div className="profit-status">
                      {profit >= 0 ? '✅ Прибыльная продажа' : '⚠️ Убыточная продажа'}
                    </div>
                  </div>
                )}

                {/* Комментарий */}
                <div className="form-group">
                  <label className="form-label">Комментарий</label>
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={isMobile ? "Дополнительная информация..." : "Дополнительная информация о продаже"}
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        Оформление...
                      </>
                    ) : (
                      <>
                        <span className="btn-submit-icon">💰</span>
                        <span className="btn-submit-text">Продать</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {deviceInfo && deviceInfo.status !== 'IN_STOCK' && (
              <div className="device-sold-message">
                <span className="sold-icon">⚠️</span>
                <span>Этот товар уже {deviceInfo.status_display?.toLowerCase()}</span>
              </div>
            )}
          </form>
        </div>

        <Modal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          title="Подтверждение продажи"
        >
          <div className="confirm-modal">
            <div className="confirm-header">
              <div className="confirm-icon">💰</div>
              <h3>Подтвердите продажу</h3>
              <p>Проверьте все данные перед продажей</p>
            </div>

            <div className="confirm-summary">
              <div className="confirm-item">
                <span className="confirm-label">Тип</span>
                <span className="confirm-value">
                  {deviceInfo?.product_type === 'PHONE' ? '📱 Телефон' : '🎧 Аксессуар'}
                </span>
              </div>
              <div className="confirm-item">
                <span className="confirm-label">Товар</span>
                <span className="confirm-value highlight">{deviceInfo?.product_name}</span>
              </div>
              {deviceInfo?.product_type === 'PHONE' ? (
                <>
                  <div className="confirm-item">
                    <span className="confirm-label">RAM</span>
                    <span className="confirm-value">{deviceInfo?.product_ram}</span>
                  </div>
                  <div className="confirm-item">
                    <span className="confirm-label">Память</span>
                    <span className="confirm-value">{deviceInfo?.product_storage}</span>
                  </div>
                  <div className="confirm-item">
                    <span className="confirm-label">Цвет</span>
                    <span className="confirm-value">{deviceInfo?.product_color}</span>
                  </div>
                  <div className="confirm-item">
                    <span className="confirm-label">IMEI</span>
                    <span className="confirm-value monospace">{deviceInfo?.imei || 'Не указан'}</span>
                  </div>
                </>
              ) : (
                <div className="confirm-item">
                  <span className="confirm-label">Серийный номер</span>
                  <span className="confirm-value monospace">
                    {deviceInfo?.product_serial || deviceInfo?.imei || 'Не указан'}
                  </span>
                </div>
              )}
              <div className="confirm-divider"></div>
              <div className="confirm-item">
                <span className="confirm-label">Закупочная цена</span>
                <span className="confirm-value">{formatMoney(deviceInfo?.purchase_price)}</span>
              </div>
              {deviceInfo?.extra_expenses > 0 && (
                <div className="confirm-item">
                  <span className="confirm-label">Доп. расходы</span>
                  <span className="confirm-value">{formatMoney(deviceInfo?.extra_expenses)}</span>
                </div>
              )}
              <div className="confirm-item">
                <span className="confirm-label">Себестоимость</span>
                <span className="confirm-value">{formatMoney(deviceInfo?.total_cost)}</span>
              </div>
              <div className="confirm-divider"></div>
              <div className="confirm-item confirm-total">
                <span className="confirm-label">Цена продажи</span>
                <span className="confirm-value total-price">{formatMoney(salePrice)}</span>
              </div>
              {profit !== null && (
                <div className="confirm-item">
                  <span className="confirm-label">Прибыль</span>
                  <span className={`confirm-value ${profit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                    {formatMoney(profit)}
                  </span>
                </div>
              )}
              {comment && (
                <div className="confirm-item">
                  <span className="confirm-label">Комментарий</span>
                  <span className="confirm-value">{comment}</span>
                </div>
              )}
            </div>

            <div className="confirm-actions">
              <button
                className="btn-confirm-cancel"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                Отмена
              </button>
              <button
                className="btn-confirm-submit"
                onClick={confirmSale}
                disabled={loading}
              >
                {loading ? '⏳ Оформление...' : '✅ Подтвердить продажу'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}

export default function NewSalePage() {
  return (
    <Suspense fallback={<div className="loading-state">Загрузка формы продажи...</div>}>
      <NewSaleForm />
    </Suspense>
  );
}