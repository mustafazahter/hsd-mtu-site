import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { workspaceStore } from '@/shared/api/workspaceStore';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('workspace_session');

        if (!sessionCookie || !sessionCookie.value) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const sessionData = JSON.parse(sessionCookie.value);
        const member = workspaceStore.getMemberById(sessionData.userId);

        if (!member || member.status !== 'approved') {
            return NextResponse.json({ authenticated: false, error: 'Hesap pasif veya geçersiz.' }, { status: 401 });
        }

        const permissions = workspaceStore.getPermissions()[member.role];

        return NextResponse.json({
            authenticated: true,
            user: {
                id: member.id,
                email: member.email,
                displayName: member.display_name,
                role: member.role,
                avatarUrl: member.avatar_url,
                mfaEnabled: member.mfa_enabled,
            },
            permissions
        });
    } catch {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}

export async function POST() {
    // Logout route
    const response = NextResponse.json({ success: true });
    response.cookies.delete('workspace_session');
    return response;
}
