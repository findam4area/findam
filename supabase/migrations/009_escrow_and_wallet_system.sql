-- Migration: Escrow Payment System and In-App Wallet
-- Requirements: 4 (Escrow Payment System), 5 (In-App Wallet System)
-- Tasks: 4.1, 4.2, 4.3, 4.4

-- ============================================================================
-- ESCROW TRANSACTIONS TABLE (Task 4.1)
-- ============================================================================
-- Holds payment information until delivery confirmation
-- Supports 2.5% transaction fee, 7-day auto-release, and dispute handling
CREATE TABLE escrow_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  fee DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'held', 'released', 'refunded', 'disputed')),
  paystack_reference TEXT UNIQUE,
  estimated_delivery_date DATE,
  auto_release_at TIMESTAMPTZ, -- 7 days after estimated delivery
  dispute_reason TEXT,
  dispute_evidence JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT different_users CHECK (buyer_id != seller_id)
);

-- Indexes for escrow_transactions (Task 4.1)
CREATE INDEX idx_escrow_buyer ON escrow_transactions(buyer_id);
CREATE INDEX idx_escrow_seller ON escrow_transactions(seller_id);
CREATE INDEX idx_escrow_listing ON escrow_transactions(listing_id);
CREATE INDEX idx_escrow_status ON escrow_transactions(status);
CREATE INDEX idx_escrow_auto_release ON escrow_transactions(auto_release_at) WHERE status = 'held';
CREATE INDEX idx_escrow_paystack_ref ON escrow_transactions(paystack_reference);
CREATE INDEX idx_escrow_created ON escrow_transactions(created_at DESC);

-- ============================================================================
-- WALLETS TABLE (Task 4.2)
-- ============================================================================
-- Manages user earnings with available and pending balances
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  available_balance DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  pending_balance DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (pending_balance >= 0),
  total_earned DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
  total_withdrawn DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (total_withdrawn >= 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for wallets (Task 4.2)
CREATE UNIQUE INDEX idx_wallets_user ON wallets(user_id);

-- ============================================================================
-- WALLET TRANSACTIONS TABLE (Task 4.3)
-- ============================================================================
-- Tracks all credits and debits with balance_after audit trail
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  fee DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  balance_after DECIMAL(12, 2) NOT NULL CHECK (balance_after >= 0),
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('escrow_release', 'withdrawal', 'refund', 'purchase', 'fee', 'adjustment')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  reference TEXT, -- External reference (e.g., escrow_transaction_id, withdrawal_id)
  metadata JSONB, -- Additional transaction details
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for wallet_transactions (Task 4.3)
CREATE INDEX idx_wallet_txn_wallet ON wallet_transactions(wallet_id, created_at DESC);
CREATE INDEX idx_wallet_txn_user ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX idx_wallet_txn_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_txn_category ON wallet_transactions(category);
CREATE INDEX idx_wallet_txn_status ON wallet_transactions(status);
CREATE INDEX idx_wallet_txn_reference ON wallet_transactions(reference);

-- ============================================================================
-- WITHDRAWALS TABLE (Task 4.4)
-- ============================================================================
-- Manages withdrawal requests with bank account details and Paystack integration
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  fee DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  net_amount DECIMAL(12, 2) NOT NULL CHECK (net_amount > 0), -- amount - fee
  bank_code TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  paystack_reference TEXT UNIQUE,
  paystack_transfer_code TEXT,
  failure_reason TEXT,
  requires_verification BOOLEAN DEFAULT FALSE, -- For withdrawals > ₦100,000
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for withdrawals (Task 4.4)
CREATE INDEX idx_withdrawals_wallet ON withdrawals(wallet_id);
CREATE INDEX idx_withdrawals_user ON withdrawals(user_id, created_at DESC);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_paystack_ref ON withdrawals(paystack_reference);
CREATE INDEX idx_withdrawals_verification ON withdrawals(requires_verification, verified_at) WHERE requires_verification = TRUE;
CREATE INDEX idx_withdrawals_created ON withdrawals(created_at DESC);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Update escrow_transactions.updated_at
CREATE OR REPLACE FUNCTION update_escrow_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_escrow_transactions_updated_at
  BEFORE UPDATE ON escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_escrow_transactions_updated_at();

-- Update wallets.updated_at
CREATE OR REPLACE FUNCTION update_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_wallets_updated_at();

-- Update withdrawals.updated_at
CREATE OR REPLACE FUNCTION update_withdrawals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_withdrawals_updated_at
  BEFORE UPDATE ON withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION update_withdrawals_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically create wallet for new users
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_wallet_for_user
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_wallet_for_user();

-- Function to calculate escrow fee (2.5% of transaction amount)
CREATE OR REPLACE FUNCTION calculate_escrow_fee(amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND(amount * 0.025, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate withdrawal fee based on amount
-- ₦100 for amounts < ₦10,000
-- ₦50 for amounts ₦10,000 - ₦19,999
-- ₦0 for amounts ≥ ₦20,000
CREATE OR REPLACE FUNCTION calculate_withdrawal_fee(amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  IF amount < 10000 THEN
    RETURN 100;
  ELSIF amount < 20000 THEN
    RETURN 50;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE escrow_transactions IS 'Holds payments securely until delivery confirmation with 7-day auto-release';
COMMENT ON TABLE wallets IS 'User digital wallets for managing earnings and balances';
COMMENT ON TABLE wallet_transactions IS 'Audit trail of all wallet credits and debits with balance snapshots';
COMMENT ON TABLE withdrawals IS 'Withdrawal requests with bank details and Paystack integration';

COMMENT ON COLUMN escrow_transactions.fee IS 'Transaction fee (2.5% of amount)';
COMMENT ON COLUMN escrow_transactions.auto_release_at IS 'Timestamp when funds auto-release (7 days after estimated delivery)';
COMMENT ON COLUMN wallets.available_balance IS 'Balance available for withdrawal or purchases';
COMMENT ON COLUMN wallets.pending_balance IS 'Balance held in escrow transactions';
COMMENT ON COLUMN wallet_transactions.balance_after IS 'Wallet balance after this transaction (audit trail)';
COMMENT ON COLUMN withdrawals.requires_verification IS 'TRUE for withdrawals > ₦100,000';
