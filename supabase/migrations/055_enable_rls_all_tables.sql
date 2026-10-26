-- Migration 055: Enable RLS on All Tables
-- Date: 2025-01-23
-- Purpose: Enable Row Level Security on all public schema tables
-- Critical: This must be done before applying policies

-- Enable RLS on categories table
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;

-- Enable RLS on listings table
ALTER TABLE IF EXISTS listings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on listing_images table (if exists)
ALTER TABLE IF EXISTS listing_images ENABLE ROW LEVEL SECURITY;

-- Enable RLS on reviews table (if exists)
ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;

-- Enable RLS on claims table (if exists)
ALTER TABLE IF EXISTS claims ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles table (if exists)
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on favorites table (if exists)
ALTER TABLE IF EXISTS favorites ENABLE ROW LEVEL SECURITY;

-- Enable RLS on bookmarks table (if exists)
ALTER TABLE IF EXISTS bookmarks ENABLE ROW LEVEL SECURITY;

-- Enable RLS on messages table (if exists)
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on conversations table (if exists)
ALTER TABLE IF EXISTS conversations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on reports table (if exists)
ALTER TABLE IF EXISTS reports ENABLE ROW LEVEL SECURITY;

-- Enable RLS on notifications table (if exists)
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'RLS enabled on all existing tables';
END $$;
