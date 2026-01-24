-- PayCore Initial Schema Migration
-- Version: 00001
-- Description: Creates all initial tables for the PayCore platform

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- CUSTOM TYPES
-- =============================================================================

-- Currency types
DO $$ BEGIN
  CREATE TYPE currency_type AS ENUM ('EUR', 'USD', 'GBP');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- User roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'agent', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Invoice status
DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'void');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Debt case status
DO $$ BEGIN
  CREATE TYPE debt_case_status AS ENUM ('pending', 'in_progress', 'payment_plan', 'escalated', 'legal', 'resolved', 'written_off');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Debt case priority
DO $$ BEGIN
  CREATE TYPE debt_case_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Voice call status
DO $$ BEGIN
  CREATE TYPE voice_call_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'no_answer', 'voicemail', 'busy', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Voice call outcome
DO $$ BEGIN
  CREATE TYPE voice_call_outcome AS ENUM ('promise_to_pay', 'payment_plan_agreed', 'dispute', 'callback_requested', 'wrong_number', 'not_interested', 'escalate', 'no_outcome');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Campaign type
DO $$ BEGIN
  CREATE TYPE campaign_type AS ENUM ('voice', 'email', 'sms', 'mixed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Campaign status
DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Template type
DO $$ BEGIN
  CREATE TYPE template_type AS ENUM ('email', 'sms', 'voice_script');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Payment plan status
DO $$ BEGIN
  CREATE TYPE payment_plan_status AS ENUM ('proposed', 'active', 'completed', 'defaulted', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Payment plan frequency
DO $$ BEGIN
  CREATE TYPE payment_plan_frequency AS ENUM ('weekly', 'biweekly', 'monthly');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Installment status
DO $$ BEGIN
  CREATE TYPE installment_status AS ENUM ('pending', 'paid', 'partial', 'overdue', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Campaign contact status
DO $$ BEGIN
  CREATE TYPE campaign_contact_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'skipped');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- TABLES
-- =============================================================================

-- Companies (Tenants)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Spain',
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  website VARCHAR(255),
  logo_url TEXT,
  currency currency_type NOT NULL DEFAULT 'EUR',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Customers (Debtors)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  external_id VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Spain',
  tax_id VARCHAR(50),
  notes TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  number VARCHAR(50) NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 21.00,
  tax_amount DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  currency currency_type NOT NULL DEFAULT 'EUR',
  notes TEXT,
  line_items JSONB NOT NULL DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(company_id, number)
);

-- Debt Cases
CREATE TABLE IF NOT EXISTS debt_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  status debt_case_status NOT NULL DEFAULT 'pending',
  priority debt_case_priority NOT NULL DEFAULT 'medium',
  total_debt DECIMAL(12, 2) NOT NULL,
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  currency currency_type NOT NULL DEFAULT 'EUR',
  days_overdue INTEGER NOT NULL DEFAULT 0,
  last_contact_at TIMESTAMPTZ,
  last_payment_at TIMESTAMPTZ,
  next_action_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Voice Agents
CREATE TABLE IF NOT EXISTS voice_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  elevenlabs_agent_id VARCHAR(100),
  voice_id VARCHAR(100) NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'es',
  system_prompt TEXT NOT NULL,
  first_message TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  total_calls INTEGER NOT NULL DEFAULT 0,
  successful_calls INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Voice Calls
CREATE TABLE IF NOT EXISTS voice_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  voice_agent_id UUID NOT NULL REFERENCES voice_agents(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  debt_case_id UUID REFERENCES debt_cases(id) ON DELETE SET NULL,
  elevenlabs_call_id VARCHAR(100),
  twilio_call_sid VARCHAR(100),
  phone_number VARCHAR(50) NOT NULL,
  status voice_call_status NOT NULL DEFAULT 'pending',
  direction VARCHAR(20) NOT NULL DEFAULT 'outbound',
  duration INTEGER,
  recording_url TEXT,
  transcription TEXT,
  summary TEXT,
  sentiment VARCHAR(50),
  outcome voice_call_outcome,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Communication Templates
CREATE TABLE IF NOT EXISTS communication_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type template_type NOT NULL,
  subject VARCHAR(500),
  body TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Collection Campaigns
CREATE TABLE IF NOT EXISTS collection_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type campaign_type NOT NULL DEFAULT 'voice',
  status campaign_status NOT NULL DEFAULT 'draft',
  voice_agent_id UUID REFERENCES voice_agents(id) ON DELETE SET NULL,
  template_id UUID REFERENCES communication_templates(id) ON DELETE SET NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  schedule JSONB NOT NULL DEFAULT '{}',
  stats JSONB NOT NULL DEFAULT '{"totalContacts": 0, "contacted": 0, "successful": 0, "failed": 0, "pending": 0}',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Campaign Contacts
CREATE TABLE IF NOT EXISTS campaign_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES collection_campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  debt_case_id UUID REFERENCES debt_cases(id) ON DELETE SET NULL,
  status campaign_contact_status NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, customer_id)
);

