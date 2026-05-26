import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import './PortalDashboard.css';

type AccountState = 'active' | 'suspended' | 'expiring' | 'expired' | 'pending';

const STATES: { id: AccountState; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'expiring', label: 'Expiring Soon' },
  { id: 'expired', label: 'Expired' },
  { id: 'suspended', label: 'Suspended' },
  { id: 'pending', label: 'Payment Pending' },
];

export default function PortalDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [state, setState] = useState<AccountState>('active');

  const fullName = (user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] || 'Customer';
  const firstName = fullName.split(' ')[0];
  const accountId = 'HXT-00042';

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const cfg = useMemo(() => {
    switch (state) {
      case 'suspended':
        return {
          badge: { tone: 'red', dot: 'static' as const, text: 'ACCOUNT SUSPENDED' },
          days: { value: '—', color: 'muted', accent: 'c-red', sub: 'Subscription suspended' },
          balance: { value: '$24.99', color: 'red', sub: 'Payment required' },
          subStatus: { text: 'SUSPENDED', color: 'red' },
          alert: { tone: 'red' as const, text: 'Your account has been suspended. Please make a payment to restore access.' },
          renew: { label: 'Reactivate Account', variant: 'red', pulse: false },
          pendingRow: false,
        };
      case 'expiring':
        return {
          badge: { tone: 'amber', dot: 'pulse' as const, text: 'RENEWAL DUE SOON' },
          days: { value: '5', color: 'amber', accent: 'c-amber', sub: 'Renews 28 May 2026' },
          balance: { value: '$0.00', color: 'amber', sub: 'All payments up to date' },
          subStatus: { text: 'ACTIVE', color: 'green' },
          alert: { tone: 'amber' as const, text: 'Your subscription expires in 5 days. Renew now to avoid interruption.' },
          renew: { label: 'Renew Subscription', variant: 'purple', pulse: true },
          pendingRow: false,
        };
      case 'expired':
        return {
          badge: { tone: 'red', dot: 'static' as const, text: 'SUBSCRIPTION EXPIRED' },
          days: { value: '0', color: 'red', accent: 'c-red', sub: 'Expired today' },
          balance: { value: '$24.99', color: 'amber', sub: 'Renewal required' },
          subStatus: { text: 'EXPIRED', color: 'red' },
          alert: { tone: 'red' as const, text: 'Your subscription has expired. Renew now to restore your connection.' },
          renew: { label: 'Renew Now', variant: 'red', pulse: false },
          pendingRow: false,
        };
      case 'pending':
        return {
          badge: { tone: 'amber', dot: 'pulse' as const, text: 'PAYMENT PENDING' },
          days: { value: '14', color: 'purple', accent: 'c-purple', sub: 'Renews 06 Jun 2026' },
          balance: { value: '$24.99', color: 'amber', sub: 'Processing payment' },
          subStatus: { text: 'ACTIVE', color: 'green' },
          alert: { tone: 'amber' as const, text: 'Your payment is being processed. Your account will be updated shortly.' },
          renew: { label: 'Renew Subscription', variant: 'purple', pulse: false },
          pendingRow: true,
        };
      default:
        return {
          badge: { tone: 'green', dot: 'pulse' as const, text: 'ACCOUNT ACTIVE' },
          days: { value: '14', color: 'purple', accent: 'c-purple', sub: 'Renews 06 Jun 2026' },
          balance: { value: '$0.00', color: 'amber', sub: 'All payments up to date' },
          subStatus: { text: 'ACTIVE', color: 'green' },
          alert: null,
          renew: { label: 'Renew Subscription', variant: 'purple', pulse: false },
          pendingRow: false,
        };
    }
  }, [state]);

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

        <div className="state-switch">
          {STATES.map((s) => (
            <button key={s.id} className={state === s.id ? 'on' : ''} onClick={() => setState(s.id)}>
              {s.label}
            </button>
          ))}
        </div>

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
            <Row k="Start Date" v="06 Jan 2026" />
            <Row k="Renewal Date" v="06 Jun 2026" vClass="purple" />
            <Row k="Monthly Fee" v="USD 24.99" />
            <Row k="Payment Method" v="EcoCash" vClass="green" />
            <Row k="Status" v={cfg.subStatus.text} vClass={cfg.subStatus.color} />
            <button className={`btn-renew ${cfg.renew.variant === 'red' ? 'red' : ''} ${cfg.renew.pulse ? 'pulse' : ''}`}>
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
                <td>06 May 2026</td><td>Monthly Subscription</td><td>EcoCash</td><td>$24.99</td>
                <td><span className={`pill ${cfg.pendingRow ? 'pill-pending' : 'pill-paid'}`}>{cfg.pendingRow ? 'PENDING' : 'PAID'}</span></td>
              </tr>
              <tr><td>06 Apr 2026</td><td>Monthly Subscription</td><td>EcoCash</td><td>$24.99</td><td><span className="pill pill-paid">PAID</span></td></tr>
              <tr><td>06 Mar 2026</td><td>Monthly Subscription</td><td>ZimSwitch</td><td>$24.99</td><td><span className="pill pill-paid">PAID</span></td></tr>
              <tr><td>06 Feb 2026</td><td>Monthly Subscription</td><td>EcoCash</td><td>$24.99</td><td><span className="pill pill-paid">PAID</span></td></tr>
              <tr><td>06 Jan 2026</td><td>Starter Kit + First Month</td><td>Cash</td><td>$104.98</td><td><span className="pill pill-paid">PAID</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
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
