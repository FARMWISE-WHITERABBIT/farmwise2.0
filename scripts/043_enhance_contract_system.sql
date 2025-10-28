-- Enhance the contract management system with additional tables and features

-- Contract templates table
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  template_name VARCHAR(255) NOT NULL,
  template_type VARCHAR(100) NOT NULL, -- 'purchase_agreement', 'supply_agreement', 'offtake_agreement', 'forward_contract'
  description TEXT,
  crop_type VARCHAR(100),
  default_terms_and_conditions TEXT,
  default_payment_terms TEXT,
  default_quality_specifications TEXT,
  default_delivery_terms TEXT,
  is_active BOOLEAN DEFAULT true,
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contract approvals table (for multi-level approval workflow)
CREATE TABLE IF NOT EXISTS contract_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  approval_level INTEGER NOT NULL,
  approver_id UUID REFERENCES users(id),
  approval_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approval_date TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contract communication log
CREATE TABLE IF NOT EXISTS contract_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  communication_type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'phone', 'meeting', 'message'
  communication_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  from_user_id UUID REFERENCES users(id),
  to_party VARCHAR(255),
  subject VARCHAR(500),
  summary TEXT,
  attachments TEXT[],
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contract milestones table
CREATE TABLE IF NOT EXISTS contract_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  milestone_type VARCHAR(50) NOT NULL, -- 'delivery', 'payment', 'inspection', 'custom'
  milestone_name VARCHAR(255) NOT NULL,
  scheduled_date DATE NOT NULL,
  actual_date DATE,
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'delayed', 'cancelled'
  description TEXT,
  responsible_party VARCHAR(100), -- 'buyer', 'seller', 'both'
  completion_percentage INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contract_templates_org ON contract_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_type ON contract_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_contract_approvals_contract ON contract_approvals(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_communications_contract ON contract_communications(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_milestones_contract ON contract_milestones(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_milestones_date ON contract_milestones(scheduled_date);

-- Enable RLS
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contract_templates
CREATE POLICY "Users can view templates in their organization"
  ON contract_templates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage templates"
  ON contract_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_users
      WHERE user_id = auth.uid()
      AND organization_id = contract_templates.organization_id
      AND role IN ('super_admin', 'admin', 'manager')
    )
  );

-- RLS Policies for contract_approvals
CREATE POLICY "Users can view approvals for their contracts"
  ON contract_approvals FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM contracts
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Approvers can update their approvals"
  ON contract_approvals FOR UPDATE
  USING (approver_id = auth.uid());

-- RLS Policies for contract_communications
CREATE POLICY "Users can view communications for their contracts"
  ON contract_communications FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM contracts
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create communications"
  ON contract_communications FOR INSERT
  WITH CHECK (
    contract_id IN (
      SELECT id FROM contracts
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for contract_milestones
CREATE POLICY "Users can view milestones for their contracts"
  ON contract_milestones FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM contracts
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage milestones"
  ON contract_milestones FOR ALL
  USING (
    contract_id IN (
      SELECT id FROM contracts
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'admin', 'manager')
      )
    )
  );
