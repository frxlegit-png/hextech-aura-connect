-- Unschedule daily cron job if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'check-expirations-daily';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DROP TABLE IF EXISTS public.push_subscriptions;

ALTER TABLE public.customer_billing
  DROP COLUMN IF EXISTS expiry_notified,
  DROP COLUMN IF EXISTS seven_day_notified;
