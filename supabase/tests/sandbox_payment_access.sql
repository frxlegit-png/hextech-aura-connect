-- Exercise row-level security in an isolated sandbox; no data is changed.
BEGIN;
SELECT set_config('request.jwt.claim.sub', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.ecocash_test_payments) THEN
    RAISE EXCEPTION 'Expected test user to see their sandbox payments';
  END IF;
  IF has_table_privilege(current_user, 'public.ecocash_test_payments', 'INSERT')
     OR has_table_privilege(current_user, 'public.ecocash_test_payments', 'UPDATE') THEN
    RAISE EXCEPTION 'Customer can write simulated payment results';
  END IF;
  IF has_table_privilege(current_user, 'public.customer_credentials', 'SELECT') THEN
    RAISE EXCEPTION 'Browser role can read legacy credential copies';
  END IF;
END $$;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.ecocash_test_payments) THEN
    RAISE EXCEPTION 'A different user can see sandbox payments';
  END IF;
END $$;
ROLLBACK;
