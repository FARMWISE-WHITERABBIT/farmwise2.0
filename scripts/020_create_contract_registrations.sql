-- =====================================================
-- CONTRACT REGISTRATION SYSTEM
-- =====================================================

-- Contract registrations/applications
CREATE TABLE IF NOT EXISTS contract_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  
  -- Registration details
  registration_number VARCHAR UNIQUE NOT NULL,
  registered_by UUID REFERENCES users(id), -- Field agent or admin who registered
  registration_type VARCHAR DEFAULT 'agent_registered', -- 'agent_registered', 'admin_registered'
  
  -- Status tracking
  status VARCHAR DEFAULT 'pending',
  -- 'pending', 'under_review', 'approved', 'rejected', 'waitlisted'
  
  -- Eligibility assessment
  meets_criteria BOOLEAN DEFAULT FALSE,
  criteria_notes TEXT,
  
  -- Farmer's proposed details
  proposed_quantity_kg DECIMAL,
  proposed_delivery_date DATE,
  farmer_notes TEXT,
  
  -- Review process
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  rejection_reason TEXT,
  
  -- Approval
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  -- Documents
  supporting_documents TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure a farmer can only register once per contract
  UNIQUE(contract_id, farmer_id)
);

-- Contract eligibility criteria
CREATE TABLE IF NOT EXISTS contract_eligibility_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  
  -- Criteria type
  criteria_type VARCHAR NOT NULL,
  -- 'min_farm_size', 'crop_experience', 'location', 'certification', 'credit_score', 'previous_contracts'
  
  criteria_value TEXT NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contract_registrations_contract ON contract_registrations(contract_id);
CREATE INDEX idx_contract_registrations_farmer ON contract_registrations(farmer_id);
CREATE INDEX idx_contract_registrations_status ON contract_registrations(status);
CREATE INDEX idx_contract_eligibility_contract ON contract_eligibility_criteria(contract_id);

-- Triggers
CREATE TRIGGER update_contract_registrations_updated_at
  BEFORE UPDATE ON contract_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate registration number
CREATE OR REPLACE FUNCTION generate_registration_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.registration_number := 'REG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('registration_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS registration_number_seq START 1;

CREATE TRIGGER set_registration_number
  BEFORE INSERT ON contract_registrations
  FOR EACH ROW
  WHEN (NEW.registration_number IS NULL)
  EXECUTE FUNCTION generate_registration_number();

-- RLS Policies
ALTER TABLE contract_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_eligibility_criteria ENABLE ROW LEVEL SECURITY;

-- Removed farmers.user_id references as farmers don't have user accounts

-- Super admins can do everything
CREATE POLICY contract_registrations_super_admin_all ON contract_registrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  );

CREATE POLICY contract_eligibility_super_admin_all ON contract_eligibility_criteria
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  );

-- Admins can view and manage registrations in their organization
CREATE POLICY contract_registrations_admin_view ON contract_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
      AND EXISTS (
        SELECT 1 FROM contracts 
        WHERE contracts.id = contract_registrations.contract_id 
        AND contracts.organization_id = users.organization_id
      )
    )
  );

CREATE POLICY contract_registrations_admin_update ON contract_registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
      AND EXISTS (
        SELECT 1 FROM contracts 
        WHERE contracts.id = contract_registrations.contract_id 
        AND contracts.organization_id = users.organization_id
      )
    )
  );

-- Field agents can view all registrations and create them
CREATE POLICY contract_registrations_agent_view ON contract_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'field_agent'
    )
  );

CREATE POLICY contract_registrations_agent_create ON contract_registrations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'field_agent'
    )
  );

-- Everyone can view eligibility criteria for active contracts
CREATE POLICY contract_eligibility_view_all ON contract_eligibility_criteria
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contracts 
      WHERE contracts.id = contract_eligibility_criteria.contract_id 
      AND contracts.status IN ('active', 'pending_approval')
    )
  );
