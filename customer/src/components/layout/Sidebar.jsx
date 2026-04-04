import { useState } from 'react'
import { X, LogOut, LayoutDashboard, Settings } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import ConfirmDialog from '../common/ConfirmDialog'
import logoIcon from '../../assets/Logo Icon.png'

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuthStore()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    if (window.innerWidth < 1024) {
      onClose()
    }
    navigate('/login', { replace: true })
  }

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <>
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-900 to-gray-900 dark:from-gray-950 dark:to-gray-950 border-r border-gray-800/50 dark:border-gray-700/50 flex flex-col transform transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="h-16 px-4 sm:px-6 border-b border-gray-800/50 dark:border-gray-700/50 flex items-center justify-between bg-gray-900/50 dark:bg-gray-950/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                logoError
                  ? 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-primary-500/30'
                  : 'overflow-hidden'
              }`}
            >
              {logoError ? (
                <LayoutDashboard className="w-5 h-5 text-gray-900" />
              ) : (
                <img
                  src={logoIcon}
                  alt="Customer"
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              )}
            </div>
            <div className="align-middle">
              <div className="text-lg sm:text-xl font-bold text-white font-sans" style={{ lineHeight: '20px' }}>
                Customer
              </div>
              <div className="text-gray-400 dark:text-gray-500 text-xs font-medium">Panel</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-800/50 dark:hover:bg-gray-700/50 transition-all duration-200 active:scale-95"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-300 dark:text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    onClose()
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-sans group ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-gray-900 font-semibold shadow-lg shadow-primary-500/30 transform scale-[1.02]'
                      : 'text-gray-300 dark:text-gray-400 hover:bg-gray-800/50 dark:hover:bg-gray-800/50 hover:text-white hover:translate-x-1'
                  }`
                }
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'group-hover:scale-110' : ''}`} />
                <span className="text-sm sm:text-base">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-800/50 dark:border-gray-700/50 bg-gray-900/30 dark:bg-gray-950/30 space-y-1.5">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-sans group text-gray-300 dark:text-gray-400 hover:bg-red-900/30 dark:hover:bg-red-900/40 hover:text-red-200 dark:hover:text-red-200 hover:translate-x-1 active:scale-95"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm sm:text-base">Logout</span>
          </button>
        </div>
      </aside>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to login again to access the customer panel."
        confirmText="Logout"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  )
}

export default Sidebar
