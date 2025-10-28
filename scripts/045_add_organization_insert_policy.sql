-- =====================================================
-- ADD INSERT POLICY FOR ORGANIZATIONS
-- =====================================================

-- Allow super admins to create new organizations
CREATE POLICY "Super admins can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Allow authenticated users to create their first organization during signup
-- This is needed for the signup flow where users don't have an organization yet
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Add UPDATE policy for organization admins
CREATE POLICY "Admins can update their organization"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin')
      AND is_active = true
    )
  );
