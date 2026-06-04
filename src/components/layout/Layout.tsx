import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar isMobileOpen={isMobileOpen} setMobileOpen={setIsMobileOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header setMobileOpen={setIsMobileOpen} />
        
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        
        {/* Footer with "Desenvolvido por AndreSD" as requested in phase 1 */}
        <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900/50 bg-slate-950">
          Desenvolvido por <a href="https://wa.me/5512982176890" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">AndreSD</a>
        </footer>
      </div>
    </div>
  );
}
