-- ====================================================================
-- Community Workspace & Calendar - Supabase Database Schema
-- Security: OWASP ASVS / RBAC / Audit Logging / Concurrency Control
-- ====================================================================

-- 1. Roles and Members Table
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE, -- References auth.users if available
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'workspace_admin', 'editor', 'contributor', 'viewer')),
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'disabled', 'revoked')),
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT,
    invited_by UUID,
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Role Permissions Table
CREATE TABLE IF NOT EXISTS workspace_role_permissions (
    role TEXT PRIMARY KEY CHECK (role IN ('super_admin', 'workspace_admin', 'editor', 'contributor', 'viewer')),
    can_view BOOLEAN DEFAULT TRUE,
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_upload BOOLEAN DEFAULT FALSE,
    can_share BOOLEAN DEFAULT FALSE
);

-- Default Role Matrix Setup
INSERT INTO workspace_role_permissions (role, can_view, can_create, can_edit, can_delete, can_upload, can_share) VALUES
    ('super_admin', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
    ('workspace_admin', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
    ('editor', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE),
    ('contributor', TRUE, TRUE, FALSE, FALSE, TRUE, FALSE),
    ('viewer', TRUE, FALSE, FALSE, FALSE, FALSE, FALSE)
ON CONFLICT (role) DO UPDATE SET
    can_view = EXCLUDED.can_view,
    can_create = EXCLUDED.can_create,
    can_edit = EXCLUDED.can_edit,
    can_delete = EXCLUDED.can_delete,
    can_upload = EXCLUDED.can_upload,
    can_share = EXCLUDED.can_share;

-- 3. Calendars Table
CREATE TABLE IF NOT EXISTS workspace_calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#ef4444',
    description TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES workspace_members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Events Table
CREATE TABLE IF NOT EXISTS workspace_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id UUID REFERENCES workspace_calendars(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'meeting' CHECK (category IN ('meeting', 'youtube', 'hackathon', 'training', 'project', 'social')),
    color TEXT NOT NULL DEFAULT '#ef4444',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_all_day BOOLEAN DEFAULT FALSE,
    recurrence_rule TEXT,
    parent_event_id UUID REFERENCES workspace_events(id) ON DELETE SET NULL,
    assignees JSONB DEFAULT '[]'::jsonb,
    location TEXT,
    meeting_link TEXT,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES workspace_members(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES workspace_members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for high-performance calendar range queries
CREATE INDEX IF NOT EXISTS idx_workspace_events_dates ON workspace_events (start_time, end_time) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_workspace_events_category ON workspace_events (category);

-- 5. Subtasks & Checklists Table
CREATE TABLE IF NOT EXISTS workspace_event_subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES workspace_events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    assigned_to UUID REFERENCES workspace_members(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Event Comments Table
CREATE TABLE IF NOT EXISTS workspace_event_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES workspace_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES workspace_members(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Secure Media & Document Attachments Table
CREATE TABLE IF NOT EXISTS workspace_event_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES workspace_events(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    storage_token TEXT UNIQUE NOT NULL,
    uploaded_by UUID REFERENCES workspace_members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Audit & Revision History Table
CREATE TABLE IF NOT EXISTS workspace_event_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES workspace_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES workspace_members(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    changes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Active Security Sessions
CREATE TABLE IF NOT EXISTS workspace_active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES workspace_members(id) ON DELETE CASCADE,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    is_revoked BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Security Audit Logs Table
CREATE TABLE IF NOT EXISTS workspace_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES workspace_members(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_resource TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'unauthorized')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Global Security Settings
CREATE TABLE IF NOT EXISTS workspace_security_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO workspace_security_settings (key, value) VALUES
    ('mfa_policy', '{"required_for_admin": false, "enforce_all": false}'::jsonb),
    ('session_timeout', '{"max_age_minutes": 1440, "idle_timeout_minutes": 120}'::jsonb),
    ('file_limits', '{"max_file_size_mb": 25, "allowed_extensions": ["pdf","docx","xlsx","pptx","png","jpg","jpeg","webp","mp3","wav"]}'::jsonb),
    ('invite_policy', '{"require_admin_approval": true, "domain_restriction": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;
