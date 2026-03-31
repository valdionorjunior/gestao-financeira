import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  Tag,
  TrendingUp,
  Target,
  BarChart3,
  FileText,
  Zap,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Settings,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useThemeStore } from '../../stores/themeStore';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Contas', href: '/accounts', icon: <Wallet className="w-5 h-5" /> },
  { label: 'Categorias', href: '/categories', icon: <Tag className="w-5 h-5" /> },
  { label: 'Transações', href: '/transactions', icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Orçamentos', href: '/budgets', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Metas', href: '/goals', icon: <Target className="w-5 h-5" /> },
  { label: 'Relatórios', href: '/reports', icon: <FileText className="w-5 h-5" /> },
  { label: 'Banco de Dados', href: '/bank-statements', icon: <FileText className="w-5 h-5" /> },
  { label: 'IA', href: '/ai', icon: <Zap className="w-5 h-5" /> },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = true, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isActive = (href: string) => {
    if (href === '/' && location.pathname === '/') return true;
    if (href !== '/' && location.pathname.startsWith(href)) return true;
    return false;
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
            💰
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white">Gestão</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">Financeira</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.href}
            onClick={() => {
              navigate(item.href);
              onClose?.();
            }}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
              'text-sm font-medium',
              isActive(item.href)
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
            )}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Theme + Settings */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-slate-700 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => {}}
          className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700"
        >
          <Menu className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 fixed top-0 left-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {open && (
        <>
          <div
            onClick={onClose}
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
          />
          <aside className="lg:hidden fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 z-40 flex flex-col">
            <button
              onClick={onClose}
              className="p-4 text-gray-900 dark:text-white ml-auto"
            >
              <X className="w-6 h-6" />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
