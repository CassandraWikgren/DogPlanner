-- GDPR consent logging system - PART 1: Tables
-- Run this first

CREATE TABLE IF NOT EXISTS consent_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES owners(id) ON DELETE CASCADE,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  consent_type text NOT NULL CHECK (consent_type IN ('digital_email', 'physical_form', 'phone_verbal', 'in_person')),
  consent_given boolean NOT NULL,
  consent_text text NOT NULL,
  consent_version text DEFAULT '1.0',
  ip_address inet,
  user_agent text,
  signed_document_url text,
  witness_staff_id uuid REFERENCES auth.users(id),
  witness_notes text,
  given_at timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consent_logs_owner ON consent_logs(owner_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_org ON consent_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_active ON consent_logs(owner_id) WHERE consent_given = true AND withdrawn_at IS NULL;

ALTER TABLE owners ADD COLUMN IF NOT EXISTS consent_status text CHECK (consent_status IN ('pending', 'verified', 'declined', 'expired', 'withdrawn')) DEFAULT 'pending';
ALTER TABLE owners ADD COLUMN IF NOT EXISTS consent_verified_at timestamptz;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS gdpr_marketing_consent boolean DEFAULT false;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS consent_required boolean DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS consent_pending_until timestamptz;

ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;
