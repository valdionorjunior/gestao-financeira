import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, Wallet, Tag, Target, PiggyBank,
  BarChart2, FileText, Bot, LogOut, ChevronLeft,
} from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';

const navItems = [
  { to: '/',               label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/transactions',   label: 'Transações',      icon: ArrowLeftRight },
  { to: '/accounts',       label: 'Contas',          icon: Wallet },
  { to: '/categories',     label: 'Categorias',      icon: Tag },
  { to: '/budgets',        label: 'Orçamentos',      icon: PiggyBank },
  { to: '/goals',          label: 'Metas',           icon: Target },
  { to: '/reports',        label: 'Relatórios',      icon: BarChart2 },
  { to: '/bank-statements',label: 'Extrato Bancário',icon: FileText },
  { to: '/ai',             label: 'Inteligência IA', icon: Bot },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <aside
      className={`flex flex-col bg-gradient-to-b from-slate-800 to-slate-900 text-white transition-all duration-300 min-h-screen
        ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight">
            💰 FinanceApp
          </span>
        )}
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-white/10 transition-colors"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== '/' && pathname.startsWith(to));
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${active
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                  title={collapsed ? label : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User + Logout */}
      <div className="px-2 py-4 border-t border-white/10">
        {!collapsed && user && (
          <div className="px-3 mb-3">
            <p className="text-xs text-slate-400">Bem-vindo,</p>
            <p className="text-sm font-semibold truncate">{user.firstName} {user.lastName}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-all"
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
