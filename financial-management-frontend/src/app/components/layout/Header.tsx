import React from 'react';
import { Bell, Search, User, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="hidden lg:flex fixed top-0 left-64 right-0 h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 items-center justify-between px-8 z-20 shadow-sm">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className={cn(
              'w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600',
              'bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'transition-all duration-200'
            )}
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6 ml-8">
        {/* Notifications */}
        <button className="relative p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors duration-200">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full" />
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-6 border-l border-gray-200 dark:border-slate-700">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white">João Silva</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Admin</p>
          </div>
          <button className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-lg hover:shadow-xl transition-shadow duration-200">
            JS
          </button>
        </div>
      </div>
    </header>
  );
}

export function MobileHeader() {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4 z-20 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
          💰
        </div>
        <h1 className="font-bold text-gray-900 dark:text-white">Gestão Financeira</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors duration-200">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full" />
        </button>
        <button className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs">
          JS
        </button>
      </div>
    </header>
  );
}
