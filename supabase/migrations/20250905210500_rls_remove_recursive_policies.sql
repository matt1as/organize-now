-- Remove recursive association_members policies causing infinite recursion
DROP POLICY IF EXISTS "Leaders can update/delete association members" ON association_members;
DROP POLICY IF EXISTS "Leaders can delete association members" ON association_members;
DROP POLICY IF EXISTS "Leaders can insert association members" ON association_members;

-- Keep existing policies:
-- - "Members can view association members" (SELECT)
-- - "Creator can add self as admin" (INSERT)
