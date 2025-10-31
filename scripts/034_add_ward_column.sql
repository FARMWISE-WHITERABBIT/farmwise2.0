-- Add ward column to farmers table and migrate data from city_town
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS ward VARCHAR;

-- Copy existing city_town data to ward column for data preservation
UPDATE farmers SET ward = city_town WHERE ward IS NULL AND city_town IS NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN farmers.ward IS 'Ward/community where the farmer resides';
