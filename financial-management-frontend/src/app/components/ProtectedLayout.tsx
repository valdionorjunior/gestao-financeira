import React, { ReactNode, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { Sidebar } from './Sidebar';

interface Props { children: ReactNode }

export function ProtectedLayout({ children }: Props) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const [collapsed, setCollapsed] = useState(false);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}
