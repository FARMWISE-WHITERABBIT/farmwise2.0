-- Add state and lga columns to users table for data analysis and filtering

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS state VARCHAR,
ADD COLUMN IF NOT EXISTS lga VARCHAR;

-- Add index for faster filtering by state and lga
CREATE INDEX IF NOT EXISTS idx_users_state ON users(state);
CREATE INDEX IF NOT EXISTS idx_users_lga ON users(lga);

-- Add comment to document the purpose
COMMENT ON COLUMN users.state IS 'State/region for data analysis and filtering';
COMMENT ON COLUMN users.lga IS 'Local Government Area for data analysis and filtering';
