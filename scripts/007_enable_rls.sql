-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Organizations RLS policies
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Users RLS policies
CREATE POLICY "Users can view users in their organization"
  ON users FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Farmers RLS policies
CREATE POLICY "Users can view farmers in their organization"
  ON farmers FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins and field agents can insert farmers"
  ON farmers FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'manager', 'field_agent')
    )
  );

CREATE POLICY "Admins and field agents can update farmers"
  ON farmers FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'manager', 'field_agent')
    )
  );

-- Farm plots RLS policies
CREATE POLICY "Users can view plots in their organization"
  ON farm_plots FOR SELECT
  USING (
    farmer_id IN (
      SELECT id FROM farmers 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert plots for farmers in their organization"
  ON farm_plots FOR INSERT
  WITH CHECK (
    farmer_id IN (
      SELECT id FROM farmers 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update plots in their organization"
  ON farm_plots FOR UPDATE
  USING (
    farmer_id IN (
      SELECT id FROM farmers 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Farm activities RLS policies
CREATE POLICY "Users can view activities in their organization"
  ON farm_activities FOR SELECT
  USING (
    farmer_id IN (
      SELECT id FROM farmers 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert activities for farmers in their organization"
  ON farm_activities FOR INSERT
  WITH CHECK (
    farmer_id IN (
      SELECT id FROM farmers 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update activities in their organization"
  ON farm_activities FOR UPDATE
  USING (
    farmer_id IN (
      SELECT id FROM farmers 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Notifications RLS policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());
