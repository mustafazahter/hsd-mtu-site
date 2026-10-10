'use client';

import React, { useState, useEffect } from 'react';
import { useFrozen } from '@/shared/lib/FrozenSection';
import {
    WorkspaceEvent,
    WorkspaceCalendar,
    WorkspaceMember,
    EventCategory,
    RolePermissions,
    WorkspaceNotification
} from '@/shared/api/workspaceTypes';
import EventDrawer from './EventDrawer';
import WorkspaceLoginModal from './WorkspaceLoginModal';

type CalendarView = 'month' | '3month' | '6month' | 'week' | 'day' | 'list';

const MONTH_NAMES = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const WEEKDAY_NAMES = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
const FULL_WEEKDAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const SHORT_WEEKDAYS = ['Pzr', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

// Hours from 08:00 to 22:00 for Week & Day views
const HOURLY_SLOTS = Array.from({ length: 15 }, (_, i) => i + 8);

export default function NotionCalendar() {
    const isFrozen = useFrozen();

    // Calendar state
    const [view, setView] = useState<CalendarView>('month');
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [timezone, setTimezone] = useState('Europe/Istanbul');

    // Data states
    const [events, setEvents] = useState<WorkspaceEvent[]>([]);
    const [calendars, setCalendars] = useState<WorkspaceCalendar[]>([]);
    const [members, setMembers] = useState<Partial<WorkspaceMember>[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Auth & Permission state
    const [currentUser, setCurrentUser] = useState<{ id: string; email: string; displayName: string; role: string } | null>(null);
    const [permissions, setPermissions] = useState<RolePermissions | undefined>(undefined);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    // Drawer state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Partial<WorkspaceEvent> | null>(null);

    // Notifications state
    const [notifications, setNotifications] = useState<WorkspaceNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/workspace/notifications');
            const data = await res.json();
            if (res.ok && data.success) {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (err) {
            console.error('Notifications fetch error:', err);
        }
    };

    const handleMarkNotifRead = async (id: string, eventId?: string) => {
        await fetch('/api/workspace/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'mark_read', id }),
        });
        fetchNotifications();
        if (eventId) {
            const target = events.find(e => e.id === eventId);
            if (target) {
                setSelectedEvent(target);
                setIsDrawerOpen(true);
                setIsNotifOpen(false);
            }
        }
    };

    const handleMarkAllNotifsRead = async () => {
        await fetch('/api/workspace/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'mark_all_read' }),
        });
        fetchNotifications();
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/workspace/auth/logout', { method: 'POST' });
            await fetch('/api/workspace/auth/session', { method: 'POST' });
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setCurrentUser(null);
            setPermissions(undefined);
            setIsUserMenuOpen(false);
            setIsLoginModalOpen(true);
        }
    };

    // Request desktop notification permissions
    const requestNotificationPermission = async () => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                try {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        new Notification('HSD Workspace Bildirimleri Aktif 🔔', {
                            body: 'Topluluk etkinlikleri ve hatırlatıcıları için masaüstü bildirimleri aktif edildi.',
                        });
                    }
                } catch (err) {
                    console.error('Notification permission error:', err);
                }
            }
        }
    };

    // Fetch session & workspace data
    const fetchWorkspaceData = async () => {
        try {
            setIsLoading(true);
            const sessionRes = await fetch('/api/workspace/auth/session');
            const sessionData = await sessionRes.json();

            if (sessionRes.ok && sessionData.authenticated) {
                setCurrentUser(sessionData.user);
                setPermissions(sessionData.permissions);
                requestNotificationPermission();

                const eventsRes = await fetch('/api/workspace/events');
                const eventsData = await eventsRes.json();
                if (eventsData.success) {
                    setEvents(eventsData.events || []);
                    setCalendars(eventsData.calendars || []);
                    setMembers(eventsData.members || []);
                }
                fetchNotifications();
            } else {
                setCurrentUser(null);
                setIsLoginModalOpen(true);
            }
        } catch (error) {
            console.error('Workspace load error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isFrozen) return; // Obeysys-rule.md
        fetchWorkspaceData();
    }, [isFrozen]);

    // Save event
    const handleSaveEvent = async (eventData: Partial<WorkspaceEvent>) => {
        const isEdit = !!eventData.id;
        const url = isEdit ? `/api/workspace/events/${eventData.id}` : '/api/workspace/events';
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
        });

        const data = await res.json();
        if (res.ok && data.success) {
            await fetchWorkspaceData();
        } else {
            throw new Error(data.error || 'Etkinlik kaydedilemedi.');
        }
    };

    // Delete event
    const handleDeleteEvent = async (eventId: string) => {
        const res = await fetch(`/api/workspace/events/${eventId}`, {
            method: 'DELETE',
        });
        const data = await res.json();
        if (res.ok && data.success) {
            await fetchWorkspaceData();
        } else {
            alert(data.error || 'Etkinlik silinemedi.');
        }
    };

    // Handle Drag & Drop move
    const handleEventDrop = async (eventId: string, newDateStr: string) => {
        const targetEvent = events.find(e => e.id === eventId);
        if (!targetEvent) return;

        const oldStart = new Date(targetEvent.start_time);
        const oldEnd = new Date(targetEvent.end_time);
        const durationMs = oldEnd.getTime() - oldStart.getTime();

        const newStart = new Date(newDateStr);
        newStart.setHours(oldStart.getHours(), oldStart.getMinutes());
        const newEnd = new Date(newStart.getTime() + durationMs);

        try {
            await handleSaveEvent({
                ...targetEvent,
                start_time: newStart.toISOString(),
                end_time: newEnd.toISOString(),
            });
        } catch (err: any) {
            alert(err.message || 'Sürükle bırak işlemi başarısız.');
        }
    };

    // Date Navigation & Helpers
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    // Helper: Get 7 days of current week (starting Monday)
    const getWeekDays = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay(); // 0 is Sunday, 1 is Monday...
        const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diffToMonday));

        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const nextDay = new Date(monday);
            nextDay.setDate(monday.getDate() + i);
            weekDays.push(nextDay);
        }
        return weekDays;
    };

    const currentWeekDays = getWeekDays(currentDate);

    // Smart Navigation Handlers based on active view
    const handlePrev = () => {
        if (view === 'month' || view === 'list') {
            setCurrentDate(new Date(year, month - 1, 1));
        } else if (view === '3month') {
            setCurrentDate(new Date(year, month - 3, 1));
        } else if (view === '6month') {
            setCurrentDate(new Date(year, month - 6, 1));
        } else if (view === 'week') {
            const d = new Date(currentDate);
            d.setDate(d.getDate() - 7);
            setCurrentDate(d);
        } else if (view === 'day') {
            const d = new Date(currentDate);
            d.setDate(d.getDate() - 1);
            setCurrentDate(d);
        }
    };

    const handleNext = () => {
        if (view === 'month' || view === 'list') {
            setCurrentDate(new Date(year, month + 1, 1));
        } else if (view === '3month') {
            setCurrentDate(new Date(year, month + 3, 1));
        } else if (view === '6month') {
            setCurrentDate(new Date(year, month + 6, 1));
        } else if (view === 'week') {
            const d = new Date(currentDate);
            d.setDate(d.getDate() + 7);
            setCurrentDate(d);
        } else if (view === 'day') {
            const d = new Date(currentDate);
            d.setDate(d.getDate() + 1);
            setCurrentDate(d);
        }
    };

    const handleToday = () => setCurrentDate(new Date());

    const getHeaderTitle = () => {
        if (view === 'month') {
            return `${MONTH_NAMES[month]} ${year}`;
        }
        if (view === '3month') {
            const endD = new Date(year, month + 2, 1);
            return `${MONTH_NAMES[month]} ${year} - ${MONTH_NAMES[endD.getMonth()]} ${endD.getFullYear()} (3 Aylık Çeyrek Görünüm)`;
        }
        if (view === '6month') {
            const endD = new Date(year, month + 5, 1);
            return `${MONTH_NAMES[month]} ${year} - ${MONTH_NAMES[endD.getMonth()]} ${endD.getFullYear()} (6 Aylık Yarı Yıl Görünümü)`;
        }
        if (view === 'week') {
            const startDay = currentWeekDays[0];
            const endDay = currentWeekDays[6];
            return `${startDay.getDate()} ${MONTH_NAMES[startDay.getMonth()]} - ${endDay.getDate()} ${MONTH_NAMES[endDay.getMonth()]} ${endDay.getFullYear()}`;
        }
        if (view === 'day') {
            return `${currentDate.getDate()} ${MONTH_NAMES[month]} ${year}, ${FULL_WEEKDAY_NAMES[currentDate.getDay()]}`;
        }
        return `${MONTH_NAMES[month]} ${year} Etkinlik Akışı`;
    };

    // Filter events
    const filteredEvents = events.filter(evt => {
        const matchesCat = selectedCategory === 'all' || evt.category === selectedCategory;
        const matchesSearch = !searchQuery || evt.title.toLowerCase().includes(searchQuery.toLowerCase()) || (evt.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    const openNewEvent = (initialDate?: Date) => {
        const start = initialDate || new Date();
        const end = new Date(start.getTime() + 3600000);
        setSelectedEvent({
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            calendar_id: calendars[0]?.id || 'cal-1',
            category: 'meeting',
            color: '#dc2626',
            status: 'planned'
        });
        setIsDrawerOpen(true);
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#08090e', color: '#fff', padding: '2rem' }}>
                <div className="ws-logo-icon" style={{ marginBottom: '1.25rem', width: '54px', height: '54px', fontSize: '1.8rem' }}>🗓️</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>HSD Workspace Yükleniyor...</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', margin: 0 }}>Çalışma alanı ve oturum yetkileri kontrol ediliyor</p>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 30%, #1a0a0a 0%, #05060a 100%)', color: '#fff', padding: '2rem', textAlign: 'center' }}>
                <div style={{ maxWidth: '440px', width: '100%', padding: '2.5rem 2rem', background: '#0d0f17', border: '1px solid var(--ws-surface-border)', borderRadius: '20px', boxShadow: '0 25px 70px rgba(0,0,0,0.85)' }}>
                    <div className="ws-logo-icon" style={{ margin: '0 auto 1.25rem auto', width: '60px', height: '60px', fontSize: '2rem' }}>
                        🔒
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>
                        HSD Workspace
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--ws-text-muted)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                        Bu alan Malatya Turgut Özal Üniversitesi Topluluğu Çekirdek Ekibine özeldir. Etkinlikleri ve çalışma alanını görüntülemek için lütfen yetkili üye hesabınızla giriş yapın.
                    </p>
                    <button
                        className="ws-btn-primary"
                        onClick={() => setIsLoginModalOpen(true)}
                        style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem', fontWeight: 700 }}
                    >
                        🔑 Çekirdek Ekip Girişi Yap
                    </button>
                </div>

                <WorkspaceLoginModal
                    isOpen={isLoginModalOpen}
                    onClose={() => {}}
                    allowClose={false}
                    onLoginSuccess={(user, perms) => {
                        setCurrentUser(user);
                        setPermissions(perms);
                        fetchWorkspaceData();
                        requestNotificationPermission();
                    }}
                />
            </div>
        );
    }

    const renderMonthCard = (offsetMonths: number) => {
        const d = new Date(year, month + offsetMonths, 1);
        const mYear = d.getFullYear();
        const mMonth = d.getMonth();

        const mDaysCount = new Date(mYear, mMonth + 1, 0).getDate();
        const mFirstDayIdx = new Date(mYear, mMonth, 1).getDay();

        return (
            <div key={`multi-month-${offsetMonths}`} style={{
                background: 'var(--ws-card)',
                border: '1px solid var(--ws-surface-border)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--ws-surface-border)', paddingBottom: '8px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                        📅 {MONTH_NAMES[mMonth]} {mYear}
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                        {filteredEvents.filter(e => {
                            const ed = new Date(e.start_time);
                            return ed.getMonth() === mMonth && ed.getFullYear() === mYear;
                        }).length} Etkinlik
                    </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
                    {WEEKDAY_NAMES.map(w => (
                        <div key={w} style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ws-text-muted)', padding: '4px 0' }}>{w}</div>
                    ))}

                    {Array.from({ length: mFirstDayIdx }).map((_, i) => (
                        <div key={`blank-${i}`} style={{ minHeight: '52px', background: 'transparent' }} />
                    ))}

                    {Array.from({ length: mDaysCount }).map((_, i) => {
                        const dayNum = i + 1;
                        const cellDate = new Date(mYear, mMonth, dayNum);
                        const isToday = cellDate.toDateString() === new Date().toDateString();

                        const dayEvents = filteredEvents.filter(e => {
                            const ed = new Date(e.start_time);
                            return ed.getDate() === dayNum && ed.getMonth() === mMonth && ed.getFullYear() === mYear;
                        });

                        return (
                            <div
                                key={`mday-${dayNum}`}
                                onDoubleClick={() => openNewEvent(cellDate)}
                                style={{
                                    minHeight: '54px',
                                    background: isToday ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.02)',
                                    border: isToday ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '6px',
                                    padding: '4px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <span style={{ fontSize: '0.7rem', fontWeight: isToday ? 800 : 600, color: isToday ? '#ef4444' : 'var(--ws-text-muted)' }}>
                                    {dayNum}
                                </span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', marginTop: '2px' }}>
                                    {dayEvents.map((evt, idx) => (
                                        <div
                                            key={evt.id || `m-evt-${idx}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedEvent(evt);
                                                setIsDrawerOpen(true);
                                            }}
                                            style={{
                                                backgroundColor: evt.color || '#dc2626',
                                                color: '#fff',
                                                fontSize: '0.62rem',
                                                fontWeight: 600,
                                                padding: '2px 4px',
                                                borderRadius: '3px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                            title={`${evt.title} (${new Date(evt.start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })})`}
                                        >
                                            {evt.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="ws-shell">
            {/* Topbar */}
            <header className="ws-topbar">
                <div className="ws-brand">
                    <div className="ws-logo-icon">
                        🗓️
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="ws-brand-title">HSD Workspace</span>
                        </div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', margin: 0 }}>
                            Core Team Event & Resource Manager
                        </p>
                    </div>
                </div>

                <div className="ws-controls">
                    <input
                        type="text"
                        className="ws-search-input"
                        placeholder="🔍 Etkinlik veya döküman ara..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />

                    {/* View Switcher */}
                    <div className="ws-view-switcher">
                        <button
                            className={`ws-view-btn ${view === 'month' ? 'ws-view-btn--active' : ''}`}
                            onClick={() => setView('month')}
                        >
                            Ay
                        </button>
                        <button
                            className={`ws-view-btn ${view === '3month' ? 'ws-view-btn--active' : ''}`}
                            onClick={() => setView('3month')}
                        >
                            3 Ay
                        </button>
                        <button
                            className={`ws-view-btn ${view === '6month' ? 'ws-view-btn--active' : ''}`}
                            onClick={() => setView('6month')}
                        >
                            6 Ay
                        </button>
                        <button
                            className={`ws-view-btn ${view === 'week' ? 'ws-view-btn--active' : ''}`}
                            onClick={() => setView('week')}
                        >
                            Hafta
                        </button>
                        <button
                            className={`ws-view-btn ${view === 'day' ? 'ws-view-btn--active' : ''}`}
                            onClick={() => setView('day')}
                        >
                            Gün
                        </button>
                        <button
                            className={`ws-view-btn ${view === 'list' ? 'ws-view-btn--active' : ''}`}
                            onClick={() => setView('list')}
                        >
                            Liste
                        </button>
                    </div>

                    <button className="ws-btn-primary" onClick={() => openNewEvent()}>
                        + Yeni Etkinlik
                    </button>

                    {/* Notification Bell Center */}
                    {currentUser && (
                        <div style={{ position: 'relative' }}>
                            <button
                                className="ws-btn-secondary"
                                onClick={() => {
                                    setIsNotifOpen(!isNotifOpen);
                                    if (!isNotifOpen) fetchNotifications();
                                }}
                                style={{ position: 'relative', padding: '8px 12px', fontSize: '1rem', cursor: 'pointer' }}
                                title="Bildirimler ve Hatırlatıcılar"
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-4px',
                                        right: '-4px',
                                        background: '#ef4444',
                                        color: '#fff',
                                        fontSize: '0.65rem',
                                        fontWeight: 800,
                                        minWidth: '18px',
                                        height: '18px',
                                        padding: '0 4px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 0 8px rgba(239,68,68,0.6)'
                                    }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {isNotifOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    right: 0,
                                    width: '340px',
                                    maxHeight: '420px',
                                    background: '#0e1017',
                                    border: '1px solid var(--ws-surface-border)',
                                    borderRadius: '12px',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
                                    zIndex: 1000,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ws-surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                        <div>
                                            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: '#fff' }}>🔔 Bildirimler & Hatırlatıcılar</h4>
                                            <p style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', margin: 0 }}>{unreadCount} okunmamış bildirim</p>
                                        </div>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={handleMarkAllNotifsRead}
                                                style={{ fontSize: '0.72rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                Tümünü Okundu İşaretle
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                                        {notifications.length === 0 ? (
                                            <p style={{ color: 'var(--ws-text-muted)', fontSize: '0.8rem', padding: '20px', textAlign: 'center', margin: 0 }}>
                                                Henüz bir bildiriminiz bulunmuyor.
                                            </p>
                                        ) : (
                                            notifications.map((n, idx) => (
                                                <div
                                                    key={n.id || `notif-${idx}`}
                                                    onClick={() => handleMarkNotifRead(n.id, n.event_id)}
                                                    style={{
                                                        padding: '10px 12px',
                                                        borderRadius: '8px',
                                                        marginBottom: '6px',
                                                        background: n.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(239,68,68,0.12)',
                                                        borderLeft: n.is_read ? '3px solid transparent' : '3px solid #ef4444',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: n.is_read ? 'var(--ws-text-muted)' : '#fff' }}>
                                                            {n.title}
                                                        </span>
                                                        <span style={{ fontSize: '0.68rem', color: 'var(--ws-text-muted)' }}>
                                                            {new Date(n.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p style={{ fontSize: '0.76rem', color: 'var(--ws-text-muted)', margin: 0, lineHeight: 1.4 }}>
                                                        {n.message}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* User profile with logout dropdown */}
                    {currentUser ? (
                        <div style={{ position: 'relative' }}>
                            <div
                                className="ws-user-menu"
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                style={{ cursor: 'pointer', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <div className="ws-user-avatar">
                                    {currentUser.displayName.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{currentUser.displayName}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--ws-text-muted)' }}>▾</span>
                            </div>

                            {isUserMenuOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    right: 0,
                                    width: '240px',
                                    background: '#0e1017',
                                    border: '1px solid var(--ws-surface-border)',
                                    borderRadius: '12px',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
                                    zIndex: 1000,
                                    padding: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px'
                                }}>
                                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--ws-surface-border)', marginBottom: '4px' }}>
                                        <p style={{ fontWeight: 700, fontSize: '0.85rem', margin: 0, color: '#fff' }}>{currentUser.displayName}</p>
                                        <p style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', margin: '2px 0 0 0' }}>{currentUser.email}</p>
                                        <span className="ws-brand-badge" style={{ marginTop: '6px', fontSize: '0.65rem', display: 'inline-block' }}>
                                            {currentUser.role.toUpperCase()}
                                        </span>
                                    </div>

                                    {(currentUser.role === 'super_admin' || currentUser.role === 'workspace_admin') && (
                                        <a
                                            href="/admin/workspace"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem',
                                                color: '#fff',
                                                textDecoration: 'none',
                                                background: 'rgba(255,255,255,0.03)'
                                            }}
                                        >
                                            ⚙️ Admin Yönetim Paneli
                                        </a>
                                    )}

                                    <button
                                        onClick={handleLogout}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem',
                                            color: '#ef4444',
                                            background: 'rgba(239,68,68,0.1)',
                                            border: '1px solid rgba(239,68,68,0.2)',
                                            cursor: 'pointer',
                                            width: '100%',
                                            textAlign: 'left',
                                            fontWeight: 600
                                        }}
                                    >
                                        🚪 Oturumu Kapat (Logout)
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button className="ws-btn-secondary" onClick={() => setIsLoginModalOpen(true)}>
                            🔒 Giriş Yap
                        </button>
                    )}
                </div>
            </header>

            {/* Body */}
            <div className="ws-body">
                {/* Left Sidebar */}
                <aside className="ws-sidebar">
                    <div>
                        <div className="ws-sidebar-section-title">Kategoriler & Filtreler</div>
                        <div className="ws-category-list">
                            <div
                                className="ws-category-item"
                                style={{ background: selectedCategory === 'all' ? 'rgba(255,255,255,0.08)' : 'transparent' }}
                                onClick={() => setSelectedCategory('all')}
                            >
                                <div className="ws-category-dot" style={{ background: '#fff' }} />
                                <span>Tüm Etkinlikler</span>
                            </div>
                            {[
                                { value: 'meeting', label: 'Toplantılar', color: '#dc2626' },
                                { value: 'youtube', label: 'YouTube Yayınları', color: '#3b82f6' },
                                { value: 'hackathon', label: 'Hackathon Prep', color: '#10b981' },
                                { value: 'training', label: 'Eğitim & Workshop', color: '#f59e0b' },
                                { value: 'project', label: 'Proje Teslimleri', color: '#8b5cf6' },
                            ].map((cat, idx) => (
                                <div
                                    key={cat.value || `cat-${idx}`}
                                    className="ws-category-item"
                                    style={{ background: selectedCategory === cat.value ? 'rgba(255,255,255,0.08)' : 'transparent' }}
                                    onClick={() => setSelectedCategory(cat.value)}
                                >
                                    <div className="ws-category-dot" style={{ background: cat.color }} />
                                    <span>{cat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="ws-sidebar-section-title">Çalışma Alanları (Calendars)</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {calendars.map((c, idx) => (
                                <div key={c.id || `cal-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                                    <span style={{ color: c.color }}>●</span>
                                    <span style={{ fontWeight: 500 }}>{c.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Workspace Canvas */}
                <main className="ws-canvas">
                    {/* Header Controls for Date */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                                {getHeaderTitle()}
                            </h2>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button className="ws-btn-secondary" onClick={handlePrev}>‹ Önceki</button>
                                <button className="ws-btn-secondary" onClick={handleToday}>Bugün</button>
                                <button className="ws-btn-secondary" onClick={handleNext}>Sonraki ›</button>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
                            Toplam {filteredEvents.length} kayıtlı etkinlik
                        </div>
                    </div>

                    {/* 1. Month View */}
                    {view === 'month' && (
                        <div className="ws-month-grid">
                            {WEEKDAY_NAMES.map((w, idx) => (
                                <div key={w || `w-${idx}`} className="ws-weekday-header">{w}</div>
                            ))}

                            {/* Leading blank days */}
                            {Array.from({ length: firstDayIndex }).map((_, i) => (
                                <div key={`empty-${i}`} className="ws-day-cell ws-day-cell--other-month" />
                            ))}

                            {/* Month days */}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const dayNum = i + 1;
                                const cellDate = new Date(year, month, dayNum);
                                const isToday = dayNum === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

                                const dayEvents = filteredEvents.filter(e => {
                                    const d = new Date(e.start_time);
                                    return d.getDate() === dayNum && d.getMonth() === month && d.getFullYear() === year;
                                });

                                return (
                                    <div
                                        key={`day-${dayNum}`}
                                        className={`ws-day-cell ${isToday ? 'ws-day-cell--today' : ''}`}
                                        onDoubleClick={() => openNewEvent(cellDate)}
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={e => {
                                            const eventId = e.dataTransfer.getData('eventId');
                                            if (eventId) handleEventDrop(eventId, cellDate.toISOString());
                                        }}
                                    >
                                        <span className="ws-day-number">{dayNum}</span>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, overflowY: 'auto' }}>
                                            {dayEvents.map((evt, idx) => (
                                                <div
                                                    key={evt.id || `evt-${idx}`}
                                                    className="ws-event-pill"
                                                    style={{ backgroundColor: evt.color || '#dc2626' }}
                                                    draggable
                                                    onDragStart={e => e.dataTransfer.setData('eventId', evt.id)}
                                                    onClick={() => {
                                                        setSelectedEvent(evt);
                                                        setIsDrawerOpen(true);
                                                    }}
                                                >
                                                    <span>•</span>
                                                    <span>{evt.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* 1b. 3 Month View (3 Aylık Çeyrek Görünüm) */}
                    {view === '3month' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                            {renderMonthCard(0)}
                            {renderMonthCard(1)}
                            {renderMonthCard(2)}
                        </div>
                    )}

                    {/* 1c. 6 Month View (6 Aylık Yarı Yıl Görünümü) */}
                    {view === '6month' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                            {renderMonthCard(0)}
                            {renderMonthCard(1)}
                            {renderMonthCard(2)}
                            {renderMonthCard(3)}
                            {renderMonthCard(4)}
                            {renderMonthCard(5)}
                        </div>
                    )}

                    {/* 2. Interactive Week View (Hafta Görünümü) */}
                    {view === 'week' && (
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: 'var(--ws-card)', border: '1px solid var(--ws-surface-border)', borderRadius: '12px', overflow: 'hidden' }}>
                            {/* Week Header Row: 7 Days */}
                            <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', borderBottom: '1px solid var(--ws-surface-border)', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ padding: '10px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ws-text-muted)', borderRight: '1px solid var(--ws-surface-border)', textAlign: 'center' }}>
                                    Saat
                                </div>
                                {currentWeekDays.map((dayDate, idx) => {
                                    const isToday = dayDate.toDateString() === new Date().toDateString();
                                    const shortDayName = SHORT_WEEKDAYS[dayDate.getDay()];
                                    return (
                                        <div
                                            key={`week-head-${idx}`}
                                            style={{
                                                padding: '10px 4px',
                                                textAlign: 'center',
                                                borderRight: idx < 6 ? '1px solid var(--ws-surface-border)' : 'none',
                                                background: isToday ? 'rgba(220,38,38,0.1)' : 'transparent',
                                            }}
                                        >
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isToday ? '#ef4444' : 'var(--ws-text-muted)', display: 'block' }}>
                                                {shortDayName}
                                            </span>
                                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: isToday ? '#ef4444' : '#fff' }}>
                                                {dayDate.getDate()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Week Hourly Timeline Slots */}
                            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)' }}>
                                {HOURLY_SLOTS.map(hour => (
                                    <React.Fragment key={`week-hour-row-${hour}`}>
                                        {/* Hour Timestamp Column */}
                                        <div style={{
                                            padding: '8px',
                                            fontSize: '0.72rem',
                                            fontWeight: 600,
                                            color: 'var(--ws-text-muted)',
                                            borderRight: '1px solid var(--ws-surface-border)',
                                            borderBottom: '1px solid var(--ws-surface-border)',
                                            textAlign: 'center',
                                            background: 'rgba(0,0,0,0.2)'
                                        }}>
                                            {hour.toString().padStart(2, '0')}:00
                                        </div>

                                        {/* 7 Day Slots for this hour */}
                                        {currentWeekDays.map((dayDate, dayIdx) => {
                                            const cellEvents = filteredEvents.filter(e => {
                                                const d = new Date(e.start_time);
                                                return d.getFullYear() === dayDate.getFullYear() &&
                                                       d.getMonth() === dayDate.getMonth() &&
                                                       d.getDate() === dayDate.getDate() &&
                                                       d.getHours() === hour;
                                            });

                                            return (
                                                <div
                                                    key={`week-slot-${hour}-${dayIdx}`}
                                                    onDoubleClick={() => {
                                                        const slotDate = new Date(dayDate);
                                                        slotDate.setHours(hour, 0, 0);
                                                        openNewEvent(slotDate);
                                                    }}
                                                    style={{
                                                        padding: '4px',
                                                        minHeight: '60px',
                                                        borderRight: dayIdx < 6 ? '1px solid var(--ws-surface-border)' : 'none',
                                                        borderBottom: '1px solid var(--ws-surface-border)',
                                                        background: dayDate.toDateString() === new Date().toDateString() ? 'rgba(220,38,38,0.02)' : 'transparent',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    {cellEvents.map((evt, evtIdx) => {
                                                        const start = new Date(evt.start_time);
                                                        const end = new Date(evt.end_time);
                                                        const timeStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;

                                                        return (
                                                            <div
                                                                key={evt.id || `week-evt-${evtIdx}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedEvent(evt);
                                                                    setIsDrawerOpen(true);
                                                                }}
                                                                style={{
                                                                    padding: '4px 6px',
                                                                    borderRadius: '6px',
                                                                    background: evt.color || '#dc2626',
                                                                    color: '#fff',
                                                                    fontSize: '0.72rem',
                                                                    fontWeight: 600,
                                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}
                                                                title={`${evt.title} (${timeStr})`}
                                                            >
                                                                <div style={{ fontWeight: 700 }}>{evt.title}</div>
                                                                <div style={{ fontSize: '0.65rem', opacity: 0.9 }}>{timeStr}</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3. Detailed Day View (Gün Görünümü) */}
                    {view === 'day' && (
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: 'var(--ws-card)', border: '1px solid var(--ws-surface-border)', borderRadius: '12px', overflow: 'hidden' }}>
                            {/* Day Header Banner */}
                            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--ws-surface-border)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                                        {currentDate.getDate()} {MONTH_NAMES[month]} {year} - {FULL_WEEKDAY_NAMES[currentDate.getDay()]}
                                    </h3>
                                    <p style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', margin: '2px 0 0 0' }}>
                                        Bugün için kayıtlı {filteredEvents.filter(e => new Date(e.start_time).toDateString() === currentDate.toDateString()).length} etkinlik mevcut.
                                    </p>
                                </div>
                                <button
                                    className="ws-btn-primary"
                                    onClick={() => openNewEvent(currentDate)}
                                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                                >
                                    + Günlük Etkinlik Ekle
                                </button>
                            </div>

                            {/* Timeline hourly slots */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {HOURLY_SLOTS.map(hour => {
                                    const currentHourNow = new Date().getHours();
                                    const isCurrentHour = currentDate.toDateString() === new Date().toDateString() && currentHourNow === hour;

                                    const slotEvents = filteredEvents.filter(e => {
                                        const d = new Date(e.start_time);
                                        return d.toDateString() === currentDate.toDateString() && d.getHours() === hour;
                                    });

                                    return (
                                        <div
                                            key={`day-hour-${hour}`}
                                            onDoubleClick={() => {
                                                const slotDate = new Date(currentDate);
                                                slotDate.setHours(hour, 0, 0);
                                                openNewEvent(slotDate);
                                            }}
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '80px 1fr',
                                                gap: '1rem',
                                                padding: '10px 14px',
                                                borderRadius: '10px',
                                                background: isCurrentHour ? 'rgba(220,38,38,0.08)' : 'rgba(255,255,255,0.02)',
                                                border: isCurrentHour ? '1px solid rgba(220,38,38,0.4)' : '1px solid var(--ws-surface-border)',
                                                minHeight: '75px',
                                                position: 'relative'
                                            }}
                                        >
                                            {/* Time label */}
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--ws-surface-border)', paddingRight: '12px' }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isCurrentHour ? '#ef4444' : '#fff' }}>
                                                    {hour.toString().padStart(2, '0')}:00
                                                </span>
                                                {isCurrentHour && (
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginTop: '2px' }}>
                                                        🔴 ŞİMDİ
                                                    </span>
                                                )}
                                            </div>

                                            {/* Slot Events */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                                                {slotEvents.length === 0 ? (
                                                    <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
                                                        (Etkinlik yok - çift tıklayarak ekleyin)
                                                    </span>
                                                ) : (
                                                    slotEvents.map((evt, idx) => {
                                                        const start = new Date(evt.start_time);
                                                        const end = new Date(evt.end_time);
                                                        const timeStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;

                                                        return (
                                                            <div
                                                                key={evt.id || `day-evt-${idx}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedEvent(evt);
                                                                    setIsDrawerOpen(true);
                                                                }}
                                                                style={{
                                                                    padding: '10px 14px',
                                                                    borderRadius: '8px',
                                                                    background: 'rgba(255,255,255,0.04)',
                                                                    borderLeft: `5px solid ${evt.color || '#dc2626'}`,
                                                                    borderTop: '1px solid var(--ws-surface-border)',
                                                                    borderRight: '1px solid var(--ws-surface-border)',
                                                                    borderBottom: '1px solid var(--ws-surface-border)',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center'
                                                                }}
                                                            >
                                                                <div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: evt.color, textTransform: 'uppercase' }}>
                                                                            {evt.category}
                                                                        </span>
                                                                        <span style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
                                                                            • ⏰ {timeStr}
                                                                        </span>
                                                                    </div>
                                                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                                                                        {evt.title}
                                                                    </h4>
                                                                    {evt.location && (
                                                                        <span style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)', display: 'block', marginTop: '2px' }}>
                                                                            📍 {evt.location}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                                    {evt.meeting_link && (
                                                                        <a
                                                                            href={evt.meeting_link}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            onClick={e => e.stopPropagation()}
                                                                            className="ws-btn-secondary"
                                                                            style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)' }}
                                                                        >
                                                                            📹 Bağlantıya Katıl
                                                                        </a>
                                                                    )}
                                                                    <button className="ws-btn-secondary" style={{ padding: '4px 8px', fontSize: '0.72rem' }}>
                                                                        Detaylar ➔
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 4. List View */}
                    {view === 'list' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {filteredEvents.length === 0 ? (
                                <p style={{ color: 'var(--ws-text-muted)', textAlign: 'center', padding: '2rem' }}>
                                    Kriterlere uygun etkinlik bulunamadı.
                                </p>
                            ) : (
                                filteredEvents.map((evt, idx) => (
                                    <div
                                        key={evt.id || `list-evt-${idx}`}
                                        onClick={() => {
                                            setSelectedEvent(evt);
                                            setIsDrawerOpen(true);
                                        }}
                                        style={{
                                            padding: '14px 18px',
                                            background: 'var(--ws-card)',
                                            border: '1px solid var(--ws-surface-border)',
                                            borderLeft: `4px solid ${evt.color}`,
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: evt.color, textTransform: 'uppercase' }}>
                                                {evt.category}
                                            </span>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '2px 0 4px 0' }}>{evt.title}</h3>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
                                                📍 {evt.location || 'Online'} • 🕒 {new Date(evt.start_time).toLocaleString('tr-TR')}
                                            </p>
                                        </div>
                                        <button className="ws-btn-secondary" style={{ fontSize: '0.78rem' }}>İncele ➔</button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Event Drawer */}
            <EventDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                event={selectedEvent}
                calendars={calendars}
                members={members}
                permissions={permissions}
                currentUser={currentUser}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
                allEvents={events}
            />

            {/* Auth Login Modal */}
            <WorkspaceLoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onLoginSuccess={(user, perms) => {
                    setCurrentUser(user);
                    setPermissions(perms);
                    fetchWorkspaceData();
                }}
            />
        </div>
    );
}
