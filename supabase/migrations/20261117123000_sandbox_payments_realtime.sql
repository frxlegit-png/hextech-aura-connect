-- The test table has an ownership policy; do not republish private billing tables.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
      AND tablename = 'ecocash_test_payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ecocash_test_payments;
  END IF;
END $$;
