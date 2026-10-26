-- Migration: Auto-generate embeddings trigger
-- Task 6.1: Implement automatic embedding generation on listing create/update
-- Requirements: 22.6

-- Note: This trigger sets a flag to indicate embeddings need generation
-- The actual embedding generation happens via the API route to avoid
-- blocking database operations and to handle OpenAI API calls properly

-- Add flag column to track embedding generation status
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS embedding_needs_update BOOLEAN DEFAULT TRUE;

-- Create function to mark embeddings for update when title/description changes
CREATE OR REPLACE FUNCTION mark_embedding_for_update()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT, always mark for embedding generation
  IF TG_OP = 'INSERT' THEN
    NEW.embedding_needs_update := TRUE;
    RETURN NEW;
  END IF;

  -- On UPDATE, mark for update if title or description changed
  IF TG_OP = 'UPDATE' THEN
    IF (NEW.title IS DISTINCT FROM OLD.title) OR 
       (NEW.description IS DISTINCT FROM OLD.description) THEN
      NEW.embedding_needs_update := TRUE;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on listings table
DROP TRIGGER IF EXISTS trigger_mark_embedding_for_update ON listings;
CREATE TRIGGER trigger_mark_embedding_for_update
  BEFORE INSERT OR UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION mark_embedding_for_update();

-- Create index on embedding_needs_update for efficient querying
CREATE INDEX IF NOT EXISTS idx_listings_embedding_needs_update 
ON listings(embedding_needs_update) 
WHERE embedding_needs_update = TRUE;

-- Comment on column and trigger
COMMENT ON COLUMN listings.embedding_needs_update IS 
  'Flag indicating whether listing embedding needs to be regenerated. Set to TRUE on insert or when title/description changes.';

COMMENT ON FUNCTION mark_embedding_for_update IS 
  'Marks listings for embedding regeneration when title or description changes. Actual embedding generation happens via API.';
