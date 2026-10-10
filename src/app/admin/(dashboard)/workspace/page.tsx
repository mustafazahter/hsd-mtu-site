'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    WorkspaceMember,
    RolePermissions,
    ActiveSession,
    AuditLogRecord,
    WorkspaceSecuritySettings,
    WorkspaceRole,
    WorkspaceGroup
} from '@/shared/api/workspaceTypes';

export default function AdminWorkspacePage() {
    const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'sessions' | 'audit' | 'settings' | 'groups'>('members');

    // Tab data states
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [permissions, setPermissions] = useState<Record<WorkspaceRole, RolePermissions> | null>(null);
    const [sessions, setSessions] = useState<ActiveSession[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
    const [settings, setSettings] = useState<WorkspaceSecuritySettings | null>(null);
    const [groups, setGroups] = useState<WorkspaceGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // New member form
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberPassword, setNewMemberPassword] = useState('');
    const [newMemberRole, setNewMemberRole] = useState<WorkspaceRole>('contributor');
    const [isCreatingMember, setIsCreatingMember] = useState(false);
    const [memberSuccessMsg, setMemberSuccessMsg] = useState<string | null>(null);

    // Member password change & delete state
    const [passwordChangeMemberId, setPasswordChangeMemberId] = useState<string | null>(null);
    const [newPasswordValue, setNewPasswordValue] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    // New group form
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupCode, setNewGroupCode] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [newGroupColor, setNewGroupColor] = useState('#3b82f6');
    const [newGroupMembers, setNewGroupMembers] = useState<string[]>([]);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [groupSuccessMsg, setGroupSuccessMsg] = useState<string | null>(null);
    const [groupMemberSearch, setGroupMemberSearch] = useState('');
    const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

    const getRoleBadge = (role: WorkspaceRole) => {
        switch (role) {
            case 'super_admin': return { label: '🛡️ Super Admin', bg: 'rgba(239,68,68,0.15)', text: '#ef4444', border: 'rgba(239,68,68,0.3)' };
            case 'workspace_admin': return { label: '🔑 Admin', bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: 'rgba(245,158,11,0.3)' };
            case 'editor': return { label: '✏️ Editör', bg: 'rgba(59,130,246,0.15)', text: '#3b82f6', border: 'rgba(59,130,246,0.3)' };
            case 'contributor': return { label: '🌱 Çekirdek Üye', bg: 'rgba(16,185,129,0.15)', text: '#10b981', border: 'rgba(16,185,129,0.3)' };
            default: return { label: '👁️ İzleyici', bg: 'rgba(156,163,175,0.15)', text: '#9ca3af', border: 'rgba(156,163,175,0.3)' };
        }
    };

    const fetchAdminData = async () => {
        setIsLoading(true);
        try {
            const [mRes, rRes, sRes, aRes, stRes, gRes] = await Promise.all([
                fetch('/api/workspace/admin/members'),
                fetch('/api/workspace/admin/roles'),
                fetch('/api/workspace/admin/sessions'),
                fetch('/api/workspace/admin/audit-logs'),
                fetch('/api/workspace/admin/settings'),
                fetch('/api/workspace/admin/groups'),
            ]);

            const [mData, rData, sData, aData, stData, gData] = await Promise.all([
                mRes.json(), rRes.json(), sRes.json(), aRes.json(), stRes.json(), gRes.json()
            ]);

            if (mData.success) setMembers(mData.members);
            if (rData.success) setPermissions(rData.permissions);
            if (sData.success) setSessions(sData.sessions);
            if (aData.success) setAuditLogs(aData.logs);
            if (stData.success) setSettings(stData.settings);
            if (gData.success) setGroups(gData.groups);
        } catch (error) {
            console.error('Admin fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberEmail || !newMemberName || !newMemberPassword) return;
        setIsCreatingMember(true);
        setMemberSuccessMsg(null);

        try {
            const res = await fetch('/api/workspace/admin/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newMemberEmail,
                    displayName: newMemberName,
                    password: newMemberPassword,
                    role: newMemberRole
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setNewMemberEmail('');
                setNewMemberName('');
                setNewMemberPassword('');
                setMemberSuccessMsg(`"${newMemberName}" üyesi başarıyla oluşturuldu! (Email: ${newMemberEmail})`);
                fetchAdminData();
            } else {
                alert(data.error || 'Üye eklenemedi.');
            }
        } catch {
            alert('Sunucu hatası.');
        } finally {
            setIsCreatingMember(false);
        }
    };

    const handleChangePasswordSubmit = async (memberId: string) => {
        if (!newPasswordValue || newPasswordValue.length < 6) {
            alert('Şifre en az 6 karakter olmalıdır.');
            return;
        }
        setIsSavingPassword(true);
        try {
            const res = await fetch('/api/workspace/admin/members', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId, password: newPasswordValue }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert('Üye şifresi başarıyla güncellendi!');
                setPasswordChangeMemberId(null);
                setNewPasswordValue('');
                fetchAdminData();
            } else {
                alert(data.error || 'Şifre güncellenemedi.');
            }
        } catch {
            alert('Sunucu hatası.');
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleDeleteMember = async (memberId: string, displayName: string) => {
        if (!confirm(`"${displayName}" kullanıcısını ve tüm erişim yetkilerini kalıcı olarak silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz.`)) return;

        try {
            const res = await fetch(`/api/workspace/admin/members?memberId=${memberId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                fetchAdminData();
            } else {
                alert(data.error || 'Üye silinemedi.');
            }
        } catch {
            alert('Sunucu hatası.');
        }
    };

    const handleAddGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        setIsCreatingGroup(true);
        setGroupSuccessMsg(null);

        try {
            const res = await fetch('/api/workspace/admin/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newGroupName.trim(),
                    code: newGroupCode.trim(),
                    description: newGroupDesc.trim(),
                    color: newGroupColor,
                    members: newGroupMembers,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setNewGroupName('');
                setNewGroupCode('');
                setNewGroupDesc('');
                setNewGroupMembers([]);
                setGroupSuccessMsg(`"${data.group.name}" özel grubu başarıyla oluşturuldu!`);
                fetchAdminData();
            } else {
                alert(data.error || 'Grup oluşturulamadı.');
            }
        } catch {
            alert('Sunucu hatası.');
        } finally {
            setIsCreatingGroup(false);
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm('Bu özel grubu silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/workspace/admin/groups?id=${groupId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                fetchAdminData();
            } else {
                alert(data.error || 'Grup silinemedi.');
            }
        } catch {
            alert('Sunucu hatası.');
        }
    };

    const handleToggleGroupMemberUpdate = async (group: WorkspaceGroup, memberId: string) => {
        const hasMember = group.members.includes(memberId);
        const updatedMembers = hasMember
            ? group.members.filter(id => id !== memberId)
            : [...group.members, memberId];

        try {
            const res = await fetch('/api/workspace/admin/groups', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: group.id,
                    members: updatedMembers,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                fetchAdminData();
            }
        } catch (err) {
            console.error('Group member update error:', err);
        }
    };

    const handleToggleNewGroupMember = (memberId: string) => {
        if (newGroupMembers.includes(memberId)) {
            setNewGroupMembers(newGroupMembers.filter(id => id !== memberId));
        } else {
            setNewGroupMembers([...newGroupMembers, memberId]);
        }
    };

    const handleUpdateMemberStatus = async (memberId: string, status: string, role?: string) => {
        const res = await fetch('/api/workspace/admin/members', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId, status, role }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
            fetchAdminData();
        } else {
            alert(data.error || 'İşlem başarısız.');
        }
    };

    const handleTogglePermission = async (role: WorkspaceRole, field: keyof Omit<RolePermissions, 'role'>) => {
        if (!permissions) return;
        const currentRolePerms = permissions[role];
        const newPerms = { ...currentRolePerms, [field]: !currentRolePerms[field] };

        const res = await fetch('/api/workspace/admin/roles', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, permissions: newPerms }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
            fetchAdminData();
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        const res = await fetch('/api/workspace/admin/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
            fetchAdminData();
        }
    };

    return (
        <div>
            <div className="admin-page-header">
                <motion.h1
                    className="admin-page-title"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    Workspace & Takvim Güvenlik Yönetimi
                </motion.h1>
                <p className="admin-page-desc">
                    Çekirdek üyeler, Özel Ekip & Grup Ayarları, Rol Bazlı Erişim Kontrolü (RBAC), aktif oturumlar ve güvenlik denetim kayıtları.
                </p>
            </div>

            {/* Sub-navigation tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
                {[
                    { id: 'members', label: '👤 Üye Yönetimi' },
                    { id: 'groups', label: '👥 Grup & Ekip Ayarları' },
                    { id: 'roles', label: '🛡️ Rol & İzin Matrisi (RBAC)' },
                    { id: 'sessions', label: '💻 Aktif Oturumlar' },
                    { id: 'audit', label: '📋 Güvenlik Denetim Kayıtları' },
                    { id: 'settings', label: '⚙️ Güvenlik & Limit Ayarları' },
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id as any)}
                        className={`admin-btn ${activeTab === t.id ? 'admin-btn--primary' : 'admin-btn--secondary'}`}
                        style={{ fontSize: '0.82rem' }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Member Management Tab */}
            {activeTab === 'members' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <form onSubmit={handleAddMember} style={{ background: '#12141d', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#fff' }}>👤 Yeni Çekirdek Ekip Üyesi Oluştur</h3>
                                <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '2px 0 0 0' }}>Kullanıcı adı, email, şifre ve atanacak rolü belirleyerek anında yetkili hesap oluşturun.</p>
                            </div>
                        </div>

                        {memberSuccessMsg && (
                            <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', fontSize: '0.82rem', fontWeight: 600 }}>
                                ✅ {memberSuccessMsg}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Ad Soyad / Kullanıcı Adı</label>
                                <input
                                    type="text"
                                    className="ws-input"
                                    placeholder="ör. Ali Yılmaz"
                                    value={newMemberName}
                                    onChange={e => setNewMemberName(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Email / Kullanıcı Adresi</label>
                                <input
                                    type="email"
                                    className="ws-input"
                                    placeholder="ör. ali@hsdmtu.com"
                                    value={newMemberEmail}
                                    onChange={e => setNewMemberEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Giriş Şifresi</label>
                                <input
                                    type="password"
                                    className="ws-input"
                                    placeholder="••••••••"
                                    value={newMemberPassword}
                                    onChange={e => setNewMemberPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Atanacak Rol</label>
                                <select
                                    className="ws-input"
                                    value={newMemberRole}
                                    onChange={e => setNewMemberRole(e.target.value as WorkspaceRole)}
                                    style={{ background: '#1c1f2e', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)' }}
                                >
                                    <option value="super_admin" style={{ background: '#12141d', color: '#ffffff' }}>Super Admin (Tam Yetki)</option>
                                    <option value="workspace_admin" style={{ background: '#12141d', color: '#ffffff' }}>Workspace Admin</option>
                                    <option value="editor" style={{ background: '#12141d', color: '#ffffff' }}>Editor (Etkinlik Kaptanı)</option>
                                    <option value="contributor" style={{ background: '#12141d', color: '#ffffff' }}>Contributor (Çekirdek Üye)</option>
                                    <option value="viewer" style={{ background: '#12141d', color: '#ffffff' }}>Viewer (İzleyici)</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button type="submit" className="admin-btn admin-btn--primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }} disabled={isCreatingMember}>
                                {isCreatingMember ? 'Hesap Oluşturuluyor...' : '➕ Yeni Üye Hesabı Oluştur'}
                            </button>
                        </div>
                    </form>

                    <div style={{ background: '#12141d', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                    <th style={{ padding: '12px 16px' }}>Üye Adı</th>
                                    <th style={{ padding: '12px 16px' }}>Email</th>
                                    <th style={{ padding: '12px 16px' }}>Rol</th>
                                    <th style={{ padding: '12px 16px' }}>Durum</th>
                                    <th style={{ padding: '12px 16px' }}>🔑 Şifre Yönetimi</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>İşlemler & Silme</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map(m => {
                                    const isChangingPass = passwordChangeMemberId === m.id;
                                    return (
                                        <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ padding: '12px 16px', fontWeight: 600 }}>{m.display_name}</td>
                                            <td style={{ padding: '12px 16px', color: '#9ca3af' }}>{m.email}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <select
                                                    value={m.role}
                                                    onChange={e => handleUpdateMemberStatus(m.id, m.status, e.target.value)}
                                                    style={{ background: '#1c1f2e', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                                                >
                                                    <option value="super_admin" style={{ background: '#12141d', color: '#ffffff' }}>Super Admin</option>
                                                    <option value="workspace_admin" style={{ background: '#12141d', color: '#ffffff' }}>Workspace Admin</option>
                                                    <option value="editor" style={{ background: '#12141d', color: '#ffffff' }}>Editor</option>
                                                    <option value="contributor" style={{ background: '#12141d', color: '#ffffff' }}>Contributor</option>
                                                    <option value="viewer" style={{ background: '#12141d', color: '#ffffff' }}>Viewer</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{
                                                    padding: '3px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    background: m.status === 'approved' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                                    color: m.status === 'approved' ? '#10b981' : '#ef4444'
                                                }}>
                                                    {m.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                {isChangingPass ? (
                                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                        <input
                                                            type="password"
                                                            className="ws-input"
                                                            placeholder="Yeni Şifre (Min 6)"
                                                            value={newPasswordValue}
                                                            onChange={e => setNewPasswordValue(e.target.value)}
                                                            style={{ padding: '4px 8px', fontSize: '0.78rem', width: '130px' }}
                                                        />
                                                        <button
                                                            onClick={() => handleChangePasswordSubmit(m.id)}
                                                            disabled={isSavingPassword}
                                                            style={{ padding: '4px 8px', background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                                                        >
                                                            Kaydet
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setPasswordChangeMemberId(null);
                                                                setNewPasswordValue('');
                                                            }}
                                                            style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.08)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setPasswordChangeMemberId(m.id);
                                                            setNewPasswordValue('');
                                                        }}
                                                        style={{ padding: '4px 10px', background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                                                    >
                                                        🔑 Şifre Değiştir
                                                    </button>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                    {m.status === 'approved' ? (
                                                        <button
                                                            onClick={() => handleUpdateMemberStatus(m.id, 'disabled')}
                                                            style={{ padding: '4px 8px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                                                        >
                                                            Devre Dışı Bırak
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleUpdateMemberStatus(m.id, 'approved')}
                                                            style={{ padding: '4px 8px', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                                                        >
                                                            Yeniden Onayla
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteMember(m.id, m.display_name)}
                                                        style={{ padding: '4px 8px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                                                        title="Kullanıcıyı Kalıcı Olarak Sil"
                                                    >
                                                        🗑️ Sil
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Groups & Teams Settings Tab */}
            {activeTab === 'groups' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Header Stats Bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div style={{ background: '#12141d', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>👥</div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0, fontWeight: 600 }}>Tanımlı Özel Gruplar</p>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '2px 0 0 0', color: '#3b82f6' }}>{groups.length} Ekip</h3>
                            </div>
                        </div>

                        <div style={{ background: '#12141d', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>👤</div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0, fontWeight: 600 }}>Sistemdeki Aktif Kullanıcılar</p>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '2px 0 0 0', color: '#10b981' }}>{members.length} Üye</h3>
                            </div>
                        </div>

                        <div style={{ background: '#12141d', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>🔔</div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0, fontWeight: 600 }}>Takvim Bildirim Eşleşmesi</p>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '2px 0 0 0', color: '#8b5cf6' }}>Aktif Entegre</h3>
                            </div>
                        </div>
                    </div>

                    {/* New Group Creation Form */}
                    <form onSubmit={handleAddGroup} style={{ background: '#12141d', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    ➕ Yeni Özel Ekip & Çalışma Grubu Tanımla
                                </h3>
                                <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '3px 0 0 0' }}>
                                    Takvim etkinliklerinde <b>🔔 Hatırlatıcı & Ekip Bildirimi Gönder</b> menüsünden bildirim atayabileceğiniz özel üye grupları oluşturun.
                                </p>
                            </div>
                        </div>

                        {groupSuccessMsg && (
                            <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', fontSize: '0.82rem', fontWeight: 600 }}>
                                ✅ {groupSuccessMsg}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Grup / Ekip Adı *</label>
                                <input
                                    type="text"
                                    className="ws-input"
                                    placeholder="ör. Editör Grubu & İçerik Ekibi"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Grup Kodu (Sistem Anahtarı)</label>
                                <input
                                    type="text"
                                    className="ws-input"
                                    placeholder="ör. editor_team"
                                    value={newGroupCode}
                                    onChange={e => setNewGroupCode(e.target.value)}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Grup Rozet Rengi</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'].map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setNewGroupColor(c)}
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                background: c,
                                                border: newGroupColor === c ? '2px solid #fff' : '2px solid transparent',
                                                cursor: 'pointer',
                                                boxShadow: newGroupColor === c ? `0 0 12px ${c}` : 'none',
                                                transition: 'transform 0.15s ease'
                                            }}
                                        />
                                    ))}
                                    <input
                                        type="color"
                                        value={newGroupColor}
                                        onChange={e => setNewGroupColor(e.target.value)}
                                        style={{ width: '32px', height: '32px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Grup Açıklaması</label>
                            <input
                                type="text"
                                className="ws-input"
                                placeholder="ör. Etkinlik afişi, site haberleri ve duyuru içeriklerini hazırlayan ekip"
                                value={newGroupDesc}
                                onChange={e => setNewGroupDesc(e.target.value)}
                            />
                        </div>

                        {/* Rich Member Selection Cards Section */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', display: 'block' }}>
                                        👤 Sistemdeki Kullanıcılar & Ekibe Atama ({newGroupMembers.length} Üye Seçili)
                                    </label>
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Gruba dahil etmek istediğiniz kullanıcı kartlarına tıklayın</span>
                                </div>

                                <input
                                    type="text"
                                    className="ws-input"
                                    placeholder="🔍 İsim, email veya rol ara..."
                                    value={groupMemberSearch}
                                    onChange={e => setGroupMemberSearch(e.target.value)}
                                    style={{ maxWidth: '240px', fontSize: '0.78rem', padding: '6px 10px' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                                {members
                                    .filter(m => {
                                        if (!groupMemberSearch) return true;
                                        const q = groupMemberSearch.toLowerCase();
                                        return m.display_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.role.toLowerCase().includes(q);
                                    })
                                    .map(m => {
                                        const isSelected = newGroupMembers.includes(m.id);
                                        const roleBadge = getRoleBadge(m.role);
                                        const initials = m.display_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

                                        return (
                                            <div
                                                key={m.id}
                                                onClick={() => handleToggleNewGroupMember(m.id)}
                                                style={{
                                                    background: isSelected ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
                                                    border: isSelected ? `1.5px solid ${newGroupColor}` : '1px solid rgba(255,255,255,0.08)',
                                                    borderRadius: '10px',
                                                    padding: '10px 12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease',
                                                    boxShadow: isSelected ? `0 0 14px ${newGroupColor}30` : 'none'
                                                }}
                                            >
                                                {/* User Initials Avatar */}
                                                <div style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    background: `linear-gradient(135deg, ${newGroupColor}80 0%, #1e1b4b 100%)`,
                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 800,
                                                    color: '#fff',
                                                    flexShrink: 0
                                                }}>
                                                    {initials}
                                                </div>

                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
                                                        <h5 style={{ fontSize: '0.83rem', fontWeight: 700, margin: 0, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {m.display_name}
                                                        </h5>
                                                    </div>
                                                    <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '1px 0 3px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {m.email}
                                                    </p>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '1px 6px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.65rem',
                                                        fontWeight: 700,
                                                        background: roleBadge.bg,
                                                        color: roleBadge.text,
                                                        border: `1px solid ${roleBadge.border}`
                                                    }}>
                                                        {roleBadge.label}
                                                    </span>
                                                </div>

                                                <div style={{
                                                    width: '22px',
                                                    height: '22px',
                                                    borderRadius: '50%',
                                                    background: isSelected ? newGroupColor : 'rgba(255,255,255,0.08)',
                                                    border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.2)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    color: '#fff',
                                                    fontWeight: 800,
                                                    flexShrink: 0
                                                }}>
                                                    {isSelected ? '✓' : '+'}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                            <button type="submit" className="admin-btn admin-btn--primary" style={{ padding: '10px 24px', fontSize: '0.88rem', fontWeight: 700 }} disabled={isCreatingGroup}>
                                {isCreatingGroup ? 'Grup Oluşturuluyor...' : '➕ Ekip Grubunu Kaydet'}
                            </button>
                        </div>
                    </form>

                    {/* Group List Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#fff' }}>📋 Tanımlı Özel Gruplar ({groups.length})</h3>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
                            {groups.map(g => {
                                const assignedMembers = members.filter(m => g.members.includes(m.id));
                                const isExpanded = expandedGroupId === g.id;

                                return (
                                    <div
                                        key={g.id}
                                        style={{
                                            background: '#12141d',
                                            borderRadius: '14px',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            borderLeft: `5px solid ${g.color || '#3b82f6'}`,
                                            padding: '1.25rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1rem',
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#fff' }}>{g.name}</h4>
                                                    <code style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px', color: g.color || '#3b82f6', fontWeight: 700 }}>
                                                        {g.code}
                                                    </code>
                                                </div>
                                                <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '4px 0 0 0' }}>{g.description || 'Açıklama belirtilmedi.'}</p>
                                            </div>

                                            <button
                                                onClick={() => handleDeleteGroup(g.id)}
                                                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                Sil
                                            </button>
                                        </div>

                                        {/* Assigned Members Visual Bar */}
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                                                    👥 Ekip Üyeleri ({assignedMembers.length} Kişi)
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedGroupId(isExpanded ? null : g.id)}
                                                    style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                                                >
                                                    {isExpanded ? '▲ Düzenlemeyi Kapat' : '✏️ Üyeleri Düzenle'}
                                                </button>
                                            </div>

                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {assignedMembers.length === 0 ? (
                                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>Henüz gruba üye eklenmedi.</span>
                                                ) : (
                                                    assignedMembers.map(m => {
                                                        const rBadge = getRoleBadge(m.role);
                                                        return (
                                                            <div
                                                                key={m.id}
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    padding: '3px 8px',
                                                                    borderRadius: '12px',
                                                                    background: `${g.color || '#3b82f6'}20`,
                                                                    border: `1px solid ${g.color || '#3b82f6'}40`,
                                                                    fontSize: '0.75rem',
                                                                    color: '#fff',
                                                                    fontWeight: 600
                                                                }}
                                                            >
                                                                <span>{m.display_name}</span>
                                                                <span style={{ fontSize: '0.65rem', color: rBadge.text }}>({m.role})</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleGroupMemberUpdate(g, m.id)}
                                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, fontSize: '0.75rem' }}
                                                                    title="Gruptan Çıkar"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>

                                        {/* Inline Member Manager Expander */}
                                        {isExpanded && (
                                            <div style={{ background: '#1c1f2e', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '4px' }}>
                                                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 8px 0', fontWeight: 600 }}>
                                                    Üye eklemek veya çıkarmak için kullanıcı kartlarına tıklayın:
                                                </p>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                                                    {members.map(m => {
                                                        const isInGroup = g.members.includes(m.id);
                                                        return (
                                                            <div
                                                                key={m.id}
                                                                onClick={() => handleToggleGroupMemberUpdate(g, m.id)}
                                                                style={{
                                                                    padding: '6px 10px',
                                                                    borderRadius: '8px',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 600,
                                                                    background: isInGroup ? `${g.color || '#3b82f6'}25` : 'rgba(255,255,255,0.03)',
                                                                    border: isInGroup ? `1px solid ${g.color || '#3b82f6'}` : '1px solid rgba(255,255,255,0.08)',
                                                                    color: isInGroup ? '#fff' : '#9ca3af',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center'
                                                                }}
                                                            >
                                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.display_name}</span>
                                                                <span>{isInGroup ? '✓' : '+'}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Role Permissions Matrix Tab */}
            {activeTab === 'roles' && permissions && (
                <div style={{ background: '#12141d', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Granüler İzin Matrisi (Role-Based Access Control)</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Rol</th>
                                <th style={{ padding: '12px' }}>Görüntüleme (can_view)</th>
                                <th style={{ padding: '12px' }}>Oluşturma (can_create)</th>
                                <th style={{ padding: '12px' }}>Düzenleme (can_edit)</th>
                                <th style={{ padding: '12px' }}>Silme (can_delete)</th>
                                <th style={{ padding: '12px' }}>Dosya Yükleme (can_upload)</th>
                                <th style={{ padding: '12px' }}>Paylaşım (can_share)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(['super_admin', 'workspace_admin', 'editor', 'contributor', 'viewer'] as WorkspaceRole[]).map(r => {
                                const p = permissions[r];
                                return (
                                    <tr key={r} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td style={{ textAlign: 'left', padding: '12px', fontWeight: 700, color: '#ef4444' }}>{r}</td>
                                        {(['can_view', 'can_create', 'can_edit', 'can_delete', 'can_upload', 'can_share'] as const).map(field => (
                                            <td key={field} style={{ padding: '12px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={p[field]}
                                                    disabled={r === 'super_admin'}
                                                    onChange={() => handleTogglePermission(r, field)}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Active Sessions Tab */}
            {activeTab === 'sessions' && (
                <div style={{ background: '#12141d', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Aktif Güvenlik Oturumları</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                <th style={{ padding: '10px' }}>Kullanıcı</th>
                                <th style={{ padding: '10px' }}>IP Adresi</th>
                                <th style={{ padding: '10px' }}>Tarayıcı / Cihaz</th>
                                <th style={{ padding: '10px' }}>Son Görülme</th>
                                <th style={{ padding: '10px' }}>Oturum İptali</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map(s => (
                                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <td style={{ padding: '10px', fontWeight: 600 }}>{s.user_name || s.user_id}</td>
                                    <td style={{ padding: '10px', color: '#9ca3af' }}>{s.ip_address}</td>
                                    <td style={{ padding: '10px', color: '#9ca3af', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.user_agent}</td>
                                    <td style={{ padding: '10px' }}>{new Date(s.last_seen_at).toLocaleString('tr-TR')}</td>
                                    <td style={{ padding: '10px' }}>
                                        {s.is_revoked ? (
                                            <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>Sonlandırıldı</span>
                                        ) : (
                                            <button
                                                onClick={() => handleRevokeSession(s.id)}
                                                style={{ padding: '4px 8px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}
                                            >
                                                Oturumu Kapat
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Audit Logs Tab */}
            {activeTab === 'audit' && (
                <div style={{ background: '#12141d', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Güvenlik Denetim Kayıtları (Audit Trail)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {auditLogs.map(log => (
                            <div key={log.id} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderLeft: log.status === 'success' ? '3px solid #10b981' : '3px solid #ef4444', borderRadius: '6px', fontSize: '0.82rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                    <span style={{ fontWeight: 700, color: '#ef4444' }}>{log.action}</span>
                                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{new Date(log.created_at).toLocaleString('tr-TR')}</span>
                                </div>
                                <div>
                                    Kullanıcı: <b>{log.user_name}</b> • Kaynak: <code style={{ color: '#3b82f6' }}>{log.target_resource}</code> • IP: {log.ip_address}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Security Settings Tab */}
            {activeTab === 'settings' && settings && (
                <div style={{ background: '#12141d', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Güvenlik Politikası & Limit Ayarları</h3>

                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ef4444', marginBottom: '8px' }}>MFA & İki Faktörlü Doğrulama</h4>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={settings.mfa_policy.required_for_admin} onChange={() => { }} />
                            Yöneticiler için MFA zorunluluğu
                        </label>
                    </div>

                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ef4444', marginBottom: '8px' }}>Dosya Yükleme Limitleri</h4>
                        <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Maksimum Dosya Boyutu: <b>{settings.file_limits.max_file_size_mb} MB</b></p>
                        <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>İzin Verilen Uzantılar: <code>{settings.file_limits.allowed_extensions.join(', ')}</code></p>
                    </div>
                </div>
            )}
        </div>
    );
}
