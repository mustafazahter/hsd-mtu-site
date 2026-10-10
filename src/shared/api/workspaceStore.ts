import {
    WorkspaceEvent,
    WorkspaceMember,
    RolePermissions,
    WorkspaceCalendar,
    ActiveSession,
    AuditLogRecord,
    WorkspaceSecuritySettings,
    EventSubtask,
    EventComment,
    EventAttachment,
    EventHistoryRecord,
    WorkspaceRole,
    EventReminder,
    WorkspaceNotification,
    ReminderTargetType,
    ReminderTiming,
    WorkspaceGroup
} from './workspaceTypes';

// Initial Core Members Seed
const DEFAULT_MEMBERS: WorkspaceMember[] = [
    {
        id: 'mem-1',
        email: 'admin@hsdmtu.site',
        display_name: 'HSD Lead (Super Admin)',
        role: 'super_admin',
        status: 'approved',
        mfa_enabled: true,
        last_active_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'mem-1b',
        email: 'admin@hsdmtu.com',
        display_name: 'HSD Lead (Com Super Admin)',
        role: 'super_admin',
        status: 'approved',
        mfa_enabled: true,
        last_active_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'mem-2',
        email: 'proje@hsdmtu.com',
        display_name: 'Proje Komitesi Lideri',
        role: 'workspace_admin',
        status: 'approved',
        mfa_enabled: false,
        last_active_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'mem-3',
        email: 'etkinlik@hsdmtu.com',
        display_name: 'Etkinlik & Sponsorluk Kaptanı',
        role: 'editor',
        status: 'approved',
        mfa_enabled: false,
        last_active_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'mem-4',
        email: 'tasarim@hsdmtu.com',
        display_name: 'Sosyal Medya & Tasarım Lideri',
        role: 'editor',
        status: 'approved',
        mfa_enabled: false,
        last_active_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'mem-5',
        email: 'medium@hsdmtu.com',
        display_name: 'Medium Komitesi Editörü',
        role: 'editor',
        status: 'approved',
        mfa_enabled: false,
        last_active_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
    }
];

// Initial Permissions Matrix
const DEFAULT_PERMISSIONS: Record<WorkspaceRole, RolePermissions> = {
    super_admin: { role: 'super_admin', can_view: true, can_create: true, can_edit: true, can_delete: true, can_upload: true, can_share: true },
    workspace_admin: { role: 'workspace_admin', can_view: true, can_create: true, can_edit: true, can_delete: true, can_upload: true, can_share: true },
    editor: { role: 'editor', can_view: true, can_create: true, can_edit: true, can_delete: true, can_upload: true, can_share: false },
    contributor: { role: 'contributor', can_view: true, can_create: true, can_edit: false, can_delete: false, can_upload: true, can_share: false },
    viewer: { role: 'viewer', can_view: true, can_create: false, can_edit: false, can_delete: false, can_upload: false, can_share: false },
};

// Calendars
const DEFAULT_CALENDARS: WorkspaceCalendar[] = [
    { id: 'cal-1', title: 'Ana Topluluk Takvimi', color: '#dc2626', description: 'Tüm topluluğun takip ettiği genel takvim', created_at: new Date().toISOString() },
    { id: 'cal-2', title: 'Proje Komitesi Takvimi', color: '#8b5cf6', description: 'Yazılım, donanım ve teknik proje süreçleri', created_at: new Date().toISOString() },
    { id: 'cal-3', title: 'Etkinlik & Sponsorluk Takvimi', color: '#ef4444', description: 'Etkinlik organizasyonları ve sponsorluk görüşmeleri', created_at: new Date().toISOString() },
    { id: 'cal-4', title: 'Sosyal Medya & Tasarım Takvimi', color: '#ec4899', description: 'Görsel tasarım, afiş, video kurgu ve sosyal medya takvimi', created_at: new Date().toISOString() },
    { id: 'cal-5', title: 'Medium Komitesi Yayın Takvimi', color: '#f59e0b', description: 'Medium blog yazıları, teknik içerikler ve bültenler', created_at: new Date().toISOString() },
];

