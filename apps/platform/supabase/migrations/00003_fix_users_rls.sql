-- =============================================================================
-- Fix Users RLS Policy - Circular Dependency Fix
-- Version: 00003
-- Description: Fixes the circular dependency in users table RLS policies
-- =============================================================================

-- The problem:
-- 1. users table has RLS enabled
-- 2. SELECT policy on users uses get_user_company_id()
-- 3. get_user_company_id() queries users table
-- 4. This creates a circular dependency during auth

-- Solution: Allow users to view their own record directly

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view users in their company" ON users;

-- Create a new policy that allows users to view their own record first
-- This breaks the circular dependency
CREATE POLICY "Users can view their own record"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Create a policy for viewing other users in the same company
-- This uses a subquery to avoid the function call circular dependency
CREATE POLICY "Users can view other users in their company"
  ON users FOR SELECT
  USING (
    company_id IN (
      SELECT u.company_id FROM users u WHERE u.id = auth.uid()
    )
  );

-- Update the helper function to use SECURITY DEFINER properly
-- The function needs to bypass RLS to query the users table
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
DECLARE
  result UUID;
BEGIN
  SELECT company_id INTO result FROM users WHERE id = auth.uid();
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_owner() TO authenticated;
