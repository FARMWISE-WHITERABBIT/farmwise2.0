-- =====================================================
-- NOTIFICATIONS
-- =====================================================

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES farmers(id),
  
  notification_type VARCHAR NOT NULL,
  -- Added type column for compatibility with triggers
  type VARCHAR,
  
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  
  priority VARCHAR DEFAULT 'normal',
  
  -- Actions
  action_url TEXT,
  action_label VARCHAR,
  
  -- Related entities
  related_entity_type VARCHAR,
  related_entity_id UUID,
  -- Added reference columns for compatibility with triggers
  reference_id TEXT,
  reference_type VARCHAR,
  
  -- Delivery
  delivery_methods VARCHAR[] DEFAULT ARRAY['in_app'],
  email_sent BOOLEAN DEFAULT FALSE,
  sms_sent BOOLEAN DEFAULT FALSE,
  push_sent BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_dismissed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
