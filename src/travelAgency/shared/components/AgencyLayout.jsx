import { useState, useRef, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Menu, Settings, LogOut, ChevronDown, Bell } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'

// Map path segments to readable page titles
function usePageTitle() {
  const { pathname } = useLocation()
  const segment = pathname.split('/').filter(Boolean).pop() || ''
  const titles = {
    dashboard: 'Dashboard',
    packages: 'Packages',
    vendors: 'Vendors',
    bookings: 'Bookings',
    'manage-children': 'Manage Children',
    settings: 'Settings',
    'manage-sub-children': 'Manage Sub-Children',
    'my-bookings': 'My Bookings',
    profile: 'Profile',
  }
  return titles[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Dashboard'
}

function UserMenu({ user, onSettings, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-gray-100 transition-colors"
      >
        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs flex-shrink-0">
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.name || 'User'}</p>
          <p className="text-xs text-gray-400 leading-tight truncate max-w-[140px]">{user?.email || ''}</p>
        </div>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-100 bg-white shadow-lg z-50 overflow-hidden animate-fade-in">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            <span className="mt-1.5 inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
              Parent Agent
            </span>
          </div>

          {/* Menu items */}
          <div className="p-1.5">
            <button
              type="button"
              onClick={() => { setOpen(false); onSettings() }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Settings size={15} className="text-gray-400" />
              Settings
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onLogout() }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={15} className="text-red-400" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AgencyTopBar({ onMenuClick, onSettings, onLogout }) {
  const { user } = useAuth()
  const title = usePageTitle()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <UserMenu user={user} onSettings={onSettings} onLogout={onLogout} />
      </div>
    </header>
  )
}

export default function AgencyLayout({ sidebar: Sidebar }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/travelAgency/parent/login', { replace: true })
  }

  // Derive settings path from current location
  const { pathname } = useLocation()
  const base = '/' + pathname.split('/').slice(1, 3).join('/')
  const settingsPath = `${base}/settings`

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AgencyTopBar
          onMenuClick={() => setSidebarOpen(true)}
          onSettings={() => navigate(settingsPath)}
          onLogout={() => setConfirmLogout(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="You will need to sign in again."
        confirmText="Logout"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
