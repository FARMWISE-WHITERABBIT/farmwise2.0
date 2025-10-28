-- Add financial permissions system for extension agents

-- Create table to track financial edit permissions
CREATE TABLE IF NOT EXISTS farmer_financial_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  can_edit_income BOOLEAN DEFAULT false,
  can_edit_expenses BOOLEAN DEFAULT false,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID REFERENCES users(id),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(farmer_id, agent_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_financial_permissions_farmer ON farmer_financial_permissions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_financial_permissions_agent ON farmer_financial_permissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_financial_permissions_active ON farmer_financial_permissions(is_active) WHERE is_active = true;

-- Function to automatically grant permission when agent creates farmer
CREATE OR REPLACE FUNCTION grant_auto_financial_permission()
RETURNS TRIGGER AS $$
BEGIN
  -- If farmer was registered by an extension agent, grant automatic permission
  IF NEW.registered_by IS NOT NULL THEN
    INSERT INTO farmer_financial_permissions (
      farmer_id,
      agent_id,
      can_edit_income,
      can_edit_expenses,
      granted_by,
      notes
    )
    VALUES (
      NEW.id,
      NEW.registered_by,
      true,
      true,
      NEW.registered_by,
      'Automatic permission granted - agent created farmer account'
    )
    ON CONFLICT (farmer_id, agent_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic permission grant
DROP TRIGGER IF EXISTS auto_grant_financial_permission ON farmers;
CREATE TRIGGER auto_grant_financial_permission
  AFTER INSERT ON farmers
  FOR EACH ROW
  EXECUTE FUNCTION grant_auto_financial_permission();

-- Grant automatic permissions for existing farmers created by agents
INSERT INTO farmer_financial_permissions (
  farmer_id,
  agent_id,
  can_edit_income,
  can_edit_expenses,
  granted_by,
  notes
)
SELECT 
  f.id,
  f.registered_by,
  true,
  true,
  f.registered_by,
  'Automatic permission granted - agent created farmer account (retroactive)'
FROM farmers f
WHERE f.registered_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM farmer_financial_permissions fp
    WHERE fp.farmer_id = f.id AND fp.agent_id = f.registered_by
  );

COMMENT ON TABLE farmer_financial_permissions IS 'Tracks which extension agents have permission to edit farmer financial records';
COMMENT ON COLUMN farmer_financial_permissions.can_edit_income IS 'Permission to add/edit income records';
COMMENT ON COLUMN farmer_financial_permissions.can_edit_expenses IS 'Permission to add/edit expense records';
COMMENT ON COLUMN farmer_financial_permissions.is_active IS 'Whether the permission is currently active';
