-- Fix RLS policies to allow super_admins to view all data across organizations
-- This ensures super_admins can see organization lists with user counts

-- =====================================================
-- ORGANIZATIONS TABLE
-- =====================================================

-- Drop existing organization SELECT policy
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can view organizations based on role" ON organizations;

-- Create new policy that allows super_admins to see all, others see their own
CREATE POLICY "Organization visibility by role"
  ON organizations FOR SELECT
  USING (
    -- Super admins can see all organizations
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
    OR
    -- Regular users can see their own organization
    id = public.user_organization_id()
  );

-- =====================================================
-- USERS TABLE
-- =====================================================

-- Drop existing users SELECT policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can view users in same organization" ON users;

-- Create new policies that allow super_admins to see all users
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can view users by role"
  ON users FOR SELECT
  USING (
    -- Super admins can see all users
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid() 
      AND u.role = 'super_admin'
    )
    OR
    -- Regular users can see users in their organization
    organization_id = public.user_organization_id()
  );

-- =====================================================
-- FARMERS TABLE
-- =====================================================

-- Update farmers SELECT policy to allow super_admins to see all
DROP POLICY IF EXISTS "Users can view farmers in their organization" ON farmers;

CREATE POLICY "Farmers visibility by role"
  ON farmers FOR SELECT
  USING (
    -- Super admins can see all farmers
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
    OR
    -- Regular users can see farmers in their organization
    organization_id = public.user_organization_id()
  );
