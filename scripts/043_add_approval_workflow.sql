-- Add approval fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- Add approval fields to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- Create index for pending approvals
CREATE INDEX IF NOT EXISTS idx_users_pending_approval ON users(is_approved, requires_approval) WHERE requires_approval = TRUE AND is_approved = FALSE;
CREATE INDEX IF NOT EXISTS idx_orgs_pending_approval ON organizations(is_approved, requires_approval) WHERE requires_approval = TRUE AND is_approved = FALSE;

-- Function to notify admins of pending approvals
CREATE OR REPLACE FUNCTION notify_pending_approval()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Notify super admins for organization approvals
  IF TG_TABLE_NAME = 'organizations' AND NEW.requires_approval = TRUE AND NEW.is_approved = FALSE THEN
    FOR admin_id IN SELECT id FROM users WHERE role = 'super_admin' LOOP
      INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
      VALUES (
        admin_id,
        'New Organization Pending Approval',
        'Organization "' || NEW.org_name || '" requires approval',
        'approval_required',
        NEW.id::TEXT,
        'organization'
      );
    END LOOP;
  END IF;

  -- Notify org admins for extension agent approvals
  IF TG_TABLE_NAME = 'users' AND NEW.requires_approval = TRUE AND NEW.is_approved = FALSE AND NEW.role = 'field_agent' THEN
    FOR admin_id IN SELECT id FROM users WHERE organization_id = NEW.organization_id AND role IN ('admin', 'manager') LOOP
      INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
      VALUES (
        admin_id,
        'New Extension Agent Pending Approval',
        'Extension agent "' || NEW.first_name || ' ' || NEW.last_name || '" requires approval',
        'approval_required',
        NEW.id::TEXT,
        'user'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organization_approval_notification
  AFTER INSERT OR UPDATE ON organizations
  FOR EACH ROW
  WHEN (NEW.requires_approval = TRUE AND NEW.is_approved = FALSE)
  EXECUTE FUNCTION notify_pending_approval();

CREATE TRIGGER user_approval_notification
  AFTER INSERT OR UPDATE ON users
  FOR EACH ROW
  WHEN (NEW.requires_approval = TRUE AND NEW.is_approved = FALSE)
  EXECUTE FUNCTION notify_pending_approval();
