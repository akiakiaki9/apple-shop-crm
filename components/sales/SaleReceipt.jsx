'use client';

import Modal from "../ui/Modal";

export default function SaleReceipt({ sale, isOpen, onClose }) {
  if (!sale) return null;

  const formatMoney = (amount) => {
    if (!amount) return '0 сум';
    return Number(amount).toLocaleString() + ' сум';
  };

  const device = sale.device_info;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🧾 Чек продажи">
      <div className="receipt">
        <div className="receipt-header">
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Продажа №{sale.id}
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>
            {sale.formatted_date}
          </div>
        </div>

        <div className="receipt-divider" />

        <div className="receipt-product">
          <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
            {device?.product_name}
          </div>
          <div style={{ color: '#4a4a6a' }}>
            {device?.product_ram} • {device?.product_storage} • {device?.product_color}
          </div>
        </div>

        <div className="receipt-divider" />

        <div className="receipt-info">
          <div className="info-row">
            <span>IMEI:</span>
            <span style={{ fontFamily: 'monospace' }}>{device?.imei}</span>
          </div>
          <div className="info-row">
            <span>Закупочная цена:</span>
            <span>{formatMoney(device?.purchase_price)}</span>
          </div>
          {device?.extra_expenses > 0 && (
            <div className="info-row">
              <span>Доп. расходы:</span>
              <span>{formatMoney(device?.extra_expenses)}</span>
            </div>
          )}
          <div className="info-row">
            <span>Себестоимость:</span>
            <span>{formatMoney(device?.total_cost)}</span>
          </div>
          <div className="info-row" style={{ borderTop: '2px solid #e5e7eb', paddingTop: '12px', marginTop: '8px' }}>
            <span style={{ fontWeight: '600' }}>Цена продажи:</span>
            <span style={{ fontWeight: '700', fontSize: '18px', color: '#2563eb' }}>
              {formatMoney(sale.sale_price)}
            </span>
          </div>
          <div className="info-row">
            <span style={{ fontWeight: '600' }}>Прибыль:</span>
            <span style={{ 
              fontWeight: '700', 
              color: (sale.profit || 0) >= 0 ? '#16a34a' : '#dc2626',
              fontSize: '18px'
            }}>
              {formatMoney(sale.profit)}
            </span>
          </div>
          {sale.comment && (
            <div className="info-row">
              <span>Комментарий:</span>
              <span>{sale.comment}</span>
            </div>
          )}
        </div>

        <div className="receipt-divider" />

        <div className="receipt-footer">
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Продано: {sale.formatted_date}
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
            Спасибо за покупку! 🌟
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
        .receipt-product {
          text-align: center;
          padding: 8px 0;
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
        .receipt-footer {
          text-align: center;
          color: #6b7280;
        }
      `}</style>
    </Modal>
  );
}