import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HexCard } from '@/components/hex/HexCard';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { hexToast } from '@/components/hex/HexToast';
import { DollarSign, CheckCircle2 } from 'lucide-react';
import { syncExpiredBalance } from '@/lib/billing';
import {
  applyMonthlyPayment,
  ensureBillingDayInvoice,
  monthsOverdue,
  monthKeyOf,
} from '@/lib/paymentCascade';

interface Client {
  user_id: string;
  account_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  monthly_fee: number;
  balance: number;
  billing_day: number | null;
  account_state: string;
  last_paid_date: string | null;
}

const METHODS = ['Cash', 'EcoCash', 'Bank Transfer', 'Omari'] as const;

export function BillingTab() {
  const [rows, setRows] = useState<Client[]>([]);
  const [payTarget, setPayTarget] = useState<Client | null>(null);
  const [payMethod, setPayMethod] = useState<string>('Cash');
  const [confirming, setConfirming] = useState(false);

  const load = async () => {
    const { data: billing } = await (supabase.from('customer_billing' as any) as any)
      .select('user_id, account_id, monthly_fee, balance, billing_day, account_state, last_paid_date');
    if (!billing) return;
    const userIds = billing.map((b: any) => b.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, phone')
      .in('user_id', userIds);
    const pmap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    const merged: Client[] = billing.map((b: any) => ({
      user_id: b.user_id,
      account_id: b.account_id,
      monthly_fee: Number(b.monthly_fee ?? 0),
      balance: Number(b.balance ?? 0),
      billing_day: b.billing_day,
      account_state: b.account_state ?? 'active',
      last_paid_date: b.last_paid_date ?? null,
      full_name: pmap.get(b.user_id)?.full_name ?? null,
      email: pmap.get(b.user_id)?.email ?? null,
      phone: pmap.get(b.user_id)?.phone ?? null,
    }));
    setRows(merged);

    // Fire-and-forget: auto-generate this month's invoice on/after billing day,
    // and sync balance for expired accounts.
    for (const c of merged) {
      ensureBillingDayInvoice({
        user_id: c.user_id,
        full_name: c.full_name,
        email: c.email,
        phone: c.phone,
        billing_day: c.billing_day,
        monthly_fee: c.monthly_fee,
      }).catch(() => {});
      syncExpiredBalance({
        user_id: c.user_id,
        billing_day: c.billing_day,
        last_paid_date: c.last_paid_date,
        account_state: c.account_state,
        balance: c.balance,
        monthly_fee: c.monthly_fee,
      }).catch(() => {});
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('billing_tab')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_billing' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_history' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Debt-only view: balance > 0. Sort by months overdue desc, then balance desc.
  const debtors = useMemo(() => {
    return rows
      .filter((r) => Number(r.balance) > 0.005)
      .map((r) => ({ ...r, _overdue: monthsOverdue(r.billing_day, r.last_paid_date) }))
      .sort((a, b) => {
        if (b._overdue !== a._overdue) return b._overdue - a._overdue;
        return b.balance - a.balance;
      });
  }, [rows]);

  const confirmPaid = async () => {
    if (!payTarget) return;
    setConfirming(true);
    try {
      // Pay the OLDEST unpaid month first when overdue, otherwise current month.
      const overdue = monthsOverdue(payTarget.billing_day, payTarget.last_paid_date);
      const today = new Date();
      const target = new Date(today.getFullYear(), today.getMonth() - Math.max(0, overdue - 1), 1);
      const monthKey = monthKeyOf(target.getFullYear(), target.getMonth());
      await applyMonthlyPayment({ client: payTarget, monthKey, method: payMethod });
      hexToast.success(`Payment confirmed for ${payTarget.full_name ?? 'client'}.`);
      setPayTarget(null);
      setPayMethod('Cash');
      load();
    } catch (e: any) {
      hexToast.error(e?.message ?? 'Failed to confirm payment');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <HexCard>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-primary">
          // Outstanding Balances
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground">
          {debtors.length} {debtors.length === 1 ? 'account' : 'accounts'} owing
        </span>
      </div>

      {debtors.length === 0 ? (
        <div className="rounded-md border border-green-500/30 bg-green-500/5 px-4 py-6 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          <span className="font-mono text-xs tracking-[0.1em] text-green-400">
            // All accounts are settled. No outstanding balances.
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <th className="px-3 py-2.5 text-left">Name</th>
                <th className="px-3 py-2.5 text-left">Account ID</th>
                <th className="px-3 py-2.5 text-center">Billing Day</th>
                <th className="px-3 py-2.5 text-right">Monthly Fee</th>
                <th className="px-3 py-2.5 text-right">Outstanding</th>
                <th className="px-3 py-2.5 text-center">Overdue</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {debtors.map((c, i) => (
                <tr
                  key={c.user_id}
                  className="border-b border-border/40 hover:bg-muted/40 animate-in fade-in slide-in-from-bottom-1"
                  style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
                >
                  <td className="px-3 py-2.5 font-medium">{c.full_name ?? c.email ?? '—'}</td>
                  <td className="px-3 py-2.5 font-mono text-primary text-xs">{c.account_id ?? '—'}</td>
                  <td className="px-3 py-2.5 text-center font-mono text-xs text-foreground/80">
                    {c.billing_day ? `Day ${c.billing_day}` : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">${c.monthly_fee.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-red-400">
                    ${c.balance.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {c._overdue > 0 ? (
                      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-amber-400">
                        {c._overdue} {c._overdue === 1 ? 'MONTH' : 'MONTHS'}
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] text-muted-foreground">CURRENT</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-[10px] tracking-[0.15em] border-green-500/50 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                      onClick={() => { setPayTarget(c); setPayMethod('Cash'); }}
                    >
                      <DollarSign className="w-3 h-3 mr-1" /> PAID
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!payTarget} onOpenChange={(o) => !o && setPayTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono tracking-[0.15em] text-primary text-sm">
              // Confirm Payment
            </DialogTitle>
          </DialogHeader>
          {payTarget && (
            <div className="space-y-4">
              <p className="text-sm">
                Confirm payment received from{' '}
                <span className="text-foreground font-semibold">
                  {payTarget.full_name ?? payTarget.email}
                </span>?
              </p>
              <div className="rounded-md border border-border p-3 bg-muted/40">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Amount</div>
                <div className="text-2xl font-mono text-green-400 mt-1">
                  USD {payTarget.monthly_fee.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setPayTarget(null)} disabled={confirming}>
              CANCEL
            </Button>
            <Button
              onClick={confirmPaid}
              disabled={confirming}
              className="bg-green-600 hover:bg-green-500 text-white"
            >
              {confirming ? 'CONFIRMING…' : 'CONFIRM'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HexCard>
  );
}
