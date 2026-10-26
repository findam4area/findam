-- Migration: Create wallets for existing users
-- This migration ensures all existing users have wallets created
-- The trigger in 009_escrow_and_wallet_system.sql handles new users automatically

-- Create wallets for all existing users who don't have one yet
INSERT INTO wallets (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM wallets)
ON CONFLICT (user_id) DO NOTHING;
