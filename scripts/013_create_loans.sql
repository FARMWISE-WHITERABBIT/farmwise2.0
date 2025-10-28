-- =====================================================
-- LOAN MANAGEMENT SYSTEM
-- =====================================================

-- Loan products/schemes
CREATE TABLE IF NOT EXISTS loan_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  
  product_name VARCHAR NOT NULL,
  product_code VARCHAR UNIQUE NOT NULL,
  description TEXT,
  
  -- Loan terms
  min_amount DECIMAL NOT NULL,
  max_amount DECIMAL NOT NULL,
  interest_rate DECIMAL NOT NULL, -- Annual percentage rate
  duration_months INTEGER NOT NULL,
  grace_period_months INTEGER DEFAULT 0,
  
  -- Eligibility
  min_farm_size_hectares DECIMAL,
  eligible_crops TEXT[],
  min_farming_experience_years INTEGER,
  requires_collateral BOOLEAN DEFAULT FALSE,
  requires_guarantor BOOLEAN DEFAULT TRUE,
  
  -- Fees
  processing_fee_percentage DECIMAL DEFAULT 0,
  insurance_fee_percentage DECIMAL DEFAULT 0,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loan applications
CREATE TABLE IF NOT EXISTS loan_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_number VARCHAR UNIQUE NOT NULL,
  
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  loan_product_id UUID REFERENCES loan_products(id),
  organization_id UUID REFERENCES organizations(id),
  
  -- Loan details
  requested_amount DECIMAL NOT NULL,
  approved_amount DECIMAL,
  purpose TEXT NOT NULL,
  repayment_plan VARCHAR, -- 'monthly', 'quarterly', 'harvest_based'
  
  -- Application status
  status VARCHAR DEFAULT 'pending',
  -- 'pending', 'under_review', 'approved', 'rejected', 'disbursed', 'completed', 'defaulted'
  
  -- Review process
  submitted_date DATE DEFAULT CURRENT_DATE,
  reviewed_by UUID REFERENCES users(id),
  reviewed_date DATE,
  review_notes TEXT,
  rejection_reason TEXT,
  
  -- Approval
  approved_by UUID REFERENCES users(id),
  approved_date DATE,
  approval_notes TEXT,
  
  -- Disbursement
  disbursed_by UUID REFERENCES users(id),
  disbursement_date DATE,
  disbursement_method VARCHAR, -- 'bank_transfer', 'mobile_money', 'cash', 'in_kind'
  disbursement_reference VARCHAR,
  
  -- Guarantor information
  guarantor_name VARCHAR,
  guarantor_phone VARCHAR,
  guarantor_relationship VARCHAR,
  guarantor_address TEXT,
  
  -- Collateral
  collateral_type VARCHAR,
  collateral_description TEXT,
  collateral_value DECIMAL,
  
  -- Documents
  documents JSONB, -- Array of document URLs
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loan repayments
CREATE TABLE IF NOT EXISTS loan_repayments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_application_id UUID REFERENCES loan_applications(id) ON DELETE CASCADE,
  
  -- Payment details
  payment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  due_amount DECIMAL NOT NULL,
  
  paid_amount DECIMAL DEFAULT 0,
  paid_date DATE,
  payment_method VARCHAR,
  payment_reference VARCHAR,
  
  -- Status
  status VARCHAR DEFAULT 'pending', -- 'pending', 'paid', 'partial', 'overdue', 'waived'
  days_overdue INTEGER DEFAULT 0,
  penalty_amount DECIMAL DEFAULT 0,
  
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loan history/audit trail
CREATE TABLE IF NOT EXISTS loan_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_application_id UUID REFERENCES loan_applications(id) ON DELETE CASCADE,
  
  action VARCHAR NOT NULL, -- 'submitted', 'reviewed', 'approved', 'rejected', 'disbursed', 'payment_made'
  action_by UUID REFERENCES users(id),
  action_date TIMESTAMPTZ DEFAULT NOW(),
  
  previous_status VARCHAR,
  new_status VARCHAR,
  
  notes TEXT,
  metadata JSONB
);

-- Indexes
CREATE INDEX idx_loan_applications_farmer ON loan_applications(farmer_id);
CREATE INDEX idx_loan_applications_status ON loan_applications(status);
CREATE INDEX idx_loan_applications_org ON loan_applications(organization_id);
CREATE INDEX idx_loan_repayments_loan ON loan_repayments(loan_application_id);
CREATE INDEX idx_loan_repayments_status ON loan_repayments(status);

-- Triggers
CREATE TRIGGER update_loan_products_updated_at
  BEFORE UPDATE ON loan_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loan_applications_updated_at
  BEFORE UPDATE ON loan_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate application number
CREATE OR REPLACE FUNCTION generate_loan_application_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.application_number := 'LOAN-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('loan_application_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS loan_application_seq START 1;

CREATE TRIGGER set_loan_application_number
  BEFORE INSERT ON loan_applications
  FOR EACH ROW
  WHEN (NEW.application_number IS NULL)
  EXECUTE FUNCTION generate_loan_application_number();
