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
import { effectiveState } from '@/lib/billing';
import { ensureCurrentCycleInvoice } from '@/lib/invoices';
import { currentCycleStart } from '@/lib/billing';

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
  const [confirming, setConfirming] = useState(false);

  const load = async () => {
    const { data: billing } = await (supabase.from('customer_billing' as any) as any)
      .select('user_id, account_id, monthly_fee, balance, billing_day, account_state');
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
      full_name: pmap.get(b.user_id)?.full_name ?? null,
      email: pmap.get(b.user_id)?.email ?? null,
      phone: pmap.get(b.user_id)?.phone ?? null,
    }));
    setRows(merged);

    // Auto-generate current-cycle invoices for all clients with a billing_day
    for (const c of merged) {
      if (c.billing_day) {
        ensureCurrentCycleInvoice({
          user_id: c.user_id,
          billing_day: c.billing_day,
          monthly_fee: c.monthly_fee,
          client_name: c.full_name,
          client_email: c.email,
          client_phone: c.phone,
        }).catch(() => {});
      }
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
    setConfirming(true);
    try {
      // 1. clear balance + set active
      await (supabase.from('customer_billing' as any) as any)
        .update({ balance: 0, account_state: 'active' })
        .eq('user_id', payTarget.user_id);

      // 2. log payment history
      const today = new Date().toISOString().slice(0, 10);
      await (supabase.from('payment_history' as any) as any).insert({
        user_id: payTarget.user_id,
        date: today,
        description: 'Monthly Subscription',
        method: payMethod,
        amount: payTarget.monthly_fee,
        status: 'PAID',
      });

      // 3. flip current-cycle invoice to PAID (if exists)
      if (payTarget.billing_day) {
        const cycle = currentCycleStart(payTarget.billing_day).toISOString().slice(0, 10);
        await (supabase.from('invoices' as any) as any)
          .update({ status: 'PAID' })
          .eq('user_id', payTarget.user_id)
          .eq('invoice_date', cycle);
      }

      hexToast.success(`Payment confirmed for ${payTarget.full_name ?? payTarget.email ?? 'client'}. Account set to Active.`);
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
              <th className="px-3 py-2.5 text-left">Account ID</th>
              <th className="px-3 py-2.5 text-left">Full Name</th>
              <th className="px-3 py-2.5 text-left">Plan</th>
              <th className="px-3 py-2.5 text-right">Monthly Fee</th>
              <th className="px-3 py-2.5 text-right">Outstanding</th>
              <th className="px-3 py-2.5 text-left">Status</th>
              <th className="px-3 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => {
              const state = effectiveState(c.billing_day, c.account_state);
              return (
                <tr
                  key={c.user_id}
                  className="border-b border-border/40 hover:bg-muted/40 animate-in fade-in slide-in-from-bottom-1"
                  style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
                >
                  <td className="px-3 py-2.5 font-mono text-primary text-xs">{c.account_id ?? '—'}</td>
                  <td className="px-3 py-2.5">{c.full_name ?? c.email ?? '—'}</td>
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
                      onClick={() => { setPayTarget(c); setPayMethod('Cash'); }}
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
              disabled={confirming}
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
