-- Run only against an isolated sandbox database. Everything is rolled back.
BEGIN;
DO $$
DECLARE
  u uuid; inv uuid := gen_random_uuid(); p1 uuid := gen_random_uuid();
  p2 uuid := gen_random_uuid(); p3 uuid := gen_random_uuid(); p4 uuid := gen_random_uuid(); b numeric; s text; v numeric;
BEGIN
  SELECT id INTO u FROM auth.users ORDER BY created_at LIMIT 1;
  IF u IS NULL THEN RAISE EXCEPTION 'Sandbox test user required'; END IF;
  UPDATE public.sandbox_billing_config SET enabled = true WHERE id;
  -- Isolate a test invoice from the account's existing test history.
  UPDATE public.invoices SET status = 'PAID' WHERE user_id = u;
  UPDATE public.customer_billing SET balance = 24.99 WHERE user_id = u;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sandbox billing row required'; END IF;
  INSERT INTO public.invoices(id,user_id,invoice_date,due_date,amount,status,month_key)
    VALUES (inv,u,'2098-01-01','2098-01-01',24.99,'UNPAID','2098-01');
  INSERT INTO public.ecocash_test_payments(id,user_id,phone,amount,status) VALUES (p1,u,'000000000',1,'pending');
  UPDATE public.ecocash_test_payments SET status = 'charged' WHERE id = p1;
  SELECT balance INTO b FROM public.customer_billing WHERE user_id = u;
  SELECT status INTO s FROM public.invoices WHERE id = inv;
  IF b <> 23.99 OR s <> 'UNPAID' THEN RAISE EXCEPTION 'Partial payment: balance %, status %', b, s; END IF;
  PERFORM public.apply_sandbox_payment(p1);
  SELECT balance INTO b FROM public.customer_billing WHERE user_id = u;
  IF b <> 23.99 THEN RAISE EXCEPTION 'Duplicate settlement changed balance'; END IF;
  INSERT INTO public.ecocash_test_payments(id,user_id,phone,amount,status) VALUES (p2,u,'000000000',25,'pending');
  UPDATE public.ecocash_test_payments SET status = 'charged' WHERE id = p2;
  SELECT balance INTO b FROM public.customer_billing WHERE user_id = u;
  SELECT status INTO s FROM public.invoices WHERE id = inv;
  SELECT unapplied_amount INTO v FROM public.ecocash_test_payments WHERE id = p2;
  IF b <> 0 OR s <> 'PAID' OR v <> 1.01 THEN RAISE EXCEPTION 'Final payment: balance %, status %, unapplied %', b, s, v; END IF;
  INSERT INTO public.ecocash_test_payments(id,user_id,phone,amount,status) VALUES (p3,u,'000000000',1,'pending');
  UPDATE public.ecocash_test_payments SET status = 'failed' WHERE id = p3;
  SELECT balance INTO b FROM public.customer_billing WHERE user_id = u;
  IF b <> 0 OR EXISTS (SELECT 1 FROM public.sandbox_payment_allocations WHERE payment_id = p3) THEN RAISE EXCEPTION 'Failed payment changed billing'; END IF;
  UPDATE public.sandbox_billing_config SET enabled = false WHERE id;
  INSERT INTO public.ecocash_test_payments(id,user_id,phone,amount,status) VALUES (p4,u,'000000000',1,'pending');
  UPDATE public.ecocash_test_payments SET status = 'charged' WHERE id = p4;
  IF (SELECT settled_at IS NOT NULL FROM public.ecocash_test_payments WHERE id = p4)
    OR EXISTS (SELECT 1 FROM public.sandbox_payment_allocations WHERE payment_id = p4)
    THEN RAISE EXCEPTION 'Disabled sandbox settlement affected billing'; END IF;
END $$;
ROLLBACK;
