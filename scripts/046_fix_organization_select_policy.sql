-- Fix organization SELECT policy to allow super_admins to view all organizations
-- This allows super_admins to see organizations they create without needing a user record in each one

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;

-- Create new policy that allows:
-- 1. Regular users to view their own organization
-- 2. Super admins to view ALL organizations
CREATE POLICY "Users can view organizations based on role"
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
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );
