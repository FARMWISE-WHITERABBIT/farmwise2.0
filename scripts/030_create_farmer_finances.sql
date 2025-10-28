-- =====================================================
-- FARMER FINANCIAL TRACKING SYSTEM
-- =====================================================

-- Farmer Income Records
CREATE TABLE IF NOT EXISTS farmer_income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  
  -- Income details
  income_type VARCHAR NOT NULL, -- 'crop_sale', 'livestock_sale', 'off_farm_income', 'government_subsidy', 'loan_disbursement', 'other'
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR DEFAULT 'NGN',
  
  -- Transaction details
  transaction_date DATE NOT NULL,
  payment_method VARCHAR, -- 'cash', 'bank_transfer', 'mobile_money', 'check'
  payment_reference VARCHAR,
  
  -- Source information
  source_name VARCHAR, -- Buyer name, employer, etc.
  source_contact VARCHAR,
  
  -- Crop-specific (if applicable)
  crop_type VARCHAR,
  quantity_sold DECIMAL,
  unit_of_measure VARCHAR,
  price_per_unit DECIMAL,
  
  -- Documentation
  receipt_url TEXT,
  supporting_documents TEXT[],
  
  -- Metadata
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farmer Expense Records
CREATE TABLE IF NOT EXISTS farmer_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  
  -- Expense details
  expense_type VARCHAR NOT NULL, -- 'seeds', 'fertilizer', 'pesticides', 'labor', 'equipment', 'transport', 'storage', 'land_rent', 'water', 'other'
  expense_category VARCHAR, -- 'input', 'operational', 'capital', 'overhead'
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR DEFAULT 'NGN',
  
  -- Transaction details
  transaction_date DATE NOT NULL,
  payment_method VARCHAR, -- 'cash', 'bank_transfer', 'mobile_money', 'credit', 'voucher'
  payment_reference VARCHAR,
  
  -- Vendor information
  vendor_name VARCHAR,
  vendor_contact VARCHAR,
  
  -- Item details
  item_description TEXT,
  quantity DECIMAL,
  unit_of_measure VARCHAR,
  unit_price DECIMAL,
  
  -- Farm activity link
  related_activity_id UUID REFERENCES farm_activities(id),
  related_plot_id UUID REFERENCES farm_plots(id),
  
  -- Documentation
  receipt_url TEXT,
  supporting_documents TEXT[],
  
  -- Metadata
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farmer Loan Tracking (simplified view of loan_applications)
CREATE TABLE IF NOT EXISTS farmer_loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  loan_application_id UUID REFERENCES loan_applications(id),
  
  -- Loan details
  loan_number VARCHAR UNIQUE,
  loan_type VARCHAR, -- 'input', 'equipment', 'working_capital', 'emergency'
  principal_amount DECIMAL(15, 2) NOT NULL,
  interest_rate DECIMAL(5, 2),
  total_amount_due DECIMAL(15, 2),
  
  -- Dates
  disbursement_date DATE,
  due_date DATE,
  
  -- Repayment tracking
  amount_paid DECIMAL(15, 2) DEFAULT 0,
  amount_outstanding DECIMAL(15, 2),
  
  -- Status
  status VARCHAR DEFAULT 'active', -- 'active', 'paid', 'overdue', 'defaulted', 'restructured'
  days_overdue INTEGER DEFAULT 0,
  
  -- Source
  lender_name VARCHAR,
  lender_type VARCHAR, -- 'bank', 'microfinance', 'cooperative', 'government', 'private'
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Score Calculation Factors
CREATE TABLE IF NOT EXISTS farmer_credit_factors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  
  -- Financial factors (0-100 each)
  repayment_history_score INTEGER DEFAULT 0, -- Based on loan repayment track record
  income_stability_score INTEGER DEFAULT 0, -- Based on consistent income over time
  debt_to_income_ratio_score INTEGER DEFAULT 0, -- Based on outstanding debt vs income
  savings_score INTEGER DEFAULT 0, -- Based on positive cash flow
  
  -- Farming factors (0-100 each)
  farm_productivity_score INTEGER DEFAULT 0, -- Based on yield per hectare
  crop_diversification_score INTEGER DEFAULT 0, -- Based on number of crops
  land_ownership_score INTEGER DEFAULT 0, -- Owned land scores higher
  farming_experience_score INTEGER DEFAULT 0, -- Years of experience
  
  -- Behavioral factors (0-100 each)
  record_keeping_score INTEGER DEFAULT 0, -- Based on activity logging frequency
  training_participation_score INTEGER DEFAULT 0, -- Based on training attendance
  group_membership_score INTEGER DEFAULT 0, -- Cooperative membership
  market_linkage_score INTEGER DEFAULT 0, -- Based on contract farming participation
  
  -- Overall credit score (0-1000)
  total_credit_score INTEGER DEFAULT 0,
  credit_rating VARCHAR, -- 'Excellent', 'Good', 'Fair', 'Poor', 'No Rating'
  
  -- Calculation metadata
  last_calculated_at TIMESTAMPTZ,
  calculation_version VARCHAR DEFAULT 'v1.0',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial Summary View (for quick access)
