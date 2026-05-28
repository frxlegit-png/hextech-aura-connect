import { useEffect } from 'react';
import { formatInvoiceDate } from '@/lib/invoices';

export interface InvoiceData {
  id: string;
  invoice_date: string;
  due_date: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  plan: string;
  amount: number;
  status: string;
}

interface Props {
  invoice: InvoiceData | null;
  onClose: () => void;
}

export function InvoiceModal({ invoice, onClose }: Props) {
  useEffect(() => {
    if (!invoice) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [invoice, onClose]);

  if (!invoice) return null;
  const paid = invoice.status?.toUpperCase() === 'PAID';
  const amt = `$${Number(invoice.amount).toFixed(2)}`;

  return (
    <div className="inv-overlay" onClick={onClose}>
      <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
        <button className="inv-close" onClick={onClose} aria-label="Close">×</button>
        <div className="inv-header">// Invoice</div>

        <div className="inv-brand">
          <div className="inv-brand-name">HEXTECH NETWORKS</div>
          <div className="inv-brand-url">hextech.co.zw</div>
        </div>

        <div className="inv-divider" />

        <div className="inv-row"><span className="inv-k">INVOICE DATE</span><span className="inv-v">{formatInvoiceDate(invoice.invoice_date)}</span></div>
        <div className="inv-row"><span className="inv-k">DUE DATE</span><span className="inv-v">{formatInvoiceDate(invoice.due_date)}</span></div>

        <div className="inv-divider" />

        <div className="inv-section-label">BILL TO:</div>
        <div className="inv-bill">{invoice.client_name || '—'}</div>
        <div className="inv-bill-sub">{invoice.client_email || '—'}</div>
        <div className="inv-bill-sub">{invoice.client_phone || '—'}</div>

        <div className="inv-divider" />

        <div className="inv-row inv-line-head">
          <span className="inv-k">DESCRIPTION</span><span className="inv-v">AMOUNT</span>
        </div>
        <div className="inv-row">
          <span className="inv-v">{invoice.plan ? `${invoice.plan}` : 'Monthly Subscription'}</span>
          <span className="inv-v">{amt}</span>
        </div>

        <div className="inv-divider" />

        <div className="inv-row inv-total">
          <span>TOTAL</span><span>{amt}</span>
        </div>

        <div className="inv-divider" />

        <div className="inv-status-row">
          <span className="inv-k">STATUS:</span>
          <span className={`inv-status ${paid ? 'paid' : 'unpaid'}`}>{paid ? 'PAID' : 'UNPAID'}</span>
        </div>

        <button className="inv-close-btn" onClick={onClose}>CLOSE</button>
      </div>
    </div>
  );
}
