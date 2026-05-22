import { useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  X,
  LogOut,
  LayoutDashboard,
  Package,
  Settings,
  Store,
  BookOpen,
  Users,
  Ticket,
  ContactRound,
  Lock,
  IndianRupee,
} from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { ROLES } from '@/shared/utils/constants.js'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import logoIcon from '@/assets/Logo Icon.png'
import { AGENCY_PANEL_BASE } from '@/travelAgency/agency/constants.js'
import { useAgencyPermissions } from '@/travelAgency/agency/hooks/useAgencyPermissions.js'
import { P } from '@/travelAgency/agency/rbac/agencyPermissions.js'

/**
 * Agency panel nav — matches admin Sidebar layout/classes; items from RBAC.
 * @param {{ isOpen: boolean, onClose: () => void }} props
 */
export default function AgencyPanelSidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { can, role, roleLabel, loginPathForLogout, isKycPending } = useAgencyPermissions()

  const sidebarBg =
    role === ROLES.PARENT_AGENCY
      ? 'bg-blue-950'
      : role === ROLES.CHILD_AGENCY
        ? 'bg-slate-900'
        : 'bg-gray-950'
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [logoError, setLogoError] = useState(true)
  const panelName = `${(roleLabel || 'Agency').replace(/agency/gi, '').trim() || 'Agency'}`

  const navItems = useMemo(() => {
    const base = AGENCY_PANEL_BASE
    /** @type {{ path: string, icon: typeof LayoutDashboard, label: string }[]} */
    const items = []

    if (can(P.DASHBOARD)) {
      items.push({ path: `${base}/dashboard`, icon: LayoutDashboard, label: 'Dashboard' })
    }
    if (can(P.PACKAGES_FULL) || can(P.PACKAGES_CLONE)) {
      items.push({ path: `${base}/packages`, icon: Package, label: 'Packages' })
    }
    if (can(P.VENDORS)) {
      items.push({ path: `${base}/vendors`, icon: Store, label: 'Vendors' })
    }
    if (can(P.BOOKINGS_NETWORK) || can(P.BOOKINGS_SALES)) {
      items.push({ path: `${base}/bookings`, icon: BookOpen, label: 'Bookings' })
    }
    if (can(P.NETWORK_CHILDREN)) {
      items.push({ path: `${base}/manage-downstream`, icon: Users, label: 'Manage agents' })
    }
    if (can(P.CUSTOMERS)) {
      items.push({ path: `${base}/customers`, icon: ContactRound, label: 'Customers' })
    }
    if (can(P.EARNINGS)) {
      items.push({ path: `${base}/earnings`, icon: IndianRupee, label: 'Earnings' })
    }
    if (can(P.SETTINGS)) {
      items.push({ path: `${base}/settings`, icon: Settings, label: 'Settings' })
    }

    return items
  }, [can])

  const handleLogout = () => {
    logout()
    navigate(loginPathForLogout, { replace: true })
    if (window.innerWidth < 1024) onClose()
  }

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col ${sidebarBg} transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 shadow-lg shadow-primary-900/40">
              <span className="text-xs font-black text-white">OT</span>
            </div>
            <div className="leading-tight">
              <p className="text-[11px] font-black uppercase tracking-widest text-white">OnTrip</p>
              <p className="truncate text-[10px] font-medium text-gray-400">{panelName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-white/10 hover:text-white lg:hidden">
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Agency navigation">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-600">Navigation</p>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isDashboard = item.path.endsWith('/dashboard')
              const isSettings = item.path.endsWith('/settings')
              const disabled = isKycPending && !isSettings

              return (
                <NavLink
                  key={item.path}
                  to={disabled ? '#' : item.path}
                  end={isDashboard}
                  onClick={(e) => {
                    if (disabled) e.preventDefault()
                    else if (window.innerWidth < 1024) onClose()
                  }}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all ${
                      disabled
                        ? 'cursor-not-allowed text-gray-600 opacity-50'
                        : isActive
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30'
                        : 'text-gray-400 hover:bg-white/8 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                  <span className="flex-1">{item.label}</span>
                  {disabled && <Lock className="h-3 w-3 text-gray-600" strokeWidth={2} />}
                </NavLink>
              )
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t border-white/8 px-3 py-3">
          <button type="button" onClick={() => setShowLogoutConfirm(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-400 transition hover:bg-red-500/10 hover:text-red-400">
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} />
            Log out
          </button>
        </div>
      </aside>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Sign out?"
        message="You will need to sign in again to access the agency panel."
        confirmText="Log out"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  )
}
