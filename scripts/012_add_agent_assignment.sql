-- Add assigned agent field to farmers table
ALTER TABLE farmers 
ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES users(id);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_farmers_assigned_agent ON farmers(assigned_agent_id);

-- Add comment
COMMENT ON COLUMN farmers.assigned_agent_id IS 'Extension agent assigned to this farmer';
