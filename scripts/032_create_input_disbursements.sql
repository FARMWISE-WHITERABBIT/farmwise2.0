-- Create input_disbursements table for tracking farm input distribution
CREATE TABLE IF NOT EXISTS input_disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  field_visit_id UUID REFERENCES field_visits(id) ON DELETE SET NULL,
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Fixed reference from profiles to users
  item_name TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  value DECIMAL(12, 2) DEFAULT 0,
  disbursement_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_input_disbursements_farmer ON input_disbursements(farmer_id);
CREATE INDEX idx_input_disbursements_agent ON input_disbursements(agent_id);
CREATE INDEX idx_input_disbursements_visit ON input_disbursements(field_visit_id);
CREATE INDEX idx_input_disbursements_date ON input_disbursements(disbursement_date);

-- Enable RLS
ALTER TABLE input_disbursements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Updated all RLS policies to reference users table instead of profiles
CREATE POLICY "Users can view disbursements in their organization"
  ON input_disbursements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u1
      JOIN users u2 ON u1.organization_id = u2.organization_id
      WHERE u1.id = auth.uid()
      AND u2.id = agent_id
    )
  );

CREATE POLICY "Agents and admins can create disbursements"
  ON input_disbursements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('extension_agent', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Agents and admins can update their disbursements"
  ON input_disbursements FOR UPDATE
  USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_input_disbursements_updated_at
  BEFORE UPDATE ON input_disbursements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
