import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { workspaceStore } from '@/shared/api/workspaceStore';
import { sanitizeHTML } from '@/shared/lib/security';

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

    if (!body.content || !body.content.trim()) {
        return NextResponse.json({ error: 'Yorum içeriği boş olamaz.' }, { status: 400 });
    }

    const cleanContent = sanitizeHTML(body.content.trim());

    const comment = workspaceStore.addComment(id, member.id, member.display_name, cleanContent);
    if (!comment) {
        return NextResponse.json({ error: 'Etkinlik bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, comment });
}
