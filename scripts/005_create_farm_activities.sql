-- =====================================================
-- FARM ACTIVITIES TRACKING
-- =====================================================

-- Comprehensive farm activities tracking
CREATE TABLE IF NOT EXISTS farm_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES farmers(id),
  plot_id UUID REFERENCES farm_plots(id),
  activity_type VARCHAR NOT NULL, 
  -- 'planting', 'irrigation', 'fertilization', 'pest_control', 'weeding', 
  -- 'pruning', 'harvesting', 'soil_preparation', 'mulching'
  activity_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  status VARCHAR DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  
  -- Crop information
  crop_type VARCHAR,
  crop_variety VARCHAR,
  crop_stage VARCHAR, -- 'seedling', 'vegetative', 'flowering', 'fruiting', 'mature'
  
  -- Planting specific
  seed_quantity DECIMAL,
  seed_unit VARCHAR,
  plant_spacing_cm DECIMAL,
  row_spacing_cm DECIMAL,
  planting_method VARCHAR, -- 'direct_seeding', 'transplanting', 'broadcasting'
  
  -- Irrigation specific
  water_source VARCHAR,
  irrigation_duration_minutes INTEGER,
  water_volume_liters DECIMAL,
  irrigation_method VARCHAR, -- 'drip', 'sprinkler', 'flood', 'manual'
  
  -- Pest control specific
  pest_identified VARCHAR,
  pest_severity VARCHAR, -- 'low', 'medium', 'high', 'critical'
  pesticide_name VARCHAR,
  pesticide_dosage DECIMAL,
  pesticide_unit VARCHAR,
  application_method VARCHAR, -- 'spraying', 'dusting', 'fumigation', 'trap'
  
  -- Fertilization specific
  fertilizer_type VARCHAR, -- 'organic', 'inorganic', 'liquid', 'granular'
  fertilizer_name VARCHAR,
  fertilizer_quantity DECIMAL,
  fertilizer_unit VARCHAR,
  npk_ratio VARCHAR, -- e.g., "15-15-15"
  
  -- Harvesting specific
  quantity_harvested DECIMAL,
  harvest_unit VARCHAR, -- 'kg', 'tons', 'bags', 'crates'
  quality_grade VARCHAR, -- 'premium', 'standard', 'substandard'
  harvest_method VARCHAR, -- 'manual', 'mechanical'
  storage_location VARCHAR,
  
  -- Resources
  labor_workers INTEGER,
  labor_hours DECIMAL,
  labor_cost DECIMAL,
  equipment_used TEXT[],
  total_cost DECIMAL,
  
  -- Environmental conditions
  weather_condition VARCHAR,
  temperature_celsius DECIMAL,
  humidity_percent DECIMAL,
  rainfall_mm DECIMAL,
  
  -- Documentation
  photos TEXT[], -- Array of Supabase Storage URLs
  videos TEXT[],
  voice_notes TEXT[],
  notes TEXT,
  gps_coordinates GEOGRAPHY(POINT, 4326),
  
  -- Tracking
  recorded_by UUID REFERENCES users(id),
  verified_by UUID REFERENCES users(id),
  verification_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity inputs (detailed tracking of all inputs used)
CREATE TABLE IF NOT EXISTS activity_inputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID REFERENCES farm_activities(id) ON DELETE CASCADE,
  input_type VARCHAR NOT NULL, -- 'seed', 'fertilizer', 'pesticide', 'equipment', 'other'
  input_name VARCHAR NOT NULL,
  quantity DECIMAL NOT NULL,
  unit VARCHAR NOT NULL,
  cost_per_unit DECIMAL,
  total_cost DECIMAL,
  supplier VARCHAR,
  batch_number VARCHAR,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity schedule/reminders
CREATE TABLE IF NOT EXISTS activity_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plot_id UUID REFERENCES farm_plots(id),
  activity_type VARCHAR NOT NULL,
  scheduled_date DATE NOT NULL,
  recurrence VARCHAR, -- 'once', 'daily', 'weekly', 'monthly', 'seasonal'
  reminder_days_before INTEGER DEFAULT 1,
  assigned_to UUID REFERENCES users(id),
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_activity_id UUID REFERENCES farm_activities(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_activities_farmer ON farm_activities(farmer_id);
CREATE INDEX idx_activities_plot ON farm_activities(plot_id);
CREATE INDEX idx_activities_date ON farm_activities(activity_date);
CREATE INDEX idx_activities_type ON farm_activities(activity_type);

-- Apply trigger to farm_activities
CREATE TRIGGER update_farm_activities_updated_at
  BEFORE UPDATE ON farm_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
