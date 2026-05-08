import { useState } from 'react'
import { X, LogOut, LayoutDashboard, Settings, Building2, Users2, Package, Bell, ChevronDown, Key, Ticket, BarChart3 } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { logout } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [agenciesOpen, setAgenciesOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
    if (window.innerWidth < 1024) onClose()
  }

  const navItems = [
    { path: '/admin/packages', icon: Package, label: 'Packages' },
    { path: '/admin/bookings', icon: Ticket, label: 'Bookings' },
    { path: '/admin/customers', icon: Users2, label: 'Customers' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
    { path: '/admin/otp-logs', icon: Key, label: 'OTP Logs' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ]
  const agencyItems = [
    { path: '/admin/agencies', label: 'Parent Agencies' },
    { path: '/admin/child-agencies', label: 'Child Agencies' },
  ]
  const agencySectionActive = agencyItems.some(
    (item) => pathname === item.path || pathname.startsWith(item.path + '/')
  )

  const linkCls = (isActive) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${
      isActive
        ? 'bg-white/10 text-white'
        : 'text-gray-400 hover:bg-white/6 hover:text-gray-200'
    }`

  return (
    <>
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #1a1745 50%, #14113a 100%)' }}>

        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
              <span className="text-xs font-black text-white">OT</span>
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-black tracking-tight text-white">OnTrip</p>
              <p className="text-[10px] font-medium text-white/40">Admin Console</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-lg p-1.5 text-white/30 hover:bg-white/10 hover:text-white lg:hidden">
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-white/8" />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Menu</p>
          <div className="space-y-0.5">

            <NavLink to="/admin/dashboard" end onClick={() => window.innerWidth < 1024 && onClose()}
              className={({ isActive }) => linkCls(isActive)}>
              <LayoutDashboard className="h-4 w-4 shrink-0" strokeWidth={2} />
              Dashboard
            </NavLink>

            {/* Agencies accordion */}
            <div>
              <button type="button" onClick={() => setAgenciesOpen(v => !v)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${
                  agencySectionActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/6 hover:text-gray-200'
                }`}>
                <Building2 className="h-4 w-4 shrink-0" strokeWidth={2} />
                <span className="flex-1 text-left">Agencies</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${agenciesOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
              </button>
              {agenciesOpen && (
                <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/8 pl-4">
                  {agencyItems.map(item => (
                    <NavLink key={item.path} to={item.path} onClick={() => window.innerWidth < 1024 && onClose()}
                      className={({ isActive }) =>
                        `block rounded-lg px-3 py-2 text-[12px] font-medium transition-all ${
                          isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
                        }`
                      }>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            {navItems.map(({ path, icon: Icon, label }) => (
              <NavLink key={path} to={path} onClick={() => window.innerWidth < 1024 && onClose()}
                className={({ isActive }) => linkCls(isActive)}>
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Divider */}
        <div className="mx-5 h-px bg-white/8" />

        {/* Logout */}
        <div className="shrink-0 px-3 py-4">
          <button type="button" onClick={() => setShowLogoutConfirm(true)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/40 transition hover:bg-red-500/15 hover:text-red-300">
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
        message="You will need to sign in again to access the admin panel."
        confirmText="Log out"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  )
}
