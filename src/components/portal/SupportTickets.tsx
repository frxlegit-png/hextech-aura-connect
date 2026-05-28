import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hexToast } from '@/components/hex/HexToast';

interface Ticket {
  id: string;
  ticket_code: string | null;
  subject: string;
  message: string | null;
  status: string;
  created_at: string;
}

interface Props {
  userId: string;
  customerName: string;
}

function pillClass(status: string) {
  const s = status.toLowerCase();
  if (s === 'resolved') return 'pill pill-paid';
  if (s === 'opened') return 'pill pill-opened';
  return 'pill pill-pending';
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function SupportTickets({ userId, customerName }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [active, setActive] = useState<Ticket | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('tickets')
      .select('id, ticket_code, subject, message, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setTickets(data as Ticket[]);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('user-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `user_id=eq.${userId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    setSubmitting(true);
    const code = 'HTX-' + Date.now().toString(36).toUpperCase().slice(-6);
    const { error } = await supabase.from('tickets').insert({
      user_id: userId,
      customer_name: customerName,
      subject: subject.trim(),
      message: message.trim() || null,
      status: 'pending',
      ticket_code: code,
    });
    setSubmitting(false);
    if (error) { hexToast.error(error.message); return; }
    hexToast.success(`Ticket ${code} submitted`);
    setSubject(''); setMessage('');
    load();
  };

  return (
    <div className="ticket-grid">
      <div className="panel">
        <div className="panel-title">// Submit Support Ticket</div>
        <form onSubmit={submit} className="ticket-form">
          <label className="tf-label">Subject</label>
          <input
            className="tf-input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of the issue"
            maxLength={120}
            required
          />
          <label className="tf-label">Message</label>
          <textarea
            className="tf-input tf-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the issue in detail..."
            rows={5}
          />
          <button type="submit" className="btn-renew" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="panel-title">// My Tickets</div>
        {tickets.length === 0 ? (
          <div className="tf-empty">No tickets submitted yet.</div>
        ) : (
          <div className="ticket-list">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="ticket-item"
                role="button"
                tabIndex={0}
                onClick={() => setActive(t)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(t); } }}
                style={{ cursor: 'pointer' }}
              >
                <div className="ticket-row">
                  <div className="ticket-code">{t.ticket_code ?? t.id.slice(0, 6)}</div>
                  <span className={pillClass(t.status)}>{t.status.toUpperCase()}</span>
                </div>
                <div className="ticket-subject">{t.subject}</div>
                {t.message && <div className="ticket-msg" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.message}</div>}
                <div className="ticket-date">{fmt(t.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {active && (
        <div className="hx-modal-overlay" onClick={() => setActive(null)}>
          <div className="hx-modal" onClick={(e) => e.stopPropagation()}>
            <button className="hx-modal-close" onClick={() => setActive(null)} aria-label="Close">×</button>
            <div className="hx-modal-title">{active.ticket_code ?? active.id.slice(0, 8)}</div>
            <p className="hx-modal-sub">{fmt(active.created_at)}</p>

            <div className="hx-pay-list">
              <div className="hx-pay-block">
                <div className="hx-pay-label">Subject</div>
                <div className="ticket-subject" style={{ marginBottom: 0 }}>{active.subject}</div>
              </div>
              <div className="hx-pay-block">
                <div className="hx-pay-label">Message</div>
                <div className="ticket-msg" style={{ marginBottom: 0, color: 'rgba(255,255,255,0.75)' }}>
                  {active.message || 'No message provided.'}
                </div>
              </div>
              <div className="hx-pay-block">
                <div className="hx-pay-label">Status</div>
                <span className={pillClass(active.status)}>{active.status.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
