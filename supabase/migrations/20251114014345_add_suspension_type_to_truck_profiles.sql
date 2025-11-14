-- Add suspension_type column to truck_profiles table
ALTER TABLE truck_profiles
ADD COLUMN IF NOT EXISTS suspension_type TEXT NOT NULL DEFAULT 'STEEL' 
CHECK (suspension_type IN ('STEEL', 'AIRBAG'));

-- Add comment explaining the column
COMMENT ON COLUMN truck_profiles.suspension_type IS 'Suspension type: STEEL (leaf/coil spring) or AIRBAG (air suspension). Affects weight distribution calculations.';

