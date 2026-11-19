-- A customer must not be able to create a paid or zero-value invoice.
-- Run only in an isolated test database; all changes are rolled back.
BEGIN;
SELECT set_config('request.jwt.claim.sub', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE rejected boolean := false; fee numeric;
BEGIN
  SELECT monthly_fee INTO fee FROM public.customer_billing WHERE user_id = auth.uid();
  IF fee IS NULL OR fee <= 0 THEN RAISE EXCEPTION 'Sandbox billing row with a positive fee required'; END IF;
  BEGIN
    INSERT INTO public.invoices(user_id,invoice_date,due_date,amount,status)
      VALUES (auth.uid(),'2088-01-01','2088-01-01',0,'PAID');
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Customer can create a paid zero-value invoice'; END IF;
  rejected := false;
  BEGIN
    INSERT INTO public.invoices(user_id,invoice_date,due_date,amount,status)
      VALUES (auth.uid(),'2088-01-02','2088-01-02',fee + 1,'UNPAID');
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Customer can create an invoice for an arbitrary fee'; END IF;
  INSERT INTO public.invoices(user_id,invoice_date,due_date,amount,status)
    VALUES (auth.uid(),'2088-01-03','2088-01-03',fee,'UNPAID');
END $$;
ROLLBACK;
