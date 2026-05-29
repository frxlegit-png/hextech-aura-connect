import { supabase } from '@/integrations/supabase/client';

interface EnsureArgs {
  user_id: string;
  billing_day: number | null;
  last_paid_date: string | null;
  monthly_fee: number;
  plan?: string;
  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  /** Explicit invoice date (YYYY-MM-DD). Defaults to last_paid_date. */
  invoice_date?: string;
  /** Explicit due date (YYYY-MM-DD). Defaults to invoice_date. */
  due_date?: string;
  /** Invoice status to insert with. Defaults to UNPAID. */
  status?: 'PAID' | 'UNPAID';
}

function nextMonthFirst(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m, 1); // m is 1-based, so this is next month day 1
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Ensure an invoice exists for the current billing cycle. Dedupes by month:
 * if any invoice already exists for that user in the same YYYY-MM as the
 * invoice_date, no new invoice is created.
 */
export async function ensureCurrentCycleInvoice(args: EnsureArgs): Promise<void> {
  if (!args.billing_day || !args.last_paid_date) return;
  const invDate = (args.invoice_date ?? args.last_paid_date).slice(0, 10);
  const dueDate = (args.due_date ?? invDate).slice(0, 10);
  const ym = invDate.slice(0, 7);

  const { data: existing } = await (supabase.from('invoices' as any) as any)
    .select('id')
    .eq('user_id', args.user_id)
    .gte('invoice_date', `${ym}-01`)
    .lt('invoice_date', nextMonthFirst(ym))
    .limit(1);
  if (existing && existing.length > 0) return;

  await (supabase.from('invoices' as any) as any).insert({
    user_id: args.user_id,
    invoice_date: invDate,
    due_date: dueDate,
    client_name: args.client_name ?? null,
    client_email: args.client_email ?? null,
    client_phone: args.client_phone ?? null,
    plan: args.plan ?? 'Residential Unlimited',
    amount: args.monthly_fee,
    status: args.status ?? 'UNPAID',
  });
}

/**
 * Dedupe a user's invoices by month — keep the most recent (by invoice_date,
 * then created_at) and delete older duplicates from the database.
 * Returns the deduped list.
 */
export async function dedupeUserInvoicesByMonth<T extends { id: string; user_id: string; invoice_date: string; created_at?: string }>(
  invoices: T[],
): Promise<T[]> {
  const sorted = [...invoices].sort((a, b) => {
    const d = (b.invoice_date || '').localeCompare(a.invoice_date || '');
    if (d !== 0) return d;
    return (b.created_at || '').localeCompare(a.created_at || '');
  });
  const seen = new Set<string>();
  const dupes: string[] = [];
  const unique: T[] = [];
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
  return unique;
}

export function formatInvoiceDate(d: string | Date | null) {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** 10% VAT inclusive in the displayed amount. */
export function vatBreakdown(totalAmount: number): { subtotal: number; vat: number; total: number } {
  const total = Number(totalAmount) || 0;
  const vat = total / 11; // 10% VAT inclusive → vat = total * 10/110
  const subtotal = total - vat;
  return { subtotal, vat, total };
}
