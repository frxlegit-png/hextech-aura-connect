-- monthly_revenue table
CREATE TABLE public.monthly_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL UNIQUE,
  amount numeric NOT NULL DEFAULT 0,
  logged_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_revenue TO authenticated;
GRANT ALL ON public.monthly_revenue TO service_role;

ALTER TABLE public.monthly_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage monthly revenue"
ON public.monthly_revenue
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER monthly_revenue_updated_at
BEFORE UPDATE ON public.monthly_revenue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- tickets table
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code text,
  user_id uuid,
  customer_name text,
  subject text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'opened' | 'resolved'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all tickets"
ON public.tickets
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Customers view own tickets"
ON public.tickets
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Customers insert own tickets"
ON public.tickets
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE TRIGGER tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.monthly_revenue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_billing;