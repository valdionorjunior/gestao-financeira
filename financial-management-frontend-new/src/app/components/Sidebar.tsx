import { FC, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  Tags,
  Target,
  TrendingUp,
  BarChart3,
  Zap,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '../utils/cn'

const menuItems = [
  { label: 'Painel', to: '/', icon: LayoutDashboard },
  { label: 'Transações', to: '/transactions', icon: Wallet },
  { label: 'Contas', to: '/accounts', icon: CreditCard },
  { label: 'Categorias', to: '/categories', icon: Tags },
  { label: 'Orçamentos', to: '/budgets', icon: Target },
  { label: 'Metas', to: '/goals', icon: TrendingUp },
  { label: 'Relatórios', to: '/reports', icon: BarChart3 },
  { label: 'IA', to: '/ai', icon: Zap },
]

interface SidebarProps {
  className?: string
}

export const Sidebar: FC<SidebarProps> = ({ className }) => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out z-30',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className,
        )}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
            Finanças
          </h1>
        </div>

        <nav className="mt-8 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors',
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                )}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
