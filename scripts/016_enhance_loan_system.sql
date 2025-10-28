-- =====================================================
-- ENHANCED LOAN MANAGEMENT SYSTEM
-- Based on comprehensive spec requirements
-- =====================================================

-- Add credit scoring fields to farmers table
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS credit_score INTEGER DEFAULT 0;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS credit_rating VARCHAR DEFAULT 'unrated';
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS last_credit_assessment_date DATE;

-- Farmer credit history table
CREATE TABLE IF NOT EXISTS farmer_credit_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  
  -- Historical data
  total_loans_taken INTEGER DEFAULT 0,
  total_amount_borrowed DECIMAL DEFAULT 0,
  total_amount_repaid DECIMAL DEFAULT 0,
  on_time_payments INTEGER DEFAULT 0,
  late_payments INTEGER DEFAULT 0,
  defaults INTEGER DEFAULT 0,
  
  -- Current status
  active_loans INTEGER DEFAULT 0,
  total_outstanding DECIMAL DEFAULT 0,
  
  -- Performance metrics
  repayment_rate DECIMAL DEFAULT 0, -- Percentage
  average_days_to_repay DECIMAL DEFAULT 0,
  longest_delay_days INTEGER DEFAULT 0,
  
  -- Income data
  average_seasonal_income DECIMAL,
  last_harvest_value DECIMAL,
  off_farm_income DECIMAL,
  
  -- Risk indicators
  weather_impact_score INTEGER DEFAULT 0, -- 0-100
  pest_disease_history_score INTEGER DEFAULT 0, -- 0-100
  market_access_score INTEGER DEFAULT 0, -- 0-100
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Harvest-linked repayment schedules
CREATE TABLE IF NOT EXISTS harvest_linked_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_application_id UUID REFERENCES loan_applications(id) ON DELETE CASCADE,
  
  crop_type VARCHAR NOT NULL,
  expected_harvest_date DATE NOT NULL,
  expected_yield_kg DECIMAL,
  expected_price_per_kg DECIMAL,
  expected_revenue DECIMAL,
  
  repayment_percentage DECIMAL NOT NULL, -- % of harvest revenue for repayment
  minimum_payment DECIMAL,
  
  actual_harvest_date DATE,
  actual_yield_kg DECIMAL,
  actual_price_per_kg DECIMAL,
  actual_revenue DECIMAL,
  
  status VARCHAR DEFAULT 'pending', -- 'pending', 'harvested', 'sold', 'paid'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Produce-backed loans (linked to contracts)
CREATE TABLE IF NOT EXISTS produce_backed_loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_application_id UUID REFERENCES loan_applications(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id),
  
  committed_quantity_kg DECIMAL NOT NULL,
  committed_crop VARCHAR NOT NULL,
  buyer_name VARCHAR NOT NULL,
  buyer_contact VARCHAR,
  
  advance_percentage DECIMAL NOT NULL, -- % of expected value advanced as loan
  expected_produce_value DECIMAL NOT NULL,
  loan_amount DECIMAL NOT NULL,
  
  delivery_date DATE NOT NULL,
  quality_standards TEXT,
  
  -- Repayment tracking
  produce_delivered_kg DECIMAL DEFAULT 0,
  produce_value_realized DECIMAL DEFAULT 0,
  repayment_deducted DECIMAL DEFAULT 0,
  
  status VARCHAR DEFAULT 'active', -- 'active', 'delivered', 'completed', 'defaulted'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Input-specific financing (voucher-based)
CREATE TABLE IF NOT EXISTS input_financing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_application_id UUID REFERENCES loan_applications(id) ON DELETE CASCADE,
  
  input_type VARCHAR NOT NULL, -- 'seeds', 'fertilizer', 'pesticides', 'equipment'
  supplier_name VARCHAR NOT NULL,
  supplier_contact VARCHAR,
  
  voucher_code VARCHAR UNIQUE NOT NULL,
  voucher_value DECIMAL NOT NULL,
  
  -- Redemption
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_date DATE,
  redeemed_amount DECIMAL,
  items_purchased JSONB, -- Array of items with quantities
  
  expiry_date DATE NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loan product enhancements
ALTER TABLE loan_products ADD COLUMN IF NOT EXISTS repayment_type VARCHAR DEFAULT 'monthly';
-- 'monthly', 'quarterly', 'harvest_based', 'produce_backed', 'flexible'

ALTER TABLE loan_products ADD COLUMN IF NOT EXISTS allows_input_financing BOOLEAN DEFAULT FALSE;
ALTER TABLE loan_products ADD COLUMN IF NOT EXISTS allows_produce_backing BOOLEAN DEFAULT FALSE;
ALTER TABLE loan_products ADD COLUMN IF NOT EXISTS target_crops TEXT[];

