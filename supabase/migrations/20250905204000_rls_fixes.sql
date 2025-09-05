-- RLS fixes: allow creators to view their associations and add themselves as admin

-- Allow creators to SELECT associations they created (so insert+select returns)
CREATE POLICY "Creators can view their associations"
    ON associations FOR SELECT
    USING (created_by = auth.uid());

-- Allow association creator to insert their own admin membership
CREATE POLICY "Creator can add self as admin"
    ON association_members FOR INSERT
    WITH CHECK (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM associations a
        WHERE a.id = association_members.association_id
          AND a.created_by = auth.uid()
      )
    );
