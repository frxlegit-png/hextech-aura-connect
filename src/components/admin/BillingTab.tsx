import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HexCard } from '@/components/hex/HexCard';
import { HexBadge } from '@/components/hex/HexBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { hexToast } from '@/components/hex/HexToast';
import { Search, DollarSign } from 'lucide-react';
import { effectiveState, getBillingDates, formatDateKey, formatDate, syncExpiredBalance } from '@/lib/billing';
import { ensureCurrentCycleInvoice } from '@/lib/invoices';



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

const stateVariant = (s: string): any => {
  const v = s.toLowerCase();
  if (v === 'active') return 'active';
  if (v === 'expiring') return 'soon';
  if (v === 'expired') return 'overdue';
  if (v === 'suspended') return 'overdue';
  return 'pending';
};
const stateLabel = (s: string) => {
  const v = s.toLowerCase();
  if (v === 'expiring') return 'EXPIRING SOON';
  if (v === 'pending') return 'PAYMENT PENDING';
  return v.toUpperCase();
};

const METHODS = ['Cash', 'EcoCash', 'Bank Transfer', 'Omari'] as const;

export function BillingTab() {
  const [rows, setRows] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [editingBalance, setEditingBalance] = useState<string | null>(null);
  const [balanceDraft, setBalanceDraft] = useState('');
  const [payTarget, setPayTarget] = useState<Client | null>(null);
  const [payMethod, setPayMethod] = useState<string>('Cash');
  const [payDate, setPayDate] = useState<string>(() => formatDateKey(new Date()));
  const [confirming, setConfirming] = useState(false);
  const [lastInvoiceDate, setLastInvoiceDate] = useState<string | null>(null);

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

    // Auto-generate current-cycle invoices only when the customer has a paid anchor
    for (const c of merged) {
      if (c.billing_day && c.last_paid_date) {
        ensureCurrentCycleInvoice({
          user_id: c.user_id,
          billing_day: c.billing_day,
          last_paid_date: c.last_paid_date,
          monthly_fee: c.monthly_fee,
          client_name: c.full_name,
          client_email: c.email,
          client_phone: c.phone,
        }).catch(() => {});
      }
      // Auto-set balance = monthly_fee when account flips to EXPIRED.
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
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Fetch most recent invoice date for the selected client.
  useEffect(() => {
    if (!payTarget) { setLastInvoiceDate(null); return; }
    let cancelled = false;
    (async () => {
      const { data } = await (supabase.from('invoices' as any) as any)
        .select('invoice_date')
        .eq('user_id', payTarget.user_id)
        .order('invoice_date', { ascending: false })
        .limit(1);
      if (!cancelled) setLastInvoiceDate(data?.[0]?.invoice_date ?? null);
    })();
    return () => { cancelled = true; };
  }, [payTarget]);

  // Derived info for the confirm dialog.
  const payInfo = useMemo(() => {
    if (!payTarget) return null;
    const parts = (payDate || formatDateKey(new Date())).split('-').map(Number);
    const effDate = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date();
    effDate.setHours(0, 0, 0, 0);
    const { renewalDate } = getBillingDates(payTarget.billing_day, payTarget.last_paid_date, effDate);
    const isEarly = !!renewalDate && !!payTarget.last_paid_date && effDate < renewalDate;
    // "Already paid one ahead" = current anchor (last_paid_date) is already
    // in the future relative to the payment date. Block second advance pay.
    const anchor = payTarget.last_paid_date
      ? new Date(payTarget.last_paid_date + 'T00:00:00')
      : null;
    const alreadyPaidAhead = !!anchor && anchor > effDate;
    return { effDate, renewalDate, isEarly, alreadyPaidAhead };
  }, [payTarget, payDate]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.full_name ?? '').toLowerCase().includes(q) ||
        (r.account_id ?? '').toLowerCase().includes(q) ||
        (r.email ?? '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  const saveBalance = async (client: Client) => {
    const v = parseFloat(balanceDraft);
    if (Number.isNaN(v) || v < 0) { setEditingBalance(null); return; }
    if (v === client.balance) { setEditingBalance(null); return; }
    const { error } = await (supabase.from('customer_billing' as any) as any)
      .update({ balance: v })
      .eq('user_id', client.user_id);
    setEditingBalance(null);
    if (error) hexToast.error('Failed to save balance');
    else { hexToast.success('Balance updated'); load(); }
  };
  const confirmPaid = async () => {
    if (!payTarget) return;
    if (payInfo?.alreadyPaidAhead) {
      hexToast.error('Client already paid one cycle in advance. Wait until the current due date.');
      return;
    }
    setConfirming(true);
    try {
      // Effective payment date: admin-selected date (defaults to today).
      // All early-vs-late logic respects this date the same way it would
      // respect the actual current day.
      const parts = (payDate || formatDateKey(new Date())).split('-').map(Number);
      const effectiveDate = parts.length === 3
        ? new Date(parts[0], parts[1] - 1, parts[2])
        : new Date();
      effectiveDate.setHours(0, 0, 0, 0);
      const effective = formatDateKey(effectiveDate);

      // Determine early vs late payment relative to current renewal date,
      // using the admin-selected payment date as "now".
      const { renewalDate } = getBillingDates(payTarget.billing_day, payTarget.last_paid_date, effectiveDate);
      const isEarly =
        !!renewalDate &&
        !!payTarget.last_paid_date &&
        effectiveDate < renewalDate; // strictly before due date

      // New cycle anchor:
      //  - Early payment: anchor to the existing renewal/due date so the
      //    paid 30-day cycle starts AFTER the current due date (due date unchanged).
      //  - Late/on-time payment: anchor to the effective payment date.
      const newAnchor = isEarly && renewalDate ? formatDateKey(renewalDate) : effective;

      // Invoice dates:
      //  - invoice_date is the effective payment date.
      //  - Early: due_date stays as the existing renewal date (unchanged).
      //  - Late/on-time: due_date = effective payment date.
      const invoiceDate = effective;
      const dueDate = isEarly && renewalDate ? formatDateKey(renewalDate) : effective;

      // 1. Update billing row: clear balance, activate, set new anchor.
      await (supabase.from('customer_billing' as any) as any)
        .update({ balance: 0, account_state: 'active', last_paid_date: newAnchor })
        .eq('user_id', payTarget.user_id);

      // 2. Log payment history (dated effective payment date).
      await (supabase.from('payment_history' as any) as any).insert({
        user_id: payTarget.user_id,
        date: effective,
        description: isEarly ? 'Monthly Subscription (Advance Payment)' : 'Monthly Subscription',
        method: payMethod,
        amount: payTarget.monthly_fee,
        status: 'PAID',
      });


      // 3. Remove any existing invoice(s) for the target month (dedupe by month
      //    of invoice_date), then insert the new PAID invoice for this payment.
      const ym = invoiceDate.slice(0, 7);
      const [y, m] = ym.split('-').map(Number);
      const nextFirst = new Date(y, m, 1);
      const nextFirstStr = `${nextFirst.getFullYear()}-${String(nextFirst.getMonth() + 1).padStart(2, '0')}-01`;
      await (supabase.from('invoices' as any) as any)
        .delete()
        .eq('user_id', payTarget.user_id)
        .gte('invoice_date', `${ym}-01`)
        .lt('invoice_date', nextFirstStr);

      await (supabase.from('invoices' as any) as any).insert({
        user_id: payTarget.user_id,
        invoice_date: invoiceDate,
        due_date: dueDate,
        client_name: payTarget.full_name,
        client_email: payTarget.email,
        client_phone: payTarget.phone,
        plan: 'Residential Unlimited',
        amount: payTarget.monthly_fee,
        status: 'PAID',
      });

      hexToast.success(
        isEarly
          ? `Advance payment recorded. Next cycle starts ${formatDateKey(renewalDate!)}.`
          : `Payment confirmed for ${payTarget.full_name ?? payTarget.email ?? 'client'}. Account set to Active.`,
      );
      setPayTarget(null);
      setPayMethod('Cash');
      load();
    } finally {
      setConfirming(false);
    }
  };



  return (
    <HexCard>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-primary">
          // Billing — Client Payment Status
        </h3>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search name or account ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <th className="px-3 py-2.5 text-left">Full Name</th>
              <th className="px-3 py-2.5 text-left">Account ID</th>
              <th className="px-3 py-2.5 text-left">Plan</th>
              <th className="px-3 py-2.5 text-right">Monthly Fee</th>
              <th className="px-3 py-2.5 text-right">Outstanding</th>
              <th className="px-3 py-2.5 text-left">Status</th>
              <th className="px-3 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => {
              const state = effectiveState(c.billing_day, c.last_paid_date, c.account_state);
              return (
                <tr
                  key={c.user_id}
                  className="border-b border-border/40 hover:bg-muted/40 animate-in fade-in slide-in-from-bottom-1"
                  style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
                >
                  <td className="px-3 py-2.5 font-medium">{c.full_name ?? c.email ?? '—'}</td>
                  <td className="px-3 py-2.5 font-mono text-primary text-xs">{c.account_id ?? '—'}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">Residential Unlimited</td>
                  <td className="px-3 py-2.5 text-right font-mono">${c.monthly_fee.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {editingBalance === c.user_id ? (
                      <Input
                        autoFocus
                        type="number"
                        step="0.01"
                        value={balanceDraft}
                        onChange={(e) => setBalanceDraft(e.target.value)}
                        onBlur={() => saveBalance(c)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          if (e.key === 'Escape') setEditingBalance(null);
                        }}
                        className="h-7 w-24 ml-auto text-right text-xs"
                      />
                    ) : (
                      <button
                        className="text-right hover:text-primary"
                        onClick={() => {
                          setEditingBalance(c.user_id);
                          setBalanceDraft(c.balance.toFixed(2));
                        }}
                      >
                        ${c.balance.toFixed(2)}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <HexBadge variant={stateVariant(state)}>{stateLabel(state)}</HexBadge>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-[10px] tracking-[0.15em] border-green-500/50 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                      onClick={() => { setPayTarget(c); setPayMethod('Cash'); setPayDate(formatDateKey(new Date())); }}
                    >
                      <DollarSign className="w-3 h-3 mr-1" /> PAID
                    </Button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-xs text-muted-foreground">No clients found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

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
                <span className="text-foreground font-semibold">{payTarget.full_name ?? payTarget.email}</span>?
              </p>
              <div className="rounded-md border border-border p-3 bg-muted/40">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Amount</div>
                <div className="text-2xl font-mono text-green-400 mt-1">USD {payTarget.monthly_fee.toFixed(2)}</div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Payment Date</label>
                <Input
                  type="date"
                  value={payDate}
                  max={formatDateKey(new Date())}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="mt-1 h-10 text-sm"
                />
                {payInfo?.renewalDate && (
                  <p className="mt-1 text-[10px]">
                    <span className="text-muted-foreground/80">Current due date: </span>
                    <span className={payInfo.isEarly ? 'text-green-400 font-mono' : 'text-red-400 font-mono'}>
                      {formatDate(payInfo.renewalDate)}
                    </span>
                    <span className="text-muted-foreground/80">
                      {payInfo.isEarly ? ' — early (due date preserved)' : ' — on/after due (cycle resets to payment date)'}
                    </span>
                  </p>
                )}
                {!payInfo?.renewalDate && (
                  <p className="mt-1 text-[10px] text-muted-foreground/80">
                    No prior cycle — payment date becomes the new anchor.
                  </p>
                )}
              </div>
              <div className="rounded-md border border-border/60 px-3 py-2 bg-muted/20 text-[11px] flex items-center justify-between">
                <span className="uppercase tracking-[0.18em] text-muted-foreground">Last invoice</span>
                <span className="font-mono text-foreground">
                  {lastInvoiceDate ? formatDate(new Date(lastInvoiceDate + 'T00:00:00')) : 'None yet'}
                </span>
              </div>
              {payInfo?.alreadyPaidAhead && (
                <div className="rounded-md border border-red-500/40 bg-red-500/10 p-2 text-[11px] text-red-300">
                  This client is already paid one cycle in advance. Only one advance payment is allowed —
                  wait until {payInfo.renewalDate ? formatDate(payInfo.renewalDate) : 'the next due date'}.
                </div>
              )}
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Payment Method</label>
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
            <Button variant="outline" onClick={() => setPayTarget(null)} disabled={confirming}>CANCEL</Button>
            <Button
              onClick={confirmPaid}
              disabled={confirming || !!payInfo?.alreadyPaidAhead}
              className="bg-green-600 hover:bg-green-500 text-white"
            >
              CONFIRM
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>
    </HexCard>
  );
}