-- Payment Plans
CREATE TABLE IF NOT EXISTS payment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  debt_case_id UUID NOT NULL REFERENCES debt_cases(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status payment_plan_status NOT NULL DEFAULT 'proposed',
  total_amount DECIMAL(12, 2) NOT NULL,
  down_payment DECIMAL(12, 2) NOT NULL DEFAULT 0,
  number_of_installments INTEGER NOT NULL,
  installment_amount DECIMAL(12, 2) NOT NULL,
  frequency payment_plan_frequency NOT NULL DEFAULT 'monthly',
  currency currency_type NOT NULL DEFAULT 'EUR',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  remaining_amount DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_by_voice_call UUID REFERENCES voice_calls(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  defaulted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Installments
CREATE TABLE IF NOT EXISTS installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status installment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  payment_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_plan_id, installment_number)
);

-- Escalation Rules
CREATE TABLE IF NOT EXISTS escalation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Escalation Rule Executions
CREATE TABLE IF NOT EXISTS escalation_rule_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES escalation_rules(id) ON DELETE CASCADE,
  debt_case_id UUID NOT NULL REFERENCES debt_cases(id) ON DELETE CASCADE,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  actions_taken JSONB NOT NULL DEFAULT '[]',
  error_message TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Companies
CREATE INDEX IF NOT EXISTS idx_companies_deleted_at ON companies(deleted_at);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_external_id ON customers(company_id, external_id);
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers(deleted_at);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_deleted_at ON invoices(deleted_at);

-- Debt Cases
CREATE INDEX IF NOT EXISTS idx_debt_cases_company_id ON debt_cases(company_id);
CREATE INDEX IF NOT EXISTS idx_debt_cases_customer_id ON debt_cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_debt_cases_status ON debt_cases(status);
CREATE INDEX IF NOT EXISTS idx_debt_cases_priority ON debt_cases(priority);
CREATE INDEX IF NOT EXISTS idx_debt_cases_days_overdue ON debt_cases(days_overdue);
CREATE INDEX IF NOT EXISTS idx_debt_cases_assigned_to ON debt_cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_debt_cases_deleted_at ON debt_cases(deleted_at);

-- Voice Agents
CREATE INDEX IF NOT EXISTS idx_voice_agents_company_id ON voice_agents(company_id);
CREATE INDEX IF NOT EXISTS idx_voice_agents_is_active ON voice_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_voice_agents_deleted_at ON voice_agents(deleted_at);

-- Voice Calls
CREATE INDEX IF NOT EXISTS idx_voice_calls_company_id ON voice_calls(company_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_voice_agent_id ON voice_calls(voice_agent_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_customer_id ON voice_calls(customer_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_debt_case_id ON voice_calls(debt_case_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_status ON voice_calls(status);
CREATE INDEX IF NOT EXISTS idx_voice_calls_created_at ON voice_calls(created_at);

-- Collection Campaigns
CREATE INDEX IF NOT EXISTS idx_collection_campaigns_company_id ON collection_campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_collection_campaigns_status ON collection_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_collection_campaigns_deleted_at ON collection_campaigns(deleted_at);

-- Campaign Contacts
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign_id ON campaign_contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_customer_id ON campaign_contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_status ON campaign_contacts(status);

-- Payment Plans
CREATE INDEX IF NOT EXISTS idx_payment_plans_company_id ON payment_plans(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_debt_case_id ON payment_plans(debt_case_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_customer_id ON payment_plans(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_status ON payment_plans(status);
CREATE INDEX IF NOT EXISTS idx_payment_plans_deleted_at ON payment_plans(deleted_at);

-- Installments
CREATE INDEX IF NOT EXISTS idx_installments_payment_plan_id ON installments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);

-- Escalation Rules
CREATE INDEX IF NOT EXISTS idx_escalation_rules_company_id ON escalation_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_escalation_rules_is_active ON escalation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_escalation_rules_deleted_at ON escalation_rules(deleted_at);

-- Escalation Rule Executions
CREATE INDEX IF NOT EXISTS idx_escalation_rule_executions_rule_id ON escalation_rule_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_escalation_rule_executions_debt_case_id ON escalation_rule_executions(debt_case_id);
CREATE INDEX IF NOT EXISTS idx_escalation_rule_executions_executed_at ON escalation_rule_executions(executed_at);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_rule_executions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get user's company_id
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is admin or owner
CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'owner') FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Companies policies
CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  USING (id = get_user_company_id());

CREATE POLICY "Admins can update their own company"
  ON companies FOR UPDATE
  USING (id = get_user_company_id() AND is_admin_or_owner());

-- Users policies
CREATE POLICY "Users can view users in their company"
  ON users FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Admins can insert users in their company"
  ON users FOR INSERT
  WITH CHECK (company_id = get_user_company_id() AND is_admin_or_owner());

CREATE POLICY "Admins can update users in their company"
  ON users FOR UPDATE
  USING (company_id = get_user_company_id() AND is_admin_or_owner());

-- Customers policies
CREATE POLICY "Users can view customers in their company"
  ON customers FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert customers in their company"
  ON customers FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update customers in their company"
  ON customers FOR UPDATE
  USING (company_id = get_user_company_id());

-- Invoices policies
CREATE POLICY "Users can view invoices in their company"
  ON invoices FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert invoices in their company"
  ON invoices FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update invoices in their company"
  ON invoices FOR UPDATE
  USING (company_id = get_user_company_id());

-- Debt Cases policies
CREATE POLICY "Users can view debt cases in their company"
  ON debt_cases FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert debt cases in their company"
  ON debt_cases FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update debt cases in their company"
  ON debt_cases FOR UPDATE
  USING (company_id = get_user_company_id());

-- Voice Agents policies
CREATE POLICY "Users can view voice agents in their company"
  ON voice_agents FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Admins can insert voice agents in their company"
  ON voice_agents FOR INSERT
  WITH CHECK (company_id = get_user_company_id() AND is_admin_or_owner());

CREATE POLICY "Admins can update voice agents in their company"
  ON voice_agents FOR UPDATE
  USING (company_id = get_user_company_id() AND is_admin_or_owner());

-- Voice Calls policies
CREATE POLICY "Users can view voice calls in their company"
  ON voice_calls FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert voice calls in their company"
  ON voice_calls FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update voice calls in their company"
  ON voice_calls FOR UPDATE
  USING (company_id = get_user_company_id());

-- Communication Templates policies
CREATE POLICY "Users can view templates in their company"
  ON communication_templates FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Admins can insert templates in their company"
  ON communication_templates FOR INSERT
  WITH CHECK (company_id = get_user_company_id() AND is_admin_or_owner());

CREATE POLICY "Admins can update templates in their company"
  ON communication_templates FOR UPDATE
  USING (company_id = get_user_company_id() AND is_admin_or_owner());

-- Collection Campaigns policies
CREATE POLICY "Users can view campaigns in their company"
  ON collection_campaigns FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Admins can insert campaigns in their company"
  ON collection_campaigns FOR INSERT
  WITH CHECK (company_id = get_user_company_id() AND is_admin_or_owner());

CREATE POLICY "Admins can update campaigns in their company"
  ON collection_campaigns FOR UPDATE
  USING (company_id = get_user_company_id() AND is_admin_or_owner());

-- Campaign Contacts policies
CREATE POLICY "Users can view campaign contacts"
  ON campaign_contacts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM collection_campaigns c
    WHERE c.id = campaign_contacts.campaign_id
    AND c.company_id = get_user_company_id()
  ));

CREATE POLICY "Users can insert campaign contacts"
  ON campaign_contacts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM collection_campaigns c
    WHERE c.id = campaign_contacts.campaign_id
    AND c.company_id = get_user_company_id()
  ));

CREATE POLICY "Users can update campaign contacts"
  ON campaign_contacts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM collection_campaigns c
    WHERE c.id = campaign_contacts.campaign_id
    AND c.company_id = get_user_company_id()
  ));

