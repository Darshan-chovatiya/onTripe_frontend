import { useEffect, useState } from 'react'
import { Menu, User } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const Header = ({ onMenuClick }) => {
  const { user } = useAuthStore()
  const [imageError, setImageError] = useState(false)
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  const apiBase = baseURL.replace('/api', '')
  const profilePictureUrl = user?.profilePicture ? `${apiBase}${user.profilePicture}` : null

  useEffect(() => {
    setImageError(false)
  }, [user?.profilePicture])

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 px-4 sm:px-6 h-16 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 active:scale-95"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-xl shadow-sm">
          {profilePictureUrl && !imageError ? (
            <img
              src={profilePictureUrl}
              alt={user?.name || 'Profile'}
              className="w-9 h-9 rounded-full object-cover shadow-md shadow-primary-500/20 ring-2 ring-white flex-shrink-0"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md shadow-primary-500/20 ring-2 ring-white flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="text-left hidden sm:block min-w-0">
            <p className="text-sm font-semibold text-gray-900 font-sans truncate">{user?.name || 'Organizer'}</p>
            <p className="text-xs text-gray-500 font-sans truncate max-w-[200px]">
              {user?.email || user?.mobile || ''}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
