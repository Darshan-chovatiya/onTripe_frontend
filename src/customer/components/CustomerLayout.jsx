import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Calendar, History, LogOut, User, MessageSquare, Menu, X } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useState, useEffect } from 'react'
import NotificationBell from '@/shared/components/NotificationBell.jsx'
import { useInboxNotifications } from '@/shared/hooks/useInboxNotifications.js'
import { getCustomerUnreadCount } from '@/customer/services/customerApi.js'

export default function CustomerLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showConfirmLogout, setShowConfirmLogout] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { unreadCount } = useInboxNotifications({
    scope: 'customer',
    fetchUnreadCount: getCustomerUnreadCount,
  })

  // Always show solid header on non-booking pages, otherwise follow scroll
  const shouldShowSolid = location.pathname !== '/customer/booking' || isScrolled

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/customer/login', { replace: true })
  }

  const navItems = [
    { to: '/customer/booking', icon: Calendar, label: 'Trips' },
    { to: '/customer/trip-history', icon: History, label: 'History' },
    { to: '/customer/community', icon: MessageSquare, label: 'Community' },
    { to: '/customer/profile', icon: User, label: 'Profile' },
  ]

  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">

      {/* 🔴 Logout Modal */}
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

      {/* 🟢 Mobile Sidebar (Drawer) */}
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
                  <Calendar className="text-white" size={18} />
                </div>
                <span className="font-bold text-gray-900 dark:text-white">OnTrip</span>
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
              onClick={() => { closeSidebar(); setShowConfirmLogout(true); }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
            >
              <LogOut size={20} />
              <span className="font-semibold">Logout</span>
            </button>
          </div>
        </aside>
      </div>

      {/* 🟢 Top Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 h-20 items-center flex px-4 sm:px-8 justify-between ${
        shouldShowSolid 
          ? 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 shadow-sm' 
          : 'bg-transparent border-transparent'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/30 transform transition-transform hover:rotate-3">
            <Calendar className="text-white" size={22} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className={`font-black text-xl tracking-tight transition-colors duration-300 ${shouldShowSolid ? 'text-gray-900 dark:text-white' : 'text-white'}`}>
              OnTrip
            </span>
          </div>
        </div>

        {/* Desktop Nav */}
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
                  {/* Active Indicator Dot */}
                  <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <NotificationBell
            to="/customer/notifications"
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
            onClick={() => setIsSidebarOpen(true)}
            className={`lg:hidden p-3 rounded-2xl transition-all active:scale-90 ${
              shouldShowSolid 
                ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' 
                : 'bg-white/10 backdrop-blur-md text-white border border-white/10 hover:bg-white/20'
            }`}
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* 🟢 Main Content */}
      <main className={`min-h-screen ${location.pathname !== '/customer/booking' ? 'pt-24' : ''}`}>
        <div className="w-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}