ALTER TABLE donor_profiles
  ADD COLUMN IF NOT EXISTS location_accuracy_m DECIMAL(10,2)
    CHECK (location_accuracy_m IS NULL OR location_accuracy_m >= 0),
  ADD COLUMN IF NOT EXISTS location_captured_at TIMESTAMPTZ;

UPDATE donor_profiles
SET location_captured_at = COALESCE(location_captured_at, updated_at)
WHERE location_captured_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_donor_profiles_location_captured_at
  ON donor_profiles(location_captured_at);

ALTER TABLE blood_requests
  ADD COLUMN IF NOT EXISTS location_accuracy_m DECIMAL(10,2)
    CHECK (location_accuracy_m IS NULL OR location_accuracy_m >= 0),
  ADD COLUMN IF NOT EXISTS location_captured_at TIMESTAMPTZ;

UPDATE blood_requests
SET location_captured_at = COALESCE(location_captured_at, created_at)
WHERE location_captured_at IS NULL;
