import { useEffect, useRef, useState } from 'react'
import { Menu, ChevronDown, Settings, LogOut, Bell } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'

const PAGE_TITLES = [
  { match: '/admin/dashboard', title: 'Dashboard' },
  { match: '/admin/customers', title: 'Customers' },
  { match: '/admin/packages', title: 'Packages' },
  { match: '/admin/agencies/network', title: 'Agency Network' },
  { match: '/admin/agencies', title: 'Agencies' },
  { match: '/admin/child-agencies', title: 'Child Agencies' },
  { match: '/admin/notifications', title: 'Notifications' },
  { match: '/admin/settings', title: 'Settings' },
  { match: '/admin/otp-logs', title: 'OTP Logs' },
]

function titleForPath(pathname) {
  if (/^\/admin\/packages\/[^/]+\/whitelabels$/.test(pathname)) return 'Package Whitelabels'
  if (/^\/admin\/packages\/[^/]+\/bookings$/.test(pathname)) return 'Package Bookings'
  if (/^\/admin\/packages\/[^/]+\/community$/.test(pathname)) return 'Package Chat'
  if (/^\/admin\/packages\/[^/]+\/reviews$/.test(pathname)) return 'Package Reviews'
  if (/^\/admin\/child-agencies\/[^/]+\/whitelabels$/.test(pathname)) return 'Agent Whitelabels'
  if (/^\/admin\/child-agencies\/[^/]+\/customers$/.test(pathname)) return 'Agency Customers'
  if (/^\/admin\/child-agencies\/[^/]+\/parents$/.test(pathname)) return 'Parent Agencies'
  const hit = PAGE_TITLES.find(e => pathname === e.match || pathname.startsWith(e.match + '/'))
  return hit?.title || 'Admin'
}

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const pageTitle = titleForPath(pathname)
  const displayName = user?.name?.trim() || 'Administrator'
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
  const profileImageUrl = user?.profileImage ? `${API_BASE}/${user.profileImage}` : null

  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-gray-100/80 bg-white/90 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between gap-4 px-5 sm:px-6">

          {/* Left: hamburger + title */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button type="button" onClick={onMenuClick}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50 lg:hidden">
              <Menu className="h-4 w-4" strokeWidth={2} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-gray-900">{pageTitle}</h1>
            </div>
          </div>

          {/* Right: notification bell + user menu */}
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => navigate('/admin/notifications')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-700">
              <Bell className="h-4 w-4" strokeWidth={2} />
            </button>

            <div className="relative" ref={menuRef}>
              <button type="button" onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 transition hover:border-gray-300 hover:shadow-sm">
                <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-[11px] font-bold text-white">
                  {profileImageUrl ? <img src={profileImageUrl} alt={displayName} className="h-full w-full object-cover" /> : initials}
                </div>
                <span className="hidden max-w-[120px] truncate text-sm font-semibold text-gray-800 sm:block">{displayName}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/60 ring-1 ring-black/5 animate-scale-in">
                  {/* Profile header */}
                  <div className="px-4 py-3.5" style={{ background: 'linear-gradient(135deg, #312885 0%, #1a1745 100%)' }}>
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white/15 text-sm font-bold text-white ring-1 ring-white/20">
                      {profileImageUrl ? <img src={profileImageUrl} alt={displayName} className="h-full w-full object-cover" /> : initials}
                    </div>
                    <p className="mt-2 truncate text-sm font-bold text-white">{displayName}</p>
                    <p className="truncate text-[11px] text-white/50">{user?.email || ''}</p>
                    <span className="mt-1.5 inline-flex rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/80">
                      Administrator
                    </span>
                  </div>

                  <div className="p-1.5">
                    <button type="button"
                      onClick={() => { setMenuOpen(false); navigate('/admin/settings') }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                      <Settings className="h-4 w-4 text-gray-400" strokeWidth={2} />
                      Settings
                    </button>
                    <button type="button"
                      onClick={() => { setMenuOpen(false); setShowLogoutConfirm(true) }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50">
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
        onConfirm={() => { setShowLogoutConfirm(false); logout(); navigate('/login', { replace: true }) }}
        title="Sign out?"
        message="You will need to sign in again to access the admin panel."
        confirmText="Log out"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  )
}
