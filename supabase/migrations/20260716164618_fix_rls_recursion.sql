-- Create a security definer function to get the current user's role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Drop existing recursive policies on public.users
DROP POLICY IF EXISTS "users_select_admin" ON public.users;
DROP POLICY IF EXISTS "users_update_role_super_admin" ON public.users;

-- Recreate policies using the security definer function to avoid infinite recursion
CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT USING (
    public.get_auth_user_role() IN ('super_admin', 'studio_admin', 'studio_staff')
  );

CREATE POLICY "users_update_role_super_admin" ON public.users
  FOR UPDATE USING (
    public.get_auth_user_role() = 'super_admin'
  );
