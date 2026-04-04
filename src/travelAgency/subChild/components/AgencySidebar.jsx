import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { X, LogOut, LayoutDashboard, Ticket, User, Settings } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import logoIcon from '@/assets/Logo Icon.png'

const BASE = '/agency/sub'

export default function AgencySidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [confirm, setConfirm] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const navItems = [
    { path: `${BASE}/dashboard`, icon: LayoutDashboard, label: 'Dashboard' },
    { path: `${BASE}/my-bookings`, icon: Ticket, label: 'My bookings' },
    { path: `${BASE}/profile`, icon: User, label: 'Profile' },
    { path: `${BASE}/settings`, icon: Settings, label: 'Settings' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/travelAgency/subchild/login', { replace: true })
    if (window.innerWidth < 1024) onClose()
  }

  return (
    <>
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-800/50 bg-gray-900 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-800/50 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${logoError ? 'bg-primary-600' : 'overflow-hidden'}`}>
              {logoError ? (
                <LayoutDashboard className="h-5 w-5 text-white" />
              ) : (
                <img src={logoIcon} alt="" className="h-full w-full object-contain" onError={() => setLogoError(true)} />
              )}
            </div>
            <div>
              <div className="text-lg font-bold text-white">Sub agency</div>
              <div className="text-xs text-gray-400">Travel</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-gray-800/50 lg:hidden" aria-label="Close">
            <X className="h-5 w-5 text-gray-300" />
          </button>
        </div>
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
                    isActive ? 'bg-primary-600 font-medium text-white' : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
        <div className="border-t border-gray-800/50 p-4">
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-300 hover:bg-red-900/30 hover:text-red-300"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
      <ConfirmDialog
        isOpen={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="You will need to sign in again."
        confirmText="Logout"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  )
}
