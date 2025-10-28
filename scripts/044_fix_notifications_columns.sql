-- =====================================================
-- FIX NOTIFICATIONS TABLE - ADD MISSING COLUMNS
-- =====================================================

-- Add type column if it doesn't exist (for compatibility with triggers)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN type VARCHAR;
  END IF;
END $$;

-- Add reference_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'reference_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN reference_id TEXT;
  END IF;
END $$;

-- Add reference_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'reference_type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN reference_type VARCHAR;
  END IF;
END $$;

-- Update existing notifications to sync type with notification_type if needed
UPDATE notifications 
SET type = notification_type 
WHERE type IS NULL AND notification_type IS NOT NULL;
