-- payment_history
CREATE TABLE public.payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT (now()::date),
  description text NOT NULL DEFAULT 'Monthly Subscription',
  method text NOT NULL DEFAULT 'Cash',
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PAID',
  invoice_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_history TO authenticated;
GRANT ALL ON public.payment_history TO service_role;

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own payment history"
  ON public.payment_history FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage all payment history"
  ON public.payment_history FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- invoices
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  invoice_date date NOT NULL,
  due_date date NOT NULL,
  client_name text,
  client_email text,
  client_phone text,
  plan text NOT NULL DEFAULT 'Residential Unlimited',
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'UNPAID',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, invoice_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own invoices"
  ON public.invoices FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage all invoices"
  ON public.invoices FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Cap at 5 invoices per client
CREATE OR REPLACE FUNCTION public.cap_invoices_per_user()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.invoices
  WHERE user_id = NEW.user_id
    AND id IN (
      SELECT id FROM public.invoices
      WHERE user_id = NEW.user_id
      ORDER BY invoice_date DESC, created_at DESC
      OFFSET 5
    );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cap_invoices_per_user
AFTER INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.cap_invoices_per_user();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;