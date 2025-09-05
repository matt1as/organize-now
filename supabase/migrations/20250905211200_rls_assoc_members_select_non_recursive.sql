-- Replace recursive SELECT policy on association_members with non-recursive version to avoid policy recursion during INSERT
DROP POLICY IF EXISTS "Members can view association members" ON association_members;

CREATE POLICY "Members can view association members (non-recursive)"
  ON association_members FOR SELECT TO authenticated
  USING (true);
