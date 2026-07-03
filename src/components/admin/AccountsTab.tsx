import { Fragment, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HexCard } from '@/components/hex/HexCard';
import { HexBadge } from '@/components/hex/HexBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { hexToast } from '@/components/hex/HexToast';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { effectiveState, formatDateKey } from '@/lib/billing';

interface Client {
  user_id: string;
  account_id: string | null;
  full_name: string | null;
  phone: string | null;
  monthly_fee: number;
  balance: number;
  billing_day: number | null;
  account_state: string;
  last_paid_date: string | null;
  joined: string; // YYYY-MM
}

interface Payment {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  method: string;
  status: string;
}

interface Summary {
  month: string;
  expenses: number;
  investments: number;
}

const MONTH_LABELS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const METHODS = ['EcoCash', 'Bank Transfer', 'Omari', 'Cash'] as const;

// Build a rolling window of months (YYYY-MM) from earliest join up to current month.
function buildMonthKeys(earliest: Date, now: Date): string[] {
  const keys: string[] = [];
  const cur = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  while (cur <= end) {
    keys.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return keys;
}

function labelFor(monthKey: string) {
  const [y, m] = monthKey.split('-').map(Number);
  return { short: MONTH_LABELS[m - 1], year: y, full: `${['January','February','March','April','May','June','July','August','September','October','November','December'][m - 1]} ${y}` };
}

function stateBadge(state: string) {
  const s = state.toLowerCase();
  const variant = s === 'active' ? 'active' : s === 'expiring' ? 'soon' : s === 'expired' ? 'overdue' : s === 'suspended' ? 'overdue' : 'pending';
  const label = s === 'expiring' ? 'EXPIRING' : s === 'pending' ? 'PENDING' : s.toUpperCase();
  return <HexBadge variant={variant as any}>{label}</HexBadge>;
}

export function AccountsTab() {
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState<{ client: Client; monthKey: string } | null>(null);
  const [payMethod, setPayMethod] = useState<string>('EcoCash');
  const [confirming, setConfirming] = useState(false);

  const load = async () => {
    const [{ data: billing }, { data: profiles }, { data: pays }, { data: sums }] = await Promise.all([
      (supabase.from('customer_billing' as any) as any)
        .select('user_id, account_id, monthly_fee, balance, billing_day, account_state, last_paid_date, created_at'),
      supabase.from('profiles').select('user_id, full_name, phone'),
      (supabase.from('payment_history' as any) as any).select('id, user_id, date, amount, method, status'),
      (supabase.from('business_summary' as any) as any).select('month, expenses, investments'),
    ]);
    const pmap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    const merged: Client[] = (billing ?? []).map((b: any) => {
      const j = new Date(b.created_at);
      return {
        user_id: b.user_id,
        account_id: b.account_id,
        monthly_fee: Number(b.monthly_fee ?? 0),
        balance: Number(b.balance ?? 0),
        billing_day: b.billing_day,
        account_state: b.account_state ?? 'active',
        last_paid_date: b.last_paid_date ?? null,
        full_name: pmap.get(b.user_id)?.full_name ?? null,
        phone: pmap.get(b.user_id)?.phone ?? null,
        joined: `${j.getFullYear()}-${String(j.getMonth() + 1).padStart(2, '0')}`,
      };
    });
    merged.sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? ''));
    setClients(merged);
    setPayments((pays ?? []) as Payment[]);
    setSummaries((sums ?? []) as Summary[]);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('accounts_tab')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_billing' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_history' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'business_summary' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const now = useMemo(() => new Date(), []);
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthKeys = useMemo(() => {
    let earliest = new Date(now.getFullYear(), 0, 1); // default: Jan of current year
    for (const c of clients) {
      const [y, m] = c.joined.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      if (d < earliest) earliest = d;
    }
    return buildMonthKeys(earliest, now);
  }, [clients, now]);

  // { user_id: Set<monthKey> } for paid months
  const paidIndex = useMemo(() => {
    const idx = new Map<string, Set<string>>();
    for (const p of payments) {
      if ((p.status || '').toUpperCase() !== 'PAID') continue;
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!idx.has(p.user_id)) idx.set(p.user_id, new Set());
      idx.get(p.user_id)!.add(key);
    }
    return idx;
  }, [payments]);

  const summaryMap = useMemo(() => new Map(summaries.map((s) => [s.month, s])), [summaries]);

  const revenueFor = (monthKey: string) => {
    let sum = 0;
    for (const p of payments) {
      if ((p.status || '').toUpperCase() !== 'PAID') continue;
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (key === monthKey) sum += Number(p.amount ?? 0);
    }
    return sum;
  };

  const toggleExpand = (uid: string) => {
    setExpanded((prev) => {
      const s = new Set(prev);
      s.has(uid) ? s.delete(uid) : s.add(uid);
      return s;
    });
  };

  const openConfirm = (client: Client, monthKey: string) => {
    setTarget({ client, monthKey });
    setPayMethod('EcoCash');
  };

  const confirmPayment = async () => {
    if (!target) return;
    const { client, monthKey } = target;
    if (!client.billing_day) {
      hexToast.error('Set a billing day on this account first.');
      return;
    }
    setConfirming(true);
    try {
      const [y, m] = monthKey.split('-').map(Number);
      const day = Math.min(client.billing_day, 28);
      const paidDate = new Date(y, m - 1, day);
      const paidStr = formatDateKey(paidDate);

      // 1. Insert payment_history record
      const { error: payErr } = await (supabase.from('payment_history' as any) as any).insert({
        user_id: client.user_id,
        date: paidStr,
        description: `Monthly Subscription — ${labelFor(monthKey).full}`,
        method: payMethod,
        amount: client.monthly_fee,
        status: 'PAID',
      });
      if (payErr) throw payErr;

      // 2. Reduce outstanding balance by monthly fee
      const newBalance = Math.max(0, Number(client.balance) - Number(client.monthly_fee));

      // 3. Advance last_paid_date only if this payment is more recent
      const patch: Record<string, unknown> = { balance: newBalance };
      const currentAnchor = client.last_paid_date ? new Date(client.last_paid_date) : null;
      if (!currentAnchor || paidDate > currentAnchor) {
        patch.last_paid_date = paidStr;
      }
      // 4. Set state to active only when balance clears
      if (newBalance <= 0.005 && client.account_state !== 'suspended' && client.account_state !== 'pending') {
        patch.account_state = 'active';
      }

      const { error: updErr } = await (supabase.from('customer_billing' as any) as any)
        .update(patch).eq('user_id', client.user_id);
      if (updErr) throw updErr;

      hexToast.success(`Payment confirmed for ${client.full_name ?? 'client'} — ${labelFor(monthKey).full}`);
      setTarget(null);
      load();
    } catch (e: any) {
      hexToast.error(e?.message ?? 'Failed to confirm payment');
    } finally {
      setConfirming(false);
    }
  };

  const saveSummary = async (monthKey: string, field: 'expenses' | 'investments', raw: string) => {
    const val = parseFloat(raw);
    if (Number.isNaN(val) || val < 0) return;
    const existing = summaryMap.get(monthKey);
    if (existing && Math.abs(Number(existing[field]) - val) < 0.005) return;
    const payload = {
      month: monthKey,
      expenses: field === 'expenses' ? val : Number(existing?.expenses ?? 0),
      investments: field === 'investments' ? val : Number(existing?.investments ?? 0),
    };
    const { error } = await (supabase.from('business_summary' as any) as any)
      .upsert(payload, { onConflict: 'month' });
    if (error) hexToast.error('Failed to save');
    else load();
  };

  return (
    <div className="space-y-6">
      {/* ============ SECTION 1: CLIENT ACCOUNTS ============ */}
      <HexCard className="p-0 overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">// Section 01</div>
            <div className="text-sm font-semibold text-foreground">Client Accounts</div>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">{clients.length} clients</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 w-8"></th>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2 hidden md:table-cell">Contact</th>
                <th className="text-left px-3 py-2 hidden md:table-cell">Type</th>
                <th className="text-left px-3 py-2">Cycle</th>
                <th className="text-right px-3 py-2">Amount</th>
                <th className="text-center px-3 py-2">{labelFor(currentMonthKey).short}</th>
                <th className="text-center px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => {
                const isOpen = expanded.has(c.user_id);
                const eff = effectiveState(c.billing_day, c.last_paid_date, c.account_state);
                const paidSet = paidIndex.get(c.user_id) ?? new Set<string>();
                const currentPaid = paidSet.has(currentMonthKey);
                const clientMonths = monthKeys.filter((k) => k >= c.joined);
                return (
                  <>
                    <tr key={c.user_id} className="border-t border-border/40 hover:bg-muted/20">
                      <td className="px-3 py-3">
                        <button
                          onClick={() => toggleExpand(c.user_id)}
                          className="text-muted-foreground hover:text-primary transition"
                          aria-label={isOpen ? 'Collapse row' : 'Expand row'}
                        >
                          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-foreground font-medium">{c.full_name ?? '—'}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{c.account_id ?? ''}</div>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell text-muted-foreground font-mono text-xs">{c.phone ?? '—'}</td>
                      <td className="px-3 py-3 hidden md:table-cell text-foreground/80">Residential</td>
                      <td className="px-3 py-3 font-mono text-xs text-foreground/80">Day {c.billing_day ?? '—'}</td>
                      <td className="px-3 py-3 text-right font-mono text-foreground">${c.monthly_fee.toFixed(2)}</td>
                      <td className="px-3 py-3 text-center">
                        <MonthCheck
                          paid={currentPaid}
                          disabled={!c.billing_day}
                          onClick={() => !currentPaid && openConfirm(c, currentMonthKey)}
                        />
                      </td>
                      <td className="px-3 py-3 text-center">{stateBadge(eff)}</td>
                    </tr>

                    {isOpen && (
                      <tr className="bg-muted/10 border-t border-border/30">
                        <td colSpan={8} className="px-3 py-4">
                          <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
                            Payment History — joined {labelFor(c.joined).short} {labelFor(c.joined).year}
                          </div>
                          {clientMonths.length === 0 ? (
                            <div className="text-xs text-muted-foreground italic">No months yet.</div>
                          ) : (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {clientMonths.map((mk) => {
                                const paid = paidSet.has(mk);
                                const label = labelFor(mk);
                                const isCurrent = mk === currentMonthKey;
                                return (
                                  <div
                                    key={mk}
                                    className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded border ${
                                      isCurrent ? 'border-primary/40 bg-primary/5' : 'border-border/40 bg-background/40'
                                    }`}
                                    style={{ minWidth: 68 }}
                                  >
                                    <div className="text-[10px] font-mono text-muted-foreground">{label.short}</div>
                                    <div className="text-[9px] font-mono text-muted-foreground/70">{label.year}</div>
                                    <MonthCheck
                                      paid={paid}
                                      disabled={!c.billing_day}
                                      onClick={() => !paid && openConfirm(c, mk)}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {clients.length === 0 && (
                <tr><td colSpan={8} className="text-center px-3 py-8 text-muted-foreground text-xs">No clients yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </HexCard>

      {/* ============ SECTION 2: BUSINESS SUMMARY ============ */}
      <HexCard className="p-0 overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">// Section 02</div>
          <div className="text-sm font-semibold text-foreground">Business Summary</div>
          <div className="text-[10px] text-muted-foreground mt-1">Revenue is auto-summed from confirmed payments. Expenses and investments are entered manually.</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                <th className="sticky left-0 z-10 bg-muted/40 text-left px-3 py-2 text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Row</th>
                {monthKeys.map((mk) => {
                  const l = labelFor(mk);
                  return (
                    <th key={mk} className="text-center px-3 py-2 text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground min-w-[90px]">
                      {l.short} <span className="text-muted-foreground/60">'{String(l.year).slice(-2)}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border/40 bg-green-500/5">
                <td className="sticky left-0 z-10 bg-background/95 backdrop-blur px-3 py-2 font-mono text-[11px] text-green-400">REVENUE</td>
                {monthKeys.map((mk) => (
                  <td key={mk} className="px-3 py-2 text-center font-mono text-green-400">
                    ${revenueFor(mk).toFixed(2)}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-border/40 bg-red-500/5">
                <td className="sticky left-0 z-10 bg-background/95 backdrop-blur px-3 py-2 font-mono text-[11px] text-red-400">EXPENSES</td>
                {monthKeys.map((mk) => (
                  <td key={mk} className="px-1 py-1">
                    <SummaryInput
                      initial={Number(summaryMap.get(mk)?.expenses ?? 0)}
                      onSave={(v) => saveSummary(mk, 'expenses', v)}
                    />
                  </td>
                ))}
              </tr>
              <tr className="border-t border-border/40 bg-primary/5">
                <td className="sticky left-0 z-10 bg-background/95 backdrop-blur px-3 py-2 font-mono text-[11px] text-primary">INVESTMENTS</td>
                {monthKeys.map((mk) => (
                  <td key={mk} className="px-1 py-1">
                    <SummaryInput
                      initial={Number(summaryMap.get(mk)?.investments ?? 0)}
                      onSave={(v) => saveSummary(mk, 'investments', v)}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </HexCard>

      {/* ============ PAYMENT CONFIRMATION MODAL ============ */}
      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono tracking-[0.15em] text-primary text-sm">
              // Confirm Payment
            </DialogTitle>
          </DialogHeader>
          {target && (
            <div className="space-y-4 text-sm">
              <p className="text-foreground">
                Confirm payment received from <span className="font-semibold">{target.client.full_name ?? 'client'}</span>?
              </p>
              <div className="rounded border border-border bg-muted/20 p-3 space-y-2 font-mono text-xs">
                <Row k="MONTH" v={labelFor(target.monthKey).full} />
                <Row k="AMOUNT" v={`USD ${target.client.monthly_fee.toFixed(2)}`} />
                <Row
                  k="LOG DATE"
                  v={(() => {
                    const [y, m] = target.monthKey.split('-').map(Number);
                    const d = Math.min(target.client.billing_day ?? 1, 28);
                    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  })()}
                />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-1">Payment Method</div>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={confirming}>Cancel</Button>
            <Button onClick={confirmPayment} disabled={confirming}>
              {confirming ? 'Confirming…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MonthCheck({ paid, disabled, onClick }: { paid: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-5 h-5 rounded border flex items-center justify-center transition ${
        paid
          ? 'bg-green-500 border-green-500'
          : disabled
            ? 'border-border/40 bg-muted/20 cursor-not-allowed'
            : 'border-border bg-background hover:border-primary'
      }`}
      aria-label={paid ? 'Paid' : 'Mark paid'}
    >
      {paid && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
    </button>
  );
}

function SummaryInput({ initial, onSave }: { initial: number; onSave: (v: string) => void }) {
  const [val, setVal] = useState<string>(initial ? String(initial) : '');
  useEffect(() => { setVal(initial ? String(initial) : ''); }, [initial]);
  return (
    <Input
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => { if ((val === '' ? 0 : parseFloat(val)) !== initial) onSave(val === '' ? '0' : val); }}
      placeholder="0"
      className="h-8 w-20 mx-auto text-center font-mono text-xs"
    />
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-foreground">{v}</span>
    </div>
  );
}
