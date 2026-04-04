import { Menu, Moon, Sun, User } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useTheme } from '@/shared/context/ThemeContext.jsx'

export default function CustomerHeader({ onMenuClick }) {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>
      <div className="flex flex-1 items-center justify-end gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg bg-gray-100 p-2 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200/80 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="hidden min-w-0 text-left sm:block">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.name || 'Customer'}</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email || user?.mobile || ''}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
