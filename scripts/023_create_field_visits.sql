-- Create field_visits table for tracking agent farm visits
CREATE TABLE IF NOT EXISTS field_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  visit_type VARCHAR(50) DEFAULT 'routine',
  location GEOGRAPHY(POINT),
  observations TEXT,
  recommendations TEXT,
  crop_health VARCHAR(50),
  pest_disease_notes TEXT,
  photos TEXT[],
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_field_visits_farmer ON field_visits(farmer_id);
CREATE INDEX idx_field_visits_agent ON field_visits(agent_id);
CREATE INDEX idx_field_visits_date ON field_visits(visit_date);

-- Enable RLS
ALTER TABLE field_visits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view field visits in their organization"
  ON field_visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.organization_id = (SELECT organization_id FROM farmers WHERE id = field_visits.farmer_id)
        OR u.id = field_visits.agent_id
      )
    )
  );

CREATE POLICY "Field agents can create field visits"
  ON field_visits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('field_agent', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Field agents can update their own field visits"
  ON field_visits FOR UPDATE
  USING (
    agent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  );
