import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export type SandboxPayment = {
  id: string; amount: number; status: 'pending' | 'charged' | 'failed' | 'abandoned' | 'refunded';
  ecocash_reference: string | null; failure_reason: string | null; created_at: string;
  settled_at: string | null; unapplied_amount: number | null;
  refund_reference: string | null;
};

/** Tracks only simulated transactions. The gateway is polled while this portal is open. */
export function useSandboxPayments(userId: string | undefined, enabled: boolean) {
  const [payments, setPayments] = useState<SandboxPayment[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const known = useRef(new Map<string, SandboxPayment['status']>());
  const initialized = useRef(false);
  const checking = useRef(false);
  const refreshSequence = useRef(0);
  const pending = useRef<string | null>(null);
  const user = useRef(userId);
  user.current = userId;

  const refresh = useCallback(async () => {
    if (!userId || !enabled) return;
    const sequence = ++refreshSequence.current;
    const { data, error: queryError } = await (supabase.from('ecocash_test_payments' as never) as any)
      .select('id, amount, status, ecocash_reference, failure_reason, created_at, settled_at, unapplied_amount, refund_reference')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
    if (user.current !== userId || sequence !== refreshSequence.current) return;
    if (queryError) {
      setError('Unable to load test payments. Check your connection and try again.');
      setReady(false);
      return;
    }
    const rows = (data ?? []) as SandboxPayment[];
    for (const row of rows) {
      const previous = known.current.get(row.id);
      if (initialized.current && previous === 'pending' && row.status !== previous) {
        if (row.status === 'charged') toast.success('EcoCash sandbox payment succeeded. No real money moved.', { id: `sandbox-${row.id}-charged` });
        if (row.status === 'failed') toast.error('EcoCash sandbox payment failed. No real money moved.', { id: `sandbox-${row.id}-failed` });
      }
      known.current.set(row.id, row.status);
    }
    initialized.current = true;
    pending.current = rows.find(row => row.status === 'pending')?.id ?? null;
    setPayments(rows);
    setError('');
    setReady(true);
  }, [enabled, userId]);

  const check = useCallback(async (id: string) => {
    if (checking.current || !userId) return;
    checking.current = true;
    try {
      const { error: invokeError } = await supabase.functions.invoke('ecocash-sandbox', {
        body: { action: 'check', id },
      });
      await refresh();
      if (invokeError) setError('Could not check the test payment. We will keep trying while this page is open.');
    } catch {
      setError('Could not check the test payment. We will keep trying while this page is open.');
    } finally { checking.current = false; }
  }, [refresh, userId]);

  useEffect(() => {
    if (!enabled || !userId) return;
    initialized.current = false;
    known.current.clear();
    pending.current = null;
    setPayments([]);
    setReady(false);
    void refresh();
    const channel = supabase.channel(`sandbox-payments-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ecocash_test_payments', filter: `user_id=eq.${userId}` }, () => { void refresh(); })
      .subscribe(status => { if (status === 'SUBSCRIBED') void refresh(); });
    const timer = window.setInterval(() => {
      if (pending.current) void check(pending.current);
      else void refresh();
    }, 10000);
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { refreshSequence.current++; window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); void supabase.removeChannel(channel); };
  }, [check, enabled, refresh, userId]);

  const start = async (phone: string, amount: number) => {
    setBusy(true);
    setError('');
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('ecocash-sandbox', {
        body: { action: 'start', phone, amount },
      });
      if (invokeError) {
        let detail = '';
        try { detail = (await invokeError.context?.json())?.error ?? ''; } catch { /* response may be unavailable */ }
        setError(detail || 'Could not confirm whether the request was sent. Checking your test payments.');
        await refresh();
        if (detail) setError(detail);
        return;
      }
      if (data?.payment?.status === 'pending') toast.info('Test payment pending. Complete any prompt on your phone.');
      if (data?.payment?.status === 'charged') toast.success('EcoCash sandbox payment succeeded. No real money moved.', { id: `sandbox-${data.payment.id}-charged` });
      if (data?.payment?.status === 'failed') toast.error('EcoCash sandbox payment failed. No real money moved.', { id: `sandbox-${data.payment.id}-failed` });
      await refresh();
    } catch {
      await refresh();
      setError('Could not confirm whether the request was sent. Check the payment status before retrying.');
    } finally { setBusy(false); }
  };
  return { payments, ready, busy, error, start, check, refresh };
}
