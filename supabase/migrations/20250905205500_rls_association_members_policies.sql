-- Adjust association_members RLS policies to fix INSERT 500 and allow initial admin creation

-- Drop existing broad FOR ALL policy to avoid interfering with INSERT
DROP POLICY IF EXISTS "Admins can manage association members" ON association_members;

-- View policy remains as-is (created earlier): "Members can view association members"

-- Leaders/Admins can update/delete association members
CREATE POLICY "Leaders can update/delete association members"
  ON association_members FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      WHERE am.association_id = association_members.association_id
        AND am.user_id = auth.uid()
        AND am.role IN ('admin','leader')
        AND am.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM association_members am
      WHERE am.association_id = association_members.association_id
        AND am.user_id = auth.uid()
        AND am.role IN ('admin','leader')
        AND am.status = 'active'
    )
  );

CREATE POLICY "Leaders can delete association members"
  ON association_members FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      WHERE am.association_id = association_members.association_id
        AND am.user_id = auth.uid()
        AND am.role IN ('admin','leader')
        AND am.status = 'active'
    )
  );

-- Leaders/Admins can insert members
CREATE POLICY "Leaders can insert association members"
  ON association_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM association_members am
      WHERE am.association_id = association_members.association_id
        AND am.user_id = auth.uid()
        AND am.role IN ('admin','leader')
        AND am.status = 'active'
    )
  );

-- Creator can add self as admin (created in previous migration) remains in effect
