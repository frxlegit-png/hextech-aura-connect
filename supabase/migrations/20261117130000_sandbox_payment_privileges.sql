-- Default public-schema grants can otherwise give clients unnecessary write privileges.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.ecocash_test_payments FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.sandbox_payment_allocations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.sandbox_billing_config FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.ecocash_test_payments TO authenticated;
