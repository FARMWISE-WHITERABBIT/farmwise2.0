-- =====================================================
-- FIX RLS POLICIES - Remove infinite recursion
-- =====================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can view farmers in their organization" ON farmers;
DROP POLICY IF EXISTS "Admins and field agents can insert farmers" ON farmers;
DROP POLICY IF EXISTS "Admins and field agents can update farmers" ON farmers;
DROP POLICY IF EXISTS "Users can view plots in their organization" ON farm_plots;
DROP POLICY IF EXISTS "Users can insert plots for farmers in their organization" ON farm_plots;
DROP POLICY IF EXISTS "Users can update plots in their organization" ON farm_plots;
DROP POLICY IF EXISTS "Users can delete plots in their organization" ON farm_plots;
DROP POLICY IF EXISTS "Users can view activities in their organization" ON farm_activities;
DROP POLICY IF EXISTS "Users can insert activities for farmers in their organization" ON farm_activities;
DROP POLICY IF EXISTS "Users can update activities in their organization" ON farm_activities;
DROP POLICY IF EXISTS "Users can delete activities in their organization" ON farm_activities;

-- Create a helper function to get user's organization_id
CREATE OR REPLACE FUNCTION public.user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Organizations RLS policies (simplified)
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (id = public.user_organization_id());

-- Users RLS policies (simplified to avoid recursion)
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can view users in same organization"
  ON users FOR SELECT
  USING (organization_id = public.user_organization_id());

-- Farmers RLS policies (simplified)
CREATE POLICY "Users can view farmers in their organization"
  ON farmers FOR SELECT
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can insert farmers"
  ON farmers FOR INSERT
  WITH CHECK (organization_id = public.user_organization_id());

CREATE POLICY "Users can update farmers"
  ON farmers FOR UPDATE
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can delete farmers"
  ON farmers FOR DELETE
  USING (organization_id = public.user_organization_id());

-- Farm plots RLS policies (simplified)
CREATE POLICY "Users can view plots"
  ON farm_plots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM farmers 
      WHERE farmers.id = farm_plots.farmer_id 
      AND farmers.organization_id = public.user_organization_id()
    )
  );

CREATE POLICY "Users can insert plots"
  ON farm_plots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farmers 
      WHERE farmers.id = farm_plots.farmer_id 
      AND farmers.organization_id = public.user_organization_id()
    )
  );

CREATE POLICY "Users can update plots"
  ON farm_plots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM farmers 
      WHERE farmers.id = farm_plots.farmer_id 
      AND farmers.organization_id = public.user_organization_id()
    )
  );

CREATE POLICY "Users can delete plots"
  ON farm_plots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM farmers 
      WHERE farmers.id = farm_plots.farmer_id 
      AND farmers.organization_id = public.user_organization_id()
    )
  );

-- Farm activities RLS policies (simplified)
CREATE POLICY "Users can view activities"
  ON farm_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM farmers 
      WHERE farmers.id = farm_activities.farmer_id 
      AND farmers.organization_id = public.user_organization_id()
    )
  );

CREATE POLICY "Users can insert activities"
  ON farm_activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farmers 
      WHERE farmers.id = farm_activities.farmer_id 
      AND farmers.organization_id = public.user_organization_id()
    )
  );

CREATE POLICY "Users can update activities"
  ON farm_activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM farmers 
      WHERE farmers.id = farm_activities.farmer_id 
      AND farmers.organization_id = public.user_organization_id()
    )
  );

CREATE POLICY "Users can delete activities"
  ON farm_activities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM farmers 
      WHERE farmers.id = farm_activities.farmer_id 
      AND farmers.organization_id = public.user_organization_id()
    )
  );
