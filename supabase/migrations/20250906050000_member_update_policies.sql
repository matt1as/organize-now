-- Add specific RLS policies for member updates to ensure only leaders can edit members

-- Drop the existing broad "Leaders can manage members" policy if it exists
DROP POLICY IF EXISTS "Leaders can manage members" ON members;

-- Add granular policies

-- SELECT: Association members can view members (already exists but let's ensure it's correct)
DROP POLICY IF EXISTS "Association members can view members" ON members;
CREATE POLICY "Association members can view members"
    ON members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM association_members
            WHERE association_members.association_id = members.association_id
            AND association_members.user_id = auth.uid()
            AND association_members.status = 'active'
        )
    );

-- INSERT: Only leaders and admins can add new members
CREATE POLICY "Leaders can add members"
    ON members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM association_members
            WHERE association_members.association_id = members.association_id
            AND association_members.user_id = auth.uid()
            AND association_members.role IN ('admin', 'leader')
            AND association_members.status = 'active'
        )
    );

-- UPDATE: Only leaders and admins can update members
CREATE POLICY "Leaders can update members"
    ON members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM association_members
            WHERE association_members.association_id = members.association_id
            AND association_members.user_id = auth.uid()
            AND association_members.role IN ('admin', 'leader')
            AND association_members.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM association_members
            WHERE association_members.association_id = members.association_id
            AND association_members.user_id = auth.uid()
            AND association_members.role IN ('admin', 'leader')
            AND association_members.status = 'active'
        )
    );

-- DELETE: Only leaders and admins can delete members
CREATE POLICY "Leaders can delete members"
    ON members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM association_members
            WHERE association_members.association_id = members.association_id
            AND association_members.user_id = auth.uid()
            AND association_members.role IN ('admin', 'leader')
            AND association_members.status = 'active'
        )
    );

-- Function to log member changes for audit trail
CREATE OR REPLACE FUNCTION log_member_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log for UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (
            association_id,
            user_id,
            action,
            entity_type,
            entity_id,
            old_data,
            new_data
        ) VALUES (
            NEW.association_id,
            auth.uid(),
            'member_updated',
            'member',
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for member change logging
DROP TRIGGER IF EXISTS log_member_changes_trigger ON members;
CREATE TRIGGER log_member_changes_trigger
    AFTER UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION log_member_changes();
