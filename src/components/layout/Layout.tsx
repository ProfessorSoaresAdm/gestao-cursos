import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '@/auth/useAuth';
import { BackupReminderModal } from '@/components/shared/BackupReminderModal';

export function Layout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar isMobileOpen={isMobileOpen} setMobileOpen={setIsMobileOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header setMobileOpen={setIsMobileOpen} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Lembrete Automático de Segurança */}
      <BackupReminderModal />
    </div>
  );
}
