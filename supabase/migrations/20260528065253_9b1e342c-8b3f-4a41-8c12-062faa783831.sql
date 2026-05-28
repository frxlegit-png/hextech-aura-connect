
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

CREATE TABLE IF NOT EXISTS public.customer_billing (
  user_id uuid PRIMARY KEY,
  account_id text UNIQUE,
  billing_start date,
  billing_end date,
  account_state text NOT NULL DEFAULT 'active',
  balance numeric NOT NULL DEFAULT 0,
  monthly_fee numeric NOT NULL DEFAULT 24.99,
  password_plain text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_billing TO authenticated;
GRANT ALL ON public.customer_billing TO service_role;
ALTER TABLE public.customer_billing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own billing" ON public.customer_billing FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage billing" ON public.customer_billing FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_customer_billing_updated BEFORE UPDATE ON public.customer_billing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ecocash text DEFAULT '',
  bank_account text DEFAULT '',
  omari text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views payment settings" ON public.payment_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage payment settings" ON public.payment_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_payment_settings_updated BEFORE UPDATE ON public.payment_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.payment_settings (ecocash, bank_account, omari)
SELECT '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM public.payment_settings);
