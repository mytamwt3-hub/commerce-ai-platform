-- migrations/20260830_create_investment_tables.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  balance NUMERIC(14,2) DEFAULT 0,
  pending_balance NUMERIC(14,2) DEFAULT 0,
  currency VARCHAR(8) DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Investment requests
CREATE TABLE IF NOT EXISTS investment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity_requested INT NOT NULL,
  quantity_funded INT DEFAULT 0,
  unit_cost NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  total_cost NUMERIC(14,2) NOT NULL,
  total_funded NUMERIC(14,2) DEFAULT 0,
  profit_share_percent NUMERIC(5,2) DEFAULT 60,
  status VARCHAR(32) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Investment fundings (each investor funding entry)
CREATE TABLE IF NOT EXISTS investment_fundings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES investment_requests(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  quantity_reserved INT NOT NULL,
  funded_at TIMESTAMPTZ DEFAULT now(),
  status VARCHAR(20) DEFAULT 'active'
);

-- Investment transactions ledger
CREATE TABLE IF NOT EXISTS investment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID,
  merchant_id UUID,
  request_id UUID,
  type VARCHAR(32),
  amount NUMERIC(14,2),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Wallet transactions ledger
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL,
  type VARCHAR(16),
  reference_type VARCHAR(32),
  reference_id UUID,
  amount NUMERIC(14,2),
  balance_after NUMERIC(14,2),
  created_at TIMESTAMPTZ DEFAULT now()
);