// Sample Events with Rich Notion Details
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();

function getDate(dayOffset: number, hour: number, minute = 0): string {
    const d = new Date(year, month, now.getDate() + dayOffset, hour, minute);
    return d.toISOString();
}

const DEFAULT_EVENTS: WorkspaceEvent[] = [
    {
        id: 'evt-1',
        calendar_id: 'cal-1',
        title: 'HSD Core Team Haftalık Senkronizasyon Toplantısı',
        description: '## Gündem\n- Geçen haftanın etkinlik değerlendirmesi\n- Önümüzdeki Hackathon bütçelemesi\n- Yeni üye başvurularının onaylanması\n\n> [!NOTE]\n> Tüm çekirdek üyelerin katılımı zorunludur.',
        category: 'meeting',
        color: '#dc2626',
        start_time: getDate(0, 15, 0),
        end_time: getDate(0, 16, 30),
        is_all_day: false,
        assignees: ['mem-1', 'mem-2', 'mem-3', 'mem-4'],
        location: 'Online - Google Meet / HSD Discord',
        meeting_link: 'https://meet.google.com/hsd-core-sync',
        status: 'planned',
        version: 1,
        created_by: 'mem-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        subtasks: [
            { id: 'st-1', event_id: 'evt-1', title: 'Toplantı notlarının hazırlanması', completed: true, created_at: new Date().toISOString() },
            { id: 'st-2', event_id: 'evt-1', title: 'Sunum slaytlarının güncellenmesi', completed: false, created_at: new Date().toISOString() },
        ],
        comments: [
            { id: 'cm-1', event_id: 'evt-1', user_id: 'mem-2', author_name: 'Proje Komitesi Lideri', content: 'Proje mimari dokümanını slayta ekledim, inceleyebilirsiniz.', created_at: new Date().toISOString() }
        ],
        attachments: [
            { id: 'att-1', event_id: 'evt-1', file_name: 'Haftalik_Gundem_Dokumani.pdf', file_size: 1420000, file_type: 'application/pdf', file_path: 'docs/gundem.pdf', storage_token: 'tok-gundem-pdf', created_at: new Date().toISOString() }
        ],
        history: [
            { id: 'hist-1', event_id: 'evt-1', user_name: 'HSD Lead', action: 'Etkinlik oluşturuldu', created_at: new Date().toISOString() }
        ]
    },
    {
        id: 'evt-2',
        calendar_id: 'cal-2',
        title: 'Proje Komitesi Kod İncelemesi & Sprint Planlama',
        description: '### İçerik\n1. API Mimarisi & Veritabanı Şeması\n2. Modüler Bileşen Tasarımı\n3. Git Branching & CI/CD Pipeline\n4. Hands-on Kod İnceleme Oturumu',
        category: 'project',
        color: '#8b5cf6',
        start_time: getDate(2, 14, 0),
        end_time: getDate(2, 17, 0),
        is_all_day: false,
        assignees: ['mem-2', 'mem-3'],
        location: 'MTÜ Mühendislik Fakültesi Lab-3',
        meeting_link: 'https://hsdmtu.site/lab-stream',
        status: 'planned',
        version: 1,
        created_by: 'mem-2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        subtasks: [
            { id: 'st-3', event_id: 'evt-2', title: 'Repository alt yapısının kurulması', completed: true, created_at: new Date().toISOString() },
            { id: 'st-4', event_id: 'evt-2', title: 'Sprint görev dağılımının kontrolü', completed: false, created_at: new Date().toISOString() }
        ],
        comments: [],
        attachments: [
            { id: 'att-2', event_id: 'evt-2', file_name: 'Proje_Mimari_Rehberi.docx', file_size: 2150000, file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', file_path: 'docs/mimari.docx', storage_token: 'tok-mimari-doc', created_at: new Date().toISOString() }
        ],
        history: [
            { id: 'hist-2', event_id: 'evt-2', user_name: 'Proje Komitesi Lideri', action: 'Planlama etkinliği takvime eklendi', created_at: new Date().toISOString() }
        ]
    },
    {
        id: 'evt-3',
        calendar_id: 'cal-4',
        title: 'Huawei AI & Cloud National Hackathon Hazırlık Kampı',
        description: 'Tüm takımların proje mimarisi sunumları, API entegrasyonları ve test süreçleri.',
        category: 'hackathon',
        color: '#10b981',
        start_time: getDate(5, 10, 0),
        end_time: getDate(6, 18, 0),
        is_all_day: true,
        assignees: ['mem-1', 'mem-3', 'mem-4'],
        location: 'Teknokent İnovasyon Merkezi',
        status: 'planned',
        version: 1,
        created_by: 'mem-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        subtasks: [],
        comments: [],
        attachments: [],
        history: []
    },
    {
        id: 'evt-4',
        calendar_id: 'cal-3',
        title: 'YouTube Canlı Yayın: Next.js 15 & Modern Web Mimari',
        description: 'Canlı yayında sıfırdan yüksek performanslı web mimarisi geliştireceğiz.',
        category: 'youtube',
        color: '#3b82f6',
        start_time: getDate(3, 20, 0),
        end_time: getDate(3, 21, 30),
        is_all_day: false,
        assignees: ['mem-3'],
        location: 'HSD YouTube Studio',
        meeting_link: 'https://youtube.com/@hsdmtu/live',
        status: 'planned',
        version: 1,
        created_by: 'mem-3',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        subtasks: [],
        comments: [],
        attachments: [],
        history: []
    }
];

