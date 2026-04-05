import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { Moon, Sun, LogOut } from 'lucide-react'
import { useThemeStore } from '../stores/theme.store'
import { useAuthStore } from '../stores/auth.store'
import { cn } from '../utils/cn'

interface HeaderProps {
  className?: string
}

export const Header: FC<HeaderProps> = ({ className }) => {
  const navigate = useNavigate()
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const theme = useThemeStore((state) => state.theme)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-0 lg:left-64 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-20',
        className,
      )}
    >
      <div className="h-full px-6 flex items-center justify-between ml-14 lg:ml-0">
        {/* Left - Breadcrumb ou titulo */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bem-vindo!</h2>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle — ícone reflete o tema atual */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {theme === 'dark'
              ? <Sun size={20} className="text-yellow-400" />
              : <Moon size={20} className="text-gray-700" />
            }
          </button>

          {/* User Profile */}
          {user && (() => {
            const displayName = user.name ?? `${user.firstName} ${user.lastName}`.trim()
            const initial = displayName.charAt(0).toUpperCase()
            return (
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-800">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                  {initial}
                </div>
              </div>
            )
          })()}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
