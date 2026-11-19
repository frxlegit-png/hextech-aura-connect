-- Keep unresolved simulated attempts when switching to another test handset.
ALTER TABLE public.ecocash_test_payments
  DROP CONSTRAINT ecocash_test_payments_status_check;
ALTER TABLE public.ecocash_test_payments
  ADD CONSTRAINT ecocash_test_payments_status_check
  CHECK (status IN ('pending', 'charged', 'failed', 'abandoned'));
