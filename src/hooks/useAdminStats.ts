import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { effectiveStateWithPaid } from '@/lib/billing';

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

    const [billingRes, revenueRes, ticketsRes, newProfRes] = await Promise.all([
      supabase.from('customer_billing').select('billing_day, account_state'),
      supabase.from('monthly_revenue').select('month, amount'),
      supabase.from('tickets').select('status'),
      supabase.from('profiles').select('user_id, created_at').gte('created_at', startMonth),
    ]);

    const billing = billingRes.data ?? [];
    let active = 0;
    for (const b of billing as any[]) {
      const eff = effectiveState(b.billing_day, b.account_state);
      if (eff === 'active' || eff === 'expiring' || eff === 'pending') active++;
    }

    const revenue = (revenueRes.data ?? []) as { month: string; amount: number | string }[];
    const total = revenue.reduce((s, r) => s + Number(r.amount), 0);
    const current = revenue.find((r) => r.month === thisMonth);
    const prev = revenue.find((r) => r.month === prevMonth);
    const monthly = current ? Number(current.amount) : 0;
    let pct: number | null = null;
    if (current && prev && Number(prev.amount) > 0) {
      pct = ((Number(current.amount) - Number(prev.amount)) / Number(prev.amount)) * 100;
    }

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
      monthlyRevenueLogged: !!current,
      monthlyRevenuePctChange: pct,
      hasPrevMonth: !!prev,
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, recompute)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, recompute)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return stats;
}
