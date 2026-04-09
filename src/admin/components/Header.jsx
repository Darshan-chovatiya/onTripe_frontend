import { useEffect, useRef, useState } from 'react'
import { Menu, User, ChevronDown, Settings, LogOut } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'

const PAGE_TITLES = [
  { match: '/admin/dashboard', title: 'Dashboard' },
  { match: '/admin/customers', title: 'Customers' },
  { match: '/admin/packages', title: 'Packages' },
  { match: '/admin/agencies/network', title: 'Agency network' },
  { match: '/admin/agencies', title: 'Agencies' },
  { match: '/admin/child-agencies', title: 'Child agencies' },
  { match: '/admin/sub-child-agencies', title: 'Sub-child agencies' },
  { match: '/admin/notifications', title: 'Notifications' },
  { match: '/admin/settings', title: 'Settings' },
]

function titleForPath(pathname) {
  if (/^\/admin\/packages\/[^/]+\/whitelabels$/.test(pathname)) return 'Package whitelabels'
  if (/^\/admin\/packages\/[^/]+\/bookings$/.test(pathname)) return 'Package bookings'
  if (/^\/admin\/child-agencies\/[^/]+\/whitelabels$/.test(pathname)) return 'Agent whitelabels'
  if (/^\/admin\/sub-child-agencies\/[^/]+\/whitelabels$/.test(pathname)) return 'Agent whitelabels'
  const hit = PAGE_TITLES.find((e) => pathname === e.match || pathname.startsWith(e.match + '/'))
  if (hit) return hit.title
  if (pathname.startsWith('/admin')) return 'Admin'
  return 'Admin'
}

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const pageTitle = titleForPath(pathname)
  const displayName = user?.name?.trim() || 'Administrator'
  const displayContact = user?.email || user?.phone || ''

  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDocDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(/** @type {Node} */ (e.target))) {
        setMenuOpen(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const goSettings = () => {
    setMenuOpen(false)
    navigate('/admin/settings')
  }

  const requestLogout = () => {
    setMenuOpen(false)
    setShowLogoutConfirm(true)
  }

  const handleLogout = () => {
    setShowLogoutConfirm(false)
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              className="-ml-1 rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" strokeWidth={2} />
            </button>
            <div className="min-w-0 border-l border-gray-200 pl-3 leading-tight lg:ml-0 lg:border-l-0 lg:pl-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">OnTrip · Admin</p>
              <h1 className="truncate text-base font-semibold text-gray-900">{pageTitle}</h1>
            </div>
          </div>

          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg border border-transparent py-1 pl-1 pr-2 transition-colors hover:border-gray-200 hover:bg-gray-50 sm:gap-2.5 sm:pl-2 sm:pr-2"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
            >
              <div className="hidden max-w-[200px] text-right leading-tight sm:block">
                <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
                {displayContact ? (
                  <p className="truncate text-[11px] text-gray-600">{displayContact}</p>
                ) : (
                  <p className="text-[11px] text-gray-400">Signed in</p>
                )}
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm">
                <User className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
              </div>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                strokeWidth={2}
                aria-hidden
              />
            </button>

            {menuOpen ? (
              <div
                className="absolute right-0 top-full z-50 mt-1 w-[min(100vw-2rem,14rem)] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5 sm:w-56"
                role="menu"
                aria-orientation="vertical"
              >
                <div className="border-b border-gray-100 px-3 py-2.5 sm:hidden">
                  <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
                  {displayContact ? (
                    <p className="truncate text-xs text-gray-600">{displayContact}</p>
                  ) : (
                    <p className="text-xs text-gray-400">Signed in</p>
                  )}
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={goSettings}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} aria-hidden />
                  Settings
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={requestLogout}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                  Log out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Sign out?"
        message="You will need to sign in again to access the admin panel."
        confirmText="Log out"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  )
}
