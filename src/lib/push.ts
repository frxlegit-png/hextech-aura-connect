import { supabase } from '@/integrations/supabase/client';

export const VAPID_PUBLIC_KEY =
  'BJYhxg5aa5PCz1C0Hq3tEZuQe4OUibYESkOQqWjUtwppF0dRnht-qA5yZePqwXlYYjgDBvKp20CRHsSUY17MlDA';

export function pushSupported(): boolean {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;
}

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.warn('[push] SW register failed', e);
    return null;
  }
}

/** Request permission and save subscription. Returns true on success. */
export async function enablePushNotifications(role: 'admin' | 'customer'): Promise<boolean> {
  if (!pushSupported()) return false;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return false;
  const reg = await registerServiceWorker();
  if (!reg) return false;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return false;
  const json = sub.toJSON();
  const payload = {
    user_id: user.id,
    role,
    endpoint: sub.endpoint,
    subscription: json as any,
    customer_id: role === 'customer' ? user.id : null,
  };
  // Upsert by (user_id, endpoint)
  const { error } = await (supabase.from('push_subscriptions' as any) as any)
    .upsert(payload, { onConflict: 'user_id,endpoint' });
  if (error) console.warn('[push] save subscription failed', error);
  return !error;
}

export function getPermissionState(): NotificationPermission | 'unsupported' {
  if (!pushSupported()) return 'unsupported';
  return Notification.permission;
}
