-- Add cab_to_axle and rear_overhang columns to truck_profiles table
ALTER TABLE truck_profiles
ADD COLUMN IF NOT EXISTS cab_to_axle DECIMAL(10, 3) DEFAULT NULL CHECK (cab_to_axle >= 0),
ADD COLUMN IF NOT EXISTS rear_overhang DECIMAL(10, 3) DEFAULT NULL CHECK (rear_overhang >= 0);

-- Add comments explaining the columns
COMMENT ON COLUMN truck_profiles.cab_to_axle IS 'CA: Distance from back of cab to rear axle (metres). Used to calculate body start position.';
COMMENT ON COLUMN truck_profiles.rear_overhang IS 'ROH: Distance from rear axle to back of truck (metres).';

