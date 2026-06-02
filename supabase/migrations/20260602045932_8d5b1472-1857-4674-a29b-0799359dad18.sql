
-- 1. Remove plaintext passwords
ALTER TABLE public.customer_billing DROP COLUMN IF EXISTS password_plain;

-- 2. Restrict payment_settings SELECT to authenticated only
DROP POLICY IF EXISTS "Anyone views payment settings" ON public.payment_settings;
CREATE POLICY "Authenticated views payment settings"
ON public.payment_settings
FOR SELECT
TO authenticated
USING (true);

-- 3. Remove sensitive tables from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.customer_billing;
ALTER PUBLICATION supabase_realtime DROP TABLE public.invoices;
ALTER PUBLICATION supabase_realtime DROP TABLE public.payment_history;
ALTER PUBLICATION supabase_realtime DROP TABLE public.tickets;
ALTER PUBLICATION supabase_realtime DROP TABLE public.monthly_revenue;

-- 4. Tighten has_role EXECUTE
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

-- 5. Move pg_net out of public schema (drop + recreate in extensions)
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net WITH SCHEMA extensions;

-- 6. Remove broad SELECT listing on site-assets bucket
DROP POLICY IF EXISTS "Anyone can view site assets files" ON storage.objects;
