import React, { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';
import { Sidebar } from './Sidebar';
import { reportsService } from '../services/finance.service';

interface Notification {
  id: string;
  type: 'budget_alert' | 'goal_deadline';
  title: string;
  message: string;
  read: boolean;
}

interface Props { children: ReactNode }

export function ProtectedLayout({ children }: Props) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const user = useAuthStore(s => s.user);
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    reportsService.dashboard().then(data => {
      const notifs: Notification[] = [];
      for (const alert of data.budgetAlerts ?? []) {
        const pct = alert.percentUsed ?? 0;
        notifs.push({
          id: `budget-${alert.id}`,
          type: 'budget_alert',
          title: pct >= 100 ? 'Orçamento Esgotado' : 'Alerta de Orçamento',
          message: `Orçamento atingiu ${pct.toFixed(0)}% do limite`,
          read: false,
        });
      }
      for (const goal of data.goalsSummary?.nearDue ?? []) {
        notifs.push({
          id: `goal-${goal.id}`,
          type: 'goal_deadline',
          title: 'Meta Próxima do Prazo',
          message: goal.name
            ? `"${goal.name}" vence em ${goal.daysLeft ?? '?'} dias (${(goal.progressPercent ?? 0).toFixed(0)}%)`
            : `Meta vence em ${goal.daysLeft ?? '?'} dias`,
          read: false,
        });
      }
      setNotifications(notifs);
    }).catch(() => { /* silent */ });
  }, []);

  const handleDocumentClick = useCallback((e: MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      setShowPanel(false);
    }
  }, []);

  useEffect(() => {
    if (showPanel) document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [showPanel, handleDocumentClick]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = (id: string) =>
    setNotifications(list => list.map(n => n.id === id ? { ...n, read: true } : n));

  const markAllRead = () =>
    setNotifications(list => list.map(n => ({ ...n, read: true })));

  const userInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
  };

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6 gap-3 shrink-0 shadow-sm z-40">
          {/* Notification bell */}
          <div ref={panelRef} className="relative">
            <button
              onClick={() => setShowPanel(v => !v)}
              aria-label="Notificações"
              className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-all"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showPanel && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="font-bold text-sm text-gray-800">Notificações</span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-violet-600 font-semibold hover:underline">
                        Marcar todas
                      </button>
                    )}
                    <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-sm text-gray-400">
                    <span className="text-3xl">✅</span>
                    <span>Nenhuma notificação</span>
                  </div>
                ) : (
                  <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {notifications.map(n => (
                      <li
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${!n.read ? 'bg-violet-50/40' : ''}`}
                      >
                        <span className="text-lg shrink-0 mt-0.5">
                          {n.type === 'budget_alert' ? '⚠️' : '🎯'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        </div>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-1.5" />}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* User avatar */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 hidden sm:block">
              Olá, <strong className="text-gray-800">{user?.firstName ?? 'Usuário'}</strong>
            </span>
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-400 text-white text-sm font-bold flex items-center justify-center shadow-md cursor-default"
              aria-label={`Avatar de ${user?.firstName ?? 'U'}`}
            >
              {userInitials()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

