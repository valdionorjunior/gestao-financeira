import { FC, ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useThemeStore } from '../stores/theme.store'
import { useEffect } from 'react'

interface LayoutProps {
  children: ReactNode
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <Header />

      <main className="flex-1 pt-16 lg:pl-64">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