const DEFAULT_SESSIONS: ActiveSession[] = [
    {
        id: 'sess-1',
        user_id: 'mem-1',
        user_name: 'HSD Lead (Super Admin)',
        user_email: 'admin@hsdmtu.site',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
        is_revoked: false,
        last_seen_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        id: 'sess-2',
        user_id: 'mem-2',
        user_name: 'Proje Komitesi Lideri',
        user_email: 'proje@hsdmtu.com',
        ip_address: '10.0.0.45',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        is_revoked: false,
        last_seen_at: new Date(Date.now() - 1800000).toISOString(),
        created_at: new Date(Date.now() - 7200000).toISOString(),
    }
];

const DEFAULT_AUDIT_LOGS: AuditLogRecord[] = [
    {
        id: 'log-1',
        user_id: 'mem-1',
        user_name: 'HSD Lead (Super Admin)',
        action: 'USER_LOGIN_SUCCESS',
        target_resource: '/workspace/auth',
        details: { method: 'MFA_VERIFIED' },
        ip_address: '192.168.1.100',
        status: 'success',
        created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        id: 'log-2',
        user_id: 'mem-2',
        user_name: 'Proje Komitesi Lideri',
        action: 'EVENT_UPDATE',
        target_resource: 'evt-2 (Kod İncelemesi)',
        details: { updated_fields: ['start_time', 'description'] },
        ip_address: '10.0.0.45',
        status: 'success',
        created_at: new Date(Date.now() - 1800000).toISOString(),
    }
];

const DEFAULT_GROUPS: WorkspaceGroup[] = [
    {
        id: 'grp-1',
        name: 'Proje Komitesi',
        code: 'proje_komitesi',
        description: 'Yazılım, donanım, yapay zeka ve AR-GE projelerini yürüten ana komite.',
        color: '#8b5cf6',
        members: ['mem-1', 'mem-2'],
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'grp-2',
        name: 'Etkinlik & Sponsorluk Komitesi',
        code: 'etkinlik_sponsorluk_komitesi',
        description: 'Topluluk içi/dışı etkinliklerin planlanması, sponsor ilişkileri ve bütçe yönetimi.',
        color: '#dc2626',
        members: ['mem-1', 'mem-3'],
        created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'grp-3',
        name: 'Sosyal Medya & Tasarım Komitesi',
        code: 'sosyal_medya_tasarim_komitesi',
        description: 'Grafik tasarım, afiş, sosyal medya yönetimi, video çekimi ve kurgu komitesi.',
        color: '#ec4899',
        members: ['mem-1', 'mem-4'],
        created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'grp-4',
        name: 'Medium Komitesi',
        code: 'medium_komitesi',
        description: 'Medium blog içerikleri, teknik makale yazımı ve topluluk bültenlerinin yayınlanması.',
        color: '#f59e0b',
        members: ['mem-1', 'mem-5'],
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'grp-5',
        name: 'Super Admin Yöneticileri',
        code: 'super_admin_group',
        description: 'Tüm sistem ve yetki yönetim haklarına sahip üst yöneticiler.',
        color: '#6366f1',
        role_key: 'super_admin',
        members: ['mem-1', 'mem-1b'],
        created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
    },
];

const DEFAULT_SETTINGS: WorkspaceSecuritySettings = {
    mfa_policy: { required_for_admin: false, enforce_all: false },
    session_timeout: { max_age_minutes: 1440, idle_timeout_minutes: 120 },
    file_limits: { max_file_size_mb: 25, allowed_extensions: ['pdf', 'docx', 'xlsx', 'pptx', 'png', 'jpg', 'jpeg', 'webp', 'mp3', 'wav'] },
    invite_policy: { require_admin_approval: true, domain_restriction: '' },
};

const DEFAULT_NOTIFICATIONS: WorkspaceNotification[] = [
    {
        id: 'notif-1',
        user_id: 'mem-1',
        event_id: 'evt-1',
        event_title: 'HSD Core Team Haftalık Senkronizasyon Toplantısı',
        title: '🔔 Etkinlik Hatırlatıcısı',
        message: 'HSD Core Team Haftalık Senkronizasyon Toplantısı bugün 15:00\'te başlayacaktır.',
        type: 'reminder',
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        id: 'notif-2',
        user_id: 'mem-2',
        event_id: 'evt-2',
        event_title: 'OWASP Top 10 Web Güvenliği Workshop & Lab',
        title: '📌 Yeni Etkinlik Daveti',
        message: 'Siber Güvenlik Lideri sizi "OWASP Top 10 Web Güvenliği Workshop & Lab" etkinliğine davet etti.',
        type: 'event_created',
        is_read: false,
        created_at: new Date(Date.now() - 7200000).toISOString(),
    }
];

// Storage Singleton pattern for workspace state
class WorkspaceStoreManager {
    private members: WorkspaceMember[] = DEFAULT_MEMBERS;
    private permissions: Record<WorkspaceRole, RolePermissions> = DEFAULT_PERMISSIONS;
    private calendars: WorkspaceCalendar[] = DEFAULT_CALENDARS;
    private events: WorkspaceEvent[] = DEFAULT_EVENTS;
    private sessions: ActiveSession[] = DEFAULT_SESSIONS;
    private auditLogs: AuditLogRecord[] = DEFAULT_AUDIT_LOGS;
    private settings: WorkspaceSecuritySettings = DEFAULT_SETTINGS;
    private notifications: WorkspaceNotification[] = DEFAULT_NOTIFICATIONS;
    private groups: WorkspaceGroup[] = DEFAULT_GROUPS;

    // Groups Management
    getGroups(): WorkspaceGroup[] {
        return [...this.groups];
    }

    getGroupById(id: string): WorkspaceGroup | undefined {
        return this.groups.find(g => g.id === id);
    }

    addGroup(groupData: Omit<WorkspaceGroup, 'id' | 'created_at' | 'updated_at'>): WorkspaceGroup {
        const newGroup: WorkspaceGroup = {
            ...groupData,
            id: `grp-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        this.groups.push(newGroup);
        this.logAudit(undefined, 'GROUP_CREATED', `Group ${newGroup.name}`, { membersCount: newGroup.members.length }, 'success');
        return newGroup;
    }

    updateGroup(id: string, updates: Partial<WorkspaceGroup>, updatedBy?: string): WorkspaceGroup | undefined {
        const index = this.groups.findIndex(g => g.id === id);
        if (index === -1) return undefined;
        this.groups[index] = {
            ...this.groups[index],
            ...updates,
            updated_at: new Date().toISOString(),
        };
        this.logAudit(updatedBy, 'GROUP_UPDATED', `Group ${id}`, updates, 'success');
        return this.groups[index];
    }

    deleteGroup(id: string, deletedBy?: string): boolean {
        const index = this.groups.findIndex(g => g.id === id);
        if (index === -1) return false;
        const groupName = this.groups[index].name;
        this.groups.splice(index, 1);
        this.logAudit(deletedBy, 'GROUP_DELETED', `Group ${groupName}`, {}, 'success');
        return true;
    }

    // Notifications Management
    getNotifications(userId: string): WorkspaceNotification[] {
        return this.notifications
            .filter(n => n.user_id === userId)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    markNotificationRead(id: string, userId: string): boolean {
        const notif = this.notifications.find(n => n.id === id && n.user_id === userId);
        if (!notif) return false;
        notif.is_read = true;
        return true;
    }

    markAllNotificationsRead(userId: string): boolean {
        let updated = false;
        this.notifications.forEach(n => {
            if (n.user_id === userId && !n.is_read) {
                n.is_read = true;
                updated = true;
            }
        });
        return updated;
    }

    dispatchNotificationsForEvent(event: WorkspaceEvent, authorName: string, authorId?: string): void {
        if (!event.reminders || event.reminders.length === 0) return;

        const timingLabels: Record<ReminderTiming, string> = {
            at_event_time: 'Etkinlik zamanında',
            '15_min': '15 dakika önce',
            '1_hour': '1 saat önce',
            '1_day': '1 gün önce',
        };

        event.reminders.forEach(rem => {
            let targetUserIds: string[] = [];

            if (rem.target_type === 'all_members') {
                targetUserIds = this.members.map(m => m.id);
            } else if (rem.target_type === 'role_group' && rem.target_role) {
                targetUserIds = this.members.filter(m => m.role === rem.target_role).map(m => m.id);
            } else if (rem.target_type === 'custom_group' && rem.target_group_id) {
                const grp = this.groups.find(g => g.id === rem.target_group_id);
                if (grp) {
                    targetUserIds = grp.members;
                }
            } else if (rem.target_type === 'selected_members' && rem.target_members) {
                targetUserIds = rem.target_members;
            }

            const uniqueUserIds = Array.from(new Set(targetUserIds));
            const timingText = timingLabels[rem.timing] || rem.timing;
            const channelText = rem.channels.includes('email') ? ' (Site İçi & E-Posta)' : ' (Site İçi)';

            uniqueUserIds.forEach(targetId => {
                const notif: WorkspaceNotification = {
                    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    user_id: targetId,
                    event_id: event.id,
                    event_title: event.title,
                    title: `🔔 Etkinlik Bildirimi: ${event.title}`,
                    message: `${authorName} tarafından düzenlenen "${event.title}" etkinliği için hatırlatıcı/bildirim gönderildi (${timingText})${channelText}.`,
                    type: 'reminder',
                    is_read: false,
                    created_at: new Date().toISOString(),
                };
                this.notifications.unshift(notif);
            });

            this.logAudit(authorId, 'NOTIFICATION_DISPATCHED', `Event ${event.title}`, {
                recipientsCount: uniqueUserIds.length,
                targetType: rem.target_type,
                timing: rem.timing,
            }, 'success');
        });
    }

    dispatchInstantNotification(data: {
        authorId: string;
        authorName: string;
        eventId: string;
        eventTitle: string;
        targetType: string;
        targetRole?: string;
        targetGroupId?: string;
        targetMembers?: string[];
    }): number {
        let targetUserIds: string[] = [];

        if (data.targetType === 'all_members') {
            targetUserIds = this.members.map(m => m.id);
        } else if (data.targetType === 'role_group' && data.targetRole) {
            targetUserIds = this.members.filter(m => m.role === data.targetRole).map(m => m.id);
        } else if (data.targetType === 'custom_group' && data.targetGroupId) {
            const grp = this.groups.find(g => g.id === data.targetGroupId);
            if (grp) {
                targetUserIds = grp.members;
            }
        } else if (data.targetType === 'selected_members' && data.targetMembers) {
            targetUserIds = data.targetMembers;
        } else {
            targetUserIds = this.members.map(m => m.id);
        }

        const uniqueUserIds = Array.from(new Set(targetUserIds));

        uniqueUserIds.forEach(targetId => {
            const notif: WorkspaceNotification = {
                id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                user_id: targetId,
                event_id: data.eventId,
                event_title: data.eventTitle,
                title: `⚡ ANLIK DUYURU: ${data.eventTitle}`,
                message: `${data.authorName} tarafından "${data.eventTitle}" etkinliği için anlık duyuru gönderildi.`,
                type: 'reminder',
                is_read: false,
                created_at: new Date().toISOString(),
            };
            this.notifications.unshift(notif);
        });

        this.logAudit(data.authorId, 'INSTANT_BROADCAST_DISPATCHED', `Event ${data.eventTitle}`, {
            recipientsCount: uniqueUserIds.length,
            targetType: data.targetType,
        }, 'success');

        return uniqueUserIds.length;
    }

    // Members Management
    getMembers(): WorkspaceMember[] {
        return [...this.members];
    }

    getMemberById(id: string): WorkspaceMember | undefined {
        return this.members.find(m => m.id === id);
    }

    getMemberByEmail(email: string): WorkspaceMember | undefined {
        return this.members.find(m => m.email.toLowerCase() === email.toLowerCase());
    }

    addMember(member: Omit<WorkspaceMember, 'id' | 'created_at' | 'updated_at'>): WorkspaceMember {
        const newMember: WorkspaceMember = {
            ...member,
            id: `mem-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        this.members.push(newMember);
        this.logAudit(newMember.id, 'MEMBER_ADDED', `Member ${newMember.email}`, { role: newMember.role }, 'success');
        return newMember;
    }

    updateMember(id: string, updates: Partial<WorkspaceMember>, updatedBy?: string): WorkspaceMember | undefined {
        const index = this.members.findIndex(m => m.id === id);
        if (index === -1) return undefined;
        this.members[index] = {
            ...this.members[index],
            ...updates,
            updated_at: new Date().toISOString(),
        };
        this.logAudit(updatedBy, 'MEMBER_UPDATED', `Member ${id}`, updates, 'success');
        return this.members[index];
    }

    deleteMember(id: string, deletedBy?: string): boolean {
        const index = this.members.findIndex(m => m.id === id);
        if (index === -1) return false;
        const memberName = this.members[index].display_name;
        this.members.splice(index, 1);

        // Clean member references from custom groups
        this.groups.forEach(g => {
            g.members = g.members.filter(mId => mId !== id);
        });

        this.logAudit(deletedBy, 'MEMBER_DELETED', `Member ${memberName} (${id})`, {}, 'success');
        return true;
    }

    // Role Permissions Matrix
    getPermissions(): Record<WorkspaceRole, RolePermissions> {
        return { ...this.permissions };
    }

    updatePermissions(role: WorkspaceRole, perms: Partial<RolePermissions>, updatedBy?: string): RolePermissions {
        this.permissions[role] = { ...this.permissions[role], ...perms };
        this.logAudit(updatedBy, 'ROLE_PERMISSIONS_UPDATED', `Role ${role}`, perms, 'success');
        return this.permissions[role];
    }

    hasPermission(role: WorkspaceRole, action: keyof Omit<RolePermissions, 'role'>): boolean {
        const rolePerms = this.permissions[role];
        return rolePerms ? !!rolePerms[action] : false;
    }

    // Calendars
    getCalendars(): WorkspaceCalendar[] {
        return [...this.calendars];
    }

    addCalendar(cal: Omit<WorkspaceCalendar, 'id' | 'created_at'>): WorkspaceCalendar {
        const newCal: WorkspaceCalendar = {
            ...cal,
            id: `cal-${Date.now()}`,
            created_at: new Date().toISOString(),
        };
        this.calendars.push(newCal);
        return newCal;
    }

    // Events Management with Concurrency & History
    getEvents(includeDeleted = false): WorkspaceEvent[] {
        return this.events.filter(e => includeDeleted || !e.is_deleted);
    }

    getEventById(id: string): WorkspaceEvent | undefined {
        return this.events.find(e => e.id === id);
    }

    createEvent(eventData: Omit<WorkspaceEvent, 'id' | 'version' | 'created_at' | 'updated_at'>, authorName = 'System'): WorkspaceEvent {
        const newEvent: WorkspaceEvent = {
            ...eventData,
            id: `evt-${Date.now()}`,
            version: 1,
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            subtasks: eventData.subtasks || [],
            comments: eventData.comments || [],
            attachments: eventData.attachments || [],
            reminders: eventData.reminders || [],
            history: [
                {
                    id: `hist-${Date.now()}`,
                    event_id: `evt-${Date.now()}`,
                    user_name: authorName,
                    action: 'Etkinlik oluşturuldu',
                    created_at: new Date().toISOString(),
                }
            ]
        };
        this.events.push(newEvent);
        this.logAudit(newEvent.created_by, 'EVENT_CREATE', `Event ${newEvent.title}`, { id: newEvent.id }, 'success');

        if (newEvent.reminders && newEvent.reminders.length > 0) {
            this.dispatchNotificationsForEvent(newEvent, authorName, newEvent.created_by);
        }

        return newEvent;
    }

    updateEvent(id: string, updates: Partial<WorkspaceEvent>, expectedVersion?: number, authorName = 'User'): { success: boolean; event?: WorkspaceEvent; error?: string } {
        const index = this.events.findIndex(e => e.id === id);
        if (index === -1) return { success: false, error: 'Etkinlik bulunamadı.' };

        const currentEvent = this.events[index];

        // Optimistic Concurrency Control Check
        if (expectedVersion !== undefined && currentEvent.version !== expectedVersion) {
            return {
                success: false,
                error: 'Çakışma Algılandı: Bu etkinlik başka bir ekip üyesi tarafından güncellendi. Lütfen sayfayı yenileyip tekrar deneyin.'
            };
        }

        const updatedEvent: WorkspaceEvent = {
            ...currentEvent,
            ...updates,
            version: currentEvent.version + 1,
            updated_at: new Date().toISOString(),
            history: [
                ...(currentEvent.history || []),
                {
                    id: `hist-${Date.now()}`,
                    event_id: id,
                    user_name: authorName,
                    action: 'Etkinlik güncellendi',
                    changes: updates,
                    created_at: new Date().toISOString(),
                }
            ]
        };

        this.events[index] = updatedEvent;
        this.logAudit(updatedEvent.updated_by, 'EVENT_UPDATE', `Event ${id}`, { version: updatedEvent.version }, 'success');

        if (updates.reminders && updates.reminders.length > 0) {
            this.dispatchNotificationsForEvent(updatedEvent, authorName, updatedEvent.updated_by);
        }

        return { success: true, event: updatedEvent };
    }

    deleteEvent(id: string, authorName = 'User', userId?: string): boolean {
        const event = this.getEventById(id);
        if (!event) return false;

        event.is_deleted = true;
        event.updated_at = new Date().toISOString();
        event.history = [
            ...(event.history || []),
            {
                id: `hist-${Date.now()}`,
                event_id: id,
                user_name: authorName,
                action: 'Etkinlik çöp kutusuna taşındı',
                created_at: new Date().toISOString(),
            }
        ];
        this.logAudit(userId, 'EVENT_DELETE', `Event ${id}`, { title: event.title }, 'success');
        return true;
    }

    restoreEvent(id: string, authorName = 'Admin', userId?: string): boolean {
        const event = this.events.find(e => e.id === id);
        if (!event) return false;

        event.is_deleted = false;
        event.updated_at = new Date().toISOString();
        event.history = [
            ...(event.history || []),
            {
                id: `hist-${Date.now()}`,
                event_id: id,
                user_name: authorName,
                action: 'Etkinlik çöp kutusundan geri yüklendi',
                created_at: new Date().toISOString(),
            }
        ];
        this.logAudit(userId, 'EVENT_RESTORE', `Event ${id}`, { title: event.title }, 'success');
        return true;
    }

    // Subtasks
    addSubtask(eventId: string, title: string, assignedTo?: string): EventSubtask | undefined {
        const event = this.getEventById(eventId);
        if (!event) return undefined;

        const subtask: EventSubtask = {
            id: `st-${Date.now()}`,
            event_id: eventId,
            title,
            completed: false,
            assigned_to: assignedTo,
            created_at: new Date().toISOString(),
        };

        event.subtasks = event.subtasks || [];
        event.subtasks.push(subtask);
        event.updated_at = new Date().toISOString();
        return subtask;
    }

    toggleSubtask(eventId: string, subtaskId: string): boolean {
        const event = this.getEventById(eventId);
        if (!event || !event.subtasks) return false;

        const subtask = event.subtasks.find(s => s.id === subtaskId);
        if (!subtask) return false;

        subtask.completed = !subtask.completed;
        event.updated_at = new Date().toISOString();
        return true;
    }

    // Comments
    addComment(eventId: string, userId: string, authorName: string, content: string): EventComment | undefined {
        const event = this.getEventById(eventId);
        if (!event) return undefined;

        const comment: EventComment = {
            id: `cm-${Date.now()}`,
            event_id: eventId,
            user_id: userId,
            author_name: authorName,
            content,
            created_at: new Date().toISOString(),
        };

        event.comments = event.comments || [];
        event.comments.push(comment);
        event.updated_at = new Date().toISOString();
        return comment;
    }

    // Attachments
    addAttachment(eventId: string, fileData: Omit<EventAttachment, 'id' | 'created_at'>): EventAttachment | undefined {
        const event = this.getEventById(eventId);
        if (!event) return undefined;

        const attachment: EventAttachment = {
            ...fileData,
            id: `att-${Date.now()}`,
            created_at: new Date().toISOString(),
        };

        event.attachments = event.attachments || [];
        event.attachments.push(attachment);
        event.updated_at = new Date().toISOString();

        this.logAudit(fileData.uploaded_by, 'FILE_UPLOAD', fileData.file_name, { event_id: eventId, size: fileData.file_size }, 'success');
        return attachment;
    }

    // Active Sessions & Audit Logs
    getSessions(): ActiveSession[] {
        return [...this.sessions];
    }

    revokeSession(sessionId: string, adminUserId?: string): boolean {
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) return false;
        session.is_revoked = true;
        this.logAudit(adminUserId, 'SESSION_REVOKED', `Session ${sessionId}`, { user_id: session.user_id }, 'success');
        return true;
    }

    getAuditLogs(): AuditLogRecord[] {
        return [...this.auditLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    logAudit(userId?: string, action?: string, targetResource?: string, details?: Record<string, any>, status: 'success' | 'failed' | 'unauthorized' = 'success') {
        const member = userId ? this.getMemberById(userId) : undefined;
        const log: AuditLogRecord = {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            user_id: userId,
            user_name: member?.display_name || 'System / Guest',
            action: action || 'UNKNOWN_ACTION',
            target_resource: targetResource || 'System',
            details: details || {},
            ip_address: '127.0.0.1',
            status,
            created_at: new Date().toISOString(),
        };
        this.auditLogs.unshift(log);
        if (this.auditLogs.length > 500) {
            this.auditLogs.pop();
        }
    }

    // Global Settings
    getSettings(): WorkspaceSecuritySettings {
        return { ...this.settings };
    }

    updateSettings(newSettings: Partial<WorkspaceSecuritySettings>, updatedBy?: string): WorkspaceSecuritySettings {
        this.settings = { ...this.settings, ...newSettings };
        this.logAudit(updatedBy, 'SECURITY_SETTINGS_UPDATED', 'Global Security Settings', newSettings, 'success');
        return this.settings;
    }
}

// Global Singleton Export
export const workspaceStore = new WorkspaceStoreManager();
