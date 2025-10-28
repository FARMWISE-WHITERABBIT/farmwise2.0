-- =====================================================
-- ADD FARMER USER ACCOUNTS
-- =====================================================
-- This migration adds user account functionality for farmers
-- so they can access the platform with limited permissions

-- Add user_id column to farmers table
ALTER TABLE farmers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON farmers(user_id);

-- Add unique constraint to ensure one farmer per user account
CREATE UNIQUE INDEX IF NOT EXISTS idx_farmers_user_id_unique ON farmers(user_id) WHERE user_id IS NOT NULL;

-- Update RLS policies for farmers table to allow farmers to view their own data
DROP POLICY IF EXISTS "Farmers can view their own profile" ON farmers;
CREATE POLICY "Farmers can view their own profile"
  ON farmers FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'manager', 'field_agent', 'analyst')
    )
  );

-- Simplified RLS policy - removed NEW/OLD references which are not available in RLS policies
-- Allow farmers to update their own basic profile information
DROP POLICY IF EXISTS "Farmers can update their own profile" ON farmers;
CREATE POLICY "Farmers can update their own profile"
  ON farmers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger function to restrict which fields farmers can update
CREATE OR REPLACE FUNCTION check_farmer_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is a farmer (not admin/agent), restrict field updates
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'farmer'
  ) THEN
    -- Farmers cannot change these critical fields
    IF NEW.farmer_id != OLD.farmer_id THEN
      RAISE EXCEPTION 'Farmers cannot change their farmer ID';
    END IF;
    
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
      RAISE EXCEPTION 'Farmers cannot change their organization';
    END IF;
    
    IF NEW.verification_status != OLD.verification_status THEN
      RAISE EXCEPTION 'Farmers cannot change their verification status';
    END IF;
    
    IF NEW.account_status != OLD.account_status THEN
      RAISE EXCEPTION 'Farmers cannot change their account status';
    END IF;
    
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Farmers cannot change their user account link';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce field restrictions
DROP TRIGGER IF EXISTS enforce_farmer_profile_restrictions ON farmers;
CREATE TRIGGER enforce_farmer_profile_restrictions
  BEFORE UPDATE ON farmers
  FOR EACH ROW
  EXECUTE FUNCTION check_farmer_profile_update();

-- Update contract_registrations RLS to allow farmers to view their own registrations
DROP POLICY IF EXISTS "Farmers can view their own contract registrations" ON contract_registrations;
CREATE POLICY "Farmers can view their own contract registrations"
  ON contract_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM farmers
      WHERE farmers.id = contract_registrations.farmer_id
      AND farmers.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'manager', 'field_agent', 'analyst')
    )
  );

-- Allow farmers to create their own contract registrations
DROP POLICY IF EXISTS "Farmers can register for contracts" ON contract_registrations;
CREATE POLICY "Farmers can register for contracts"
  ON contract_registrations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farmers
      WHERE farmers.id = contract_registrations.farmer_id
      AND farmers.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'manager', 'field_agent')
    )
  );

-- Update farm_plots RLS to allow farmers to view their own plots
DROP POLICY IF EXISTS "Farmers can view their own plots" ON farm_plots;
CREATE POLICY "Farmers can view their own plots"
  ON farm_plots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM farmers
      WHERE farmers.id = farm_plots.farmer_id
      AND farmers.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'manager', 'field_agent', 'analyst')
    )
  );

-- Update farm_activities RLS to allow farmers to view their own activities
DROP POLICY IF EXISTS "Farmers can view their own activities" ON farm_activities;
CREATE POLICY "Farmers can view their own activities"
  ON farm_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM farmers
      WHERE farmers.id = farm_activities.farmer_id
      AND farmers.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'manager', 'field_agent', 'analyst')
    )
  );

-- Update harvest_batches RLS to allow farmers to view their own batches
DROP POLICY IF EXISTS "Farmers can view their own harvest batches" ON harvest_batches;
CREATE POLICY "Farmers can view their own harvest batches"
  ON harvest_batches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM farmers
      WHERE farmers.id = harvest_batches.farmer_id
      AND farmers.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'manager', 'field_agent', 'analyst')
    )
  );

-- Function to automatically create a farmer user account
CREATE OR REPLACE FUNCTION create_farmer_user_account(
  p_farmer_id UUID,
  p_email VARCHAR,
  p_password VARCHAR,
  p_phone VARCHAR
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_farmer_record RECORD;
BEGIN
  -- Get farmer details
  SELECT * INTO v_farmer_record FROM farmers WHERE id = p_farmer_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Farmer not found';
  END IF;
  
  -- Check if farmer already has a user account
  IF v_farmer_record.user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Farmer already has a user account';
  END IF;
  
  -- Create auth user (this would be done via Supabase Auth API in practice)
  -- For now, we'll just create the user record
  INSERT INTO users (
    id,
    organization_id,
    first_name,
    last_name,
    email,
    phone,
    role,
    is_active,
    email_verified,
    preferred_language
  ) VALUES (
    gen_random_uuid(),
    v_farmer_record.organization_id,
    v_farmer_record.first_name,
    v_farmer_record.last_name,
    COALESCE(p_email, v_farmer_record.email),
    COALESCE(p_phone, v_farmer_record.primary_phone),
    'farmer',
    true,
    false,
    v_farmer_record.preferred_language
  ) RETURNING id INTO v_user_id;
  
  -- Link user to farmer
  UPDATE farmers SET user_id = v_user_id WHERE id = p_farmer_id;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_farmer_user_account TO authenticated;

COMMENT ON FUNCTION create_farmer_user_account IS 'Creates a user account for a farmer, allowing them to access the platform';
