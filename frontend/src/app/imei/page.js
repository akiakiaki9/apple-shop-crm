'use client';

import { useState, useEffect } from 'react';
import Navigation from '../../../components/layout/Navigation';
import api from '../../../lib/api';
import './imei.css';

export default function IMEIPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setDevices([]);
        setSearched(true);

        const query = searchQuery.trim();
        if (!query) {
            setError('Введите IMEI, серийный номер или название товара');
            setLoading(false);
            return;
        }

        try {
            const response = await api.get(`/devices/search/?q=${encodeURIComponent(query)}`);
            if (Array.isArray(response.data)) {
                setDevices(response.data);
            } else {
                setDevices([response.data]);
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setError('Устройство не найдено');
            } else {
                console.error('Ошибка поиска:', err);
                setError('Произошла ошибка при поиске. Попробуйте позже.');
            }
            setDevices([]);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (amount) => {
        if (!amount) return '0 сум';
        return Number(amount).toLocaleString() + ' сум';
    };

    const getDeviceType = (device) => {
        return device.product_type === 'PHONE' ? '📱 Телефон' : '🎧 Аксессуар';
    };

    const getDeviceIdentifier = (device) => {
        if (device.product_type === 'PHONE') {
            return device.imei || 'Без IMEI';
        } else {
            return device.imei || device.product_serial || 'Без номера';
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'IN_STOCK': 'badge-success',
            'SOLD': 'badge-danger',
            'RESERVED': 'badge-warning'
        };
        return badges[status] || 'badge-secondary';
    };

    const DeviceCard = ({ device, index }) => {
        const isPhone = device.product_type === 'PHONE';
        const isInStock = device.status === 'IN_STOCK';

        return (
            <div className="device-card">
                <div className="device-card-header">
                    <div className="device-card-title">
                        <span className="device-card-icon">📱</span>
                        <h2>Устройство #{index + 1}</h2>
                    </div>
                    <span className={`badge ${getStatusBadge(device.status)}`}>
                        {device.status_display}
                    </span>
                </div>

                <div className="device-card-body">
                    <div className="device-info-grid">
                        <div className="device-info-item">
                            <span className="device-info-label">Тип</span>
                            <span className="device-info-value">{getDeviceType(device)}</span>
                        </div>
                        <div className="device-info-item">
                            <span className="device-info-label">Товар</span>
                            <span className="device-info-value highlight">{device.product_name}</span>
                        </div>

                        {isPhone ? (
                            <>
                                <div className="device-info-item">
                                    <span className="device-info-label">RAM</span>
                                    <span className="device-info-value">{device.product_ram || '—'}</span>
                                </div>
                                <div className="device-info-item">
                                    <span className="device-info-label">Память</span>
                                    <span className="device-info-value">{device.product_storage || '—'}</span>
                                </div>
                                <div className="device-info-item">
                                    <span className="device-info-label">Цвет</span>
                                    <span className="device-info-value">{device.product_color || '—'}</span>
                                </div>
                            </>
                        ) : (
                            <div className="device-info-item">
                                <span className="device-info-label">Серийный номер</span>
                                <span className="device-info-value monospace">
                                    {device.product_serial || device.imei || '—'}
                                </span>
                            </div>
                        )}

                        <div className="device-info-item highlight">
                            <span className="device-info-label">
                                {isPhone ? 'IMEI' : 'Номер'}
                            </span>
                            <span className="device-info-value monospace large">
                                {getDeviceIdentifier(device)}
                            </span>
                        </div>

                        <div className="device-info-item">
                            <span className="device-info-label">Закупочная цена</span>
                            <span className="device-info-value">{formatMoney(device.purchase_price)}</span>
                        </div>

                        {device.extra_expenses > 0 && (
                            <div className="device-info-item">
                                <span className="device-info-label">Доп. расходы</span>
                                <span className="device-info-value">{formatMoney(device.extra_expenses)}</span>
                            </div>
                        )}

                        <div className="device-info-item highlight">
                            <span className="device-info-label">Себестоимость</span>
                            <span className="device-info-value strong">{formatMoney(device.total_cost)}</span>
                        </div>

                        {device.sale_price && (
                            <>
                                <div className="device-info-item">
                                    <span className="device-info-label">Цена продажи</span>
                                    <span className="device-info-value">{formatMoney(device.sale_price)}</span>
                                </div>
                                <div className="device-info-item">
                                    <span className="device-info-label">Прибыль</span>
                                    <span className={`device-info-value profit ${device.profit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                                        {formatMoney(device.profit)}
                                    </span>
                                </div>
                            </>
                        )}

                        <div className="device-info-item">
                            <span className="device-info-label">Дата прихода</span>
                            <span className="device-info-value">
                                {new Date(device.created_at).toLocaleDateString('ru-RU', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>

                        {device.sold_at && (
                            <div className="device-info-item">
                                <span className="device-info-label">Дата продажи</span>
                                <span className="device-info-value">
                                    {new Date(device.sold_at).toLocaleDateString('ru-RU', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {isInStock && (
                    <div className="device-card-footer">
                        <a
                            href={`/sales/new?device=${device.id}`}
                            className="btn-sell"
                        >
                            <span className="btn-sell-icon">🛒</span>
                            <span className="btn-sell-text">Продать этот товар</span>
                        </a>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <Navigation />
            <div className="imei-container">
                <header className="imei-header">
                    <div className="imei-header-left">
                        <h1 className="imei-title">🔍 Поиск по IMEI</h1>
                        <p className="imei-subtitle">
                            Быстрый поиск устройства по IMEI, серийному номеру или названию товара
                        </p>
                    </div>
                </header>

                <div className="imei-search-card">
                    <form onSubmit={handleSearch} className="imei-search-form">
                        <div className="search-input-group">
                            <span className="search-input-icon">🔍</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={isMobile ? "IMEI, SN или название..." : "Введите IMEI, серийный номер или название товара"}
                                className="search-input-field"
                                required
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                className="search-btn"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-small"></span>
                                        Поиск...
                                    </>
                                ) : (
                                    <>
                                        <span className="search-btn-icon">🔍</span>
                                        <span className="search-btn-text">Найти</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="search-hint">
                            <span className="search-hint-icon">💡</span>
                            <span className="search-hint-text">
                                Например: 358000000000001, SN-2024-001 или iPhone 15
                            </span>
                        </div>
                    </form>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <span className="alert-icon">⚠️</span>
                        <span className="alert-text">{error}</span>
                    </div>
                )}

                {devices.length > 0 && (
                    <div className="results-section">
                        <div className="results-header">
                            <span className="results-count">
                                <span className="count-badge">
                                    {devices.length}
                                </span>
                                {devices.length === 1 ? 'устройство найдено' : 'устройств найдено'}
                            </span>
                            <button
                                onClick={() => {
                                    setDevices([]);
                                    setSearched(false);
                                    setSearchQuery('');
                                }}
                                className="clear-results"
                                type="button"
                            >
                                ✕ Очистить
                            </button>
                        </div>

                        <div className="devices-list">
                            {devices.map((device, index) => (
                                <DeviceCard key={device.id || index} device={device} index={index} />
                            ))}
                        </div>
                    </div>
                )}

                {searched && devices.length === 0 && !error && (
                    <div className="empty-state">
                        <div className="empty-icon">🔍</div>
                        <h3 className="empty-title">Устройство не найдено</h3>
                        <p className="empty-text">
                            Попробуйте изменить запрос или проверьте правильность ввода
                        </p>
                        <div className="empty-tips">
                            <div className="tip">
                                <span className="tip-icon">💡</span>
                                <span>Проверьте правильность IMEI или серийного номера</span>
                            </div>
                            <div className="tip">
                                <span className="tip-icon">💡</span>
                                <span>Используйте часть названия товара</span>
                            </div>
                            <div className="tip">
                                <span className="tip-icon">💡</span>
                                <span>Убедитесь, что устройство существует в системе</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}