ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS month_key TEXT;
UPDATE public.invoices SET month_key = to_char(invoice_date, 'YYYY-MM') WHERE month_key IS NULL;
CREATE INDEX IF NOT EXISTS invoices_user_month_key_idx ON public.invoices (user_id, month_key);