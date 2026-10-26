-- ============================================================================
-- BARTER MESSAGES TABLE
-- ============================================================================
-- Stores messages exchanged during barter negotiations
-- Requirement 12.7: Dedicated messaging for exchange negotiation

CREATE TABLE IF NOT EXISTS barter_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  proposal_id UUID NOT NULL REFERENCES barter_proposals(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Message content
  content TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT barter_messages_content_length CHECK (char_length(content) > 0 AND char_length(content) <= 500)
);

-- Indexes for barter_messages
CREATE INDEX idx_barter_messages_proposal ON barter_messages(proposal_id);
CREATE INDEX idx_barter_messages_sender ON barter_messages(sender_id);
CREATE INDEX idx_barter_messages_created ON barter_messages(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on barter_messages
ALTER TABLE barter_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages for proposals they are part of
CREATE POLICY barter_messages_user_view ON barter_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM barter_proposals bp
      WHERE bp.id = barter_messages.proposal_id
        AND (bp.proposer_id = auth.uid() OR bp.receiver_id = auth.uid())
    )
  );

-- Users can insert messages for proposals they are part of
CREATE POLICY barter_messages_user_insert ON barter_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM barter_proposals bp
      WHERE bp.id = proposal_id
        AND (bp.proposer_id = auth.uid() OR bp.receiver_id = auth.uid())
        AND bp.status IN ('pending', 'countered')
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE barter_messages IS 'Messages exchanged during barter proposal negotiations';
COMMENT ON COLUMN barter_messages.proposal_id IS 'Reference to the barter proposal';
COMMENT ON COLUMN barter_messages.sender_id IS 'User who sent the message';
COMMENT ON COLUMN barter_messages.content IS 'Message content (max 500 characters)';
