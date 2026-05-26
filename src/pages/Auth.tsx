import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { hexToast } from '@/components/hex/HexToast';
import './Auth.css';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user, isAdmin, isCustomer, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      if (isAdmin) navigate('/admin');
      else if (isCustomer) navigate('/portal');
      else navigate('/');
    }
  }, [user, isAdmin, isCustomer, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      hexToast.error(
        error.message === 'Invalid login credentials'
          ? 'Invalid email or password'
          : error.message
      );
    } else {
      hexToast.success('Welcome back!');
    }
  };

  return (
    <div className="hex-auth">
      <div className="dots" />
      <div className="glow glow-purple" />
      <div className="glow glow-cyan" />
      <div className="corner corner-tl" />
      <div className="corner corner-br" />
      <div className="sys-tag">HEXTECH // CLIENT PORTAL v1.0</div>

      <div className="page">
        <aside className="left">
          <div className="brand">
            <div className="brand-mark" />
            <div className="brand-name">
              HEX<span>TECH</span>
            </div>
          </div>

          <div className="left-body">
            <div className="left-tag">// CLIENT PORTAL</div>
            <h1 className="left-headline">
              Your network, <em>always on.</em>
            </h1>
            <p className="left-sub">
              Monitor your subscription, check equipment status, and manage your payments — all in one place.
            </p>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat-num">99.7%</div>
              <div className="stat-label">Uptime</div>
            </div>
            <div className="stat">
              <div className="stat-num">24/7</div>
              <div className="stat-label">Support</div>
            </div>
            <div className="stat">
              <div className="stat-num">HRE</div>
              <div className="stat-label">Harare, ZW</div>
            </div>
          </div>
        </aside>

        <section className="right">
          <div className="form-header">
            <div className="form-eyebrow">// Secure Access</div>
            <h2 className="form-title">Sign in to your account</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="account">Account ID or Email</label>
              <input
                id="account"
                type="text"
                placeholder="HXT-00001 or client@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <div className="pwd-row">
                <label htmlFor="password">Password</label>
                <button type="button" className="forgot" onClick={() => hexToast.success('Contact support to reset your password')}>
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Accessing...' : 'Access Portal'}
            </button>
          </form>

          <div className="divider">
            <div className="divider-line" />
            <div className="divider-text">Network Status</div>
            <div className="divider-line" />
          </div>

          <div className="status-bar">
            <span className="status-dot" />
            <span className="status-text">
              All systems <strong>operational</strong> — Harare network
            </span>
          </div>

          <div className="form-footer">
            Need help? <a onClick={() => navigate('/#contact')}>Contact support</a> · <a href="https://hextech.co.zw">hextech.co.zw</a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Auth;
