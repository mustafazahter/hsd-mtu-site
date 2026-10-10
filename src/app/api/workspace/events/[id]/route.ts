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

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const member = await getCurrentMember();
    if (!member) {
        return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const { id } = await params;
    const event = workspaceStore.getEventById(id);
    if (!event) {
        return NextResponse.json({ error: 'Etkinlik bulunamadı.' }, { status: 404 });
    }

    // Check RBAC permission for edit
    const isOwner = event.created_by === member.id;
    const canEditAny = workspaceStore.hasPermission(member.role, 'can_edit');

    if (!canEditAny && (!isOwner || member.role === 'viewer')) {
        workspaceStore.logAudit(member.id, 'UNAUTHORIZED_EDIT_EVENT_ATTEMPT', `Event ${id}`, {}, 'unauthorized');
        return NextResponse.json({ error: 'Bu etkinliği düzenleme yetkiniz bulunmamaktadır.' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const expectedVersion = body.version;

        const result = workspaceStore.updateEvent(
            id,
            {
                title: body.title,
                description: body.description,
                category: body.category,
                color: body.color,
                start_time: body.start_time,
                end_time: body.end_time,
                is_all_day: body.is_all_day,
                recurrence_rule: body.recurrence_rule,
                assignees: body.assignees,
                location: body.location,
                meeting_link: body.meeting_link,
                status: body.status,
                reminders: body.reminders,
                updated_by: member.id,
            },
            expectedVersion,
            member.display_name
        );

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 409 });
        }

        return NextResponse.json({ success: true, event: result.event });
    } catch (error) {
        return NextResponse.json({ error: 'Etkinlik güncellenirken hata oluştu.' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const member = await getCurrentMember();
    if (!member) {
        return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const { id } = await params;
    const event = workspaceStore.getEventById(id);
    if (!event) {
        return NextResponse.json({ error: 'Etkinlik bulunamadı.' }, { status: 404 });
    }

    const isOwner = event.created_by === member.id;
    const canDeleteAny = workspaceStore.hasPermission(member.role, 'can_delete');

    if (!canDeleteAny && (!isOwner || member.role === 'viewer')) {
        workspaceStore.logAudit(member.id, 'UNAUTHORIZED_DELETE_EVENT_ATTEMPT', `Event ${id}`, {}, 'unauthorized');
        return NextResponse.json({ error: 'Bu etkinliği silme yetkiniz bulunmamaktadır.' }, { status: 403 });
    }

    const success = workspaceStore.deleteEvent(id, member.display_name, member.id);
    if (!success) {
        return NextResponse.json({ error: 'Silme işlemi başarısız.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
