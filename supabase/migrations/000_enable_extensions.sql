-- Enable required PostgreSQL extensions
-- This must run before any other migrations that use these extensions

-- UUID generation functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PostGIS for location-based queries (coordinates, geography)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Trigram similarity for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
