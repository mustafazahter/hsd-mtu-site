import React from 'react';
import type { Metadata } from 'next';
import NotionCalendar from '@/widgets/workspace/NotionCalendar';
import FrozenSection from '@/shared/lib/FrozenSection';
import '@/app/workspace/workspace.css';

export const metadata: Metadata = {
    title: 'Topluluk Takvimi & Çalışma Alanı | HSD MTÜ Workspace',
    description: 'HSD Malatya Turgut Özal Üniversitesi Topluluğu Çekirdek Üyelerine Özel Notion Calendar & Ekip Çalışma Alanı.',
    robots: { index: false, follow: false },
};

export default function WorkspacePage() {
    return (
        <FrozenSection id="workspace-calendar-root" className="min-h-screen bg-black">
            <NotionCalendar />
        </FrozenSection>
    );
}
