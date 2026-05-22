import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { CalendarDays, LogOut, User, Menu, X, Briefcase, Users } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useState, useEffect } from 'react'
import NotificationBell from '@/shared/components/NotificationBell.jsx'
import { useInboxNotifications } from '@/shared/hooks/useInboxNotifications.js'
import { getVendorUnreadCount } from '@/vendor/services/vendorApi.js'
import { VendorChatProvider, useVendorChat } from '@/vendor/context/VendorChatContext.jsx'

function VendorLayoutInner() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { handleVendorNotification } = useVendorChat()
  const [showConfirmLogout, setShowConfirmLogout] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { unreadCount } = useInboxNotifications({
    scope: 'vendor',
    fetchUnreadCount: getVendorUnreadCount,
    onNotificationOpen: handleVendorNotification,
  })

  const isDashboard = location.pathname === '/vendor/dashboard' || location.pathname === '/vendor'
  const isCommunity = location.pathname.startsWith('/vendor/community')
  const shouldShowSolid = !isDashboard || isScrolled

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/vendor/login', { replace: true })
  }

  const navItems = [
    { to: '/vendor/dashboard', icon: CalendarDays, label: 'Schedule' },
    { to: '/vendor/community', icon: Users, label: 'Community' },
    { to: '/vendor/profile', icon: User, label: 'Profile' },
  ]

  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="min-h-dvh overflow-x-hidden bg-gray-50 dark:bg-gray-900">
      {showConfirmLogout && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowConfirmLogout(false)}
          />
          <div className="relative z-10 w-full max-w-xs sm:max-w-sm bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-white/10 shadow-2xl p-6 sm:p-8 text-center animate-scale-in">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <LogOut size={28} />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Logout?</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-2 mb-6">Are you sure you want to logout?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowConfirmLogout(false)}
                className="py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium active:scale-95 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed inset-0 z-[150] lg:hidden transition-all duration-300 ${isSidebarOpen ? 'visible' : 'invisible'}`}>
        <div
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeSidebar}
        />
        <aside className={`absolute top-0 right-0 bottom-0 w-72 bg-white dark:bg-gray-950 shadow-2xl transition-transform duration-300 ease-out border-l border-gray-100 dark:border-white/5 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="text-white" size={18} />
                </div>
                <span className="font-bold text-gray-900 dark:text-white">OnTrip Vendor</span>
              </div>
              <button onClick={closeSidebar} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl">
                <X size={20} />
              </button>
            </div>

            <nav className="space-y-2 flex-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeSidebar}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200
                    ${isActive
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 dark:shadow-none'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'}
                  `}
                >
                  <item.icon size={20} />
                  <span className="font-semibold">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <button
              onClick={() => { closeSidebar(); setShowConfirmLogout(true) }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
            >
              <LogOut size={20} />
              <span className="font-semibold">Logout</span>
            </button>
          </div>
        </aside>
      </div>

      <header className={`fixed top-0 left-0 right-0 z-[100] flex h-16 items-center justify-between px-3 transition-all duration-500 sm:h-20 sm:px-6 lg:px-8 ${
        shouldShowSolid
          ? 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 shadow-sm'
          : 'bg-transparent border-transparent'
      }`}>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 shadow-lg shadow-primary-500/30 transition-transform hover:rotate-3 sm:h-10 sm:w-10 sm:rounded-2xl">
            <Briefcase className="text-white" size={20} strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-col leading-tight">
            <span className={`truncate font-black text-base tracking-tight transition-colors duration-300 sm:text-xl ${shouldShowSolid ? 'text-gray-900 dark:text-white' : 'text-white'}`}>
              OnTrip Vendor
            </span>
          </div>
        </div>

        <nav className={`hidden lg:flex items-center gap-1 p-1 rounded-2xl transition-all duration-300 ${shouldShowSolid ? 'bg-gray-100/50' : 'bg-white/5 backdrop-blur-md border border-white/10'}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                relative flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 group
                ${isActive
                  ? (shouldShowSolid ? 'bg-white text-primary-600 font-bold shadow-sm' : 'bg-white text-gray-900 font-bold')
                  : (shouldShowSolid ? 'text-gray-500 hover:text-gray-900' : 'text-white/70 hover:text-white')}
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-sm font-medium tracking-tight">{item.label}</span>
                  <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <NotificationBell
            to="/vendor/notifications"
            unreadCount={unreadCount}
            solidHeader={shouldShowSolid}
          />
          <button
            onClick={() => setShowConfirmLogout(true)}
            className={`hidden lg:flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 border ${
              shouldShowSolid
                ? 'text-gray-500 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100'
                : 'text-white/70 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white'
            }`}
          >
            <LogOut size={18} strokeWidth={2} />
            <span className="text-sm font-bold tracking-tight">Exit</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className={`lg:hidden rounded-xl p-2.5 transition-all active:scale-90 sm:rounded-2xl sm:p-3 ${
              shouldShowSolid
                ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                : 'bg-white/10 backdrop-blur-md text-white border border-white/10 hover:bg-white/20'
            }`}
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <main
        className={
          isCommunity
            ? 'flex h-dvh min-h-0 flex-col pt-16 sm:pt-20'
            : `min-h-[calc(100dvh-4rem)] sm:min-h-[calc(100dvh-5rem)] ${!isDashboard ? 'pt-16 sm:pt-20' : ''}`
        }
      >
        <div className={`w-full max-w-[100vw] ${isCommunity ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : ''}`}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default function VendorLayout() {
  return (
    <VendorChatProvider>
      <VendorLayoutInner />
    </VendorChatProvider>
  )
}
