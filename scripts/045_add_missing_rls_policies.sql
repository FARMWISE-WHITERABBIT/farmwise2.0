-- =====================================================
-- ADD MISSING RLS POLICIES FOR USER/ORG CREATION
-- =====================================================

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Service role can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Super admins can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Super admins can update organizations" ON organizations;

-- Organizations INSERT policy
-- Allow authenticated users to create organizations (for signup)
-- and super_admins to create additional organizations
CREATE POLICY "Allow organization creation"
  ON organizations FOR INSERT
  WITH CHECK (
    -- Allow if user is authenticated (for signup flow)
    auth.uid() IS NOT NULL
    OR
    -- Allow if user is super_admin
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Organizations UPDATE policy for super_admins
CREATE POLICY "Super admins can update organizations"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Drop existing user policies if they exist
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;

-- Users INSERT policy
-- Allow authenticated users to create their own user record (for signup)
-- and admins/managers to create user records for their organization
CREATE POLICY "Allow user creation"
  ON users FOR INSERT
  WITH CHECK (
    -- Allow users to create their own record during signup
    id = auth.uid()
    OR
    -- Allow admins/managers to create users in their organization
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'manager')
    )
  );

-- Add INSERT policy for notifications (for system-generated notifications)
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);  -- Allow all inserts, RLS on SELECT protects reading
