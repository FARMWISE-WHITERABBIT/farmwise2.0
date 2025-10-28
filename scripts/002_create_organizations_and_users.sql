-- =====================================================
-- ORGANIZATIONS & USERS
-- =====================================================

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_name VARCHAR NOT NULL,
  org_type VARCHAR, -- 'government', 'cooperative', 'ngo', 'private_aggregator', 'research'
  
  -- Contact
  contact_email VARCHAR,
  contact_phone VARCHAR,
  address TEXT,
  state VARCHAR,
  country VARCHAR DEFAULT 'Nigeria',
  
  -- Branding
  logo_url TEXT,
  primary_color VARCHAR DEFAULT '#2D5016',
  
  -- Subscription
  subscription_tier VARCHAR DEFAULT 'basic', -- 'basic', 'pro', 'enterprise'
  subscription_start_date DATE,
  subscription_end_date DATE,
  max_users INTEGER DEFAULT 5,
  max_farmers INTEGER,
  
  -- Features enabled
  features_enabled JSONB DEFAULT '{"gps_mapping": true, "traceability": true, "loans": false, "iot": false}',
  
  -- Settings
  settings JSONB,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users with role-based access
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  
  -- Profile
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR,
  avatar_url TEXT,
  
  -- Role
  role VARCHAR NOT NULL DEFAULT 'viewer',
  -- 'super_admin', 'admin', 'manager', 'field_agent', 'analyst', 'viewer', 'farmer'
  
  permissions JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMPTZ,
  
  -- Preferences
  preferred_language VARCHAR DEFAULT 'English',
  timezone VARCHAR DEFAULT 'Africa/Lagos',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
