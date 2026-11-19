ALTER TABLE public.ecocash_test_payments DROP CONSTRAINT ecocash_test_payments_status_check;
ALTER TABLE public.ecocash_test_payments ADD CONSTRAINT ecocash_test_payments_status_check
  CHECK (status IN ('pending', 'charged', 'failed', 'abandoned', 'refunded'));
ALTER TABLE public.ecocash_test_payments ADD COLUMN refund_reference text;
