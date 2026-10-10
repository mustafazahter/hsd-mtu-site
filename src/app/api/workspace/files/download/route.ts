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

export async function GET(request: Request) {
    const member = await getCurrentMember();
    if (!member) {
        return NextResponse.json({ error: 'Yetkisiz erişim. Dosyaları indirmek için giriş yapmalısınız.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const token = searchParams.get('token');

    if (!fileId) {
        return NextResponse.json({ error: 'Dosya ID eksik.' }, { status: 400 });
    }

    // Search attachment across events
    const events = workspaceStore.getEvents();
    let targetAttachment;
    let targetEvent;

    for (const evt of events) {
        if (evt.attachments) {
            const att = evt.attachments.find(a => a.id === fileId);
            if (att) {
                targetAttachment = att;
                targetEvent = evt;
                break;
            }
        }
    }

    if (!targetAttachment) {
        return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 404 });
    }

    // Token check or Session check
    if (token && targetAttachment.storage_token !== token) {
        workspaceStore.logAudit(member.id, 'UNAUTHORIZED_FILE_ACCESS_ATTEMPT', targetAttachment.file_name, { fileId, token }, 'unauthorized');
        return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş indirme bağlantısı.' }, { status: 403 });
    }

    const mode = searchParams.get('mode') || 'download';
    const isInline = mode === 'inline';

    workspaceStore.logAudit(member.id, isInline ? 'FILE_PREVIEW_SUCCESS' : 'FILE_DOWNLOAD_SUCCESS', targetAttachment.file_name, { eventId: targetEvent?.id, size: targetAttachment.file_size }, 'success');

    // If real data URL exists, serve exact binary buffer
    if (targetAttachment.data_url && targetAttachment.data_url.startsWith('data:')) {
        const matches = targetAttachment.data_url.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
            const mimeType = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': mimeType,
                    'Content-Disposition': `${isInline ? 'inline' : 'attachment'}; filename="${targetAttachment.file_name}"`,
                    'Cache-Control': 'public, max-age=3600',
                }
            });
        }
    }

    // Fallback response for sample documents
    const dummyContent = `HSD MTÜ Community Workspace Secured Attachment\n----------------------------------------\nFile Name: ${targetAttachment.file_name}\nUploaded By: ${targetAttachment.uploaded_by || 'System'}\nEvent: ${targetEvent?.title || 'General'}\nTimestamp: ${targetAttachment.created_at}\n\n[CONFIDENTIAL DOCUMENT - AUTHORIZED ACCESS ONLY]`;

    return new NextResponse(dummyContent, {
        headers: {
            'Content-Type': targetAttachment.file_type || 'text/plain',
            'Content-Disposition': `${isInline ? 'inline' : 'attachment'}; filename="${targetAttachment.file_name}"`,
            'Cache-Control': 'no-store, private',
        }
    });
}
