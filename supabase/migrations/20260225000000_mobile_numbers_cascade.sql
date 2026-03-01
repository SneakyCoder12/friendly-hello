-- Add ON DELETE CASCADE to mobile_numbers pointing to auth.users
ALTER TABLE public.mobile_numbers
  DROP CONSTRAINT IF EXISTS mobile_numbers_user_id_fkey;

ALTER TABLE public.mobile_numbers
  ADD CONSTRAINT mobile_numbers_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users (id)
  ON DELETE CASCADE;
