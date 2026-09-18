ALTER TABLE donor_matches
  ADD COLUMN IF NOT EXISTS donation_completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_donor_matches_donation_completed_at
  ON donor_matches(donation_completed_at)
  WHERE donation_completed_at IS NOT NULL;
