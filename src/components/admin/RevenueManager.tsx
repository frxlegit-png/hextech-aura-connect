import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HexCard } from '@/components/hex/HexCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { hexToast } from '@/components/hex/HexToast';
import { useAuth } from '@/hooks/useAuth';
import { DollarSign, Save, X, Pencil } from 'lucide-react';

interface RevenueRow {
  id: string;
  month: string; // YYYY-MM
  amount: number;
  logged_by: string | null;
  created_at: string;
  updated_at: string;
}

function monthOptions(count = 24): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    out.push({ value, label });
  }
  return out;
}

function formatMonth(m: string) {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function RevenueManager() {
  const { user } = useAuth();
  const [rows, setRows] = useState<RevenueRow[]>([]);
  const [month, setMonth] = useState(monthOptions(1)[0].value);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const refresh = async () => {
    const { data } = await supabase
      .from('monthly_revenue')
      .select('*')
      .order('month', { ascending: false });
    if (data) setRows(data as RevenueRow[]);
  };

  /**
   * When a month rolls over, auto-log the just-ended month on the revenue tab
   * (if it doesn't already have a row) by summing PAID payment_history for
   * that month. Idempotent — only inserts when no row exists yet.
   */
  const ensurePreviousMonthLogged = async () => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    const startIso = new Date(prev.getFullYear(), prev.getMonth(), 1).toISOString();
    const endIso = new Date(prev.getFullYear(), prev.getMonth() + 1, 1).toISOString();

    const { data: existing } = await supabase
      .from('monthly_revenue')
      .select('id')
      .eq('month', prevKey)
      .limit(1);
    if (existing && existing.length > 0) return;

    const { data: pays } = await (supabase.from('payment_history' as any) as any)
      .select('amount, status')
      .gte('date', startIso)
      .lt('date', endIso);
    const sum = ((pays as any[]) ?? [])
      .filter((p) => (p.status || '').toUpperCase() === 'PAID')
      .reduce((s, p) => s + Number(p.amount ?? 0), 0);

    await supabase.from('monthly_revenue').insert({
      month: prevKey,
      amount: sum,
      logged_by: 'auto',
      updated_at: new Date().toISOString(),
    });
  };

  useEffect(() => {
    (async () => {
      await ensurePreviousMonthLogged();
      await refresh();
    })();
    const ch = supabase
      .channel('monthly_revenue_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_revenue' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_history' }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);


  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 0) {
      hexToast.error('Enter a valid amount');
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from('monthly_revenue')
      .upsert(
        { month, amount: amt, logged_by: user?.email ?? null, updated_at: new Date().toISOString() },
        { onConflict: 'month' },
      );
    setBusy(false);
    if (error) { hexToast.error(error.message); return; }
    hexToast.success(`Revenue for ${formatMonth(month)} saved.`);
    setAmount('');
  };

  const handleEditSave = async (id: string) => {
    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt < 0) { hexToast.error('Enter a valid amount'); return; }
    const { error } = await supabase
      .from('monthly_revenue')
      .update({ amount: amt, logged_by: user?.email ?? null })
      .eq('id', id);
    if (error) { hexToast.error(error.message); return; }
    hexToast.success('Updated.');
    setEditingId(null);
  };

  return (
    <HexCard>
      <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">// Revenue</h3>

      <div className="border border-border rounded-md p-4 bg-card/40 mb-6">
        <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Log Revenue For This Month
        </Label>
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 mt-2">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
          >
            {monthOptions(36).map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">USD</span>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-12 font-mono"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={busy || !amount}
            className="uppercase tracking-[0.2em] bg-primary hover:bg-primary/90"
          >
            <DollarSign className="w-4 h-4 mr-1" /> Save Revenue
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <th className="text-left py-2 px-3 text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-mono">Month</th>
              <th className="text-left py-2 px-3 text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-mono">Revenue (USD)</th>
              <th className="text-left py-2 px-3 text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-mono">Logged By</th>
              <th className="text-left py-2 px-3 text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-mono">Date Logged</th>
              <th className="text-right py-2 px-3 text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-mono">Action</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {rows.map((r) => (
              <tr key={r.id} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <td className="py-3 px-3 text-foreground">{formatMonth(r.month)}</td>
                <td className="py-3 px-3 text-green-400">
                  {editingId === r.id ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="h-8 font-mono w-32"
                    />
                  ) : (
                    `$${Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  )}
                </td>
                <td className="py-3 px-3 text-muted-foreground text-xs">{r.logged_by ?? '—'}</td>
                <td className="py-3 px-3 text-muted-foreground text-xs">
                  {new Date(r.updated_at || r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="py-3 px-3 text-right">
                  {editingId === r.id ? (
                    <div className="inline-flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="w-3 h-3 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" onClick={() => handleEditSave(r.id)}>
                        <Save className="w-3 h-3 mr-1" /> Save
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => { setEditingId(r.id); setEditAmount(String(r.amount)); }}>
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">No revenue logged yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </HexCard>
  );
}
