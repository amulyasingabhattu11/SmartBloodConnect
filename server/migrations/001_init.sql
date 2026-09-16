CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(30) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'DISABLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donor_profiles (
  donor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  blood_group VARCHAR(3) NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  latitude DECIMAL(9,6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DECIMAL(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  location_label VARCHAR(255) NOT NULL,
  last_donation_date DATE,
  availability_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (availability_status IN ('AVAILABLE', 'UNAVAILABLE', 'TEMP_DISABLED')),
  response_count INTEGER NOT NULL DEFAULT 0,
  accept_count INTEGER NOT NULL DEFAULT 0,
  decline_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blood_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  patient_reference VARCHAR(120) NOT NULL,
  required_blood_group VARCHAR(3) NOT NULL CHECK (required_blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  hospital_name VARCHAR(180) NOT NULL,
  hospital_address TEXT NOT NULL,
  latitude DECIMAL(9,6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DECIMAL(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  units_required INTEGER NOT NULL CHECK (units_required > 0 AND units_required <= 20),
  urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('NORMAL', 'URGENT', 'CRITICAL')),
  required_before TIMESTAMPTZ NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'MATCHING', 'PARTIALLY_MATCHED', 'FULFILLED', 'CANCELLED', 'EXPIRED')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donor_matches (
  match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES blood_requests(request_id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES donor_profiles(donor_id) ON DELETE CASCADE,
  distance_km DECIMAL(7,2) NOT NULL,
  priority_score INTEGER NOT NULL CHECK (priority_score BETWEEN 0 AND 100),
  notification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (notification_status IN ('PENDING', 'SENT', 'VIEWED', 'ACCEPTED', 'DECLINED')),
  donor_response VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (donor_response IN ('PENDING', 'ACCEPTED', 'DECLINED')),
  batch_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (request_id, donor_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  request_id UUID REFERENCES blood_requests(request_id) ON DELETE CASCADE,
  match_id UUID REFERENCES donor_matches(match_id) ON DELETE CASCADE,
  type VARCHAR(40) NOT NULL,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'VIEWED', 'ACCEPTED', 'DECLINED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blood_banks (
  blood_bank_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(180) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  phone VARCHAR(30),
  verified_status VARCHAR(20) NOT NULL DEFAULT 'DEMO' CHECK (verified_status IN ('DEMO', 'UNVERIFIED', 'VERIFIED'))
);

CREATE TABLE IF NOT EXISTS blood_inventory (
  inventory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blood_bank_id UUID NOT NULL REFERENCES blood_banks(blood_bank_id) ON DELETE CASCADE,
  blood_group VARCHAR(3) NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  units_available INTEGER NOT NULL CHECK (units_available >= 0),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blood_bank_id, blood_group)
);

CREATE INDEX IF NOT EXISTS idx_donor_profiles_blood_group ON donor_profiles(blood_group);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_availability ON donor_profiles(availability_status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_requester ON blood_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_donor_matches_request ON donor_matches(request_id);
CREATE INDEX IF NOT EXISTS idx_donor_matches_donor ON donor_matches(donor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

