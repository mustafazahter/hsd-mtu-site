import { createBrowserClient } from '@supabase/ssr'
import { createServerClient as createSSRServerClient, type CookieOptions } from '@supabase/ssr'

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
);

// ============================================
// Browser Client (Client Components)
// ============================================
let supabaseBrowserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
    if (typeof window !== 'undefined') {
        if (!supabaseBrowserClient) {
            supabaseBrowserClient = createBrowserClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );
        }
        return supabaseBrowserClient;
    }
    
    // Server-side fallback (hızlı oluşturulabilir çünkü stateless)
    return createBrowserClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );
}

// ============================================
// Server Client (Server Components / API Routes)
// ============================================
export async function createServerClient(cookieStore: {
    getAll: () => Promise<{ name: string; value: string }[]> | { name: string; value: string }[]
    set: (name: string, value: string, options: CookieOptions) => void | Promise<void>
}) {
    return createSSRServerClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll: async () => {
                    return await cookieStore.getAll()
                },
                setAll: async (cookiesToSet) => {
                    try {
                        for (const { name, value, options } of cookiesToSet) {
                            await cookieStore.set(name, value, options)
                        }
                    } catch {
                        // Server Component'lerde set çağrılırsa sessizce geç
                    }
                },
            },
        }
    )
}
