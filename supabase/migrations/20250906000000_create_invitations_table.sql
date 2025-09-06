-- Create invitations table
CREATE TABLE invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  association_id UUID REFERENCES associations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  birth_date DATE,
  member_data JSONB DEFAULT '{}', -- Additional pre-filled data
  token UUID DEFAULT uuid_generate_v4() NOT NULL UNIQUE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')) DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add invitation_id to members table
ALTER TABLE members 
ADD COLUMN invitation_id UUID REFERENCES invitations(id);

-- Create indexes
CREATE INDEX idx_invitations_association_id ON invitations(association_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);
CREATE INDEX idx_members_invitation_id ON members(invitation_id);

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations

-- Members of an association can view invitations
CREATE POLICY "Association members can view invitations"
  ON invitations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      WHERE am.association_id = invitations.association_id
        AND am.user_id = auth.uid()
        AND am.status = 'active'
    )
  );

-- Leaders and admins can create invitations
CREATE POLICY "Leaders can create invitations"
  ON invitations FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM association_members am
      WHERE am.association_id = invitations.association_id
        AND am.user_id = auth.uid()
        AND am.role IN ('admin', 'leader')
        AND am.status = 'active'
    )
    AND created_by = auth.uid()
  );

-- Leaders and admins can update invitations (cancel, resend)
CREATE POLICY "Leaders can update invitations"
  ON invitations FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM association_members am
      WHERE am.association_id = invitations.association_id
        AND am.user_id = auth.uid()
        AND am.role IN ('admin', 'leader')
        AND am.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM association_members am
      WHERE am.association_id = invitations.association_id
        AND am.user_id = auth.uid()
        AND am.role IN ('admin', 'leader')
        AND am.status = 'active'
    )
  );

-- Anyone with a valid token can view their invitation (for self-registration)
CREATE POLICY "Public can view invitation by token"
  ON invitations FOR SELECT TO anon
  USING (
    status = 'pending' 
    AND expires_at > NOW()
  );

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' AND expires_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to update updated_at timestamp
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
