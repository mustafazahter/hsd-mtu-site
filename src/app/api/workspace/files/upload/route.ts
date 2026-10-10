import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { workspaceStore } from '@/shared/api/workspaceStore';
import { validateFileUpload, sanitizeFileName, generateSecureToken } from '@/shared/lib/security';

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

export async function POST(request: Request) {
    const member = await getCurrentMember();
    if (!member) {
        return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    if (!workspaceStore.hasPermission(member.role, 'can_upload')) {
        workspaceStore.logAudit(member.id, 'UNAUTHORIZED_UPLOAD_ATTEMPT', '/workspace/files/upload', {}, 'unauthorized');
        return NextResponse.json({ error: 'Dosya yükleme yetkiniz bulunmamaktadır.' }, { status: 403 });
    }

    try {
        const formData = await request.formData();
        const eventId = formData.get('eventId') as string;
        const file = formData.get('file') as File;

        if (!eventId || !file) {
            return NextResponse.json({ error: 'Etkinlik ID ve dosya zorunludur.' }, { status: 400 });
        }

        const validation = validateFileUpload(file.name, file.type, file.size, 25);
        if (!validation.valid) {
            workspaceStore.logAudit(member.id, 'FILE_UPLOAD_BLOCKED', file.name, { reason: validation.reason }, 'failed');
            return NextResponse.json({ error: validation.reason }, { status: 400 });
        }

        const safeFileName = sanitizeFileName(file.name);
        const storageToken = generateSecureToken(24);
        const internalPath = `protected_uploads/${eventId}/${storageToken}_${safeFileName}`;

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type || 'application/octet-stream';
        const dataUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
        const contentText = mimeType.startsWith('text/') ? fileBuffer.toString('utf-8') : undefined;

        const attachment = workspaceStore.addAttachment(eventId, {
            event_id: eventId,
            file_name: safeFileName,
            file_size: file.size,
            file_type: mimeType,
            file_path: internalPath,
            storage_token: storageToken,
            uploaded_by: member.id,
            data_url: dataUrl,
            content_text: contentText,
        });

        if (!attachment) {
            return NextResponse.json({ error: 'Etkinlik bulunamadı.' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            attachment: {
                ...attachment,
                downloadUrl: `/api/workspace/files/download?fileId=${attachment.id}&token=${storageToken}`
            }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Dosya yüklenirken hata oluştu.' }, { status: 500 });
    }
}
