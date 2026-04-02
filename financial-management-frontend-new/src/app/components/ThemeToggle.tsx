import { useThemeStore } from '../stores/themeStore'
import { cn } from '../utils/cn'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeStore()

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'p-2.5 rounded-lg transition-colors',
        isDark
          ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      )}
      title="Toggle theme"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
