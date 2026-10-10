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

    const notifications = workspaceStore.getNotifications(member.id);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    return NextResponse.json({
        success: true,
        notifications,
        unreadCount
    });
}

export async function PATCH(request: Request) {
    const member = await getCurrentMember();
    if (!member) {
        return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { action, id } = body;

        if (action === 'mark_all_read') {
            workspaceStore.markAllNotificationsRead(member.id);
            return NextResponse.json({ success: true, message: 'Tüm bildirimler okundu olarak işaretlendi.' });
        }

        if (action === 'mark_read' && id) {
            const ok = workspaceStore.markNotificationRead(id, member.id);
            if (!ok) {
                return NextResponse.json({ error: 'Bildirim bulunamadı.' }, { status: 404 });
            }
            return NextResponse.json({ success: true, message: 'Bildirim okundu.' });
        }

        return NextResponse.json({ error: 'Geçersiz işlem parametresi.' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Bildirim güncellenirken hata oluştu.' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const member = await getCurrentMember();
    if (!member) {
        return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { action, eventId, eventTitle, targetType, targetRole, targetGroupId, targetMembers } = body;

        if (action === 'dispatch_event_reminder' || action === 'instant_broadcast') {
            const recipientsCount = workspaceStore.dispatchInstantNotification({
                authorId: member.id,
                authorName: member.display_name,
                eventId: eventId || 'evt-general',
                eventTitle: eventTitle || 'Etkinlik Duyurusu',
                targetType: targetType || 'all_members',
                targetRole,
                targetGroupId,
                targetMembers,
            });

            return NextResponse.json({
                success: true,
                recipientsCount,
                message: `Duyuru ${recipientsCount} üyeye başarıyla iletildi.`
            });
        }

        return NextResponse.json({ error: 'Geçersiz bildirim işlemi.' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Bildirim gönderilirken sunucu hatası oluştu.' }, { status: 500 });
    }
}
