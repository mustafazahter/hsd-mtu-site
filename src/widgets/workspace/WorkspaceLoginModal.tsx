'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (user: any, permissions: any) => void;
    allowClose?: boolean;
}

export default function WorkspaceLoginModal({ isOpen, onClose, onLoginSuccess, allowClose = true }: LoginModalProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg(null);

        try {
            const res = await fetch('/api/workspace/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                onLoginSuccess(data.user, data.permissions);
                onClose();
            } else {
                setErrorMsg(data.error || 'Giriş başarısız.');
            }
        } catch {
            setErrorMsg('Sunucu ile iletişim kurulamadı.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickFill = (demoEmail: string) => {
        setEmail(demoEmail);
        setPassword('password123');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="ws-drawer-overlay" onClick={allowClose ? onClose : undefined} style={{ justifyContent: 'center', alignItems: 'center' }}>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        width: '420px',
                        maxWidth: '92vw',
                        background: '#0d0f17',
                        border: '1px solid var(--ws-surface-border)',
                        borderRadius: '16px',
                        padding: '2rem',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                        position: 'relative'
                    }}
                >
                    {allowClose && (
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'none',
                                border: 'none',
                                color: 'var(--ws-text-muted)',
                                cursor: 'pointer',
                                fontSize: '1.2rem'
                            }}
                        >
                            ✕
                        </button>
                    )}
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div className="ws-logo-icon" style={{ margin: '0 auto 12px auto' }}>
                            🔒
                        </div>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>HSD Çekirdek Üye Girişi</h2>
                        <p style={{ fontSize: '0.82rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>
                            Topluluk Takvimi & Çalışma Alanına Özel Yetkili Erişim
                        </p>
                    </div>

                    {errorMsg && (
                        <div style={{ padding: '10px', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)', borderRadius: '8px', color: '#ef4444', fontSize: '0.82rem', marginBottom: '1rem' }}>
                            ⚠️ {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Honeypot field */}
                        <input type="text" name="website" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '6px' }}>
                                Kurumsal / Çekirdek Üye Email
                            </label>
                            <input
                                type="email"
                                className="ws-input"
                                placeholder="ör. admin@hsdmtu.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ws-text-muted)', display: 'block', marginBottom: '6px' }}>
                                Parola
                            </label>
                            <input
                                type="password"
                                className="ws-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="ws-btn-primary" style={{ justifyContent: 'center', padding: '10px' }} disabled={isLoading}>
                            {isLoading ? 'Doğrulanıyor...' : 'Çalışma Alanına Giriş Yap ➔'}
                        </button>
                    </form>

                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--ws-surface-border)' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)', marginBottom: '8px', textAlign: 'center' }}>
                            Hızlı Test İçin Örnek Çekirdek Hesaplar:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                            <button
                                type="button"
                                onClick={() => handleQuickFill('admin@hsdmtu.com')}
                                style={{ padding: '4px 8px', fontSize: '0.72rem', background: 'rgba(220,38,38,0.15)', color: '#ef4444', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                Super Admin
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickFill('workspace@hsdmtu.com')}
                                style={{ padding: '4px 8px', fontSize: '0.72rem', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                Workspace Admin
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickFill('editor@hsdmtu.com')}
                                style={{ padding: '4px 8px', fontSize: '0.72rem', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                Editor
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
