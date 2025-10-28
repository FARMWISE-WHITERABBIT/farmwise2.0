-- Fix infinite recursion in RLS policies by using SECURITY DEFINER functions
-- This allows policies to check user roles without triggering recursive policy checks

-- Create helper function to check if current user is super_admin
-- SECURITY DEFINER allows this function to bypass RLS when checking the users table
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- ORGANIZATIONS TABLE - Fix recursion
-- =====================================================

DROP POLICY IF EXISTS "Organization visibility by role" ON organizations;

CREATE POLICY "Organization visibility by role"
  ON organizations FOR SELECT
  USING (
    -- Super admins can see all organizations
    public.is_super_admin()
    OR
    -- Regular users can see their own organization
    id = public.user_organization_id()
  );

-- =====================================================
-- USERS TABLE - Fix recursion
-- =====================================================

DROP POLICY IF EXISTS "Users can view users by role" ON users;

CREATE POLICY "Users can view users by role"
  ON users FOR SELECT
  USING (
    -- Users can always see their own profile
    id = auth.uid()
    OR
    -- Super admins can see all users
    public.is_super_admin()
    OR
    -- Regular users can see users in their organization
    organization_id = public.user_organization_id()
  );

-- =====================================================
-- FARMERS TABLE - Fix recursion
-- =====================================================

DROP POLICY IF EXISTS "Farmers visibility by role" ON farmers;

CREATE POLICY "Farmers visibility by role"
  ON farmers FOR SELECT
  USING (
    -- Super admins can see all farmers
    public.is_super_admin()
    OR
    -- Regular users can see farmers in their organization
    organization_id = public.user_organization_id()
  );
