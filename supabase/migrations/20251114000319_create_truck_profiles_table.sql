-- Create truck_profiles table
CREATE TABLE IF NOT EXISTS truck_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  body_type TEXT NOT NULL CHECK (body_type IN ('TRAY', 'PANTECH', 'CURTAINSIDER', 'REFRIGERATED', 'TIPPER', 'TANKER')),
  
  -- Physical dimensions (metres)
  body_length DECIMAL(10, 3) NOT NULL CHECK (body_length > 0),
  body_width DECIMAL(10, 3) NOT NULL CHECK (body_width > 0),
  wheelbase DECIMAL(10, 3) NOT NULL CHECK (wheelbase > 0),
  front_overhang DECIMAL(10, 3) NOT NULL DEFAULT 0 CHECK (front_overhang >= 0),
  
  -- Weights (kilograms)
  tare_weight DECIMAL(10, 2) NOT NULL CHECK (tare_weight > 0),
  front_tare_weight DECIMAL(10, 2) NOT NULL CHECK (front_tare_weight > 0),
  rear_tare_weight DECIMAL(10, 2) NOT NULL CHECK (rear_tare_weight > 0),
  gvm DECIMAL(10, 2) NOT NULL CHECK (gvm > 0),
  front_axle_limit DECIMAL(10, 2) NOT NULL CHECK (front_axle_limit > 0),
  rear_axle_limit DECIMAL(10, 2) NOT NULL CHECK (rear_axle_limit > 0),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on user_id for faster queries
CREATE INDEX idx_truck_profiles_user_id ON truck_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE truck_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own truck profiles
CREATE POLICY "Users can view own truck profiles"
  ON truck_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own truck profiles
CREATE POLICY "Users can insert own truck profiles"
  ON truck_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own truck profiles
CREATE POLICY "Users can update own truck profiles"
  ON truck_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own truck profiles
CREATE POLICY "Users can delete own truck profiles"
  ON truck_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_truck_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER truck_profiles_updated_at
  BEFORE UPDATE ON truck_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_truck_profiles_updated_at();

