import { Menu, User } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'

export default function Header({ onMenuClick }) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md sm:px-6 h-16 shadow-sm">
      <div className="flex h-full items-center justify-between">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
        <div className="ml-auto flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 shadow-sm sm:px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 ring-2 ring-white">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin'}</p>
            <p className="max-w-[200px] truncate text-xs text-gray-500">{user?.email || user?.mobile || ''}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
