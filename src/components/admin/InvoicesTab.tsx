import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HexCard } from '@/components/hex/HexCard';
import { HexBadge } from '@/components/hex/HexBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { InvoiceModal, InvoiceData } from '@/components/portal/InvoiceModal';
import { hexToast } from '@/components/hex/HexToast';
import { formatInvoiceDate } from '@/lib/invoices';

interface InvoiceRow extends InvoiceData {
  user_id: string;
  account_id: string | null;
}

export function InvoicesTab() {
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<InvoiceRow | null>(null);

  const load = async () => {
    const { data: invs } = await (supabase.from('invoices' as any) as any)
      .select('*')
      .order('invoice_date', { ascending: false })
      .limit(500);
    if (!invs) return;
    const userIds = Array.from(new Set(invs.map((i: any) => i.user_id)));
    const { data: billing } = await (supabase.from('customer_billing' as any) as any)
      .select('user_id, account_id')
      .in('user_id', userIds);
    const idMap = new Map((billing ?? []).map((b: any) => [b.user_id, b.account_id as string | null]));
    setRows(invs.map((i: any) => ({ ...i, account_id: idMap.get(i.user_id) ?? null })));
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('invoices_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.client_name ?? '').toLowerCase().includes(q) ||
        (r.account_id ?? '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  const toggleStatus = async () => {
    if (!open) return;
    const next = open.status?.toUpperCase() === 'PAID' ? 'UNPAID' : 'PAID';
    await (supabase.from('invoices' as any) as any).update({ status: next }).eq('id', open.id);
    if (next === 'PAID') {
      const paidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 10);
      await (supabase.from('payment_history' as any) as any).insert({
        user_id: open.user_id,
        date: new Date().toISOString().slice(0, 10),
        description: 'Monthly Subscription',
        method: 'Cash',
        amount: open.amount,
        status: 'PAID',
      });
      await (supabase.from('customer_billing' as any) as any)
        .update({ balance: 0, account_state: 'active', paid_until: paidUntil })
        .eq('user_id', open.user_id);
    }
    hexToast.success(`Invoice marked ${next}`);
    setOpen({ ...open, status: next });
    load();
  };

  return (
    <HexCard>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-primary">// Invoices</h3>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search client or account ID..."
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
              <th className="px-3 py-2.5 text-left">Invoice Date</th>
              <th className="px-3 py-2.5 text-left">Client Name</th>
              <th className="px-3 py-2.5 text-left">Account ID</th>
              <th className="px-3 py-2.5 text-left">Plan</th>
              <th className="px-3 py-2.5 text-right">Amount</th>
              <th className="px-3 py-2.5 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const paid = (r.status || '').toUpperCase() === 'PAID';
              return (
                <tr
                  key={r.id}
                  className="border-b border-border/40 hover:bg-muted/40 cursor-pointer animate-in fade-in slide-in-from-bottom-1"
                  style={{ animationDelay: `${i * 25}ms`, animationFillMode: 'both' }}
                  onClick={() => setOpen(r)}
                >
                  <td className="px-3 py-2.5 font-mono text-xs">{formatInvoiceDate(r.invoice_date)}</td>
                  <td className="px-3 py-2.5">{r.client_name ?? '—'}</td>
                  <td className="px-3 py-2.5 font-mono text-primary text-xs">{r.account_id ?? '—'}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{r.plan}</td>
                  <td className="px-3 py-2.5 text-right font-mono">${Number(r.amount).toFixed(2)}</td>
                  <td className="px-3 py-2.5">
                    <HexBadge variant={paid ? 'paid' : ('pending' as any)}>{paid ? 'PAID' : 'UNPAID'}</HexBadge>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-xs text-muted-foreground">No invoices yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <>
          <InvoiceModal invoice={open} onClose={() => setOpen(null)} />
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[120]">
            <Button size="sm" onClick={toggleStatus} className="shadow-lg">
              Mark as {open.status?.toUpperCase() === 'PAID' ? 'UNPAID' : 'PAID'}
            </Button>
          </div>
        </>
      )}
    </HexCard>
  );
}
