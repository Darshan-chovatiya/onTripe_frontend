import { useState, useRef, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Menu, User, ChevronDown, Settings, LogOut, Bell } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import { useAgencyPermissions } from '@/travelAgency/agency/hooks/useAgencyPermissions.js'
import { useSocketNotifications } from '@/hooks/useSocketNotifications.js'

function titleForPath(pathname) {
  if (/^\/agency\/packages\/[^/]+\/community$/.test(pathname)) return 'Package chat'
  if (/^\/agency\/packages\/[^/]+$/.test(pathname)) return 'Package details'
  if (pathname.startsWith('/agency/packages')) return 'Packages'
  if (pathname.startsWith('/agency/dashboard')) return 'Dashboard'
  if (pathname.startsWith('/agency/vendors')) return 'Vendors'
  if (pathname.startsWith('/agency/bookings')) return 'Bookings'
  if (pathname.startsWith('/agency/my-bookings')) return 'My bookings'
  if (pathname.startsWith('/agency/earnings')) return 'Earnings'
  if (pathname.startsWith('/agency/manage-downstream')) return 'Manage network'
  if (pathname.startsWith('/agency/customers')) return 'Customers'
  if (pathname.startsWith('/agency/settings')) return 'Settings'
  return 'Agency'
}

function AgencyHeader({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { loginPathForLogout, roleLabel } = useAgencyPermissions()
  const pageTitle = titleForPath(pathname)
  const displayName = user?.name?.trim() || 'Agency user'
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
  const logoUrl = user?.agencyLogo ? `${API_BASE}/${String(user.agencyLogo).replace(/^\//, '')}` : null
  const profileUrl = user?.profileImage ? `${API_BASE}/${String(user.profileImage).replace(/^\//, '')}` : null
  const avatarUrl = logoUrl || profileUrl

  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
          {/* Left */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button type="button" onClick={onMenuClick}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden">
              <Menu className="h-5 w-5" strokeWidth={2} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-gray-900">{pageTitle}</h1>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button type="button" onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm transition hover:border-gray-300 hover:shadow">
                <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-[11px] font-bold text-white shadow-sm">
                  {avatarUrl ? <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" /> : initials}
                </div>
                <span className="hidden max-w-[120px] truncate text-sm font-semibold text-gray-800 sm:block">{displayName}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl ring-1 ring-black/5">
                  <div className="bg-gradient-to-br from-primary-600 to-primary-800 px-4 py-3">
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white/20 text-sm font-bold text-white">
                      {avatarUrl ? <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" /> : initials}
                    </div>
                    <p className="mt-2 truncate text-sm font-bold text-white">{displayName}</p>
                    <p className="truncate text-[11px] text-primary-200">{user?.email || user?.phone || ''}</p>
                    <span className="mt-1.5 inline-flex rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                      {roleLabel}
                    </span>
                  </div>
                  <div className="py-1">
                    <button type="button" onClick={() => { setMenuOpen(false); navigate('/agency/settings') }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      <Settings className="h-4 w-4 text-gray-400" strokeWidth={2} />
                      Settings
                    </button>
                    <button type="button" onClick={() => { setMenuOpen(false); setShowLogoutConfirm(true) }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
                      <LogOut className="h-4 w-4" strokeWidth={2} />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => { setShowLogoutConfirm(false); logout(); navigate(loginPathForLogout, { replace: true }) }}
        title="Sign out?"
        message="You will need to sign in again to access the agency panel."
        confirmText="Log out"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  )
}

export default function AgencyLayout({ sidebar: Sidebar }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useSocketNotifications()

  return (
    <div className="flex h-screen bg-gray-50/80">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AgencyHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
      {sidebarOpen && (
        <button type="button" className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          aria-label="Close menu" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
