-- Migration 059: Index Verification RPC Functions (Fixed)
-- Task 13.1: Implement index query functions
-- Requirements: 11.1, 11.2, 11.3, 11.4

-- Function to query table indexes (name matches verification script expectation)
CREATE OR REPLACE FUNCTION query_table_indexes(table_name TEXT)
RETURNS TABLE (
  schemaname TEXT,
  tablename TEXT,
  indexname TEXT,
  indexdef TEXT,
  is_unique BOOLEAN,
  is_partial BOOLEAN
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    n.nspname::TEXT as schemaname,
    t.relname::TEXT as tablename,
    i.relname::TEXT as indexname,
    pg_get_indexdef(i.oid)::TEXT as indexdef,
    ix.indisunique as is_unique,
    CASE WHEN pg_get_expr(ix.indpred, ix.indrelid) IS NOT NULL THEN true ELSE false END as is_partial
  FROM pg_index ix
  JOIN pg_class t ON t.oid = ix.indrelid
  JOIN pg_class i ON i.oid = ix.indexrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE t.relname = table_name
    AND n.nspname = 'public'
  ORDER BY i.relname;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION query_table_indexes(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION query_table_indexes(TEXT) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION query_table_indexes(TEXT) IS 
'Returns all indexes for a given table with detailed information. Used by the database index verification script (Task 13.1).';
