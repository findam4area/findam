-- Create review_votes table for tracking helpfulness votes
CREATE TABLE IF NOT EXISTS review_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Create index for review votes
CREATE INDEX IF NOT EXISTS idx_review_votes_review 
ON review_votes(review_id);

CREATE INDEX IF NOT EXISTS idx_review_votes_user 
ON review_votes(user_id);

-- Enable RLS
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for review_votes
CREATE POLICY "Users can view all review votes"
  ON review_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own votes"
  ON review_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON review_votes FOR DELETE
  USING (auth.uid() = user_id);