-- Loan application enhancements
ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS credit_score_at_application INTEGER;
ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS farm_size_hectares DECIMAL;
ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS expected_yield_kg DECIMAL;
ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS expected_revenue DECIMAL;
ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS loan_type VARCHAR DEFAULT 'standard';
-- 'standard', 'harvest_linked', 'produce_backed', 'input_financing', 'equipment'

ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS linked_contract_id UUID REFERENCES contracts(id);
ALTER TABLE loan_applications ADD COLUMN IF NOT EXISTS input_vouchers_issued BOOLEAN DEFAULT FALSE;

-- Financial institution partners
CREATE TABLE IF NOT EXISTS financial_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  
  partner_name VARCHAR NOT NULL,
  partner_type VARCHAR NOT NULL, -- 'bank', 'microfinance', 'cooperative', 'digital_lender'
  contact_person VARCHAR,
  contact_email VARCHAR,
  contact_phone VARCHAR,
  
  -- Integration
  api_endpoint VARCHAR,
  api_key_encrypted TEXT,
  integration_status VARCHAR DEFAULT 'manual', -- 'manual', 'api', 'hybrid'
  
  -- Terms
  min_loan_amount DECIMAL,
  max_loan_amount DECIMAL,
  interest_rate_range VARCHAR,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_farmer_credit_history_farmer ON farmer_credit_history(farmer_id);
CREATE INDEX idx_harvest_schedules_loan ON harvest_linked_schedules(loan_application_id);
CREATE INDEX idx_produce_backed_loans_loan ON produce_backed_loans(loan_application_id);
CREATE INDEX idx_produce_backed_loans_contract ON produce_backed_loans(contract_id);
CREATE INDEX idx_input_financing_loan ON input_financing(loan_application_id);
CREATE INDEX idx_input_financing_voucher ON input_financing(voucher_code);

-- Function to calculate credit score
CREATE OR REPLACE FUNCTION calculate_farmer_credit_score(p_farmer_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 500; -- Base score
  v_history RECORD;
BEGIN
  -- Get credit history
  SELECT * INTO v_history FROM farmer_credit_history WHERE farmer_id = p_farmer_id;
  
  IF v_history IS NULL THEN
    RETURN v_score; -- Return base score if no history
  END IF;
  
  -- Repayment rate (max +200 points)
  v_score := v_score + (v_history.repayment_rate * 2)::INTEGER;
  
  -- On-time payments (max +100 points)
  IF v_history.total_loans_taken > 0 THEN
    v_score := v_score + ((v_history.on_time_payments::DECIMAL / v_history.total_loans_taken) * 100)::INTEGER;
  END IF;
  
  -- Defaults penalty (max -200 points)
  v_score := v_score - (v_history.defaults * 50);
  
  -- Late payments penalty (max -100 points)
  v_score := v_score - (v_history.late_payments * 10);
  
  -- Income stability bonus (max +100 points)
  IF v_history.average_seasonal_income > 0 THEN
    v_score := v_score + LEAST(100, (v_history.average_seasonal_income / 10000)::INTEGER);
  END IF;
  
  -- Risk factors penalty (max -150 points)
  v_score := v_score - ((100 - v_history.weather_impact_score) / 2)::INTEGER;
  v_score := v_score - ((100 - v_history.pest_disease_history_score) / 2)::INTEGER;
  v_score := v_score - ((100 - v_history.market_access_score) / 2)::INTEGER;
  
  -- Ensure score is within 300-850 range
  v_score := GREATEST(300, LEAST(850, v_score));
  
  -- Update farmer's credit score
  UPDATE farmers 
  SET credit_score = v_score,
      credit_rating = CASE
        WHEN v_score >= 750 THEN 'excellent'
        WHEN v_score >= 650 THEN 'good'
        WHEN v_score >= 550 THEN 'fair'
        WHEN v_score >= 450 THEN 'poor'
        ELSE 'very_poor'
      END,
      last_credit_assessment_date = CURRENT_DATE
  WHERE id = p_farmer_id;
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Function to generate voucher code
CREATE OR REPLACE FUNCTION generate_voucher_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.voucher_code := 'VCH-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_voucher_code
  BEFORE INSERT ON input_financing
  FOR EACH ROW
  WHEN (NEW.voucher_code IS NULL)
  EXECUTE FUNCTION generate_voucher_code();

-- Triggers for updated_at
CREATE TRIGGER update_harvest_schedules_updated_at
  BEFORE UPDATE ON harvest_linked_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produce_backed_loans_updated_at
  BEFORE UPDATE ON produce_backed_loans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_partners_updated_at
  BEFORE UPDATE ON financial_partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
