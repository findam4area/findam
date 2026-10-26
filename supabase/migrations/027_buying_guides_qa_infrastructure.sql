-- Migration: Buying Guides and Product Q&A Infrastructure
-- Description: Creates tables for buying guides and product questions/answers

-- ============================================================================
-- BUYING GUIDES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS buying_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    checklist JSONB DEFAULT '[]'::jsonb, -- Array of checklist items
    price_ranges JSONB DEFAULT '{}'::jsonb, -- Object with min/max prices for different conditions
    video_url TEXT,
    comparison_chart JSONB DEFAULT '[]'::jsonb, -- Array of comparison data
    common_scams TEXT[], -- Array of common scam descriptions
    key_features TEXT[], -- Array of key features to check
    market_prices JSONB DEFAULT '{}'::jsonb, -- Estimated market prices for common items
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for buying guides
CREATE INDEX idx_buying_guides_category ON buying_guides(category_id);
CREATE INDEX idx_buying_guides_published ON buying_guides(is_published) WHERE is_published = true;
CREATE INDEX idx_buying_guides_updated ON buying_guides(last_updated_at DESC);

-- RLS Policies for buying guides
ALTER TABLE buying_guides ENABLE ROW LEVEL SECURITY;

-- Anyone can view published guides
CREATE POLICY "Anyone can view published buying guides"
    ON buying_guides FOR SELECT
    USING (is_published = true);

-- Only service role can manage guides (admin operations through backend)
-- Regular users cannot directly insert/update/delete guides
CREATE POLICY "Service role can manage buying guides"
    ON buying_guides FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- GUIDE BOOKMARKS TABLE
-- ============================================================================
-- Requirements: 22.8

CREATE TABLE IF NOT EXISTS guide_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    guide_id UUID NOT NULL REFERENCES buying_guides(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, guide_id)
);

-- Indexes for guide bookmarks
CREATE INDEX idx_guide_bookmarks_user ON guide_bookmarks(user_id);
CREATE INDEX idx_guide_bookmarks_guide ON guide_bookmarks(guide_id);

-- RLS Policies for guide bookmarks
ALTER TABLE guide_bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can manage their own bookmarks
CREATE POLICY "Users can manage their own guide bookmarks"
    ON guide_bookmarks FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================================
-- PRODUCT QUESTIONS TABLE
-- ============================================================================
-- Requirements: 23.1, 23.2, 23.7

CREATE TABLE IF NOT EXISTS product_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    asker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    answered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    answered_at TIMESTAMPTZ,
    is_seller_answer BOOLEAN DEFAULT false,
    upvotes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'hidden')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for product questions
CREATE INDEX idx_product_questions_listing ON product_questions(listing_id);
CREATE INDEX idx_product_questions_asker ON product_questions(asker_id);
CREATE INDEX idx_product_questions_status ON product_questions(status);
CREATE INDEX idx_product_questions_upvotes ON product_questions(upvotes DESC);
CREATE INDEX idx_product_questions_created ON product_questions(created_at DESC);

-- RLS Policies for product questions
ALTER TABLE product_questions ENABLE ROW LEVEL SECURITY;

-- Anyone can view questions
CREATE POLICY "Anyone can view product questions"
    ON product_questions FOR SELECT
    USING (status != 'hidden');

-- Authenticated users can post questions
CREATE POLICY "Authenticated users can post questions"
    ON product_questions FOR INSERT
    WITH CHECK (auth.uid() = asker_id);

-- Sellers and buyers can answer questions
CREATE POLICY "Sellers can answer their listing questions"
    ON product_questions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM listings
            WHERE listings.id = product_questions.listing_id
            AND listings.user_id = auth.uid()
        )
    );

-- Buyers who purchased can also answer
CREATE POLICY "Buyers who purchased can answer questions"
    ON product_questions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM purchase_records
            WHERE purchase_records.listing_id = product_questions.listing_id
            AND purchase_records.buyer_id = auth.uid()
        )
    );

-- Users can delete their own questions if not answered
CREATE POLICY "Users can delete their own unanswered questions"
    ON product_questions FOR DELETE
    USING (
        auth.uid() = asker_id
        AND answer IS NULL
    );

-- ============================================================================
-- QUESTION UPVOTES TABLE
-- ============================================================================
-- Requirements: 23.7

CREATE TABLE IF NOT EXISTS question_upvotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES product_questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(question_id, user_id)
);

-- Indexes for question upvotes
CREATE INDEX idx_question_upvotes_question ON question_upvotes(question_id);
CREATE INDEX idx_question_upvotes_user ON question_upvotes(user_id);

-- RLS Policies for question upvotes
ALTER TABLE question_upvotes ENABLE ROW LEVEL SECURITY;

-- Users can manage their own upvotes
CREATE POLICY "Users can manage their own question upvotes"
    ON question_upvotes FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================================
-- QUESTION LIMIT TRACKING
-- ============================================================================
-- Requirements: 23.9 - Limit to 5 questions per listing per user

