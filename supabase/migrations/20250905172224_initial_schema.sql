-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'leader', 'member', 'guardian');
CREATE TYPE member_status AS ENUM ('active', 'inactive', 'pending');

-- Create associations table
CREATE TABLE associations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  settings JSONB DEFAULT '{}'
);

-- Create user_profiles table (extends auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,
  birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  preferences JSONB DEFAULT '{}'
);

-- Create association_members table (many-to-many relationship)
CREATE TABLE association_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'member',
  status member_status NOT NULL DEFAULT 'pending',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  permissions JSONB DEFAULT '{}',
  UNIQUE(association_id, user_id)
);

-- Create members table (for association member records)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  birth_date DATE,
  member_number VARCHAR(50),
  status member_status NOT NULL DEFAULT 'active',
  guardian_id UUID REFERENCES members(id) ON DELETE SET NULL,
  joined_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  custom_fields JSONB DEFAULT '{}',
  consents JSONB DEFAULT '{}'
);

-- Create guardian_relationships table
CREATE TABLE guardian_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guardian_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL DEFAULT 'parent',
  is_primary BOOLEAN DEFAULT FALSE,
  can_view BOOLEAN DEFAULT TRUE,
  can_edit BOOLEAN DEFAULT TRUE,
  can_sign_consent BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guardian_user_id, child_member_id)
);

-- Create audit_log table for GDPR compliance
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  association_id UUID REFERENCES associations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_associations_slug ON associations(slug);
CREATE INDEX idx_association_members_association_id ON association_members(association_id);
CREATE INDEX idx_association_members_user_id ON association_members(user_id);
CREATE INDEX idx_members_association_id ON members(association_id);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_guardian_id ON members(guardian_id);
CREATE INDEX idx_guardian_relationships_guardian ON guardian_relationships(guardian_user_id);
CREATE INDEX idx_guardian_relationships_child ON guardian_relationships(child_member_id);
CREATE INDEX idx_audit_log_association ON audit_log(association_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_associations_updated_at BEFORE UPDATE ON associations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_association_members_updated_at BEFORE UPDATE ON association_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guardian_relationships_updated_at BEFORE UPDATE ON guardian_relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE association_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for associations
CREATE POLICY "Users can view associations they belong to"
    ON associations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM association_members
            WHERE association_members.association_id = associations.id
            AND association_members.user_id = auth.uid()
            AND association_members.status = 'active'
        )
    );

CREATE POLICY "Admins can create associations"
    ON associations FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their associations"
    ON associations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM association_members
            WHERE association_members.association_id = associations.id
            AND association_members.user_id = auth.uid()
            AND association_members.role = 'admin'
            AND association_members.status = 'active'
        )
    );

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- RLS Policies for association_members
CREATE POLICY "Members can view association members"
    ON association_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM association_members am
            WHERE am.association_id = association_members.association_id
            AND am.user_id = auth.uid()
            AND am.status = 'active'
        )
    );

CREATE POLICY "Admins can manage association members"
    ON association_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM association_members am
            WHERE am.association_id = association_members.association_id
            AND am.user_id = auth.uid()
            AND am.role IN ('admin', 'leader')
            AND am.status = 'active'
        )
    );

-- RLS Policies for members
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

CREATE POLICY "Leaders can manage members"
    ON members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM association_members
            WHERE association_members.association_id = members.association_id
            AND association_members.user_id = auth.uid()
            AND association_members.role IN ('admin', 'leader')
            AND association_members.status = 'active'
        )
    );

-- RLS Policies for guardian_relationships
CREATE POLICY "Guardians can view their relationships"
    ON guardian_relationships FOR SELECT
    USING (guardian_user_id = auth.uid());

CREATE POLICY "Guardians can manage their relationships"
    ON guardian_relationships FOR ALL
    USING (guardian_user_id = auth.uid());

-- RLS Policies for audit_log (read-only for admins)
CREATE POLICY "Admins can view audit logs"
    ON audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM association_members
            WHERE association_members.association_id = audit_log.association_id
            AND association_members.user_id = auth.uid()
            AND association_members.role = 'admin'
            AND association_members.status = 'active'
        )
    );

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
