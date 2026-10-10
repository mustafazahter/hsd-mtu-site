import crypto from 'crypto';

// ============================================
// Cryptographic Password Hashing (OWASP ASVS)
// Uses Node.js native crypto scrypt with salt & high cost
// ============================================
export function hashPassword(password: string): { hash: string; salt: string } {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
    return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
    try {
        const verifyHash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
        return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
    } catch {
        return false;
    }
}

// ============================================
// Secure Random Tokens
// ============================================
export function generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

// Signed download token with expiration (Short-lived 5-min link)
const DOWNLOAD_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'hsdmtu-secure-workspace-download-secret-key-2026';

export function generateDownloadToken(fileId: string, userId: string, expiresInSeconds = 300): string {
    const expires = Date.now() + expiresInSeconds * 1000;
    const payload = `${fileId}:${userId}:${expires}`;
    const hmac = crypto.createHmac('sha256', DOWNLOAD_SECRET).update(payload).digest('hex');
    return `${expires}.${hmac}`;
}

export function verifyDownloadToken(fileId: string, userId: string, token: string): boolean {
    if (!token || !token.includes('.')) return false;
    const [expiresStr, hmac] = token.split('.');
    const expires = parseInt(expiresStr, 10);
    if (isNaN(expires) || Date.now() > expires) return false;

    const payload = `${fileId}:${userId}:${expires}`;
    const expectedHmac = crypto.createHmac('sha256', DOWNLOAD_SECRET).update(payload).digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedHmac, 'hex'));
    } catch {
        return false;
    }
}

// ============================================
// File Security & Validation (Anti-Malware & Path Traversal)
// ============================================
const ALLOWED_EXTENSIONS = new Set([
    'pdf', 'docx', 'xlsx', 'pptx', 'png', 'jpg', 'jpeg', 'webp', 'mp3', 'wav', 'txt'
]);

const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png',
    'image/jpeg',
    'image/webp',
    'audio/mpeg',
    'audio/wav',
    'text/plain'
]);

export function validateFileUpload(fileName: string, mimeType: string, fileSizeInBytes: number, maxMb = 25): { valid: boolean; reason?: string } {
    if (fileSizeInBytes > maxMb * 1024 * 1024) {
        return { valid: false, reason: `Dosya boyutu ${maxMb} MB sınırını aşıyor.` };
    }

    const parts = fileName.split('.');
    if (parts.length < 2) {
        return { valid: false, reason: 'Geçersiz dosya uzantısı.' };
    }

    const ext = parts.pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.has(ext)) {
        return { valid: false, reason: `.${ext} uzantılı dosya yüklenmesine izin verilmiyor.` };
    }

    if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType)) {
        return { valid: false, reason: `Desteklenmeyen dosya türü: ${mimeType}` };
    }

    // Double extension checks (e.g. file.php.jpg)
    if (parts.some(p => ['php', 'exe', 'sh', 'bat', 'cmd', 'js', 'py', 'vbs'].includes(p.toLowerCase()))) {
        return { valid: false, reason: 'Şüpheli çift uzantı tespiti.' };
    }

    return { valid: true };
}

export function sanitizeFileName(name: string): string {
    // Prevent path traversal
    const safeName = name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    return safeName.slice(0, 100);
}

export function sanitizeHTML(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}
