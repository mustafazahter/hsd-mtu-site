import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { workspaceStore } from '@/shared/api/workspaceStore';

async function getCurrentMember() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('workspace_session');
    if (!sessionCookie?.value) return null;
    try {
        const session = JSON.parse(sessionCookie.value);
        const member = workspaceStore.getMemberById(session.userId);
        return member?.status === 'approved' ? member : null;
    } catch {
        return null;
    }
}

export async function GET() {
    const member = await getCurrentMember();
    if (!member) {
        return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const events = workspaceStore.getEvents();
    const calendars = workspaceStore.getCalendars();
    const members = workspaceStore.getMembers().map(m => ({
        id: m.id,
        email: m.email,
        displayName: m.display_name,
        role: m.role,
        avatarUrl: m.avatar_url,
    }));

    return NextResponse.json({
        success: true,
        events,
        calendars,
        members,
    });
}

export async function POST(request: Request) {
    const member = await getCurrentMember();
    if (!member) {
        return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    // Check RBAC permission for event creation
    if (!workspaceStore.hasPermission(member.role, 'can_create')) {
        workspaceStore.logAudit(member.id, 'UNAUTHORIZED_CREATE_EVENT_ATTEMPT', '/workspace/events', {}, 'unauthorized');
        return NextResponse.json({ error: 'Etkinlik oluşturma yetkiniz bulunmamaktadır.' }, { status: 403 });
    }

    try {
        const body = await request.json();

        if (!body.title || !body.start_time || !body.end_time) {
            return NextResponse.json({ error: 'Başlık, başlangıç ve bitiş zamanı zorunludur.' }, { status: 400 });
        }

        const newEvent = workspaceStore.createEvent(
            {
                calendar_id: body.calendar_id || 'cal-1',
                title: body.title,
                description: body.description || '',
                category: body.category || 'meeting',
                color: body.color || '#ef4444',
                start_time: body.start_time,
                end_time: body.end_time,
                is_all_day: !!body.is_all_day,
                recurrence_rule: body.recurrence_rule || '',
                assignees: body.assignees || [],
                location: body.location || '',
                meeting_link: body.meeting_link || '',
                status: body.status || 'planned',
                reminders: body.reminders || [],
                created_by: member.id,
                updated_by: member.id,
            },
            member.display_name
        );

        return NextResponse.json({ success: true, event: newEvent });
    } catch (error) {
        return NextResponse.json({ error: 'İstek işlenirken hata oluştu.' }, { status: 500 });
    }
}
