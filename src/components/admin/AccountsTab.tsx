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
import { ChevronDown, ChevronRight, Check, Search, Loader2, AlertCircle, X } from 'lucide-react';
import { effectiveState } from '@/lib/billing';
import { applyMonthlyPayment, reverseMonthlyPayment } from '@/lib/paymentCascade';
import { useAuth } from '@/hooks/useAuth';


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

interface RevenueRow {
  id: string;
  month: string;
  amount: number;
  logged_by: string | null;
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
  const { user } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [revenueRows, setRevenueRows] = useState<RevenueRow[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState<{ client: Client; monthKey: string } | null>(null);
  const [reverseTarget, setReverseTarget] = useState<{ client: Client; monthKey: string } | null>(null);
  const [payMethod, setPayMethod] = useState<string>('EcoCash');
  const [confirming, setConfirming] = useState(false);
  const [reversing, setReversing] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [reverseError, setReverseError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<'all' | 'active' | 'expiring' | 'expired' | 'suspended' | 'pending'>('all');


  const load = async () => {
    const [{ data: billing }, { data: profiles }, { data: pays }, { data: sums }, { data: revs }] = await Promise.all([
      (supabase.from('customer_billing' as any) as any)
        .select('user_id, account_id, monthly_fee, balance, billing_day, account_state, last_paid_date, created_at'),
      supabase.from('profiles').select('user_id, full_name, phone'),
      (supabase.from('payment_history' as any) as any).select('id, user_id, date, amount, method, status'),
      (supabase.from('business_summary' as any) as any).select('month, expenses, investments'),
      (supabase.from('monthly_revenue' as any) as any).select('id, month, amount, logged_by'),
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
    merged.sort((a, b) => {
      // Sort by billing_day ascending; NULLs last.
      const ad = a.billing_day ?? Number.POSITIVE_INFINITY;
      const bd = b.billing_day ?? Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;
      return (a.full_name ?? '').localeCompare(b.full_name ?? '');
    });
    setClients(merged);
    setPayments((pays ?? []) as Payment[]);
    setSummaries((sums ?? []) as Summary[]);
    setRevenueRows((revs ?? []) as RevenueRow[]);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('accounts_tab')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_billing' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_history' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'business_summary' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_revenue' }, load)
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
  const revenueMap = useMemo(
    () => new Map(revenueRows.map((r) => [r.month, r])),
    [revenueRows],
  );

  const paymentStatsByMonth = useMemo(() => {
    const idx = new Map<string, { count: number; sum: number }>();
    for (const p of payments) {
      if ((p.status || '').toUpperCase() !== 'PAID') continue;
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const cur = idx.get(key) ?? { count: 0, sum: 0 };
      cur.count += 1;
      cur.sum += Number(p.amount ?? 0);
      idx.set(key, cur);
    }
    return idx;
  }, [payments]);


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
    setConfirmError(null);
  };

  const openReverse = (client: Client, monthKey: string) => {
    setReverseTarget({ client, monthKey });
    setReverseError(null);
  };

  const confirmReverse = async () => {
    if (!reverseTarget) return;
    const { client, monthKey } = reverseTarget;
    setReversing(true);
    setReverseError(null);

    // Optimistic: strip the PAID rows for this user+month locally, add balance back.
    const [ry, rm] = monthKey.split('-').map(Number);
    const removedIds: string[] = [];
    setPayments((prev) => prev.filter((p) => {
      if ((p.status || '').toUpperCase() !== 'PAID') return true;
      if (p.user_id !== client.user_id) return true;
      const d = new Date(p.date);
      if (d.getFullYear() === ry && d.getMonth() === rm - 1) {
        removedIds.push(p.id);
        return false;
      }
      return true;
    }));
    const prevClients = clients;
    setClients((prev) =>
      prev.map((c) =>
        c.user_id === client.user_id
          ? { ...c, balance: Number(c.balance ?? 0) + Number(c.monthly_fee ?? 0) }
          : c,
      ),
    );
    const label = labelFor(monthKey).full;
    const closing = reverseTarget;
    setReverseTarget(null);
    hexToast.success(`Payment reversed — ${client.full_name ?? 'client'} · ${label}`);

    try {
      await reverseMonthlyPayment({
        client: {
          user_id: client.user_id,
          full_name: client.full_name,
          email: null,
          phone: client.phone,
          monthly_fee: client.monthly_fee,
          balance: client.balance,
          billing_day: client.billing_day,
          account_state: client.account_state,
          last_paid_date: client.last_paid_date,
        },
        monthKey,
      });
      load();
    } catch (e: any) {
      setClients(prevClients);
      // Refetch is safest for restoring payments; also restore modal.
      load();
      setReverseTarget(closing);
      const msg = e?.message ?? 'Failed to reverse payment';
      setReverseError(msg);
      hexToast.error(msg);
    } finally {
      setReversing(false);
    }
  };


  const confirmPayment = async () => {
    if (!target) return;
    const { client, monthKey } = target;
    if (!client.billing_day) {
      setConfirmError('Set a billing day on this account first.');
      hexToast.error('Set a billing day on this account first.');
      return;
    }
    setConfirming(true);
    setConfirmError(null);

    // Optimistic: inject a fake PAID row into local state so the check appears immediately.
    const optimisticId = `optimistic-${crypto.randomUUID?.() ?? Date.now()}`;
    const [y, m] = monthKey.split('-').map(Number);
    const day = Math.min(client.billing_day, 28);
    const optimisticDate = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const optimisticPayment: Payment = {
      id: optimisticId,
      user_id: client.user_id,
      date: optimisticDate,
      amount: client.monthly_fee,
      method: payMethod,
      status: 'PAID',
    };
    setPayments((prev) => [...prev, optimisticPayment]);
    const prevClients = clients;
    setClients((prev) =>
      prev.map((c) =>
        c.user_id === client.user_id
          ? { ...c, balance: Math.max(0, Number(c.balance ?? 0) - Number(c.monthly_fee ?? 0)) }
          : c,
      ),
    );
    const label = labelFor(monthKey).full;
    const closingTarget = target;
    setTarget(null);
    hexToast.success(`Payment recorded — ${client.full_name ?? 'client'} · ${label}`);

    try {
      await applyMonthlyPayment({
        client: {
          user_id: client.user_id,
          full_name: client.full_name,
          email: null,
          phone: client.phone,
          monthly_fee: client.monthly_fee,
          balance: client.balance,
          billing_day: client.billing_day,
          account_state: client.account_state,
          last_paid_date: client.last_paid_date,
        },
        monthKey,
        method: payMethod,
      });
      load();
    } catch (e: any) {
      // Rollback optimistic changes.
      setPayments((prev) => prev.filter((p) => p.id !== optimisticId));
      setClients(prevClients);
      setTarget(closingTarget);
      const msg = e?.message ?? 'Failed to confirm payment';
      setConfirmError(msg);
      hexToast.error(msg);
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

  const saveRevenue = async (monthKey: string, raw: string) => {
    const val = parseFloat(raw);
    if (Number.isNaN(val) || val < 0) return;
    const existing = revenueMap.get(monthKey);
    if (existing && Math.abs(Number(existing.amount) - val) < 0.005) return;
    const nowIso = new Date().toISOString();
    const loggedBy = user?.email ?? 'manual';
    if (existing) {
      const { error } = await (supabase.from('monthly_revenue' as any) as any)
        .update({ amount: val, logged_by: loggedBy, updated_at: nowIso })
        .eq('id', existing.id);
      if (error) { hexToast.error('Failed to save revenue'); return; }
    } else {
      const { error } = await (supabase.from('monthly_revenue' as any) as any)
        .insert({ month: monthKey, amount: val, logged_by: loggedBy, updated_at: nowIso });
      if (error) { hexToast.error('Failed to save revenue'); return; }
    }
    hexToast.success(`Revenue for ${labelFor(monthKey).full} updated`);
    load();
  };


  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (stateFilter !== 'all') {
        const eff = effectiveState(c.billing_day, c.last_paid_date, c.account_state).toLowerCase();
        if (eff !== stateFilter) return false;
      }
      if (!q) return true;
      return (
        (c.full_name ?? '').toLowerCase().includes(q) ||
        (c.account_id ?? '').toLowerCase().includes(q) ||
        (c.phone ?? '').toLowerCase().includes(q)
      );
    });
  }, [clients, search, stateFilter]);

  const STATE_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'expiring', label: 'Expiring' },
    { key: 'expired', label: 'Expired' },
    { key: 'suspended', label: 'Suspended' },
    { key: 'pending', label: 'Pending' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* ============ SECTION 1: CLIENT ACCOUNTS ============ */}
      <HexCard className="p-0 overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">// Section 01</div>
            <div className="text-sm font-semibold text-foreground">Client Accounts</div>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">
            {filteredClients.length} / {clients.length} clients
          </div>
        </div>

        {/* Search + filter controls */}
        <div className="border-b border-border px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, Account ID, or phone…"
              className="pl-9 pr-9 h-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {STATE_FILTERS.map((f) => (
              <Button
                key={f.key}
                size="sm"
                variant={stateFilter === f.key ? 'default' : 'outline'}
                onClick={() => setStateFilter(f.key)}
                className="uppercase tracking-[0.12em] text-[10px] h-8"
              >
                {f.label}
              </Button>
            ))}
          </div>
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
              {filteredClients.map((c, idx) => {
                const isOpen = expanded.has(c.user_id);
                const eff = effectiveState(c.billing_day, c.last_paid_date, c.account_state);
                const paidSet = paidIndex.get(c.user_id) ?? new Set<string>();
                const currentPaid = paidSet.has(currentMonthKey);
                const clientMonths = monthKeys.filter((k) => k >= c.joined);
                const prevDay = idx > 0 ? filteredClients[idx - 1].billing_day : null;
                const showDivider = idx === 0 || c.billing_day !== prevDay;

                const dividerLabel = c.billing_day ? `— DAY ${c.billing_day} —` : '— NO BILLING DAY —';
                return (
                  <Fragment key={c.user_id}>
                    {showDivider && (
                      <tr className="bg-muted/20">
                        <td colSpan={8} className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/70">
                          {dividerLabel}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t border-border/40 hover:bg-muted/20">
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
                          onClick={() =>
                            currentPaid
                              ? openReverse(c, currentMonthKey)
                              : openConfirm(c, currentMonthKey)
                          }
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
                                      onClick={() =>
                                        paid ? openReverse(c, mk) : openConfirm(c, mk)
                                      }
                                    />

                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {clients.length === 0 && (
                <tr><td colSpan={8} className="text-center px-3 py-8 text-muted-foreground text-xs">No clients yet.</td></tr>
              )}
              {clients.length > 0 && filteredClients.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center px-3 py-8 text-muted-foreground text-xs">
                    No accounts match “{search}”{stateFilter !== 'all' ? ` in ${stateFilter}` : ''}.
                    <button
                      onClick={() => { setSearch(''); setStateFilter('all'); }}
                      className="ml-2 text-primary hover:underline"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
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
                {monthKeys.map((mk) => {
                  const rev = revenueMap.get(mk);
                  const stats = paymentStatsByMonth.get(mk) ?? { count: 0, sum: 0 };
                  return (
                    <td key={mk} className="px-1 py-1">
                      <RevenueCell
                        row={rev}
                        paymentCount={stats.count}
                        computedSum={stats.sum}
                        onSave={(v) => saveRevenue(mk, v)}
                      />
                    </td>
                  );
                })}

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
              {confirmError && (
                <div className="flex items-start gap-2 rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-[1px]" />
                  <span>{confirmError}</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={confirming}>Cancel</Button>
            <Button onClick={confirmPayment} disabled={confirming}>
              {confirming ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Confirming…</>
              ) : (
                'Confirm'
              )}
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
          ? 'bg-green-500 border-green-500 hover:bg-green-500/80'
          : disabled
            ? 'border-border/40 bg-muted/20 cursor-not-allowed'
            : 'border-border bg-background hover:border-primary'
      }`}
      title={paid ? 'Click to reverse this payment' : 'Mark as paid'}
      aria-label={paid ? 'Reverse payment' : 'Mark paid'}

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

function RevenueCell({
  row,
  paymentCount,
  computedSum,
  onSave,
}: {
  row?: { amount: number; logged_by: string | null };
  paymentCount: number;
  computedSum: number;
  onSave: (v: string) => void;
}) {
  // Manual override wins. Otherwise show the live sum from payment_history so
  // historic months (and any drift in monthly_revenue) stay accurate.
  const isManual = !!row && row.logged_by !== null && row.logged_by !== 'auto';
  const displayAmount = isManual ? Number(row!.amount ?? 0) : computedSum;
  const [val, setVal] = useState<string>(displayAmount ? String(displayAmount) : '');
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setVal(displayAmount ? String(displayAmount) : '');
  }, [displayAmount, focused]);

  const tooltip = isManual
    ? `Manually set by ${row?.logged_by}. Click to edit.`
    : `Auto-calculated from ${paymentCount} payment${paymentCount === 1 ? '' : 's'}. Click to edit.`;

  return (
    <div className="flex flex-col items-center gap-0.5" title={tooltip}>
      <Input
        value={val}
        onFocus={() => setFocused(true)}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          setFocused(false);
          const next = val === '' ? 0 : parseFloat(val);
          if (!Number.isNaN(next) && Math.abs(next - displayAmount) > 0.005) {
            onSave(val === '' ? '0' : val);
          }
        }}
        placeholder="0"
        className={`h-8 w-24 mx-auto text-center font-mono text-xs ${
          isManual ? 'text-amber-400 border-amber-400/40' : 'text-primary border-primary/30'
        }`}
      />
      {isManual && (
        <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-amber-400/80">Edited</span>
      )}
    </div>
  );

}
