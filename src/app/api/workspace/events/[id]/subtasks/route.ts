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

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const member = await getCurrentMember();
    if (!member) {
        return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (!body.title) {
        return NextResponse.json({ error: 'Görev başlığı zorunludur.' }, { status: 400 });
    }

    const subtask = workspaceStore.addSubtask(id, body.title, body.assignedTo);
    if (!subtask) {
        return NextResponse.json({ error: 'Etkinlik bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, subtask });
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const member = await getCurrentMember();
    if (!member) {
        return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (!body.subtaskId) {
        return NextResponse.json({ error: 'Alt görev ID zorunludur.' }, { status: 400 });
    }

    const success = workspaceStore.toggleSubtask(id, body.subtaskId);
    if (!success) {
        return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
}
