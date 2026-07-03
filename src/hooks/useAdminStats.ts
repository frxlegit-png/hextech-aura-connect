import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { effectiveState } from '@/lib/billing';

export interface AdminStats {
  activeSubscribers: number;
  newThisMonth: number;
  monthlyRevenue: number;
  monthlyRevenueLogged: boolean;
  monthlyRevenuePctChange: number | null;
  hasPrevMonth: boolean;
  totalRevenue: number;
  openTickets: number;
  pendingTickets: number;
}

const EMPTY: AdminStats = {
  activeSubscribers: 0,
  newThisMonth: 0,
  monthlyRevenue: 0,
  monthlyRevenueLogged: false,
  monthlyRevenuePctChange: null,
  hasPrevMonth: false,
  totalRevenue: 0,
  openTickets: 0,
  pendingTickets: 0,
};

function ym(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function useAdminStats(): AdminStats {
  const [stats, setStats] = useState<AdminStats>(EMPTY);

  const recompute = async () => {
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thisMonth = ym(now);
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = ym(prevDate);

    const [billingRes, revenueRes, paymentsRes, ticketsRes, newProfRes] = await Promise.all([
      supabase.from('customer_billing').select('billing_day, account_state, last_paid_date'),
      supabase.from('monthly_revenue').select('month, amount, logged_by'),
      (supabase.from('payment_history' as any) as any).select('date, amount, status'),
      supabase.from('tickets').select('status'),
      supabase.from('profiles').select('user_id, created_at').gte('created_at', startMonth),
    ]);

    const billing = billingRes.data ?? [];
    let active = 0;
    for (const b of billing as any[]) {
      const eff = effectiveState(b.billing_day, b.last_paid_date, b.account_state);
      if (eff === 'active' || eff === 'expiring' || eff === 'pending') active++;
    }

    // Build per-month revenue from payment_history, then apply manual overrides
    // from monthly_revenue (rows where logged_by !== 'auto'). Same logic as
    // Accounts tab REVENUE row so the dashboard and Section 2 always agree.
    const revenue = (revenueRes.data ?? []) as {
      month: string;
      amount: number | string;
      logged_by: string | null;
    }[];
    const payments = (paymentsRes.data ?? []) as { date: string; amount: number | string; status: string }[];

    const perMonth = new Map<string, number>();
    for (const p of payments) {
      if ((p.status || '').toUpperCase() !== 'PAID') continue;
      const d = new Date(p.date);
      const key = ym(d);
      perMonth.set(key, (perMonth.get(key) ?? 0) + Number(p.amount ?? 0));
    }
    for (const r of revenue) {
      if (r.logged_by !== null && r.logged_by !== 'auto') {
        perMonth.set(r.month, Number(r.amount ?? 0));
      }
    }

    const total = Array.from(perMonth.values()).reduce((s, v) => s + v, 0);
    const monthly = perMonth.get(thisMonth) ?? 0;
    const prevVal = perMonth.get(prevMonth) ?? 0;
    const hasCurrent = perMonth.has(thisMonth);
    const hasPrev = perMonth.has(prevMonth);
    const pct: number | null =
      hasCurrent && hasPrev && prevVal > 0 ? ((monthly - prevVal) / prevVal) * 100 : null;

    const tickets = (ticketsRes.data ?? []) as { status: string }[];
    const open = tickets.filter((t) => {
      const s = (t.status || '').toLowerCase();
      return s === 'pending' || s === 'opened';
    }).length;
    const pending = tickets.filter((t) => (t.status || '').toLowerCase() === 'pending').length;

    setStats({
      activeSubscribers: active,
      newThisMonth: (newProfRes.data ?? []).length,
      monthlyRevenue: monthly,
      monthlyRevenueLogged: hasCurrent,
      monthlyRevenuePctChange: pct,
      hasPrevMonth: hasPrev,
      totalRevenue: total,
      openTickets: open,
      pendingTickets: pending,
    });
  };

  useEffect(() => {
    recompute();
    const ch = supabase
      .channel('admin_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_billing' }, recompute)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_revenue' }, recompute)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_history' }, recompute)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, recompute)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, recompute)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return stats;
}
