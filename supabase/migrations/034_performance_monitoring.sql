-- Performance Monitoring Infrastructure
-- Requirements: Performance optimization
-- Task 76.6: Add performance monitoring

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  rating TEXT CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  delta NUMERIC,
  metric_id TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_agent TEXT,
  url TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_rating ON performance_metrics(rating);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_timestamp ON performance_metrics(name, timestamp DESC);

-- Enable RLS
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to insert metrics (for anonymous tracking)
CREATE POLICY "Anyone can insert performance metrics"
  ON performance_metrics
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Note: Admin-only policy removed since users table doesn't have role column
-- If you need admin access, add a role column to users table first

-- Users can view their own metrics
CREATE POLICY "Users can view their own performance metrics"
  ON performance_metrics
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function to clean up old metrics (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_performance_metrics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM performance_metrics
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$;

-- Function to get performance summary
CREATE OR REPLACE FUNCTION get_performance_summary(
  p_metric_name TEXT DEFAULT NULL,
  p_period_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  metric_name TEXT,
  total_count BIGINT,
  avg_value NUMERIC,
  p50_value NUMERIC,
  p75_value NUMERIC,
  p95_value NUMERIC,
  p99_value NUMERIC,
  good_count BIGINT,
  needs_improvement_count BIGINT,
  poor_count BIGINT,
  good_percentage NUMERIC,
  needs_improvement_percentage NUMERIC,
  poor_percentage NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH metric_data AS (
    SELECT
      name,
      value,
      rating
    FROM performance_metrics
    WHERE
      timestamp >= NOW() - (p_period_days || ' days')::INTERVAL
      AND (p_metric_name IS NULL OR name = p_metric_name)
  ),
  percentiles AS (
    SELECT
      name,
      PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY value) AS p50,
      PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY value) AS p75,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) AS p95,
      PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY value) AS p99
    FROM metric_data
    GROUP BY name
  ),
  counts AS (
    SELECT
      name,
      COUNT(*) AS total,
      AVG(value) AS avg_val,
      COUNT(*) FILTER (WHERE rating = 'good') AS good,
      COUNT(*) FILTER (WHERE rating = 'needs-improvement') AS needs_improvement,
      COUNT(*) FILTER (WHERE rating = 'poor') AS poor
    FROM metric_data
    GROUP BY name
  )
  SELECT
    c.name,
    c.total,
    c.avg_val,
    p.p50,
    p.p75,
    p.p95,
    p.p99,
    c.good,
    c.needs_improvement,
    c.poor,
    ROUND((c.good::NUMERIC / NULLIF(c.total, 0)) * 100, 2) AS good_pct,
    ROUND((c.needs_improvement::NUMERIC / NULLIF(c.total, 0)) * 100, 2) AS needs_improvement_pct,
    ROUND((c.poor::NUMERIC / NULLIF(c.total, 0)) * 100, 2) AS poor_pct
  FROM counts c
  LEFT JOIN percentiles p ON c.name = p.name
  ORDER BY c.total DESC;
END;
$$;

-- Comments
COMMENT ON TABLE performance_metrics IS 'Stores Core Web Vitals and custom performance metrics';
COMMENT ON FUNCTION cleanup_old_performance_metrics() IS 'Removes performance metrics older than 90 days';
COMMENT ON FUNCTION get_performance_summary(TEXT, INTEGER) IS 'Returns aggregated performance metrics summary';
