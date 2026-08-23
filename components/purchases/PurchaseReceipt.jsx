'use client';

import Modal from "../ui/Modal";

export default function PurchaseReceipt({ purchase, isOpen, onClose }) {
  if (!purchase) return null;

  const formatMoney = (amount) => {
    if (!amount) return '0 сум';
    return Number(amount).toLocaleString() + ' сум';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🧾 Чек прихода">
      <div className="receipt">
        <div className="receipt-header">
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Приход №{purchase.id}
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>
            {purchase.formatted_date}
          </div>
        </div>

        <div className="receipt-divider" />

        <div className="receipt-info">
          <div className="info-row">
            <span>Поставщик:</span>
            <span>{purchase.supplier_name || 'Не указан'}</span>
          </div>
          {purchase.comment && (
            <div className="info-row">
              <span>Комментарий:</span>
              <span>{purchase.comment}</span>
            </div>
          )}
          <div className="info-row">
            <span>Количество:</span>
            <span>{purchase.total_count || 0} шт.</span>
          </div>
          <div className="info-row">
            <span>Стоимость товаров:</span>
            <span>{formatMoney(purchase.devices_total)}</span>
          </div>
          {purchase.extra_expenses > 0 && (
            <>
              <div className="info-row">
                <span>Доп. расходы:</span>
                <span>{formatMoney(purchase.extra_expenses)}</span>
              </div>
              {purchase.extra_expenses_comment && (
                <div className="info-row">
                  <span>Комментарий к расходам:</span>
                  <span>{purchase.extra_expenses_comment}</span>
                </div>
              )}
            </>
          )}
          <div className="info-row" style={{ borderTop: '2px solid #e5e7eb', paddingTop: '12px', marginTop: '8px' }}>
            <span style={{ fontWeight: '600' }}>Общая сумма:</span>
            <span style={{ fontWeight: '700', fontSize: '16px', color: '#2563eb' }}>
              {formatMoney(purchase.total_price)}
            </span>
          </div>
        </div>

        <div className="receipt-divider" />

        <div className="receipt-items">
          <h4 style={{ marginBottom: '12px' }}>📱 Устройства</h4>
          {purchase.devices?.map((device, index) => (
            <div key={device.id} className="device-item">
              <div style={{ fontWeight: '500' }}>
                {device.product_name} - {device.product_ram} - {device.product_storage} - {device.product_color}
              </div>
              <div style={{ fontSize: '14px', color: '#4a4a6a', fontFamily: 'monospace' }}>
                IMEI: {device.imei}
              </div>
              <div style={{ fontSize: '14px', color: '#4a4a6a' }}>
                Закупка: {formatMoney(device.purchase_price)}
                {device.extra_expenses > 0 && ` + доп. расходы: ${formatMoney(device.extra_expenses)}`}
              </div>
              <div style={{ fontSize: '14px', color: '#4a4a6a' }}>
                Себестоимость: {formatMoney(device.total_cost)}
              </div>
              {index < purchase.devices.length - 1 && <div className="item-divider" />}
            </div>
          ))}
        </div>

        <div className="receipt-divider" />

        <div className="receipt-footer">
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Создан: {purchase.formatted_date}
          </div>
        </div>
      </div>

      <style jsx>{`
        .receipt {
          font-size: 14px;
        }
        .receipt-header {
          text-align: center;
          margin-bottom: 16px;
        }
        .receipt-divider {
          border-top: 2px dashed #e5e7eb;
          margin: 16px 0;
        }
        .receipt-info {
          display: grid;
          gap: 8px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
        }
        .info-row span:first-child {
          color: #6b7280;
        }
        .receipt-items {
          max-height: 300px;
          overflow-y: auto;
        }
        .device-item {
          padding: 8px 0;
        }
        .item-divider {
          border-top: 1px solid #f1f3f5;
          margin: 8px 0;
        }
        .receipt-footer {
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
      `}</style>
    </Modal>
  );
}