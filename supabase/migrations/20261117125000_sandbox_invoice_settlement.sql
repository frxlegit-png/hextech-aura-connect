-- Disabled by default: enabling simulated settlement is restricted to a test database.
CREATE TABLE public.sandbox_billing_config (id boolean PRIMARY KEY DEFAULT true CHECK (id), enabled boolean NOT NULL DEFAULT false);
INSERT INTO public.sandbox_billing_config (id, enabled) VALUES (true, false);
REVOKE ALL ON public.sandbox_billing_config FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.sandbox_billing_config TO service_role;

CREATE TABLE public.sandbox_payment_allocations (
  payment_id uuid NOT NULL REFERENCES public.ecocash_test_payments(id),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  PRIMARY KEY (payment_id, invoice_id)
);
ALTER TABLE public.sandbox_payment_allocations ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.sandbox_payment_allocations TO service_role;
ALTER TABLE public.ecocash_test_payments ADD COLUMN settled_at timestamptz;
ALTER TABLE public.ecocash_test_payments ADD COLUMN unapplied_amount numeric(12,2);

CREATE FUNCTION public.apply_sandbox_payment(p_payment_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.ecocash_test_payments%ROWTYPE; inv record; remaining numeric; allocated numeric;
  already_paid numeric; applied_total numeric := 0; latest_paid date := NULL;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.sandbox_billing_config WHERE id AND enabled) THEN RETURN; END IF;
  SELECT * INTO p FROM public.ecocash_test_payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND OR p.status <> 'charged' OR p.settled_at IS NOT NULL THEN RETURN; END IF;
  PERFORM 1 FROM public.customer_billing WHERE user_id = p.user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'No sandbox billing account'; END IF;
  remaining := p.amount;
  FOR inv IN SELECT * FROM public.invoices WHERE user_id = p.user_id AND upper(status) <> 'PAID'
    ORDER BY due_date, invoice_date, id FOR UPDATE LOOP
    EXIT WHEN remaining <= 0;
    SELECT coalesce(sum(amount), 0) INTO already_paid FROM public.sandbox_payment_allocations WHERE invoice_id = inv.id;
    allocated := least(remaining, greatest(inv.amount - already_paid, 0));
    IF allocated <= 0 THEN CONTINUE; END IF;
    INSERT INTO public.sandbox_payment_allocations(payment_id, invoice_id, amount) VALUES (p.id, inv.id, allocated);
    INSERT INTO public.payment_history(user_id, date, description, method, amount, status, invoice_id)
      VALUES (p.user_id, current_date, 'EcoCash sandbox test payment', 'EcoCash sandbox', allocated, 'PAID', inv.id);
    remaining := remaining - allocated;
    applied_total := applied_total + allocated;
    IF already_paid + allocated >= inv.amount THEN
      UPDATE public.invoices SET status = 'PAID', paid_date = current_date WHERE id = inv.id;
      latest_paid := greatest(latest_paid, inv.invoice_date);
    END IF;
  END LOOP;
  UPDATE public.customer_billing SET balance = greatest(0, balance - applied_total),
    last_paid_date = CASE WHEN latest_paid IS NOT NULL THEN greatest(coalesce(last_paid_date, latest_paid), latest_paid) ELSE last_paid_date END
    WHERE user_id = p.user_id;
  UPDATE public.ecocash_test_payments SET settled_at = now(), unapplied_amount = remaining, updated_at = now() WHERE id = p.id;
END $$;
REVOKE ALL ON FUNCTION public.apply_sandbox_payment(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_sandbox_payment(uuid) TO service_role;

CREATE FUNCTION public.settle_sandbox_payment_trigger() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'charged' AND OLD.status IS DISTINCT FROM NEW.status THEN PERFORM public.apply_sandbox_payment(NEW.id); END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER settle_confirmed_sandbox_payment AFTER UPDATE OF status ON public.ecocash_test_payments
FOR EACH ROW EXECUTE FUNCTION public.settle_sandbox_payment_trigger();