CREATE OR REPLACE VIEW farmer_financial_summary AS
SELECT 
  f.id AS farmer_id,
  f.farmer_id AS farmer_code,
  f.first_name || ' ' || f.last_name AS farmer_name,
  
  -- Income summary
  COALESCE(SUM(fi.amount), 0) AS total_income,
  COALESCE(SUM(CASE WHEN fi.transaction_date >= CURRENT_DATE - INTERVAL '30 days' THEN fi.amount ELSE 0 END), 0) AS income_last_30_days,
  COALESCE(SUM(CASE WHEN fi.transaction_date >= CURRENT_DATE - INTERVAL '90 days' THEN fi.amount ELSE 0 END), 0) AS income_last_90_days,
  
  -- Expense summary
  COALESCE(SUM(fe.amount), 0) AS total_expenses,
  COALESCE(SUM(CASE WHEN fe.transaction_date >= CURRENT_DATE - INTERVAL '30 days' THEN fe.amount ELSE 0 END), 0) AS expenses_last_30_days,
  COALESCE(SUM(CASE WHEN fe.transaction_date >= CURRENT_DATE - INTERVAL '90 days' THEN fe.amount ELSE 0 END), 0) AS expenses_last_90_days,
  
  -- Net position
  COALESCE(SUM(fi.amount), 0) - COALESCE(SUM(fe.amount), 0) AS net_position,
  
  -- Loan summary
  COALESCE(SUM(fl.principal_amount), 0) AS total_loans_taken,
  COALESCE(SUM(fl.amount_outstanding), 0) AS total_outstanding_debt,
  COUNT(DISTINCT fl.id) FILTER (WHERE fl.status = 'active') AS active_loans_count,
  
  -- Credit score
  fcf.total_credit_score,
  fcf.credit_rating
  
FROM farmers f
LEFT JOIN farmer_income fi ON f.id = fi.farmer_id
LEFT JOIN farmer_expenses fe ON f.id = fe.farmer_id
LEFT JOIN farmer_loans fl ON f.id = fl.farmer_id
LEFT JOIN farmer_credit_factors fcf ON f.id = fcf.farmer_id
GROUP BY f.id, f.farmer_id, f.first_name, f.last_name, fcf.total_credit_score, fcf.credit_rating;

-- Indexes for performance
CREATE INDEX idx_farmer_income_farmer ON farmer_income(farmer_id);
CREATE INDEX idx_farmer_income_date ON farmer_income(transaction_date);
CREATE INDEX idx_farmer_income_type ON farmer_income(income_type);

CREATE INDEX idx_farmer_expenses_farmer ON farmer_expenses(farmer_id);
CREATE INDEX idx_farmer_expenses_date ON farmer_expenses(transaction_date);
CREATE INDEX idx_farmer_expenses_type ON farmer_expenses(expense_type);

CREATE INDEX idx_farmer_loans_farmer ON farmer_loans(farmer_id);
CREATE INDEX idx_farmer_loans_status ON farmer_loans(status);

CREATE INDEX idx_farmer_credit_factors_farmer ON farmer_credit_factors(farmer_id);
CREATE INDEX idx_farmer_credit_factors_score ON farmer_credit_factors(total_credit_score);

-- Triggers
CREATE TRIGGER update_farmer_income_updated_at
  BEFORE UPDATE ON farmer_income
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farmer_expenses_updated_at
  BEFORE UPDATE ON farmer_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farmer_loans_updated_at
  BEFORE UPDATE ON farmer_loans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farmer_credit_factors_updated_at
  BEFORE UPDATE ON farmer_credit_factors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
