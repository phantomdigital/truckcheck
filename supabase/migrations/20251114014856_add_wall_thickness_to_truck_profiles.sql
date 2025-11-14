-- Add wall thickness columns to truck_profiles table
ALTER TABLE truck_profiles
ADD COLUMN IF NOT EXISTS wall_thickness_front DECIMAL(10, 3) DEFAULT NULL CHECK (wall_thickness_front >= 0),
ADD COLUMN IF NOT EXISTS wall_thickness_rear DECIMAL(10, 3) DEFAULT NULL CHECK (wall_thickness_rear >= 0),
ADD COLUMN IF NOT EXISTS wall_thickness_sides DECIMAL(10, 3) DEFAULT NULL CHECK (wall_thickness_sides >= 0);

-- Add comments explaining the columns
COMMENT ON COLUMN truck_profiles.wall_thickness_front IS 'Front wall thickness in metres. Defaults to 0.03m (30mm) for pantech/refrigerated, 0 for tray/curtainsider.';
COMMENT ON COLUMN truck_profiles.wall_thickness_rear IS 'Rear wall thickness in metres. Defaults to 0.03m (30mm) for pantech/refrigerated, 0 for tray/curtainsider.';
COMMENT ON COLUMN truck_profiles.wall_thickness_sides IS 'Side wall thickness in metres (applies to both sides). Defaults to 0.03m (30mm) for pantech/refrigerated, 0 for tray/curtainsider.';

