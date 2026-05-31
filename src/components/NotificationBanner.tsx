import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { enablePushNotifications, getPermissionState, pushSupported } from '@/lib/push';
import { hexToast } from '@/components/hex/HexToast';

interface Props {
  role: 'admin' | 'customer';
  text?: string;
}

const DISMISS_KEY = 'hextech_push_banner_dismissed';

export function NotificationBanner({ role, text }: Props) {
  const [state, setState] = useState<NotificationPermission | 'unsupported'>('default');
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setState(getPermissionState());
    setHidden(localStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  if (!pushSupported() || state === 'granted' || state === 'unsupported' || hidden) return null;

  const message =
    text ||
    (role === 'admin'
      ? '// Enable notifications to be alerted when tickets are submitted and subscriptions expire.'
      : '// Enable notifications to receive alerts about your subscription and support tickets.');

  const handleEnable = async () => {
    setBusy(true);
    const ok = await enablePushNotifications(role);
    setBusy(false);
    setState(getPermissionState());
    if (ok) {
      hexToast.success('Notifications enabled.');
      localStorage.setItem(DISMISS_KEY, '1');
    } else if (Notification.permission === 'denied') {
      // banner stays visible with denied message
    }
  };

  return (
    <div
      className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-5 py-3.5"
      style={{
        background: 'rgba(245,158,11,0.08)',
        borderColor: 'rgba(245,158,11,0.45)',
      }}
    >
      <div className="flex items-start gap-3 flex-1 min-w-[240px]">
        <Bell className="w-4 h-4 mt-0.5 text-amber-400 shrink-0" />
        <div>
          <p
            className="text-[12px] text-amber-200/90 leading-snug"
            style={{ fontFamily: '"Share Tech Mono", ui-monospace, monospace' }}
          >
            {message}
          </p>
          {state === 'denied' && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Notifications blocked. Enable them in your browser settings to receive alerts.
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {state !== 'denied' && (
          <button
            onClick={handleEnable}
            disabled={busy}
            className="px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase rounded-md border border-amber-400/60 text-amber-300 hover:bg-amber-400/10 transition disabled:opacity-50"
            style={{ fontFamily: '"Share Tech Mono", ui-monospace, monospace' }}
          >
            {busy ? 'Enabling…' : 'Enable Notifications'}
          </button>
        )}
        <button
          onClick={() => { localStorage.setItem(DISMISS_KEY, '1'); setHidden(true); }}
          className="px-2 py-1.5 text-[10px] tracking-[0.18em] uppercase text-muted-foreground hover:text-foreground"
          style={{ fontFamily: '"Share Tech Mono", ui-monospace, monospace' }}
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
