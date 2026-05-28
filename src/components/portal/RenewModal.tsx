import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Settings = { ecocash: string; bank_account: string; omari: string };

export function RenewModal({
  open, onClose, amount, supportHref = 'mailto:support@hextech.co.zw',
}: {
  open: boolean;
  onClose: () => void;
  amount: string;
  supportHref?: string;
}) {
  const [s, setS] = useState<Settings>({ ecocash: '', bank_account: '', omari: '' });
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from('payment_settings')
        .select('ecocash, bank_account, omari')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setS({ ecocash: data.ecocash ?? '', bank_account: data.bank_account ?? '', omari: data.omari ?? '' });
    })();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const copy = async (key: string, value: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
  };

  const methods = [
    { key: 'ecocash', label: 'EcoCash', value: s.ecocash || '—' },
    { key: 'bank', label: 'Bank Account', value: s.bank_account || '—' },
    { key: 'omari', label: 'Omari', value: s.omari || '—' },
  ];

  return (
    <div className="hx-modal-overlay" onClick={onClose}>
      <div className="hx-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="hx-modal-close" onClick={onClose} aria-label="Close">×</button>
        <div className="hx-modal-title">// Payment Details</div>
        <p className="hx-modal-sub">Send your payment to any of the following accounts and contact support to confirm.</p>

        <div className="hx-pay-list">
          {methods.map((m) => (
            <div key={m.key} className="hx-pay-block">
              <div className="hx-pay-label">{m.label}</div>
              <div className="hx-pay-row">
                <div className="hx-pay-value">{m.value}</div>
                <button
                  className={`hx-copy-btn ${copied === m.key ? 'copied' : ''}`}
                  onClick={() => copy(m.key, m.value)}
                  disabled={!m.value || m.value === '—'}
                >
                  {copied === m.key ? 'COPIED ✓' : 'COPY'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="hx-amount">Amount Due: USD {amount}</div>
        <div className="hx-note">After payment, contact Hextech support to confirm your payment and activate your account.</div>
        <a href={supportHref} className="hx-support-btn">CONTACT SUPPORT</a>
      </div>
    </div>
  );
}
