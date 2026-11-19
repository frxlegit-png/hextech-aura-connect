-- Accounting records must remain available for payment reconciliation.
DROP TRIGGER IF EXISTS trg_cap_invoices_per_user ON public.invoices;
DROP FUNCTION IF EXISTS public.cap_invoices_per_user();
