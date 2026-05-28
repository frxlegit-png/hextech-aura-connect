import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { RenewModal } from '@/components/portal/RenewModal';
import {
  daysRemaining as calcDaysRemaining,
  nextBillingDate,
  currentCycleStart,
  effectiveState,
  isManual,
} from '@/lib/billing';
import './PortalDashboard.css';

type AccountState = 'active' | 'suspended' | 'expiring' | 'expired' | 'pending';

interface BillingData {
  account_id: string | null;
  billing_start: string | null;
  billing_end: string | null;
  billing_day: number | null;
  account_state: AccountState;
  balance: number;
  monthly_fee: number;
}

function formatDate(d: Date | string | null) {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PortalDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [showRenew, setShowRenew] = useState(false);

  const fullName = (user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] || 'Customer';
  const firstName = fullName.split(' ')[0];

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('customer_billing')
        .select('account_id, billing_start, billing_end, account_state, balance, monthly_fee')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setBilling(data as BillingData);
    })();
  }, [user]);

  const state = deriveState(billing);
  const accountId = billing?.account_id ?? '—';
  const monthly = (billing?.monthly_fee ?? 24.99).toFixed(2);
  const balance = (billing?.balance ?? 0).toFixed(2);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const daysToRenewal = useMemo(() => {
    if (!billing?.billing_end) return null;
    const end = new Date(billing.billing_end);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  }, [billing?.billing_end]);

  const cfg = useMemo(() => {
    const daysVal = daysToRenewal !== null ? String(daysToRenewal) : '—';
    const renewSub = billing?.billing_end ? `Renews ${formatDate(billing.billing_end)}` : 'No billing cycle set';

    switch (state) {
      case 'suspended':
        return {
          badge: { tone: 'red', dot: 'static' as const, text: 'ACCOUNT SUSPENDED' },
          days: { value: '—', color: 'muted', accent: 'c-red', sub: 'Subscription suspended' },
          balance: { value: `$${balance}`, color: 'red', sub: 'Payment required' },
          subStatus: { text: 'SUSPENDED', color: 'red' },
          alert: { tone: 'red' as const, text: 'Your account has been suspended. Please make a payment to restore access.' },
          renew: { label: 'Reactivate Account', variant: 'red', pulse: false },
          pendingRow: false,
        };
      case 'expiring':
        return {
          badge: { tone: 'amber', dot: 'pulse' as const, text: 'RENEWAL DUE SOON' },
          days: { value: daysVal, color: 'amber', accent: 'c-amber', sub: renewSub },
          balance: { value: `$${balance}`, color: parseFloat(balance) > 0 ? 'amber' : 'green', sub: parseFloat(balance) > 0 ? 'Payment recommended' : 'All payments up to date' },
          subStatus: { text: 'ACTIVE', color: 'green' },
          alert: { tone: 'amber' as const, text: `Your subscription expires in ${daysVal} days. Renew now to avoid interruption.` },
          renew: { label: 'Renew Subscription', variant: 'purple', pulse: true },
          pendingRow: false,
        };
      case 'expired':
        return {
          badge: { tone: 'red', dot: 'static' as const, text: 'SUBSCRIPTION EXPIRED' },
          days: { value: '0', color: 'red', accent: 'c-red', sub: 'Expired' },
          balance: { value: `$${balance}`, color: 'amber', sub: 'Renewal required' },
          subStatus: { text: 'EXPIRED', color: 'red' },
          alert: { tone: 'red' as const, text: 'Your subscription has expired. Renew now to restore your connection.' },
          renew: { label: 'Renew Now', variant: 'red', pulse: false },
          pendingRow: false,
        };
      case 'pending':
        return {
          badge: { tone: 'amber', dot: 'pulse' as const, text: 'PAYMENT PENDING' },
          days: { value: daysVal, color: 'purple', accent: 'c-purple', sub: renewSub },
          balance: { value: `$${balance}`, color: 'amber', sub: 'Processing payment' },
          subStatus: { text: 'ACTIVE', color: 'green' },
          alert: { tone: 'amber' as const, text: 'Your payment is being processed. Your account will be updated shortly.' },
          renew: { label: 'Renew Subscription', variant: 'purple', pulse: false },
          pendingRow: true,
        };
      default:
        return {
          badge: { tone: 'green', dot: 'pulse' as const, text: 'ACCOUNT ACTIVE' },
          days: { value: daysVal, color: 'purple', accent: 'c-purple', sub: renewSub },
          balance: { value: `$${balance}`, color: parseFloat(balance) > 0 ? 'amber' : 'green', sub: parseFloat(balance) > 0 ? 'Balance outstanding' : 'All payments up to date' },
          subStatus: { text: 'ACTIVE', color: 'green' },
          alert: null,
          renew: { label: 'Renew Subscription', variant: 'purple', pulse: false },
          pendingRow: false,
        };
    }
  }, [state, balance, daysToRenewal, billing?.billing_end]);

  return (
    <div className="hex-dash">
      <div className="dots" />
      <div className="glow glow-purple" />
      <div className="glow glow-cyan" />
      <div className="corner corner-tl" />
      <div className="corner corner-br" />
      <div className="sys-tag">HEXTECH // CLIENT PORTAL v1.0</div>

      <div className="wrap">
        <nav className="nav">
          <div className="brand">
            <div className="brand-mark" />
            <div className="brand-name">HEX<span>TECH</span></div>
          </div>
          <div className="nav-right">
            <div className="nav-id">ID: <strong>{accountId}</strong></div>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        <div className="welcome">
          <div>
            <div className="welcome-tag">// DASHBOARD</div>
            <div className="welcome-name">Welcome back, <span>{firstName}.</span></div>
          </div>
          <div className={`status-badge ${cfg.badge.tone !== 'green' ? cfg.badge.tone : ''}`}>
            <div className={`badge-dot ${cfg.badge.tone !== 'green' ? cfg.badge.tone : ''} ${cfg.badge.dot === 'static' ? 'static' : ''}`} />
            <div className={`badge-text ${cfg.badge.tone !== 'green' ? cfg.badge.tone : ''}`}>{cfg.badge.text}</div>
          </div>
        </div>

        {cfg.alert && (
          <div className={`alert ${cfg.alert.tone}`}>
            <div className="alert-dot" />
            <div>{cfg.alert.text}</div>
          </div>
        )}

        <div className="stat-grid">
          <div className={`stat-card ${cfg.days.accent}`}>
            <div className="sc-label">Days to Renewal</div>
            <div className={`sc-value ${cfg.days.color}`}>{cfg.days.value}</div>
            <div className="sc-sub">{cfg.days.sub}</div>
          </div>
          <div className="stat-card c-cyan">
            <div className="sc-label">Current Plan</div>
            <div className="sc-value cyan" style={{ fontSize: 22, marginTop: 5 }}>Residential</div>
            <div className="sc-sub">Unlimited 4G LTE</div>
          </div>
          <div className="stat-card c-cyan">
            <div className="sc-label">Equipment</div>
            <div className="sc-value cyan" style={{ fontSize: 16, marginTop: 8 }}>Gen 2 AC Station</div>
            <div className="sc-sub">Customer-owned</div>
          </div>
          <div className="stat-card c-amber">
            <div className="sc-label">Outstanding Balance</div>
            <div className={`sc-value ${cfg.balance.color}`} style={{ fontSize: 24, marginTop: 4 }}>{cfg.balance.value}</div>
            <div className="sc-sub">{cfg.balance.sub}</div>
          </div>
        </div>

        <div className="mid-grid">
          <div className="panel">
            <div className="panel-title">// Subscription</div>
            <Row k="Plan" v="Residential Unlimited" vClass="cyan" />
            <Row k="Start Date" v={formatDate(billing?.billing_start ?? null)} />
            <Row k="Renewal Date" v={formatDate(billing?.billing_end ?? null)} vClass="purple" />
            <Row k="Monthly Fee" v={`USD ${monthly}`} />
            <Row k="Payment Method" v="EcoCash" vClass="green" />
            <Row k="Status" v={cfg.subStatus.text} vClass={cfg.subStatus.color} />
            <button
              className={`btn-renew ${cfg.renew.variant === 'red' ? 'red' : ''} ${cfg.renew.pulse ? 'pulse' : ''}`}
              onClick={() => setShowRenew(true)}
            >
              {cfg.renew.label}
            </button>
          </div>

          <div className="panel">
            <div className="panel-title">// Equipment</div>
            <div className="equip-header">
              <div className="equip-name">Gen 2 AC Client Station</div>
            </div>
            <div className="signal-wrap">
              <div className="signal-label">Signal Strength</div>
              <div className="signal-row">
                <div className="signal-bars">
                  <div className="bar active" />
                  <div className="bar active" />
                  <div className="bar active" />
                  <div className="bar active" />
                  <div className="bar" />
                </div>
                <div className="signal-val">-62 dBm</div>
              </div>
            </div>
            <Row k="Device" v="Gen 2 AC Station" />
            <Row k="Router" v="300 Mbps Indoor AP" />
            <Row k="IP Address" v="192.168.1.105" vClass="cyan" />
            <Row k="Frequency" v="5 GHz" />
          </div>
        </div>

        <div className="table-panel">
          <div className="panel-title">// Payment History</div>
          <table>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Method</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>{formatDate(billing?.billing_start ?? null)}</td>
                <td>Monthly Subscription</td><td>EcoCash</td><td>${monthly}</td>
                <td><span className={`pill ${cfg.pendingRow ? 'pill-pending' : 'pill-paid'}`}>{cfg.pendingRow ? 'PENDING' : 'PAID'}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <RenewModal open={showRenew} onClose={() => setShowRenew(false)} amount={monthly} />
    </div>
  );
}

function Row({ k, v, vClass }: { k: string; v: string; vClass?: string }) {
  return (
    <div className="detail-row">
      <div className="dr-key">{k}</div>
      <div className={`dr-val ${vClass ?? ''}`}>{v}</div>
    </div>
  );
}
