ALTER TABLE public.customer_billing
  ADD COLUMN IF NOT EXISTS signal_strength text,
  ADD COLUMN IF NOT EXISTS station_model text,
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS frequency text;