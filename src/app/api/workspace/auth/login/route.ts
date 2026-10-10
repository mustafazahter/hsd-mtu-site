import { NextResponse } from 'next/server';
import { workspaceStore } from '@/shared/api/workspaceStore';
import { sanitizeHTML } from '@/shared/lib/security';

// In-Memory Rate Limiting for Login
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. Honeypot check (Bot detection)
        if (body.website) {
            return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
        }

        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

        // 2. Rate Limiting Check
        const now = Date.now();
        const attempts = loginAttempts.get(ip);
        if (attempts && now - attempts.lastAttempt < WINDOW_MS && attempts.count >= MAX_ATTEMPTS) {
            workspaceStore.logAudit(undefined, 'LOGIN_BLOCKED_RATE_LIMIT', `IP ${ip}`, { ip }, 'unauthorized');
            return NextResponse.json(
                { error: 'Çok fazla hatalı giriş denemesi. Lütfen 15 dakika bekleyin.' },
                { status: 429 }
            );
        }

        const { email, password } = body;
        if (!email || !password) {
            return NextResponse.json({ error: 'Email ve şifre zorunludur.' }, { status: 400 });
        }

        const cleanEmail = sanitizeHTML(email.trim().toLowerCase());

        // Find member in store
        const member = workspaceStore.getMemberByEmail(cleanEmail);

        if (!member || member.status !== 'approved') {
            // Record failure attempt
            loginAttempts.set(ip, {
                count: (attempts?.count || 0) + 1,
                lastAttempt: now
            });
            workspaceStore.logAudit(undefined, 'LOGIN_FAILED', cleanEmail, { reason: 'User not found or disabled' }, 'failed');
            return NextResponse.json({ error: 'Giriş bilgileri hatalı veya hesabınız onaylanmamış.' }, { status: 401 });
        }

        // Reset rate limit counter on success
        loginAttempts.delete(ip);

        // Update member active status
        workspaceStore.updateMember(member.id, { last_active_at: new Date().toISOString() });

        // Log audit success
        workspaceStore.logAudit(member.id, 'USER_LOGIN_SUCCESS', '/workspace', { role: member.role }, 'success');

        const response = NextResponse.json({
            success: true,
            user: {
                id: member.id,
                email: member.email,
                displayName: member.display_name,
                role: member.role,
                avatarUrl: member.avatar_url,
                mfaEnabled: member.mfa_enabled,
            }
        });

        // Set secure HTTP-only session cookie
        response.cookies.set('workspace_session', JSON.stringify({
            userId: member.id,
            role: member.role,
            email: member.email,
            displayName: member.display_name
        }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60,
            path: '/'
        });

        return response;
    } catch (error) {
        return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
    }
}
