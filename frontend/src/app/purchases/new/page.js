'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../../../components/layout/Navigation';
import api from '../../../../lib/api';
import Input from '../../../../components/ui/Input';
import Button from '../../../../components/ui/Button';
import Modal from '../../../../components/ui/Modal';
import './new-purchase.css';

export default function NewPurchasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [productType, setProductType] = useState('PHONE');
  const [customColor, setCustomColor] = useState('');
  const [customStorage, setCustomStorage] = useState('');
  const [customRam, setCustomRam] = useState('');
  const [formData, setFormData] = useState({
    product_name: '',
    product_type: 'PHONE',
    ram: '',
    storage: '',
    color: '',
    purchase_price: '',
    extra_expenses: '',
    extra_expenses_comment: '',
    supplier_name: '',
    comment: '',
    imeis: '',
  });

  const ramOptions = [
    '4 GB', '6 GB', '8 GB', '12 GB', '16 GB', '18 GB', '24 GB', '32 GB', '36 GB'
  ];

  const storageOptions = [
    '64 GB', '128 GB', '256 GB', '512 GB', '1 TB', '2 TB'
  ];

  const colorOptions = [
    'Black', 'White', 'Blue', 'Red', 'Green',
    'Yellow', 'Purple', 'Natural', 'Gold', 'Silver',
    'Pink', 'Orange', 'Gray', 'Brown', 'Coral',
    'Titanium', 'Graphite', 'Sierra Blue', 'Alpine Green',
    'Starry Purple MEANA', 'Nebula Red MEANA', 'Sapphire Blue RK',
    'Aurora Gold RK', 'Lumina Forest MMN', 'Eclipse BLUE MMN',
    'Cappuccino Brown RK', 'Ice White RK', 'Plum Purple MMN',
    'Ice White RK', 'Ice Blue MMN', 'Aurora Green RK',
    'Mist White RK', 'Aurora Blue RK'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleTypeChange = (type) => {
    setProductType(type);
    setFormData(prev => ({
      ...prev,
      product_type: type,
      ram: '',
      storage: '',
      color: '',
    }));
    setError('');
  };

  const handleAddCustom = (type) => {
    if (type === 'color' && customColor && !colorOptions.includes(customColor)) {
      colorOptions.push(customColor);
      setFormData(prev => ({ ...prev, color: customColor }));
      setCustomColor('');
    }
    if (type === 'storage' && customStorage && !storageOptions.includes(customStorage)) {
      storageOptions.push(customStorage);
      setFormData(prev => ({ ...prev, storage: customStorage }));
      setCustomStorage('');
    }
    if (type === 'ram' && customRam && !ramOptions.includes(customRam)) {
      ramOptions.push(customRam);
      setFormData(prev => ({ ...prev, ram: customRam }));
      setCustomRam('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.product_name) {
      setError('Введите название товара');
      return;
    }

    if (productType === 'PHONE') {
      if (!formData.ram) {
        setError('Выберите оперативную память');
        return;
      }
      if (!formData.storage) {
        setError('Выберите память');
        return;
      }
      if (!formData.color) {
        setError('Выберите цвет');
        return;
      }
    }

    if (!formData.purchase_price || formData.purchase_price <= 0) {
      setError('Введите корректную закупочную цену');
      return;
    }
    if (!formData.imeis.trim()) {
      setError('Введите хотя бы один IMEI/номер');
      return;
    }

    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    setLoading(true);
    setError('');
    setSuccess(null);

    try {
      const response = await api.post('/purchases/create_purchase/', {
        product_name: formData.product_name,
        product_type: formData.product_type,
        ram: formData.ram || '',
        storage: formData.storage || '',
        color: formData.color || '',
        purchase_price: Number(formData.purchase_price),
        extra_expenses: Number(formData.extra_expenses) || 0,
        extra_expenses_comment: formData.extra_expenses_comment || '',
        supplier_name: formData.supplier_name || '',
        comment: formData.comment || '',
        imeis: formData.imeis,
      });

      setSuccess({
        message: '✅ Приход успешно добавлен!',
        count: response.data.devices?.length || 0,
        total: response.data.total_price || 0,
        devices_total: response.data.devices_total || 0,
        extra_expenses: Number(formData.extra_expenses) || 0,
      });

      setFormData(prev => ({
        ...prev,
        product_name: '',
        ram: '',
        storage: '',
        color: '',
        purchase_price: '',
        extra_expenses: '',
        extra_expenses_comment: '',
        supplier_name: '',
        comment: '',
        imeis: '',
      }));

      // Автоматически скрыть уведомление через 8 секунд
      setTimeout(() => setSuccess(null), 8000);

    } catch (err) {
      console.error('Ошибка:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Произошла ошибка при создании прихода');
      }
    } finally {
      setLoading(false);
    }
  };

  const imeiCount = formData.imeis.split('\n').filter(i => i.trim()).length;
  const totalPrice = (Number(formData.purchase_price) * imeiCount + (Number(formData.extra_expenses) || 0));
  const totalPriceDisplay = totalPrice > 0 ? totalPrice.toLocaleString() : '0';

  return (
    <>
      <Navigation />
      <div className="purchase-container">
        <header className="purchase-header">
          <div>
            <h1 className="purchase-title">📦 Новый приход</h1>
            <p className="purchase-subtitle">Добавление товаров на склад</p>
          </div>
          <a href="/purchases" className="btn-history">
            📋 История приходов
          </a>
        </header>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">❌</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <div className="alert-success-content">
              <div className="alert-success-header">
                <span className="alert-success-icon">✅</span>
                <strong>{success.message}</strong>
              </div>
              <div className="alert-success-body">
                <div className="success-item">
                  <span className="success-label">Добавлено:</span>
                  <span className="success-value">{success.count} шт.</span>
                </div>
                <div className="success-item">
                  <span className="success-label">Стоимость товаров:</span>
                  <span className="success-value">{success.devices_total.toLocaleString()} сум</span>
                </div>
                {success.extra_expenses > 0 && (
                  <div className="success-item">
                    <span className="success-label">Дополнительные расходы:</span>
                    <span className="success-value">{success.extra_expenses.toLocaleString()} сум</span>
                  </div>
                )}
                <div className="success-item success-total">
                  <span className="success-label">Общая стоимость:</span>
                  <span className="success-value">{success.total.toLocaleString()} сум</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="purchase-card">
          <form onSubmit={handleSubmit} className="purchase-form">
            {/* Тип товара */}
            <div className="form-section">
              <label className="form-label">Тип товара *</label>
              <div className="type-toggle">
                <button
                  type="button"
                  className={`type-btn ${productType === 'PHONE' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('PHONE')}
                  disabled={loading}
                >
                  <span className="type-icon">📱</span>
                  Телефон
                </button>
                <button
                  type="button"
                  className={`type-btn ${productType === 'ACCESSORY' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('ACCESSORY')}
                  disabled={loading}
                >
                  <span className="type-icon">🎧</span>
                  Аксессуар
                </button>
              </div>
            </div>

            {/* Основные поля */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Название *</label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  placeholder={productType === 'PHONE' ? 'Например: iPhone 15 Pro Max' : 'Например: Чехол для iPhone 15'}
                  className="form-input"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Цена закупки (сум) *</label>
                <input
                  type="number"
                  name="purchase_price"
                  value={formData.purchase_price}
                  onChange={handleChange}
                  placeholder="8 500 000"
                  className="form-input"
                  required
                  disabled={loading}
                  min="0"
                  step="1"
                />
              </div>
            </div>

            {/* Характеристики для телефона */}
            {productType === 'PHONE' && (
              <div className="phone-specs">
                <div className="form-group">
                  <label className="form-label">Оперативная память (RAM) *</label>
                  <div className="custom-select-group">
                    <select
                      name="ram"
                      value={formData.ram}
                      onChange={handleChange}
                      className="form-select"
                      required
                      disabled={loading}
                    >
                      <option value="">Выберите RAM</option>
                      {ramOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <div className="custom-add-group">
                      <input
                        type="text"
                        value={customRam}
                        onChange={(e) => setCustomRam(e.target.value)}
                        placeholder="Своя"
                        className="form-input-small"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="btn-add-custom"
                        onClick={() => handleAddCustom('ram')}
                        disabled={loading || !customRam}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Память (Storage) *</label>
                    <div className="custom-select-group">
                      <select
                        name="storage"
                        value={formData.storage}
                        onChange={handleChange}
                        className="form-select"
                        required
                        disabled={loading}
                      >
                        <option value="">Выберите память</option>
                        {storageOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <div className="custom-add-group">
                        <input
                          type="text"
                          value={customStorage}
                          onChange={(e) => setCustomStorage(e.target.value)}
                          placeholder="Своя"
                          className="form-input-small"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          className="btn-add-custom"
                          onClick={() => handleAddCustom('storage')}
                          disabled={loading || !customStorage}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Цвет *</label>
                    <div className="custom-select-group">
                      <select
                        name="color"
                        value={formData.color}
                        onChange={handleChange}
                        className="form-select"
                        required
                        disabled={loading}
                      >
                        <option value="">Выберите цвет</option>
                        {colorOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <div className="custom-add-group">
                        <input
                          type="text"
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                          placeholder="Свой"
                          className="form-input-small"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          className="btn-add-custom"
                          onClick={() => handleAddCustom('color')}
                          disabled={loading || !customColor}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Дополнительные расходы */}
            <div className="extra-expenses">
              <div className="extra-expenses-header">
                <span className="extra-expenses-icon">💰</span>
                <h4>Дополнительные расходы</h4>
                <span className="extra-expenses-badge">Опционально</span>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Сумма доп. расходов</label>
                  <input
                    type="number"
                    name="extra_expenses"
                    value={formData.extra_expenses}
                    onChange={handleChange}
                    placeholder="100 000"
                    className="form-input"
                    disabled={loading}
                    min="0"
                    step="1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Комментарий к расходам</label>
                  <input
                    type="text"
                    name="extra_expenses_comment"
                    value={formData.extra_expenses_comment}
                    onChange={handleChange}
                    placeholder="Например: Доставка, упаковка"
                    className="form-input"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Поставщик и комментарий */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Поставщик</label>
                <input
                  type="text"
                  name="supplier_name"
                  value={formData.supplier_name}
                  onChange={handleChange}
                  placeholder="Название поставщика"
                  className="form-input"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Комментарий</label>
                <input
                  type="text"
                  name="comment"
                  value={formData.comment}
                  onChange={handleChange}
                  placeholder="Дополнительная информация"
                  className="form-input"
                  disabled={loading}
                />
              </div>
            </div>

            {/* IMEI/номера */}
            <div className="form-group">
              <label className="form-label">
                {productType === 'PHONE' ? 'IMEI' : 'Серийные номера'} *
                <span className="form-hint">(каждый на новой строке)</span>
              </label>
              <textarea
                name="imeis"
                value={formData.imeis}
                onChange={handleChange}
                placeholder={productType === 'PHONE'
                  ? "358000000000001\n358000000000002\n358000000000003"
                  : "SN-2024-001\nSN-2024-002\nSN-2024-003"
                }
                rows="6"
                className="form-textarea"
                required
                disabled={loading}
              />
              {formData.imeis && (
                <div className="imei-counter">
                  <span>Найдено:</span>
                  <strong>{imeiCount}</strong>
                  <span>{productType === 'PHONE' ? 'IMEI' : 'номеров'}</span>
                  {imeiCount > 0 && Number(formData.purchase_price) > 0 && (
                    <span className="imei-total">
                      Общая стоимость: {totalPriceDisplay} сум
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Сохранение...
                  </>
                ) : (
                  '📦 Добавить приход'
                )}
              </button>
            </div>
          </form>
        </div>

        <Modal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          title="Подтверждение прихода"
        >
          <div className="confirm-modal">
            <div className="confirm-header">
              <div className="confirm-icon">📦</div>
              <h3>Подтвердите добавление прихода</h3>
              <p>Проверьте все данные перед сохранением</p>
            </div>

            <div className="confirm-summary">
              <div className="confirm-item">
                <span className="confirm-label">Тип:</span>
                <span className="confirm-value">
                  {productType === 'PHONE' ? 'Телефон' : 'Аксессуар'}
                </span>
              </div>
              <div className="confirm-item">
                <span className="confirm-label">Название:</span>
                <span className="confirm-value highlight">{formData.product_name}</span>
              </div>
              {productType === 'PHONE' && (
                <>
                  <div className="confirm-item">
                    <span className="confirm-label">RAM:</span>
                    <span className="confirm-value">{formData.ram}</span>
                  </div>
                  <div className="confirm-item">
                    <span className="confirm-label">Память:</span>
                    <span className="confirm-value">{formData.storage}</span>
                  </div>
                  <div className="confirm-item">
                    <span className="confirm-label">Цвет:</span>
                    <span className="confirm-value">{formData.color}</span>
                  </div>
                </>
              )}
              <div className="confirm-item">
                <span className="confirm-label">Закупочная цена:</span>
                <span className="confirm-value">
                  {Number(formData.purchase_price).toLocaleString()} сум
                </span>
              </div>
              {formData.extra_expenses && Number(formData.extra_expenses) > 0 && (
                <>
                  <div className="confirm-item">
                    <span className="confirm-label">Доп. расходы:</span>
                    <span className="confirm-value">
                      {Number(formData.extra_expenses).toLocaleString()} сум
                    </span>
                  </div>
                  {formData.extra_expenses_comment && (
                    <div className="confirm-item">
                      <span className="confirm-label">Комментарий к расходам:</span>
                      <span className="confirm-value">{formData.extra_expenses_comment}</span>
                    </div>
                  )}
                </>
              )}
              <div className="confirm-divider"></div>
              <div className="confirm-item">
                <span className="confirm-label">Количество:</span>
                <span className="confirm-value highlight">{imeiCount} шт.</span>
              </div>
              <div className="confirm-item confirm-total">
                <span className="confirm-label">Общая стоимость:</span>
                <span className="confirm-value total-price">{totalPriceDisplay} сум</span>
              </div>
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
                onClick={confirmSubmit}
                disabled={loading}
              >
                {loading ? '⏳ Сохранение...' : '✅ Подтвердить приход'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}