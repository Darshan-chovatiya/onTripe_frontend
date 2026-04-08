import { useState } from 'react'
import { X, LogOut, LayoutDashboard, Settings, Building2, Users2, Package, Layers, Bell, ChevronDown } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import logoIcon from '@/assets/Logo Icon.png'

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { logout } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [agenciesOpen, setAgenciesOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
    if (window.innerWidth < 1024) onClose()
  }

  const dashboardItem = { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' }
  const navItems = [
    { path: '/admin/packages', icon: Package, label: 'Packages' },
    { path: '/admin/whitelabels', icon: Layers, label: 'Whitelabels' },
    { path: '/admin/customers', icon: Users2, label: 'Customers' },
    { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ]
  const agencyItems = [
    { path: '/admin/agencies', label: 'Parent' },
    { path: '/admin/child-agencies', label: 'Child' },
    { path: '/admin/sub-child-agencies', label: 'Sub-child' },
  ]
  const agencySectionActive = agencyItems.some(
    (item) => pathname === item.path || pathname.startsWith(item.path + '/')
  )

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-gray-200 bg-white shadow-[1px_0_0_0_rgba(0,0,0,0.03)] transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 shrink-0 items-center border-b border-primary-800/30 bg-primary-700 px-4 sm:px-5">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  logoError ? 'bg-white/20' : 'overflow-hidden bg-white ring-2 ring-white/25'
                }`}
              >
                {logoError ? (
                  <span className="text-xs font-bold tracking-tight text-white">OT</span>
                ) : (
                  <img src={logoIcon} alt="" className="h-full w-full object-contain p-1" onError={() => setLogoError(true)} />
                )}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">OnTrip</p>
                <p className="truncate text-sm font-semibold text-white">Admin console</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1 shrink-0 rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
          <NavLink
            to={dashboardItem.path}
            onClick={() => window.innerWidth < 1024 && onClose()}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg border-l-[3px] py-2.5 pl-[9px] pr-3 text-[14px] leading-snug transition-colors ${
                isActive
                  ? 'border-primary-600 bg-primary-50 font-semibold text-gray-900'
                  : 'border-transparent font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <LayoutDashboard className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden />
            <span>{dashboardItem.label}</span>
          </NavLink>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setAgenciesOpen((v) => !v)}
              className={`flex w-full items-center gap-3 rounded-lg border-l-[3px] py-2.5 pl-[9px] pr-3 text-left text-[14px] leading-snug transition-colors ${
                agencySectionActive
                  ? 'border-primary-600 bg-primary-50 font-semibold text-gray-900'
                  : 'border-transparent font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Building2 className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden />
              <span className="flex-1">Agencies</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${agenciesOpen ? 'rotate-180' : ''}`}
                strokeWidth={2}
                aria-hidden
              />
            </button>
            {agenciesOpen ? (
              <div className="ml-7 space-y-1">
                {agencyItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => window.innerWidth < 1024 && onClose()}
                    className={({ isActive }) =>
                      `flex items-center rounded-md px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-primary-50 font-semibold text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg border-l-[3px] py-2.5 pl-[9px] pr-3 text-[14px] leading-snug transition-colors ${
                    isActive
                      ? 'border-primary-600 bg-primary-50 font-semibold text-gray-900'
                      : 'border-transparent font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
          </div>
        </nav>

        <div className="shrink-0 border-t border-gray-200 bg-gray-50/80 px-3 py-3">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="group flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left text-[14px] font-medium text-gray-700 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-800"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0 text-gray-500 group-hover:text-red-700" strokeWidth={2} />
            Log out
          </button>
        </div>
      </aside>

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
