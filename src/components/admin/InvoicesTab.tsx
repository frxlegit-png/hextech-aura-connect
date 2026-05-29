import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HexCard } from '@/components/hex/HexCard';
import { HexBadge } from '@/components/hex/HexBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Trash2 } from 'lucide-react';
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
    // Last 2 months window (covers current month and previous calendar month)
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 2);
    cutoff.setHours(0, 0, 0, 0);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const { data: invs } = await (supabase.from('invoices' as any) as any)
      .select('*')
      .gte('invoice_date', cutoffStr)
      .order('invoice_date', { ascending: false })
      .limit(500);
    if (!invs) return;

    // Dedupe: one invoice per user per (year-month). Keep most recent invoice_date, then newest created_at.
    const sorted = [...invs].sort((a: any, b: any) => {
      const d = (b.invoice_date || '').localeCompare(a.invoice_date || '');
      if (d !== 0) return d;
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
    const seen = new Set<string>();
    const dupes: string[] = [];
    const unique: any[] = [];
    for (const inv of sorted) {
      const ym = (inv.invoice_date || '').slice(0, 7);
      const key = `${inv.user_id}|${ym}`;
      if (seen.has(key)) { dupes.push(inv.id); continue; }
      seen.add(key);
      unique.push(inv);
    }
    if (dupes.length) {
      await (supabase.from('invoices' as any) as any).delete().in('id', dupes);
    }

    const userIds = Array.from(new Set(unique.map((i: any) => i.user_id)));
    const { data: billing } = await (supabase.from('customer_billing' as any) as any)
      .select('user_id, account_id')
      .in('user_id', userIds);
    const idMap = new Map((billing ?? []).map((b: any) => [b.user_id, b.account_id as string | null]));
    setRows(unique.map((i: any) => ({ ...i, account_id: idMap.get(i.user_id) ?? null })));
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

  // Note: marking PAID/UNPAID is controlled exclusively from the Billing tab.


  const deleteInvoice = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Delete this invoice? This cannot be undone.')) return;
    const { error } = await (supabase.from('invoices' as any) as any).delete().eq('id', id);
    if (error) { hexToast.error('Failed to delete invoice'); return; }
    hexToast.success('Invoice deleted');
    setRows((prev) => prev.filter((r) => r.id !== id));
    if (open?.id === id) setOpen(null);
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
              <th className="px-3 py-2.5 text-right w-12"></th>
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
                  <td className="px-3 py-2.5 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={(e) => deleteInvoice(r.id, e)}
                      aria-label="Delete invoice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-xs text-muted-foreground">No invoices in the last 2 months.</td></tr>
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
