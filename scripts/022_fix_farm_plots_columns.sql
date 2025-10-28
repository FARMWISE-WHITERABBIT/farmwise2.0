-- Fix farm_plots column naming to match code expectations
-- The code expects 'area_hectares' but schema has 'size_hectares'

ALTER TABLE farm_plots 
  RENAME COLUMN size_hectares TO area_hectares;

ALTER TABLE farm_plots 
  RENAME COLUMN size_acres TO area_acres;

-- Update any existing data or constraints if needed
COMMENT ON COLUMN farm_plots.area_hectares IS 'Plot area in hectares';
COMMENT ON COLUMN farm_plots.area_acres IS 'Plot area in acres (optional)';
