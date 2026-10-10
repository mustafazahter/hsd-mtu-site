export type WorkspaceRole = 'super_admin' | 'workspace_admin' | 'editor' | 'contributor' | 'viewer';

export type MemberStatus = 'pending' | 'approved' | 'disabled' | 'revoked';

export type EventCategory = 'meeting' | 'youtube' | 'hackathon' | 'training' | 'project' | 'social';

export type EventStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface WorkspaceMember {
    id: string;
    auth_id?: string;
    email: string;
    display_name: string;
    password?: string;
    avatar_url?: string;
    role: WorkspaceRole;
    status: MemberStatus;
    mfa_enabled?: boolean;
    invited_by?: string;
    last_active_at?: string;
    created_at: string;
    updated_at: string;
}

export interface RolePermissions {
    role: WorkspaceRole;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_upload: boolean;
    can_share: boolean;
}

export interface WorkspaceCalendar {
    id: string;
    title: string;
    color: string;
    description?: string;
    is_private?: boolean;
    created_by?: string;
    created_at: string;
}

export interface EventSubtask {
    id: string;
    event_id: string;
    title: string;
    completed: boolean;
    assigned_to?: string;
    due_date?: string;
    created_at: string;
}

export interface EventComment {
    id: string;
    event_id: string;
    user_id: string;
    author_name: string;
    content: string;
    created_at: string;
}

export interface EventAttachment {
    id: string;
    event_id: string;
    file_name: string;
    file_size: number;
    file_type: string;
    file_path: string;
    storage_token: string;
    uploaded_by?: string;
    created_at: string;
    download_url?: string;
    data_url?: string;
    content_text?: string;
}

export interface EventHistoryRecord {
    id: string;
    event_id: string;
    user_id?: string;
    user_name: string;
    action: string;
    changes?: Record<string, any>;
    created_at: string;
}

export interface WorkspaceGroup {
    id: string;
    name: string;
    code: string;
    description: string;
    color: string;
    role_key?: WorkspaceRole;
    members: string[]; // Member IDs assigned to this group
    created_at: string;
    updated_at: string;
}

export type ReminderTiming = 'at_event_time' | '15_min' | '1_hour' | '1_day';
export type ReminderTargetType = 'selected_members' | 'role_group' | 'all_members' | 'custom_group';

export interface EventReminder {
    id: string;
    target_type: ReminderTargetType;
    target_members?: string[]; // Member IDs
    target_role?: WorkspaceRole; // Role if role_group
    target_group_id?: string; // Group ID if custom_group
    target_group_name?: string;
    timing: ReminderTiming;
    channels: ('in_app' | 'email')[];
    send_immediately?: boolean;
}

export interface WorkspaceNotification {
    id: string;
    user_id: string;
    event_id?: string;
    event_title?: string;
    title: string;
    message: string;
    type: 'reminder' | 'event_created' | 'event_updated' | 'general';
    is_read: boolean;
    created_at: string;
}

export interface WorkspaceEvent {
    id: string;
    calendar_id: string;
    title: string;
    description?: string;
    category: EventCategory;
    color: string;
    start_time: string; // ISO string
    end_time: string;   // ISO string
    is_all_day?: boolean;
    recurrence_rule?: string;
    parent_event_id?: string;
    assignees: string[]; // member IDs
    location?: string;
    meeting_link?: string;
    status: EventStatus;
    version: number;
    is_deleted?: boolean;
    created_by?: string;
    updated_by?: string;
    created_at: string;
    updated_at: string;
    // Expanded dynamic properties
    subtasks?: EventSubtask[];
    comments?: EventComment[];
    attachments?: EventAttachment[];
    history?: EventHistoryRecord[];
    reminders?: EventReminder[];
}

export interface ActiveSession {
    id: string;
    user_id: string;
    user_name?: string;
    user_email?: string;
    ip_address: string;
    user_agent?: string;
    is_revoked: boolean;
    last_seen_at: string;
    created_at: string;
}

export interface AuditLogRecord {
    id: string;
    user_id?: string;
    user_name?: string;
    action: string;
    target_resource: string;
    details?: Record<string, any>;
    ip_address?: string;
    status: 'success' | 'failed' | 'unauthorized';
    created_at: string;
}

export interface WorkspaceSecuritySettings {
    mfa_policy: {
        required_for_admin: boolean;
        enforce_all: boolean;
    };
    session_timeout: {
        max_age_minutes: number;
        idle_timeout_minutes: number;
    };
    file_limits: {
        max_file_size_mb: number;
        allowed_extensions: string[];
    };
    invite_policy: {
        require_admin_approval: boolean;
        domain_restriction: string;
    };
}