-- Function to check question limit
CREATE OR REPLACE FUNCTION check_question_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM product_questions
        WHERE listing_id = NEW.listing_id
        AND asker_id = NEW.asker_id
    ) >= 5 THEN
        RAISE EXCEPTION 'You have reached the maximum of 5 questions per listing';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce question limit
CREATE TRIGGER enforce_question_limit
    BEFORE INSERT ON product_questions
    FOR EACH ROW
    EXECUTE FUNCTION check_question_limit();

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update buying_guides updated_at timestamp
CREATE OR REPLACE FUNCTION update_buying_guides_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_buying_guides_timestamp
    BEFORE UPDATE ON buying_guides
    FOR EACH ROW
    EXECUTE FUNCTION update_buying_guides_timestamp();

-- Update product_questions updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_questions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_questions_timestamp
    BEFORE UPDATE ON product_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_product_questions_timestamp();

-- Update upvote count when upvote is added/removed
CREATE OR REPLACE FUNCTION update_question_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE product_questions
        SET upvotes = upvotes + 1
        WHERE id = NEW.question_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE product_questions
        SET upvotes = upvotes - 1
        WHERE id = OLD.question_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_question_upvote_count_insert
    AFTER INSERT ON question_upvotes
    FOR EACH ROW
    EXECUTE FUNCTION update_question_upvote_count();

CREATE TRIGGER update_question_upvote_count_delete
    AFTER DELETE ON question_upvotes
    FOR EACH ROW
    EXECUTE FUNCTION update_question_upvote_count();

-- Update bookmark count when bookmark is added/removed
CREATE OR REPLACE FUNCTION update_guide_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE buying_guides
        SET bookmark_count = bookmark_count + 1
        WHERE id = NEW.guide_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE buying_guides
        SET bookmark_count = bookmark_count - 1
        WHERE id = OLD.guide_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_guide_bookmark_count_insert
    AFTER INSERT ON guide_bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_guide_bookmark_count();

CREATE TRIGGER update_guide_bookmark_count_delete
    AFTER DELETE ON guide_bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_guide_bookmark_count();

-- Set is_seller_answer flag when seller answers
CREATE OR REPLACE FUNCTION set_seller_answer_flag()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.answer IS NOT NULL AND NEW.answered_by IS NOT NULL THEN
        -- Check if answerer is the seller
        NEW.is_seller_answer := EXISTS (
            SELECT 1 FROM listings
            WHERE listings.id = NEW.listing_id
            AND listings.user_id = NEW.answered_by
        );
        
        -- Set answered_at timestamp
        IF NEW.answered_at IS NULL THEN
            NEW.answered_at := NOW();
        END IF;
        
        -- Update status to answered
        NEW.status := 'answered';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_seller_answer_flag
    BEFORE UPDATE ON product_questions
    FOR EACH ROW
    WHEN (NEW.answer IS NOT NULL AND OLD.answer IS NULL)
    EXECUTE FUNCTION set_seller_answer_flag();

-- ============================================================================
-- SELLER ANSWER RATE CALCULATION
-- ============================================================================
-- Requirements: 23.10

-- Function to calculate seller answer rate
CREATE OR REPLACE FUNCTION get_seller_answer_rate(seller_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_questions INTEGER;
    answered_questions INTEGER;
BEGIN
    -- Get total questions for seller's listings
    SELECT COUNT(*)
    INTO total_questions
    FROM product_questions pq
    JOIN listings l ON l.id = pq.listing_id
    WHERE l.user_id = seller_user_id;
    
    -- Get answered questions
    SELECT COUNT(*)
    INTO answered_questions
    FROM product_questions pq
    JOIN listings l ON l.id = pq.listing_id
    WHERE l.user_id = seller_user_id
    AND pq.status = 'answered';
    
    -- Calculate percentage
    IF total_questions = 0 THEN
        RETURN 0;
    ELSE
        RETURN ROUND((answered_questions::NUMERIC / total_questions::NUMERIC) * 100, 2);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE buying_guides IS 'Comprehensive buying guides for major product categories';
COMMENT ON TABLE guide_bookmarks IS 'User bookmarks for buying guides';
COMMENT ON TABLE product_questions IS 'Questions and answers for product listings';
COMMENT ON TABLE question_upvotes IS 'Upvotes for helpful questions and answers';

COMMENT ON COLUMN buying_guides.checklist IS 'JSON array of checklist items for inspecting products';
COMMENT ON COLUMN buying_guides.price_ranges IS 'JSON object with price ranges for different conditions';
COMMENT ON COLUMN buying_guides.comparison_chart IS 'JSON array of comparison data for popular models';
COMMENT ON COLUMN buying_guides.common_scams IS 'Array of common scam descriptions to watch out for';
COMMENT ON COLUMN buying_guides.key_features IS 'Array of key features buyers should check';
COMMENT ON COLUMN buying_guides.market_prices IS 'JSON object with estimated market prices';

COMMENT ON COLUMN product_questions.is_seller_answer IS 'True if the answer was provided by the listing seller';
COMMENT ON COLUMN product_questions.status IS 'Question status: pending, answered, or hidden';
