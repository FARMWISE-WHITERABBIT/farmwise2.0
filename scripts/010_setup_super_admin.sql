-- =====================================================
-- SETUP SUPER ADMIN USER
-- =====================================================

-- Update the demo user to be a super admin
UPDATE users 
SET 
  role = 'super_admin',
  permissions = '{"all": true, "manage_users": true, "manage_organizations": true, "view_all_data": true, "export_data": true, "system_settings": true}'::jsonb,
  updated_at = NOW()
WHERE email = 'demo@farmwise.com';

-- If the user doesn't exist in users table yet, we'll need to insert after auth signup
-- This will be handled by the application after authentication
