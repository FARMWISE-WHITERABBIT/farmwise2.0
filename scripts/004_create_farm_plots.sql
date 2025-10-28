-- =====================================================
-- FARM PLOTS & GPS MAPPING
-- =====================================================

-- Farm plots with detailed boundaries
CREATE TABLE IF NOT EXISTS farm_plots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  plot_name VARCHAR NOT NULL,
  plot_code VARCHAR UNIQUE, -- e.g., "PLT-FW-001"
  size_hectares DECIMAL(10,4) NOT NULL,
  size_acres DECIMAL(10,4),
  boundaries GEOGRAPHY(POLYGON, 4326), -- PostGIS for spatial data
  boundary_coordinates JSONB, -- GeoJSON format for frontend
  center_point GEOGRAPHY(POINT, 4326),
  elevation_meters DECIMAL,
  soil_type VARCHAR,
  soil_ph DECIMAL(3,1),
  irrigation_type VARCHAR, -- 'drip', 'sprinkler', 'rain-fed', etc.
  irrigation_coverage_percent DECIMAL(5,2),
  slope_degree DECIMAL(4,2),
  current_crop VARCHAR,
  planting_date DATE,
  expected_harvest_date DATE,
  crop_health_status VARCHAR DEFAULT 'healthy', -- 'healthy', 'attention', 'critical'
  last_inspection_date DATE,
  satellite_image_url TEXT,
  notes TEXT,
  status VARCHAR DEFAULT 'active',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for spatial queries
CREATE INDEX idx_farm_plots_boundaries ON farm_plots USING GIST(boundaries);
CREATE INDEX idx_farm_plots_center ON farm_plots USING GIST(center_point);
CREATE INDEX idx_farm_plots_farmer ON farm_plots(farmer_id);

-- Crop health monitoring zones within plots
CREATE TABLE IF NOT EXISTS plot_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plot_id UUID REFERENCES farm_plots(id) ON DELETE CASCADE,
  zone_name VARCHAR,
  zone_boundaries GEOGRAPHY(POLYGON, 4326),
  health_status VARCHAR,
  ndvi_value DECIMAL(5,4), -- Normalized Difference Vegetation Index
  soil_moisture_percent DECIMAL(5,2),
  temperature_celsius DECIMAL(5,2),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Apply trigger to farm_plots
CREATE TRIGGER update_farm_plots_updated_at
  BEFORE UPDATE ON farm_plots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
