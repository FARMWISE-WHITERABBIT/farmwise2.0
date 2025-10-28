-- =====================================================
-- CONTRACT MANAGEMENT SYSTEM
-- =====================================================

-- Contracts (offtake agreements, supply contracts)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_number VARCHAR UNIQUE NOT NULL,
  
  -- Parties
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  buyer_organization_id UUID REFERENCES organizations(id),
  organization_id UUID REFERENCES organizations(id), -- Managing organization
  
  -- Contract details
  contract_type VARCHAR NOT NULL, -- 'offtake', 'supply', 'service', 'lease'
  title VARCHAR NOT NULL,
  description TEXT,
  
  -- Product/service
  crop_type VARCHAR,
  variety VARCHAR,
  quantity_kg DECIMAL,
  unit_of_measure VARCHAR DEFAULT 'kg',
  quality_specifications TEXT,
  
  -- Financial terms
  price_per_unit DECIMAL NOT NULL,
  total_contract_value DECIMAL NOT NULL,
  currency VARCHAR DEFAULT 'NGN',
  payment_terms TEXT,
  advance_payment_percentage DECIMAL DEFAULT 0,
  
  -- Timeline
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  delivery_date DATE,
  
  -- Status
  status VARCHAR DEFAULT 'draft',
  -- 'draft', 'pending_approval', 'active', 'fulfilled', 'breached', 'terminated', 'expired'
  
  -- Approval workflow
  created_by UUID REFERENCES users(id),
  approved_by_farmer BOOLEAN DEFAULT FALSE,
  farmer_approval_date DATE,
  approved_by_buyer BOOLEAN DEFAULT FALSE,
  buyer_approval_date DATE,
  
  -- Fulfillment tracking
  quantity_delivered_kg DECIMAL DEFAULT 0,
  amount_paid DECIMAL DEFAULT 0,
  fulfillment_percentage DECIMAL DEFAULT 0,
  
  -- Terms and conditions
  terms_and_conditions TEXT,
  penalties_for_breach TEXT,
  dispute_resolution TEXT,
  
  -- Documents
  contract_document_url TEXT,
  supporting_documents TEXT[],
  
  -- Signatures (digital)
  farmer_signature_url TEXT,
  farmer_signed_date DATE,
  buyer_signature_url TEXT,
  buyer_signed_date DATE,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract deliveries/milestones
CREATE TABLE IF NOT EXISTS contract_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  
  delivery_number INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  actual_date DATE,
  
  quantity_kg DECIMAL NOT NULL,
  delivered_quantity_kg DECIMAL DEFAULT 0,
  
  payment_amount DECIMAL NOT NULL,
  paid_amount DECIMAL DEFAULT 0,
  payment_date DATE,
  payment_reference VARCHAR,
  
  status VARCHAR DEFAULT 'pending', -- 'pending', 'delivered', 'paid', 'overdue'
  
  quality_check_passed BOOLEAN,
  quality_notes TEXT,
  
  notes TEXT,
  documents TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract amendments
CREATE TABLE IF NOT EXISTS contract_amendments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  
  amendment_number INTEGER NOT NULL,
  amendment_date DATE DEFAULT CURRENT_DATE,
  amended_by UUID REFERENCES users(id),
  
  amendment_type VARCHAR, -- 'price_change', 'quantity_change', 'date_extension', 'terms_update'
  description TEXT NOT NULL,
  
  previous_value TEXT,
  new_value TEXT,
  
  reason TEXT,
  
  approved_by_farmer BOOLEAN DEFAULT FALSE,
  approved_by_buyer BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract disputes
CREATE TABLE IF NOT EXISTS contract_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  
  raised_by UUID REFERENCES users(id),
  raised_date DATE DEFAULT CURRENT_DATE,
  
  dispute_type VARCHAR, -- 'quality', 'quantity', 'payment', 'delivery_delay', 'breach'
  description TEXT NOT NULL,
  
  status VARCHAR DEFAULT 'open', -- 'open', 'under_review', 'resolved', 'escalated'
  
  resolution TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_date DATE,
  
  documents TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contracts_farmer ON contracts(farmer_id);
CREATE INDEX idx_contracts_buyer ON contracts(buyer_organization_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contract_deliveries_contract ON contract_deliveries(contract_id);
CREATE INDEX idx_contract_amendments_contract ON contract_amendments(contract_id);
CREATE INDEX idx_contract_disputes_contract ON contract_disputes(contract_id);

-- Triggers
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate contract number
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.contract_number := 'CNT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('contract_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS contract_number_seq START 1;

CREATE TRIGGER set_contract_number
  BEFORE INSERT ON contracts
  FOR EACH ROW
  WHEN (NEW.contract_number IS NULL)
  EXECUTE FUNCTION generate_contract_number();
