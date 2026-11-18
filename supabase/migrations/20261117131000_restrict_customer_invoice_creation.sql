-- Customers may create only their own unpaid invoices at their configured fee.
DROP POLICY IF EXISTS "Customers insert own invoices" ON public.invoices;
CREATE POLICY "Customers insert own invoices" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'UNPAID'
    AND paid_date IS NULL
    AND amount > 0
    AND EXISTS (
      SELECT 1 FROM public.customer_billing b
      WHERE b.user_id = auth.uid() AND b.monthly_fee = invoices.amount
    )
  );
