-- Create livestock table for detailed livestock tracking
CREATE TABLE IF NOT EXISTS livestock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Livestock identification
  livestock_type VARCHAR(100) NOT NULL, -- cattle, poultry, goats, sheep, pigs, rabbits, fish, etc.
  breed VARCHAR(200),
  tag_number VARCHAR(100), -- Unique identifier for the animal/group
  
  -- Quantity and demographics
  quantity INTEGER NOT NULL DEFAULT 1,
  age_months INTEGER,
  gender VARCHAR(20), -- male, female, mixed (for groups)
  
  -- Health and status
  health_status VARCHAR(50) DEFAULT 'healthy', -- healthy, sick, under_treatment, quarantined
  vaccination_status VARCHAR(50) DEFAULT 'not_vaccinated', -- vaccinated, not_vaccinated, partial
  last_vaccination_date DATE,
  next_vaccination_due DATE,
  
  -- Production data
  purpose VARCHAR(100), -- meat, dairy, eggs, breeding, draft, mixed
  production_status VARCHAR(50), -- producing, not_producing, growing
  average_daily_production DECIMAL(10, 2), -- milk in liters, eggs in count, etc.
  production_unit VARCHAR(50), -- liters, eggs, kg, etc.
  
  -- Breeding information
  breeding_status VARCHAR(50), -- breeding, pregnant, lactating, not_breeding
  last_breeding_date DATE,
  expected_delivery_date DATE,
  offspring_count INTEGER DEFAULT 0,
  
  -- Financial data
  acquisition_date DATE,
  acquisition_cost DECIMAL(12, 2),
  current_market_value DECIMAL(12, 2),
  
  -- Location and housing
  housing_type VARCHAR(100), -- barn, coop, pen, pasture, pond, cage
  location_description TEXT,
  plot_id UUID REFERENCES farm_plots(id) ON DELETE SET NULL,
  
  -- Feed and care
  feed_type VARCHAR(200),
  daily_feed_cost DECIMAL(10, 2),
  water_source VARCHAR(100),
  
  -- Notes and documentation
  notes TEXT,
  medical_history JSONB DEFAULT '[]'::jsonb,
  production_records JSONB DEFAULT '[]'::jsonb,
  photos TEXT[], -- Array of photo URLs
  documents TEXT[], -- Array of document URLs
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT positive_age CHECK (age_months IS NULL OR age_months >= 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_livestock_farmer ON livestock(farmer_id);
CREATE INDEX IF NOT EXISTS idx_livestock_organization ON livestock(organization_id);
CREATE INDEX IF NOT EXISTS idx_livestock_type ON livestock(livestock_type);
CREATE INDEX IF NOT EXISTS idx_livestock_health_status ON livestock(health_status);
CREATE INDEX IF NOT EXISTS idx_livestock_plot ON livestock(plot_id);

-- Create livestock_transactions table for tracking sales, purchases, deaths, etc.
CREATE TABLE IF NOT EXISTS livestock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  livestock_id UUID NOT NULL REFERENCES livestock(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  transaction_type VARCHAR(50) NOT NULL, -- purchase, sale, death, slaughter, gift, transfer, birth
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12, 2),
  total_amount DECIMAL(12, 2),
  
  buyer_seller_name VARCHAR(200),
  buyer_seller_contact VARCHAR(50),
  
  reason TEXT, -- For deaths, transfers, etc.
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_livestock_transactions_livestock ON livestock_transactions(livestock_id);
CREATE INDEX IF NOT EXISTS idx_livestock_transactions_farmer ON livestock_transactions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_livestock_transactions_date ON livestock_transactions(transaction_date);

-- Enable Row Level Security
ALTER TABLE livestock ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestock_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for livestock
CREATE POLICY "Users can view livestock in their organization"
  ON livestock FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Users can insert livestock in their organization"
  ON livestock FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update livestock in their organization"
  ON livestock FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete livestock in their organization"
  ON livestock FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for livestock_transactions
CREATE POLICY "Users can view livestock transactions in their organization"
  ON livestock_transactions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Users can insert livestock transactions in their organization"
  ON livestock_transactions FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );
