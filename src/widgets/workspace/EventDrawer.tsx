'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    WorkspaceEvent,
    WorkspaceCalendar,
    WorkspaceMember,
    EventCategory,
    EventStatus,
    RolePermissions,
    EventReminder,
    ReminderTargetType,
    ReminderTiming,
    WorkspaceRole,
    WorkspaceGroup
} from '@/shared/api/workspaceTypes';

interface EventDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    event: Partial<WorkspaceEvent> | null;
    calendars: WorkspaceCalendar[];
    members: Partial<WorkspaceMember>[];
    permissions?: RolePermissions;
    currentUser: { id: string; displayName: string; role: string } | null;
    onSave: (eventData: Partial<WorkspaceEvent>) => Promise<void>;
    onDelete?: (eventId: string) => Promise<void>;
    allEvents: WorkspaceEvent[];
}

const CATEGORY_OPTIONS: { value: EventCategory; label: string; color: string }[] = [
    { value: 'meeting', label: 'Topluluk Toplantısı', color: '#dc2626' },
    { value: 'youtube', label: 'YouTube Yayını', color: '#3b82f6' },
    { value: 'hackathon', label: 'Hackathon Hazırlığı', color: '#10b981' },
    { value: 'training', label: 'Eğitim & Workshop', color: '#f59e0b' },
    { value: 'project', label: 'Proje Teslimi', color: '#8b5cf6' },
    { value: 'social', label: 'Sosyal Etkinlik', color: '#ec4899' },
];

export default function EventDrawer({
    isOpen,
    onClose,
    event,
    calendars,
    members,
    permissions,
    currentUser,
    onSave,
    onDelete,
    allEvents
}: EventDrawerProps) {
    const [activeTab, setActiveTab] = useState<'content' | 'subtasks' | 'attachments' | 'comments' | 'history'>('content');

    // Form states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [calendarId, setCalendarId] = useState('');
    const [category, setCategory] = useState<EventCategory>('meeting');
    const [color, setColor] = useState('#dc2626');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [isAllDay, setIsAllDay] = useState(false);
    const [location, setLocation] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    const [status, setStatus] = useState<EventStatus>('planned');
    const [assignees, setAssignees] = useState<string[]>([]);
    const [recurrenceRule, setRecurrenceRule] = useState('');

    // Dynamic lists
    const [subtasks, setSubtasks] = useState(event?.subtasks || []);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [comments, setComments] = useState(event?.comments || []);
    const [newCommentText, setNewCommentText] = useState('');
    const [attachments, setAttachments] = useState(event?.attachments || []);

    // Reminder states
    const [reminders, setReminders] = useState<EventReminder[]>(event?.reminders || []);
    const [remTargetType, setRemTargetType] = useState<ReminderTargetType>('all_members');
    const [remTargetRole, setRemTargetRole] = useState<WorkspaceRole>('contributor');
    const [remTargetGroupId, setRemTargetGroupId] = useState<string | undefined>(undefined);
    const [remTargetGroupName, setRemTargetGroupName] = useState<string | undefined>(undefined);
    const [remTargetMembers, setRemTargetMembers] = useState<string[]>([]);
    const [remTiming, setRemTiming] = useState<ReminderTiming>('15_min');
    const [remInApp, setRemInApp] = useState(true);
    const [remEmail, setRemEmail] = useState(true);

    const [groups, setGroups] = useState<WorkspaceGroup[]>([]);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [broadcastSuccessMsg, setBroadcastSuccessMsg] = useState<string | null>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [conflictWarning, setConflictWarning] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [previewAttachment, setPreviewAttachment] = useState<any | null>(null);

    useEffect(() => {
        fetch('/api/workspace/admin/groups')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.groups) setGroups(data.groups);
            })
            .catch(err => console.error('Failed to load groups in EventDrawer', err));
    }, []);

    useEffect(() => {
        if (event) {
            setTitle(event.title || '');
            setDescription(event.description || '');
            setCalendarId(event.calendar_id || (calendars[0]?.id || 'cal-1'));
            setCategory(event.category || 'meeting');
            setColor(event.color || '#dc2626');
            setStartTime(event.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
            setEndTime(event.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : new Date(Date.now() + 3600000).toISOString().slice(0, 16));
            setIsAllDay(!!event.is_all_day);
            setLocation(event.location || '');
            setMeetingLink(event.meeting_link || '');
            setStatus(event.status || 'planned');
            setAssignees(event.assignees || []);
            setRecurrenceRule(event.recurrence_rule || '');
            setSubtasks(event.subtasks || []);
            setComments(event.comments || []);
            setAttachments(event.attachments || []);
            setReminders(event.reminders || []);
            setErrorMessage(null);
        }
    }, [event, calendars]);

    // Detect scheduling conflicts
    useEffect(() => {
        if (!startTime || !endTime) {
            setConflictWarning(null);
            return;
        }

        const startMs = new Date(startTime).getTime();
        const endMs = new Date(endTime).getTime();

        const conflict = allEvents.find(e => {
            if (e.id === event?.id || e.is_deleted) return false;
            const eStart = new Date(e.start_time).getTime();
            const eEnd = new Date(e.end_time).getTime();
            return (startMs < eEnd && endMs > eStart);
        });

        if (conflict) {
            setConflictWarning(`Çakışma Uyarısı: "${conflict.title}" etkinliği ile aynı saat dilimine denk geliyor.`);
        } else {
            setConflictWarning(null);
        }
    }, [startTime, endTime, allEvents, event?.id]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setErrorMessage('Lütfen bir etkinlik başlığı girin.');
            return;
        }

        setIsSaving(true);
        setErrorMessage(null);

        try {
            await onSave({
                id: event?.id,
                title: title.trim(),
                description,
                calendar_id: calendarId,
                category,
                color,
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTime).toISOString(),
                is_all_day: isAllDay,
                location,
                meeting_link: meetingLink,
                status,
                assignees,
                recurrence_rule: recurrenceRule,
                version: event?.version,
                subtasks,
                comments,
                attachments,
                reminders
            });
            onClose();
        } catch (err: any) {
            setErrorMessage(err.message || 'Etkinlik kaydedilemedi.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddSubtask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubtaskTitle.trim()) return;

        const newSt = {
            id: `st-${Date.now()}`,
            event_id: event?.id || 'temp',
            title: newSubtaskTitle.trim(),
            completed: false,
            created_at: new Date().toISOString(),
        };

        setSubtasks([...subtasks, newSt]);
        setNewSubtaskTitle('');
    };

    const toggleSubtask = (stId: string) => {
        setSubtasks(subtasks.map(st => st.id === stId ? { ...st, completed: !st.completed } : st));
    };

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCommentText.trim() || !currentUser) return;

        const newCm = {
            id: `cm-${Date.now()}`,
            event_id: event?.id || 'temp',
            user_id: currentUser.id,
            author_name: currentUser.displayName,
            content: newCommentText.trim(),
            created_at: new Date().toISOString(),
        };

        setComments([...comments, newCm]);
        setNewCommentText('');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !event?.id) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('eventId', event.id);
        formData.append('file', file);

        try {
            const res = await fetch('/api/workspace/files/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.success && data.attachment) {
                setAttachments([...attachments, data.attachment]);
            } else {
                alert(data.error || 'Dosya yükleme hatası.');
            }
        } catch {
            alert('Dosya sunucuya gönderilemedi.');
        } finally {
            setIsUploading(false);
        }
    };

    const toggleAssignee = (mId: string) => {
        if (assignees.includes(mId)) {
            setAssignees(assignees.filter(id => id !== mId));
        } else {
            setAssignees([...assignees, mId]);
        }
    };

    const handleAddReminder = () => {
        const channels: ('in_app' | 'email')[] = [];
        if (remInApp) channels.push('in_app');
        if (remEmail) channels.push('email');
        if (channels.length === 0) {
            alert('Lütfen en az bir bildirim kanalı seçin (Site İçi veya E-Posta).');
            return;
        }

        const selectedGroup = remTargetType === 'custom_group' ? groups.find(g => g.id === remTargetGroupId) : undefined;

        const newRem: EventReminder = {
            id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            target_type: remTargetType,
            target_role: remTargetType === 'role_group' ? remTargetRole : undefined,
            target_group_id: remTargetType === 'custom_group' ? remTargetGroupId : undefined,
            target_group_name: remTargetType === 'custom_group' ? (remTargetGroupName || selectedGroup?.name) : undefined,
            target_members: remTargetType === 'selected_members' ? (remTargetMembers.length > 0 ? remTargetMembers : assignees) : undefined,
            timing: remTiming,
            channels,
            send_immediately: true,
        };

        setReminders([...reminders, newRem]);
    };

    const handleSendInstantBroadcast = async () => {
        setIsBroadcasting(true);
        setBroadcastSuccessMsg(null);
        try {
            const res = await fetch('/api/workspace/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'dispatch_event_reminder',
                    eventId: event?.id || 'temp-event',
                    eventTitle: title || 'Etkinlik Duyurusu',
                    targetType: remTargetType,
                    targetRole: remTargetRole,
                    targetGroupId: remTargetGroupId,
                    targetMembers: assignees,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setBroadcastSuccessMsg(`⚡ Bildirim ${data.recipientsCount || 1} kişiye başarıyla iletildi!`);
            } else {
                alert(data.error || 'Bildirim gönderilemedi.');
            }
        } catch (err) {
            alert('Sunucuya erişilemedi.');
        } finally {
            setIsBroadcasting(false);
        }
    };

    const removeReminder = (remId: string) => {
        setReminders(reminders.filter(r => r.id !== remId));
    };

    return (
        <>
            {/* Event Drawer Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div key="ws-drawer-overlay-key" className="ws-drawer-overlay" onClick={onClose}>
                        <motion.div
                            key="ws-drawer-panel-key"
                            className="ws-drawer"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Drawer Header */}
                            <div className="ws-drawer-header">
                                <div>
                                    <span className="ws-brand-badge" style={{ backgroundColor: `${color}20`, borderColor: `${color}40`, color }}>
                                        {CATEGORY_OPTIONS.find(c => c.value === category)?.label || category}
                                    </span>
                                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '4px' }}>
                                        {event?.id ? 'Etkinlik & Çalışma Alanı Detayları' : 'Yeni Etkinlik Oluştur'}
                                    </h2>
                                </div>
                                <button onClick={onClose} className="ws-btn-secondary" style={{ padding: '6px 10px' }}>
                                    ✕ Close
                                </button>
                            </div>

                            {/* Navigation Tabs - Original Clean 5 Tabs */}
                            <div style={{ display: 'flex', borderBottom: '1px solid var(--ws-surface-border)', padding: '0 1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                                {[
                                    { id: 'content', label: 'Genel & Notlar' },
                                    { id: 'subtasks', label: `Kontrol Listesi (${subtasks.filter(s => s.completed).length}/${subtasks.length})` },
                                    { id: 'attachments', label: `Dosyalar (${attachments.length})` },
                                    { id: 'comments', label: `Yorumlar (${comments.length})` },
                                    { id: 'history', label: 'Değişiklik Geçmişi' },
                                ].map((tab, idx) => (
                                    <button
                                        key={tab.id || `tab-${idx}`}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        style={{
                                            padding: '10px 14px',
                                            fontSize: '0.83rem',
                                            fontWeight: 600,
                                            border: 'none',
                                            background: 'transparent',
                                            color: activeTab === tab.id ? '#dc2626' : 'var(--ws-text-muted)',
                                            borderBottom: activeTab === tab.id ? '2px solid #dc2626' : '2px solid transparent',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Drawer Content */}
                            <div className="ws-drawer-body">
                                {errorMessage && (
                                    <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
                                        ⚠️ {errorMessage}
                                    </div>
                                )}

                                {conflictWarning && (
                                    <div className="ws-alert-conflict">
                                        ⚠️ {conflictWarning}
                                    </div>
                                )}

                                {activeTab === 'content' && (
                                    <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '6px' }}>
                                                Etkinlik Başlığı *
                                            </label>
                                            <input
                                                type="text"
                                                className="ws-input"
                                                placeholder="ör. OWASP Top 10 Workshop Hazırlığı"
                                                value={title}
                                                onChange={e => setTitle(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '6px' }}>
                                                    Kategori & Tür
                                                </label>
                                                <select
                                                    className="ws-input"
                                                    value={category}
                                                    onChange={e => {
                                                        const cat = e.target.value as EventCategory;
                                                        setCategory(cat);
                                                        const opt = CATEGORY_OPTIONS.find(o => o.value === cat);
                                                        if (opt) setColor(opt.color);
                                                    }}
                                                >
                                                    {CATEGORY_OPTIONS.map((opt, idx) => (
                                                        <option key={opt.value || `opt-${idx}`} value={opt.value} style={{ background: '#12141d' }}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '6px' }}>
                                                    Takvim Çalışma Alanı
                                                </label>
                                                <select
                                                    className="ws-input"
                                                    value={calendarId}
                                                    onChange={e => setCalendarId(e.target.value)}
                                                >
                                                    {calendars.map((c, idx) => (
                                                        <option key={c.id || `cal-opt-${idx}`} value={c.id} style={{ background: '#12141d' }}>
                                                            {c.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '6px' }}>
                                                    Başlangıç Tarihi & Saati
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    className="ws-input"
                                                    value={startTime}
                                                    onChange={e => setStartTime(e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '6px' }}>
                                                    Bitiş Tarihi & Saati
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    className="ws-input"
                                                    value={endTime}
                                                    onChange={e => setEndTime(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isAllDay}
                                                    onChange={e => setIsAllDay(e.target.checked)}
                                                />
                                                Tüm Gün Etkinliği
                                            </label>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '6px' }}>
                                                    Konum / Yer
                                                </label>
                                                <input
                                                    type="text"
                                                    className="ws-input"
                                                    placeholder="ör. MTÜ Mühendislik Lab-2"
                                                    value={location}
                                                    onChange={e => setLocation(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '6px' }}>
                                                    Toplantı Bağlantısı (Meet / Zoom)
                                                </label>
                                                <input
                                                    type="url"
                                                    className="ws-input"
                                                    placeholder="https://meet.google.com/..."
                                                    value={meetingLink}
                                                    onChange={e => setMeetingLink(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '6px' }}>
                                                Sorumlu Üyeler (Assignees)
                                            </label>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {members.map((m, idx) => {
                                                    const memberId = m.id || `mem-${idx}`;
                                                    const isSelected = assignees.includes(memberId);
                                                    return (
                                                        <button
                                                            key={memberId}
                                                            type="button"
                                                            onClick={() => toggleAssignee(memberId)}
                                                            style={{
                                                                padding: '4px 10px',
                                                                borderRadius: '16px',
                                                                fontSize: '0.78rem',
                                                                border: isSelected ? '1px solid #dc2626' : '1px solid var(--ws-surface-border)',
                                                                background: isSelected ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.04)',
                                                                color: isSelected ? '#fff' : 'var(--ws-text-muted)',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {m.display_name || m.email || `Member ${idx + 1}`}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Integrated Reminders & Notifications Section */}
                                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--ws-surface-border)', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    🔔 Hatırlatıcı & Ekip Bildirimi Gönder ({reminders.length})
                                                </label>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
                                                    Seçilen gruba, ekibe veya tüm üyelere anlık veya zamanlı bildirim atayın
                                                </span>
                                            </div>

                                            {broadcastSuccessMsg && (
                                                <div style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', color: '#10b981', fontSize: '0.78rem', fontWeight: 600 }}>
                                                    {broadcastSuccessMsg}
                                                </div>
                                            )}

                                            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr auto auto', gap: '0.5rem', alignItems: 'center' }}>
                                                <select
                                                    className="ws-input"
                                                    value={
                                                        remTargetType === 'role_group'
                                                            ? `role:${remTargetRole}`
                                                            : remTargetType === 'custom_group'
                                                            ? `group:${remTargetGroupId}`
                                                            : remTargetType
                                                    }
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        if (val.startsWith('role:')) {
                                                            setRemTargetType('role_group');
                                                            setRemTargetRole(val.replace('role:', '') as WorkspaceRole);
                                                            setRemTargetGroupId(undefined);
                                                            setRemTargetGroupName(undefined);
                                                        } else if (val.startsWith('group:')) {
                                                            setRemTargetType('custom_group');
                                                            const gId = val.replace('group:', '');
                                                            setRemTargetGroupId(gId);
                                                            const foundG = groups.find(g => g.id === gId);
                                                            if (foundG) setRemTargetGroupName(foundG.name);
                                                        } else {
                                                            setRemTargetType(val as ReminderTargetType);
                                                            setRemTargetGroupId(undefined);
                                                            setRemTargetGroupName(undefined);
                                                        }
                                                    }}
                                                    style={{ fontSize: '0.78rem', padding: '6px 10px', background: '#12141d', color: '#ffffff' }}
                                                >
                                                    <option value="all_members" style={{ background: '#12141d', color: '#ffffff' }}>👥 Tüm Üye Grubu</option>
                                                    
                                                    <optgroup label="🛡️ Sistem Rol Grupları" style={{ background: '#12141d', color: '#ef4444' }}>
                                                        <option value="role:super_admin" style={{ background: '#12141d', color: '#ffffff' }}>🛡️ Super Admin Grubu</option>
                                                        <option value="role:workspace_admin" style={{ background: '#12141d', color: '#ffffff' }}>🛡️ Admin Grubu</option>
                                                        <option value="role:editor" style={{ background: '#12141d', color: '#ffffff' }}>🛡️ Editör Grubu</option>
                                                        <option value="role:contributor" style={{ background: '#12141d', color: '#ffffff' }}>🛡️ Çekirdek Üyeler</option>
                                                    </optgroup>

                                                    {groups.length > 0 && (
                                                        <optgroup label="👥 Özel Ekip & Çalışma Grupları" style={{ background: '#12141d', color: '#10b981' }}>
                                                            {groups.map(g => (
                                                                <option key={g.id} value={`group:${g.id}`} style={{ background: '#12141d', color: '#ffffff' }}>
                                                                    👥 {g.name} ({g.members.length} Üye)
                                                                </option>
                                                            ))}
                                                        </optgroup>
                                                    )}

                                                    <option value="selected_members" style={{ background: '#12141d', color: '#ffffff' }}>👤 Seçilen Sorumlular</option>
                                                </select>

                                                <select
                                                    className="ws-input"
                                                    value={remTiming}
                                                    onChange={e => setRemTiming(e.target.value as ReminderTiming)}
                                                    style={{ fontSize: '0.78rem', padding: '6px 10px', background: '#12141d', color: '#ffffff' }}
                                                >
                                                    <option value="at_event_time" style={{ background: '#12141d', color: '#ffffff' }}>⚡ Etkinlik Anında</option>
                                                    <option value="15_min" style={{ background: '#12141d', color: '#ffffff' }}>⏱️ 15 Dk Önce</option>
                                                    <option value="1_hour" style={{ background: '#12141d', color: '#ffffff' }}>⏳ 1 Saat Önce</option>
                                                    <option value="1_day" style={{ background: '#12141d', color: '#ffffff' }}>📅 1 Gün Önce</option>
                                                </select>

                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={remInApp} onChange={e => setRemInApp(e.target.checked)} />
                                                        🔔 Site İçi
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={remEmail} onChange={e => setRemEmail(e.target.checked)} />
                                                        📧 E-Posta
                                                    </label>
                                                </div>

                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button
                                                        type="button"
                                                        onClick={handleAddReminder}
                                                        className="ws-btn-secondary"
                                                        style={{ padding: '6px 10px', fontSize: '0.78rem', background: 'rgba(220,38,38,0.15)', color: '#ef4444', borderColor: 'rgba(220,38,38,0.3)' }}
                                                    >
                                                        + Planla
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleSendInstantBroadcast}
                                                        disabled={isBroadcasting}
                                                        className="ws-btn-secondary"
                                                        style={{ padding: '6px 10px', fontSize: '0.78rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }}
                                                        title="Seçilen hedef gruba anında masaüstü / site içi bildirim gönder"
                                                    >
                                                        {isBroadcasting ? 'Gönderiliyor...' : '⚡ Anlık Duyur'}
                                                    </button>
                                                </div>
                                            </div>

                                            {reminders.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                                    {reminders.map((r, idx) => {
                                                        const timingLabels: Record<string, string> = {
                                                            at_event_time: 'Etkinlik Anında',
                                                            '15_min': '15 Dk Önce',
                                                            '1_hour': '1 Saat Önce',
                                                            '1_day': '1 Gün Önce'
                                                        };
                                                        const targetText = r.target_type === 'all_members'
                                                            ? '👥 Tüm Üyeler'
                                                            : r.target_type === 'role_group'
                                                            ? `🛡️ Rol: ${r.target_role}`
                                                            : r.target_type === 'custom_group'
                                                            ? `👥 [Grup] ${r.target_group_name || 'Özel Ekip'}`
                                                            : `👤 ${r.target_members?.length || 0} Üye`;

                                                        return (
                                                            <span
                                                                key={r.id || `rem-badge-${idx}`}
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    padding: '4px 10px',
                                                                    background: 'rgba(220,38,38,0.12)',
                                                                    border: '1px solid rgba(220,38,38,0.3)',
                                                                    borderRadius: '16px',
                                                                    fontSize: '0.75rem',
                                                                    color: '#fff'
                                                                }}
                                                            >
                                                                <span>{targetText} • {timingLabels[r.timing] || r.timing} ({r.channels.join('+')})</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeReminder(r.id)}
                                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', padding: 0, marginLeft: '2px' }}
                                                                >
                                                                    ✕
                                                                </button>
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '6px' }}>
                                                Döküman, Açıklama ve Notlar (Markdown)
                                            </label>
                                            <textarea
                                                className="ws-input ws-textarea"
                                                placeholder="Etkinlik gündemi, notlar, teslim kriterleri..."
                                                value={description}
                                                onChange={e => setDescription(e.target.value)}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                            {event?.id && onDelete && (
                                                <button
                                                    type="button"
                                                    className="ws-btn-secondary"
                                                    style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                                                    onClick={async () => {
                                                        if (confirm('Bu etkinliği silmek istediğinize emin misiniz?')) {
                                                            await onDelete(event.id!);
                                                            onClose();
                                                        }
                                                    }}
                                                >
                                                    Sil
                                                </button>
                                            )}
                                            <button type="button" onClick={onClose} className="ws-btn-secondary">
                                                İptal
                                            </button>
                                            <button type="submit" className="ws-btn-primary" disabled={isSaving}>
                                                {isSaving ? 'Kaydediliyor...' : 'Etkinliği Kaydet'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {activeTab === 'subtasks' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                type="text"
                                                className="ws-input"
                                                placeholder="Yeni alt görev / kontrol maddesi ekle..."
                                                value={newSubtaskTitle}
                                                onChange={e => setNewSubtaskTitle(e.target.value)}
                                            />
                                            <button type="submit" className="ws-btn-primary">Ekle</button>
                                        </form>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {subtasks.length === 0 ? (
                                                <p style={{ color: 'var(--ws-text-muted)', fontSize: '0.85rem' }}>Henüz kontrol maddesi eklenmedi.</p>
                                            ) : (
                                                subtasks.map((st, idx) => (
                                                    <div key={st.id || `st-${idx}`} className="ws-subtask-item">
                                                        <input
                                                            type="checkbox"
                                                            checked={st.completed}
                                                            onChange={() => toggleSubtask(st.id)}
                                                        />
                                                        <span style={{ textDecoration: st.completed ? 'line-through' : 'none', color: st.completed ? 'var(--ws-text-muted)' : '#fff' }}>
                                                            {st.title}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'attachments' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ border: '2px dashed var(--ws-surface-border)', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--ws-text-muted)', marginBottom: '8px' }}>
                                                PDF, DOCX, XLSX, Görsel veya Ses Dosyası Yükle (Max 25MB)
                                            </p>
                                            <input
                                                type="file"
                                                onChange={handleFileUpload}
                                                disabled={isUploading || !event?.id}
                                                style={{ display: 'none' }}
                                                id="drawer-file-upload"
                                            />
                                            <label htmlFor="drawer-file-upload" className="ws-btn-secondary" style={{ display: 'inline-block', cursor: 'pointer' }}>
                                                {isUploading ? 'Yükleniyor...' : '📁 Dosya Seç ve Yükle'}
                                            </label>
                                            {!event?.id && (
                                                <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '6px' }}>
                                                    * Dosya yüklemek için önce etkinliği kaydedin.
                                                </p>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {attachments.map((att, idx) => (
                                                <div key={att.id || `att-${idx}`} className="ws-attachment-card">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span>📎</span>
                                                        <div>
                                                            <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{att.file_name}</p>
                                                            <p style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
                                                                {(att.file_size / (1024 * 1024)).toFixed(2)} MB • {new Date(att.created_at).toLocaleDateString('tr-TR')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewAttachment(att)}
                                                            className="ws-btn-secondary"
                                                            style={{ padding: '4px 10px', fontSize: '0.78rem', background: 'rgba(220,38,38,0.15)', color: '#ef4444', borderColor: 'rgba(220,38,38,0.3)' }}
                                                        >
                                                            👁️ Görüntüle / Önizle
                                                        </button>
                                                        <a
                                                            href={`/api/workspace/files/download?fileId=${att.id}&token=${att.storage_token}&mode=download`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="ws-btn-secondary"
                                                            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                                        >
                                                            Güvenli İndir ⬇
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'comments' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                type="text"
                                                className="ws-input"
                                                placeholder="Ekip arkadaşlarınıza bir not bırakın..."
                                                value={newCommentText}
                                                onChange={e => setNewCommentText(e.target.value)}
                                            />
                                            <button type="submit" className="ws-btn-primary">Gönder</button>
                                        </form>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {comments.map((c, idx) => (
                                                <div key={c.id || `cm-${idx}`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--ws-surface-border)', padding: '10px', borderRadius: '8px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#ef4444' }}>{c.author_name}</span>
                                                        <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>{new Date(c.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p style={{ fontSize: '0.85rem' }}>{c.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'history' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {(event?.history || []).map((h, idx) => (
                                            <div key={h.id || `hist-${idx}`} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid #dc2626', fontSize: '0.8rem' }}>
                                                <span style={{ fontWeight: 600 }}>{h.user_name}</span>: {h.action}
                                                <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
                                                    {new Date(h.created_at).toLocaleString('tr-TR')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* File Preview Modal */}
            <AnimatePresence>
                {previewAttachment && (
                    <div
                        key="preview-modal-overlay"
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4"
                        onClick={() => setPreviewAttachment(null)}
                    >
                        <motion.div
                            key="preview-modal-card"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#0d0f17] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
                        >
                            {/* Modal Header */}
                            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">📄</span>
                                    <div>
                                        <h3 className="font-bold text-white text-sm md:text-base">{previewAttachment.file_name}</h3>
                                        <p className="text-xs text-gray-400">
                                            {(previewAttachment.file_size / (1024 * 1024)).toFixed(2)} MB • {previewAttachment.file_type}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={`/api/workspace/files/download?fileId=${previewAttachment.id}&token=${previewAttachment.storage_token}&mode=download`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="ws-btn-primary text-xs"
                                        style={{ padding: '6px 12px' }}
                                    >
                                        Güvenli İndir ⬇
                                    </a>
                                    <button
                                        onClick={() => setPreviewAttachment(null)}
                                        className="ws-btn-secondary text-xs"
                                        style={{ padding: '6px 12px' }}
                                    >
                                        ✕ Kapat
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body / Viewer */}
                            <div className="p-6 flex-1 overflow-y-auto flex items-center justify-center bg-black/60 min-h-[350px]">
                                {(() => {
                                    const fileSrc = previewAttachment.data_url || `/api/workspace/files/download?fileId=${previewAttachment.id}&token=${previewAttachment.storage_token}&mode=inline`;
                                    const fileName = (previewAttachment.file_name || '').toLowerCase();
                                    const mime = (previewAttachment.file_type || '').toLowerCase();

                                    if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].some(ext => fileName.endsWith('.' + ext))) {
                                        return (
                                            <img
                                                src={fileSrc}
                                                alt={previewAttachment.file_name}
                                                className="max-h-[68vh] max-w-full object-contain rounded-lg border border-white/10 shadow-lg"
                                            />
                                        );
                                    }

                                    if (mime === 'application/pdf' || fileName.endsWith('.pdf')) {
                                        return (
                                            <iframe
                                                src={fileSrc}
                                                className="w-full h-[68vh] rounded-lg border border-white/10"
                                                title={previewAttachment.file_name}
                                            />
                                        );
                                    }

                                    if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg'].some(ext => fileName.endsWith('.' + ext))) {
                                        return (
                                            <div className="w-full max-w-md p-8 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-6 shadow-xl">
                                                <div className="w-16 h-16 rounded-full bg-rose-600/20 text-rose-500 flex items-center justify-center text-3xl">
                                                    🎵
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold text-white mb-1 text-base">{previewAttachment.file_name}</p>
                                                    <p className="text-xs text-gray-400">Ses Kaydı / Oynatıcı</p>
                                                </div>
                                                <audio controls src={fileSrc} className="w-full" />
                                            </div>
                                        );
                                    }

                                    if (previewAttachment.content_text || mime.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
                                        return (
                                            <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-xl p-6 text-left overflow-y-auto max-h-[65vh]">
                                                <h4 className="text-sm font-bold text-rose-400 mb-3 uppercase tracking-wider">Metin Belgesi Önizlemesi</h4>
                                                <pre className="text-xs font-mono text-gray-200 whitespace-pre-wrap leading-relaxed bg-black/50 p-4 rounded-lg border border-white/5">
                                                    {previewAttachment.content_text || 'HSD MTÜ Topluluk Çalışma Alanı Korumalı Dökümanı'}
                                                </pre>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="w-full max-w-lg p-8 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-4 text-center">
                                            <div className="w-16 h-16 rounded-full bg-rose-600/20 text-rose-500 flex items-center justify-center text-3xl">
                                                📄
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-lg">{previewAttachment.file_name}</h4>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Belge Türü: {previewAttachment.file_type || 'Doküman'}
                                                </p>
                                            </div>
                                            <p className="text-sm text-gray-300 mt-2 bg-black/40 p-4 rounded-xl border border-white/5 text-left w-full">
                                                🔒 Bu döküman korumalı çalışma alanında saklanmaktadır. Cihazınızda doğrudan açmak için aşağıdaki butondan indirebilirsiniz.
                                            </p>
                                            <a
                                                href={`/api/workspace/files/download?fileId=${previewAttachment.id}&token=${previewAttachment.storage_token}&mode=download`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="ws-btn-primary mt-2"
                                            >
                                                Dosyayı İndir ve Aç ⬇
                                            </a>
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
