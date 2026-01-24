-- =============================================================================
-- PayCore Row Level Security (RLS) Policies
-- Multi-tenant security for Supabase
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_case_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTIONS (in public schema for Supabase compatibility)
-- =============================================================================

-- Get the current user's company_id from JWT claims
CREATE OR REPLACE FUNCTION public.get_company_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'company_id')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Get the current user's ID from JWT
CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    auth.uid(),
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Get the current user's role from JWT claims
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    'readonly'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user has admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() IN ('admin', 'manager');
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- =============================================================================
-- COMPANIES POLICIES
-- =============================================================================

-- Users can only see their own company
CREATE POLICY "companies_select_own" ON companies
    FOR SELECT USING (id = public.get_company_id());

-- Only admins can update company settings
CREATE POLICY "companies_update_admin" ON companies
    FOR UPDATE USING (id = public.get_company_id() AND public.is_admin());

-- =============================================================================
-- USERS POLICIES
-- =============================================================================

-- Users can see all users in their company
CREATE POLICY "users_select_company" ON users
    FOR SELECT USING (company_id = public.get_company_id() AND deleted_at IS NULL);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (id = public.get_user_id());

-- Admins can update any user in their company
CREATE POLICY "users_update_admin" ON users
    FOR UPDATE USING (company_id = public.get_company_id() AND public.is_admin());

-- Admins can insert new users
CREATE POLICY "users_insert_admin" ON users
    FOR INSERT WITH CHECK (company_id = public.get_company_id() AND public.is_admin());

-- Admins can soft delete users
CREATE POLICY "users_delete_admin" ON users
    FOR DELETE USING (company_id = public.get_company_id() AND public.is_admin());

-- =============================================================================
-- CUSTOMERS POLICIES
-- =============================================================================

-- Users can see all customers in their company
CREATE POLICY "customers_select_company" ON customers
    FOR SELECT USING (company_id = public.get_company_id() AND deleted_at IS NULL);

-- Users with write access can create customers
CREATE POLICY "customers_insert_company" ON customers
    FOR INSERT WITH CHECK (company_id = public.get_company_id() AND public.get_user_role() != 'readonly');

-- Users with write access can update customers
CREATE POLICY "customers_update_company" ON customers
    FOR UPDATE USING (company_id = public.get_company_id() AND public.get_user_role() != 'readonly');

-- Admins can soft delete customers
CREATE POLICY "customers_delete_admin" ON customers
    FOR DELETE USING (company_id = public.get_company_id() AND public.is_admin());

-- =============================================================================
-- INVOICES POLICIES
-- =============================================================================

-- Users can see all invoices in their company
CREATE POLICY "invoices_select_company" ON invoices
    FOR SELECT USING (company_id = public.get_company_id() AND deleted_at IS NULL);

-- Users with write access can create invoices
CREATE POLICY "invoices_insert_company" ON invoices
    FOR INSERT WITH CHECK (company_id = public.get_company_id() AND public.get_user_role() != 'readonly');

-- Users with write access can update invoices
CREATE POLICY "invoices_update_company" ON invoices
    FOR UPDATE USING (company_id = public.get_company_id() AND public.get_user_role() != 'readonly');

-- Admins can soft delete invoices
CREATE POLICY "invoices_delete_admin" ON invoices
    FOR DELETE USING (company_id = public.get_company_id() AND public.is_admin());

-- =============================================================================
-- INVOICE ITEMS POLICIES
-- =============================================================================

-- Users can see invoice items for invoices in their company
CREATE POLICY "invoice_items_select_company" ON invoice_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.company_id = public.get_company_id()
        )
    );

-- Users with write access can manage invoice items
CREATE POLICY "invoice_items_insert_company" ON invoice_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.company_id = public.get_company_id()
        ) AND public.get_user_role() != 'readonly'
    );

CREATE POLICY "invoice_items_update_company" ON invoice_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.company_id = public.get_company_id()
        ) AND public.get_user_role() != 'readonly'
    );

CREATE POLICY "invoice_items_delete_company" ON invoice_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.company_id = public.get_company_id()
        ) AND public.get_user_role() != 'readonly'
    );

-- =============================================================================
-- PAYMENTS POLICIES
-- =============================================================================

-- Users can see payments for invoices in their company
CREATE POLICY "payments_select_company" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = payments.invoice_id
            AND invoices.company_id = public.get_company_id()
        )
    );

-- Users with write access can create payments
CREATE POLICY "payments_insert_company" ON payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = payments.invoice_id
            AND invoices.company_id = public.get_company_id()
        ) AND public.get_user_role() != 'readonly'
    );

-- Users with write access can update payments
CREATE POLICY "payments_update_company" ON payments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = payments.invoice_id
            AND invoices.company_id = public.get_company_id()
        ) AND public.get_user_role() != 'readonly'
    );

-- =============================================================================
-- DEBT CASES POLICIES
-- =============================================================================

-- Users can see all debt cases in their company
CREATE POLICY "debt_cases_select_company" ON debt_cases
    FOR SELECT USING (company_id = public.get_company_id() AND deleted_at IS NULL);

-- Users with write access can create debt cases
CREATE POLICY "debt_cases_insert_company" ON debt_cases
    FOR INSERT WITH CHECK (company_id = public.get_company_id() AND public.get_user_role() != 'readonly');

-- Users with write access can update debt cases
CREATE POLICY "debt_cases_update_company" ON debt_cases
    FOR UPDATE USING (company_id = public.get_company_id() AND public.get_user_role() != 'readonly');

-- Admins can soft delete debt cases
CREATE POLICY "debt_cases_delete_admin" ON debt_cases
    FOR DELETE USING (company_id = public.get_company_id() AND public.is_admin());

-- =============================================================================
-- DEBT CASE ACTIVITIES POLICIES
-- =============================================================================

-- Users can see activities for debt cases in their company
CREATE POLICY "debt_case_activities_select_company" ON debt_case_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM debt_cases
            WHERE debt_cases.id = debt_case_activities.debt_case_id
            AND debt_cases.company_id = public.get_company_id()
        )
    );

-- Users with write access can create activities
CREATE POLICY "debt_case_activities_insert_company" ON debt_case_activities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM debt_cases
            WHERE debt_cases.id = debt_case_activities.debt_case_id
            AND debt_cases.company_id = public.get_company_id()
        ) AND public.get_user_role() != 'readonly'
    );

-- =============================================================================
-- AUDIT LOGS POLICIES
-- =============================================================================

-- Admins can see all audit logs for their company
CREATE POLICY "audit_logs_select_admin" ON audit_logs
    FOR SELECT USING (company_id = public.get_company_id() AND public.is_admin());

-- System can insert audit logs (using service role)
CREATE POLICY "audit_logs_insert_service" ON audit_logs
    FOR INSERT WITH CHECK (company_id = public.get_company_id());

-- =============================================================================
-- SERVICE ROLE BYPASS
-- =============================================================================
-- Note: The service_role key bypasses RLS by default in Supabase.
-- This is used for backend API operations where we've already validated
-- the user's permissions in the application layer.

-- =============================================================================
-- CUSTOMER PORTAL POLICIES (Anonymous access for customers)
-- =============================================================================

-- Allow customers to view their own invoices via magic link
-- This requires a separate customers_portal_tokens table and validation

-- For customer portal, we use a separate authentication flow
-- The API validates the customer token and uses service_role to fetch data
