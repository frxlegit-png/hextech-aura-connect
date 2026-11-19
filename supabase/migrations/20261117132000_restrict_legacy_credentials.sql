-- Existing Auth passwords remain valid. Legacy plaintext copies are no longer
-- available to browser clients; deleting existing records is a separate step.
REVOKE ALL ON public.customer_credentials FROM PUBLIC, anon, authenticated;
