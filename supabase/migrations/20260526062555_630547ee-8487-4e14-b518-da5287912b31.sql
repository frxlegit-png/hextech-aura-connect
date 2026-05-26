-- Add 'customer' value to app_role enum for portal access
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';