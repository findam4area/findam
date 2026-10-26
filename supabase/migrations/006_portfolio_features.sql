-- Migration: Add portfolio features for service providers and job seekers
-- Date: 2026-02-05

-- Add CV and skills fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS cv_url TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[],
ADD COLUMN IF NOT EXISTS is_service_provider BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_job_seeker BOOLEAN DEFAULT FALSE;

-- Add comment to explain skills array
COMMENT ON COLUMN users.skills IS 'Array of skill tags for service providers and job seekers';
COMMENT ON COLUMN users.cv_url IS 'URL to uploaded CV/resume for job seekers';
COMMENT ON COLUMN users.is_service_provider IS 'Flag indicating if user is a service provider with portfolio';
COMMENT ON COLUMN users.is_job_seeker IS 'Flag indicating if user is a job seeker';

-- Create index for service provider queries
CREATE INDEX IF NOT EXISTS idx_users_service_provider ON users(is_service_provider) WHERE is_service_provider = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_job_seeker ON users(is_job_seeker) WHERE is_job_seeker = TRUE;
