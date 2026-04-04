import { useEffect, useState } from 'react'
import { Menu, User, Moon, Sun } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'

const Header = ({ onMenuClick }) => {
  const { user } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const [imageError, setImageError] = useState(false)

  const getAvatarUrl = (profilePicture) => {
    if (!profilePicture) return null
    if (profilePicture.startsWith('http')) return profilePicture
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
    const baseUrl = API_BASE_URL.replace('/api', '')
    return `${baseUrl}${profilePicture}`
  }

  const avatarUrl = user?.profilePicture ? getAvatarUrl(user.profilePicture) : null

  useEffect(() => {
    setImageError(false)
  }, [user?.profilePicture])

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-800 px-4 sm:px-6 h-16 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-all duration-200 active:scale-95"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => toggleTheme()}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all"
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-xl shadow-sm">
            {avatarUrl && !imageError ? (
              <img
                src={avatarUrl}
                alt={user?.name || 'Profile'}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-gray-700 flex-shrink-0"
                onError={() => setImageError(true)}
              />
            ) : user?.name ? (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="text-left hidden sm:block min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user?.name || 'Customer'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                {user?.email || user?.mobile || ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
