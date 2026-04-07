import { useState } from 'react'
import { 
  X, 
  LogOut, 
  LayoutDashboard, 
  Settings, 
  Users, 
  Building2, 
  BarChart3, 
  ChevronDown, 
  ChevronRight, 
  UserRound, 
  Users2, 
  UserSquare2, 
  Package, 
  Layers,
  Bell
} from 'lucide-react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import logoIcon from '@/assets/Logo Icon.png'

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
    if (window.innerWidth < 1024) onClose()
  }

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/customers', icon: Users2, label: 'Customers' },
    { path: '/admin/packages', icon: Package, label: 'Packages' },
    { path: '/admin/whitelabels', icon: Layers, label: 'Whitelabels' },
    { path: '/admin/agencies', icon: Building2, label: 'Agencies' },
    { path: '/admin/child-agencies', icon: Building2, label: 'Child Agencies' },
    { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <>
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-800/50 bg-gray-900 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-800/50 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                logoError ? 'bg-primary-600' : 'overflow-hidden'
              }`}
            >
              {logoError ? (
                <LayoutDashboard className="h-5 w-5 text-white" />
              ) : (
                <img src={logoIcon} alt="" className="h-full w-full object-contain" onError={() => setLogoError(true)} />
              )}
            </div>
            <div>
              <div className="text-lg font-bold text-white">Admin</div>
              <div className="text-xs font-medium text-gray-400">Panel</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-gray-800/50 lg:hidden" aria-label="Close">
            <X className="h-5 w-5 text-gray-300" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
          {navItems.map((item) => {
            if (item.isSubMenu) {
              const Icon = item.icon
              return (
                <div key={item.label} className="space-y-1.5">
                  <button
                    onClick={item.toggle}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
                      item.isOpen ? 'text-white bg-gray-800/30' : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </div>
                    {item.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  
                  {item.isOpen && (
                    <div className="ml-4 space-y-1 border-l border-gray-800 pl-2">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon
                        return (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            onClick={() => window.innerWidth < 1024 && onClose()}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-lg px-4 py-2.5 text-xs transition-all ${
                                  isActive 
                                    ? 'bg-primary-600 font-semibold text-white' 
                                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                                }`
                            }
                          >
                            <ChildIcon className="h-4 w-4" />
                            {child.label}
                          </NavLink>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 font-sans text-sm transition-all ${
                    isActive ? 'bg-primary-600 font-semibold text-white' : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
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
            onClick={() => setShowLogoutConfirm(true)}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-300 hover:bg-red-900/30 hover:text-red-300"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="You will need to sign in again to access the admin panel."
        confirmText="Logout"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  )
}
