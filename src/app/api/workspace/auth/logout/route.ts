import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('workspace_session');
        const response = NextResponse.json({ success: true, message: 'Oturum başarıyla kapatıldı.' });
        response.cookies.delete('workspace_session');
        return response;
    } catch {
        return NextResponse.json({ error: 'Çıkış yapılırken bir hata oluştu.' }, { status: 500 });
    }
}
