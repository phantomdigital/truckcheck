-- Create load_calculations table
CREATE TABLE IF NOT EXISTS load_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  truck_profile_id UUID NOT NULL REFERENCES truck_profiles(id) ON DELETE CASCADE,
  
  -- Metadata
  name TEXT NOT NULL,
  
  -- Load data (stored as JSONB for flexibility)
  pallets JSONB NOT NULL DEFAULT '[]'::jsonb,
  weight_distribution JSONB NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_load_calculations_user_id ON load_calculations(user_id);
CREATE INDEX idx_load_calculations_truck_profile_id ON load_calculations(truck_profile_id);
CREATE INDEX idx_load_calculations_created_at ON load_calculations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE load_calculations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own load calculations
CREATE POLICY "Users can view own load calculations"
  ON load_calculations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own load calculations
CREATE POLICY "Users can insert own load calculations"
  ON load_calculations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own load calculations
CREATE POLICY "Users can update own load calculations"
  ON load_calculations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own load calculations
CREATE POLICY "Users can delete own load calculations"
  ON load_calculations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_load_calculations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER load_calculations_updated_at
  BEFORE UPDATE ON load_calculations
  FOR EACH ROW
  EXECUTE FUNCTION update_load_calculations_updated_at();

