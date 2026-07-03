
CREATE TABLE public.business_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL UNIQUE,
  expenses numeric NOT NULL DEFAULT 0,
  investments numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.business_summary TO authenticated;
GRANT ALL ON public.business_summary TO service_role;

ALTER TABLE public.business_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view business summary"
  ON public.business_summary FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert business summary"
  ON public.business_summary FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update business summary"
  ON public.business_summary FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_business_summary_updated_at
  BEFORE UPDATE ON public.business_summary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
