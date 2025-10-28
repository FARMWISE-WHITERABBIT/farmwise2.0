-- =====================================================
-- FOOD TRACEABILITY SYSTEM
-- =====================================================

-- Harvest batches
CREATE TABLE IF NOT EXISTS harvest_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_number VARCHAR UNIQUE NOT NULL,
  qr_code VARCHAR UNIQUE NOT NULL,
  
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  farm_plot_id UUID REFERENCES farm_plots(id),
  organization_id UUID REFERENCES organizations(id),
  
  -- Product details
  crop_type VARCHAR NOT NULL,
  variety VARCHAR,
  quantity_kg DECIMAL NOT NULL,
  unit_of_measure VARCHAR DEFAULT 'kg',
  
  -- Harvest details
  harvest_date DATE NOT NULL,
  expected_shelf_life_days INTEGER,
  quality_grade VARCHAR, -- 'A', 'B', 'C'
  
  -- Certifications
  is_organic BOOLEAN DEFAULT FALSE,
  certifications TEXT[],
  
  -- Storage
  storage_location VARCHAR,
  storage_temperature_celsius DECIMAL,
  storage_conditions TEXT,
  
  -- Status
  status VARCHAR DEFAULT 'harvested',
  -- 'harvested', 'in_storage', 'in_transit', 'at_aggregator', 'at_processor', 'at_retailer', 'sold'
  
  current_location VARCHAR,
  current_handler_id UUID REFERENCES users(id),
  
  -- Metadata
  notes TEXT,
  photos TEXT[], -- Array of photo URLs
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Traceability events (blockchain-style immutable log)
CREATE TABLE IF NOT EXISTS traceability_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES harvest_batches(id) ON DELETE CASCADE,
  
  event_type VARCHAR NOT NULL,
  -- 'harvest', 'storage', 'quality_check', 'transport', 'transfer', 'processing', 'packaging', 'sale'
  
  event_date TIMESTAMPTZ DEFAULT NOW(),
  event_location VARCHAR,
  gps_coordinates GEOGRAPHY(POINT, 4326),
  
  -- Actors
  performed_by UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  
  -- Event details
  description TEXT,
  quantity_affected_kg DECIMAL,
  
  -- Quality/condition
  temperature_celsius DECIMAL,
  humidity_percentage DECIMAL,
  quality_notes TEXT,
  
  -- Transfer details (if applicable)
  transferred_from UUID REFERENCES users(id),
  transferred_to UUID REFERENCES users(id),
  transport_method VARCHAR,
  vehicle_id VARCHAR,
  
  -- Documentation
  photos TEXT[],
  documents TEXT[],
  
  -- Blockchain hash (for future blockchain integration)
  event_hash VARCHAR,
  previous_event_hash VARCHAR,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality checks
CREATE TABLE IF NOT EXISTS quality_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES harvest_batches(id) ON DELETE CASCADE,
  
  check_date DATE NOT NULL,
  checked_by UUID REFERENCES users(id),
  
  -- Quality parameters
  appearance_score INTEGER, -- 1-10
  freshness_score INTEGER, -- 1-10
  size_uniformity_score INTEGER, -- 1-10
  color_score INTEGER, -- 1-10
  overall_grade VARCHAR, -- 'A', 'B', 'C', 'Rejected'
  
  -- Measurements
  moisture_content_percentage DECIMAL,
  weight_kg DECIMAL,
  
  -- Defects
  has_defects BOOLEAN DEFAULT FALSE,
  defect_description TEXT,
  defect_percentage DECIMAL,
  
  -- Test results
  pesticide_residue_test VARCHAR, -- 'pass', 'fail', 'pending'
  microbial_test VARCHAR,
  
  notes TEXT,
  photos TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_harvest_batches_farmer ON harvest_batches(farmer_id);
CREATE INDEX idx_harvest_batches_plot ON harvest_batches(farm_plot_id);
CREATE INDEX idx_harvest_batches_status ON harvest_batches(status);
CREATE INDEX idx_harvest_batches_qr ON harvest_batches(qr_code);
CREATE INDEX idx_traceability_events_batch ON traceability_events(batch_id);
CREATE INDEX idx_traceability_events_date ON traceability_events(event_date);
CREATE INDEX idx_quality_checks_batch ON quality_checks(batch_id);

-- Triggers
CREATE TRIGGER update_harvest_batches_updated_at
  BEFORE UPDATE ON harvest_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate batch number
CREATE OR REPLACE FUNCTION generate_batch_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.batch_number := 'BATCH-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('batch_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS batch_number_seq START 1;

CREATE TRIGGER set_batch_number
  BEFORE INSERT ON harvest_batches
  FOR EACH ROW
  WHEN (NEW.batch_number IS NULL)
  EXECUTE FUNCTION generate_batch_number();

-- Function to generate QR code string
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.qr_code := 'FW-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_qr_code
  BEFORE INSERT ON harvest_batches
  FOR EACH ROW
  WHEN (NEW.qr_code IS NULL)
  EXECUTE FUNCTION generate_qr_code();
