-- =====================================================
-- FARMERS DATABASE
-- =====================================================

-- Comprehensive farmers database
CREATE TABLE IF NOT EXISTS farmers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id VARCHAR UNIQUE NOT NULL, -- "FW-ENU-2025-00001"
  organization_id UUID REFERENCES organizations(id),
  
  -- Personal information
  title VARCHAR, -- 'Mr', 'Mrs', 'Ms', 'Chief', 'Dr'
  first_name VARCHAR NOT NULL,
  middle_name VARCHAR,
  last_name VARCHAR NOT NULL,
  maiden_name VARCHAR,
  date_of_birth DATE,
  gender VARCHAR,
  marital_status VARCHAR,
  
  -- Contact information
  primary_phone VARCHAR NOT NULL,
  alternate_phone VARCHAR,
  email VARCHAR,
  whatsapp_number VARCHAR,
  
  -- Address
  residential_address TEXT,
  city_town VARCHAR,
  lga VARCHAR NOT NULL, -- Local Government Area
  state VARCHAR NOT NULL,
  country VARCHAR DEFAULT 'Nigeria',
  nearest_landmark TEXT,
  gps_coordinates GEOGRAPHY(POINT, 4326),
  
  -- Identification
  bvn VARCHAR, -- Bank Verification Number
  nin VARCHAR, -- National Identification Number
  voters_card VARCHAR,
  drivers_license VARCHAR,
  id_card_photo_url TEXT,
  
  -- Education & Background
  education_level VARCHAR,
  farming_experience_years INTEGER,
  primary_occupation VARCHAR,
  farming_as VARCHAR, -- 'primary_occupation', 'secondary_income', 'subsistence'
  
  -- Banking information
  bank_name VARCHAR,
  account_number VARCHAR,
  account_name VARCHAR,
  bank_verification_status VARCHAR DEFAULT 'pending',
  
  -- Family information
  spouse_name VARCHAR,
  spouse_phone VARCHAR,
  number_of_dependents INTEGER,
  household_size INTEGER,
  
  -- Emergency contact
  emergency_contact_name VARCHAR,
  emergency_contact_relationship VARCHAR,
  emergency_contact_phone VARCHAR,
  
  -- Group membership
  is_cooperative_member BOOLEAN DEFAULT FALSE,
  cooperative_name VARCHAR,
  cooperative_id UUID,
  member_number VARCHAR,
  leadership_position VARCHAR,
  
  -- Farm ownership
  total_farm_area_hectares DECIMAL,
  land_ownership_type VARCHAR, -- 'owned', 'leased', 'family_land', 'communal'
  land_title_available BOOLEAN DEFAULT FALSE,
  
  -- Farming details
  primary_crops TEXT[], -- Array of crops
  secondary_crops TEXT[],
  livestock_kept TEXT[],
  farming_method VARCHAR, -- 'traditional', 'improved', 'organic', 'mixed'
  irrigation_available BOOLEAN DEFAULT FALSE,
  
  -- Technology adoption
  has_smartphone BOOLEAN DEFAULT FALSE,
  internet_access VARCHAR, -- 'none', 'occasional', 'regular'
  digital_literacy VARCHAR, -- 'none', 'basic', 'intermediate', 'advanced'
  
  -- Financial profile
  estimated_annual_income DECIMAL,
  has_active_loan BOOLEAN DEFAULT FALSE,
  credit_score INTEGER,
  
  -- Profile
  profile_photo_url TEXT,
  farmer_story TEXT,
  
  -- Verification and status
  verification_status VARCHAR DEFAULT 'unverified',
  -- 'unverified', 'phone_verified', 'partially_verified', 'fully_verified'
  verification_date DATE,
  verified_by UUID REFERENCES users(id),
  
  account_status VARCHAR DEFAULT 'active', -- 'active', 'inactive', 'suspended', 'deceased'
  last_activity_date DATE,
  activity_score INTEGER, -- 0-100 based on engagement
  
  -- Registration details
  registration_date DATE DEFAULT CURRENT_DATE,
  registration_source VARCHAR, -- 'field_agent', 'self_registration', 'government', 'cooperative'
  registered_by UUID REFERENCES users(id),
  registration_location VARCHAR,
  
  -- Preferences
  preferred_language VARCHAR DEFAULT 'English',
  preferred_contact_method VARCHAR, -- 'phone', 'sms', 'whatsapp', 'email'
  sms_notifications_enabled BOOLEAN DEFAULT TRUE,
  
  -- Additional data
  notes TEXT,
  tags TEXT[],
  custom_fields JSONB, -- For organization-specific fields
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Family members/dependents
CREATE TABLE IF NOT EXISTS farmer_family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  full_name VARCHAR NOT NULL,
  relationship VARCHAR, -- 'spouse', 'child', 'parent', 'sibling', 'other'
  date_of_birth DATE,
  gender VARCHAR,
  phone_number VARCHAR,
  is_involved_in_farming BOOLEAN DEFAULT FALSE,
  is_emergency_contact BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farmer groups/cooperatives
CREATE TABLE IF NOT EXISTS cooperatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cooperative_name VARCHAR NOT NULL,
  registration_number VARCHAR,
  registration_date DATE,
  state VARCHAR,
  lga VARCHAR,
  address TEXT,
  contact_person VARCHAR,
  contact_phone VARCHAR,
  total_members INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification logs
CREATE TABLE IF NOT EXISTS farmer_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  verification_type VARCHAR NOT NULL, -- 'bvn', 'nin', 'phone', 'bank', 'physical_visit'
  verification_status VARCHAR, -- 'pending', 'verified', 'failed'
  verification_date DATE,
  verified_by UUID REFERENCES users(id),
  verification_notes TEXT,
  verification_documents TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity tracking
CREATE TABLE IF NOT EXISTS farmer_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  activity_type VARCHAR, -- 'registration', 'profile_update', 'plot_added', 'activity_logged', 'loan_applied', 'harvest_recorded', 'login'
  activity_description TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for farmers
CREATE INDEX idx_farmers_organization ON farmers(organization_id);
CREATE INDEX idx_farmers_state_lga ON farmers(state, lga);
CREATE INDEX idx_farmers_status ON farmers(account_status);
CREATE INDEX idx_farmers_verification ON farmers(verification_status);
CREATE INDEX idx_farmers_phone ON farmers(primary_phone);
CREATE INDEX idx_farmers_gps ON farmers USING GIST(gps_coordinates);
CREATE INDEX idx_farmers_crops ON farmers USING GIN(primary_crops);
CREATE INDEX idx_farmers_fulltext ON farmers USING GIN(to_tsvector('english', first_name || ' ' || last_name || ' ' || farmer_id));

-- Apply trigger to farmers
CREATE TRIGGER update_farmers_updated_at
  BEFORE UPDATE ON farmers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
