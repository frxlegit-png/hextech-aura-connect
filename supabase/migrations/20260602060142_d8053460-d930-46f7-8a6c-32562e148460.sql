
CREATE TABLE public.customer_credentials (
  user_id uuid PRIMARY KEY,
  password_plain text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_credentials TO authenticated;
GRANT ALL ON public.customer_credentials TO service_role;

ALTER TABLE public.customer_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage credentials"
ON public.customer_credentials
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_customer_credentials_updated_at
BEFORE UPDATE ON public.customer_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
