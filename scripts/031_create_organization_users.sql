-- Create organization_users table for managing user roles within organizations
CREATE TABLE IF NOT EXISTS organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  -- Roles: owner, admin, manager, field_agent, member
  permissions JSONB DEFAULT '{}',
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Create indexes
CREATE INDEX idx_organization_users_org ON organization_users(organization_id);
CREATE INDEX idx_organization_users_user ON organization_users(user_id);
CREATE INDEX idx_organization_users_role ON organization_users(role);

-- Add RLS policies
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- Users can view organization_users in their organization
CREATE POLICY "Users can view organization members"
  ON organization_users
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Admins and owners can insert organization_users
CREATE POLICY "Admins can add organization members"
  ON organization_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = organization_users.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role IN ('owner', 'admin')
      AND ou.is_active = true
    )
  );

-- Admins and owners can update organization_users
CREATE POLICY "Admins can update organization members"
  ON organization_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = organization_users.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role IN ('owner', 'admin')
      AND ou.is_active = true
    )
  );

-- Admins and owners can delete organization_users
CREATE POLICY "Admins can remove organization members"
  ON organization_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = organization_users.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role IN ('owner', 'admin')
      AND ou.is_active = true
    )
  );

-- Function to automatically add user to organization_users when user is created with organization_id
CREATE OR REPLACE FUNCTION auto_add_user_to_organization()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NOT NULL THEN
    INSERT INTO organization_users (organization_id, user_id, role, joined_at)
    VALUES (NEW.organization_id, NEW.id, COALESCE(NEW.role, 'member'), NOW())
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_add_user_to_organization ON users;
CREATE TRIGGER trigger_auto_add_user_to_organization
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_user_to_organization();

-- Migrate existing users to organization_users
INSERT INTO organization_users (organization_id, user_id, role, joined_at, is_active)
SELECT 
  organization_id,
  id as user_id,
  CASE 
    WHEN role = 'super_admin' THEN 'owner'
    WHEN role = 'admin' THEN 'admin'
    WHEN role = 'field_agent' THEN 'field_agent'
    ELSE 'member'
  END as role,
  created_at as joined_at,
  is_active
FROM users
WHERE organization_id IS NOT NULL
ON CONFLICT (organization_id, user_id) DO NOTHING;