-- Payment Plans policies
CREATE POLICY "Users can view payment plans in their company"
  ON payment_plans FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert payment plans in their company"
  ON payment_plans FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update payment plans in their company"
  ON payment_plans FOR UPDATE
  USING (company_id = get_user_company_id());

-- Installments policies
CREATE POLICY "Users can view installments"
  ON installments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM payment_plans p
    WHERE p.id = installments.payment_plan_id
    AND p.company_id = get_user_company_id()
  ));

CREATE POLICY "Users can insert installments"
  ON installments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM payment_plans p
    WHERE p.id = installments.payment_plan_id
    AND p.company_id = get_user_company_id()
  ));

CREATE POLICY "Users can update installments"
  ON installments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM payment_plans p
    WHERE p.id = installments.payment_plan_id
    AND p.company_id = get_user_company_id()
  ));

-- Escalation Rules policies
CREATE POLICY "Users can view escalation rules in their company"
  ON escalation_rules FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Admins can insert escalation rules in their company"
  ON escalation_rules FOR INSERT
  WITH CHECK (company_id = get_user_company_id() AND is_admin_or_owner());

CREATE POLICY "Admins can update escalation rules in their company"
  ON escalation_rules FOR UPDATE
  USING (company_id = get_user_company_id() AND is_admin_or_owner());

-- Escalation Rule Executions policies
CREATE POLICY "Users can view rule executions"
  ON escalation_rule_executions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM escalation_rules r
    WHERE r.id = escalation_rule_executions.rule_id
    AND r.company_id = get_user_company_id()
  ));

CREATE POLICY "System can insert rule executions"
  ON escalation_rule_executions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM escalation_rules r
    WHERE r.id = escalation_rule_executions.rule_id
    AND r.company_id = get_user_company_id()
  ));

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT table_name
    FROM information_schema.columns
    WHERE column_name = 'updated_at'
    AND table_schema = 'public'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
      CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END;
$$;

-- =============================================================================
-- SEED DATA (Optional - for development)
-- =============================================================================

-- This section is commented out for production
-- Uncomment for development/testing

/*
-- Create a test company
INSERT INTO companies (id, name, tax_id, address, city, postal_code, country, email, currency)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'PayCore Demo Company',
  'B12345678',
  'Calle Mayor 1',
  'Madrid',
  '28001',
  'Spain',
  'demo@paycore.io',
  'EUR'
);
*/
