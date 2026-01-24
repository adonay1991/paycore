-- =============================================================================
-- Migration: 00002_webhook_events
-- Description: Add webhook events table for tracking incoming webhooks
-- =============================================================================

-- Create webhook events table for audit trail
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying by source and event type
CREATE INDEX idx_webhook_events_source ON webhook_events(source);
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_received_at ON webhook_events(received_at);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);

-- Add debt case notes table for storing notes and payment commitments
CREATE TABLE IF NOT EXISTS debt_case_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_case_id UUID NOT NULL REFERENCES debt_cases(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'note',
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying notes by debt case
CREATE INDEX idx_debt_case_notes_debt_case_id ON debt_case_notes(debt_case_id);
CREATE INDEX idx_debt_case_notes_type ON debt_case_notes(type);

-- RLS for debt case notes
ALTER TABLE debt_case_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes for debt cases in their company"
  ON debt_case_notes FOR SELECT
  USING (
    debt_case_id IN (
      SELECT id FROM debt_cases WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can create notes for debt cases in their company"
  ON debt_case_notes FOR INSERT
  WITH CHECK (
    debt_case_id IN (
      SELECT id FROM debt_cases WHERE company_id = get_user_company_id()
    )
  );

-- Add new columns to voice_calls for better tracking
ALTER TABLE voice_calls
  ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transcript_ready_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS analysis_ready_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS error_code TEXT,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS campaign_contact_id UUID REFERENCES campaign_contacts(id);

-- Add new columns to debt_cases for outcome tracking
ALTER TABLE debt_cases
  ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMPTZ;

-- Function to increment campaign contact attempts
CREATE OR REPLACE FUNCTION increment_attempts(contact_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_attempts INTEGER;
BEGIN
  SELECT attempts INTO current_attempts
  FROM campaign_contacts
  WHERE id = contact_id;

  RETURN COALESCE(current_attempts, 0) + 1;
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON TABLE webhook_events IS 'Audit trail for all incoming webhooks';
COMMENT ON TABLE debt_case_notes IS 'Notes and payment commitments for debt cases';
