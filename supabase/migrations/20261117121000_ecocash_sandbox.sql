-- Sandbox attempts are isolated from the real billing ledger.
CREATE TABLE public.ecocash_test_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  phone text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'charged', 'failed')),
  ecocash_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ecocash_one_pending_test_per_user
  ON public.ecocash_test_payments (user_id) WHERE status = 'pending';
ALTER TABLE public.ecocash_test_payments ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.ecocash_test_payments TO authenticated;
GRANT ALL ON public.ecocash_test_payments TO service_role;
CREATE POLICY "Users view own EcoCash tests" ON public.ecocash_test_payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
