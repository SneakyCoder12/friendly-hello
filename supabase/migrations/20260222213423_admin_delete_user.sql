-- Create a secure RPC function to allow admins to delete users completely.
-- This requires SECURITY DEFINER so it can access the auth schema.
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Check if the caller is an admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: only admins can delete users.';
  END IF;

  -- 2. Delete the user from auth.users. 
  -- Due to foreign keys with ON DELETE CASCADE, this will automatically
  -- delete their profile, listings, and favorites as well.
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
