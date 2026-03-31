import React, { ReactNode, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { Sidebar } from './layout/Sidebar';
import { Header, MobileHeader } from './layout/Header';
import { useThemeStore } from '../stores/themeStore';

interface Props {
  children: ReactNode;
}

export function ProtectedLayout({ children }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDark } = useThemeStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white">
        {/* Sidebar */}
        <Sidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        {/* Main Content */}
        <main className="lg:ml-64 min-h-screen">
          {/* Header */}
          <Header onMenuClick={() => setMobileMenuOpen(true)} />
          <MobileHeader />

          {/* Page Content */}
          <div className="pt-20 lg:pt-16 px-4 lg:px-8 py-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
