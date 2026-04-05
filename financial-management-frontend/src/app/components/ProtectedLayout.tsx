import React, { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Bell, X, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';
import { useThemeStore } from '../stores/theme.store';
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
  const { isDark, toggleTheme } = useThemeStore();
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
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-end px-6 gap-3 shrink-0 shadow-sm z-40">

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Modo claro' : 'Modo escuro'}
            title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-200 dark:hover:border-violet-700 transition-all"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Notification bell */}
          <div ref={panelRef} className="relative">
            <button
              onClick={() => setShowPanel(v => !v)}
              aria-label="Notificações"
              className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-200 dark:hover:border-violet-700 transition-all"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 border-2 border-white dark:border-gray-900">
                  {unreadCount}
                </span>
              )}
            </button>

            {showPanel && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-sm text-gray-800 dark:text-gray-100">Notificações</span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline">
                        Marcar todas
                      </button>
                    )}
                    <button onClick={() => setShowPanel(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-sm text-gray-400 dark:text-gray-500">
                    <span className="text-3xl">✅</span>
                    <span>Nenhuma notificação</span>
                  </div>
                ) : (
                  <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                    {notifications.map(n => (
                      <li
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${!n.read ? 'bg-violet-50/40 dark:bg-violet-900/10' : ''}`}
                      >
                        <span className="text-lg shrink-0 mt-0.5">
                          {n.type === 'budget_alert' ? '⚠️' : '🎯'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-100">{n.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
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
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              Olá, <strong className="text-gray-800 dark:text-gray-100">{user?.firstName ?? 'Usuário'}</strong>
            </span>
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-400 text-white text-sm font-bold flex items-center justify-center shadow-md cursor-default"
              aria-label={`Avatar de ${user?.firstName ?? 'U'}`}
            >
              {userInitials()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}

