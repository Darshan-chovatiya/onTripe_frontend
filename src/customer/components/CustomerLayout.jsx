import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Calendar, History, LogOut, User, MessageSquare } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useState } from 'react'

export default function CustomerLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [showConfirmLogout, setShowConfirmLogout] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const navItems = [
    { to: '/customer/booking', icon: Calendar, label: 'Trips' },
    { to: '/customer/trip-history', icon: History, label: 'History' },
    { to: '/customer/community', icon: MessageSquare, label: 'Community' },
    { to: '/customer/profile', icon: User, label: 'Profile' },
  ]

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">

      {/* 🔴 Logout Modal */}
      {showConfirmLogout && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowConfirmLogout(false)}
          />

          <div className="relative z-10 w-full max-w-xs sm:max-w-sm 
          bg-white dark:bg-gray-900 rounded-3xl 
          border border-gray-200/50 dark:border-white/10 
          shadow-2xl p-6 sm:p-8 text-center animate-scale-in">

            <div className="w-16 h-16 sm:w-20 sm:h-20 
            bg-red-100 dark:bg-red-500/10 text-red-500 
            rounded-2xl flex items-center justify-center mx-auto mb-5">
              <LogOut size={28} />
            </div>

            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Logout?
            </h2>

            <p className="text-xs sm:text-sm text-gray-500 mt-2 mb-6">
              Are you sure you want to logout?
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowConfirmLogout(false)}
                className="py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 
                text-gray-600 hover:text-gray-900 dark:hover:text-white 
                text-sm font-medium transition"
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 
                text-white text-sm font-medium 
                active:scale-95 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24">
        <Outlet />
      </main>

      {/* 🔵 Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] px-3 sm:px-4 pb-4 sm:pb-6 pt-2 pointer-events-none">
        
        <div className="max-w-lg mx-auto 
        bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl 
        border border-gray-200/50 dark:border-white/10 
        rounded-3xl shadow-lg 
        flex items-center justify-around 
        p-1.5 sm:p-2 pointer-events-auto">

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex flex-col items-center justify-center 
                p-2 sm:p-3 rounded-xl sm:rounded-2xl 
                transition-all duration-300 group relative
                ${isActive
                  ? 'text-primary-600 -translate-y-1 sm:-translate-y-2'
                  : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className={`
                    flex items-center justify-center 
                    transition-all duration-300
                    ${isActive
                      ? 'p-2 sm:p-3 bg-primary-600 text-white rounded-full shadow-md scale-110 sm:scale-125'
                      : 'group-hover:scale-105'}
                  `}>
                    <item.icon
                      size={20}
                      className="sm:w-6 sm:h-6"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>

                  <span className={`
                    text-[10px] sm:text-[11px] font-medium tracking-wide mt-1
                    ${isActive
                      ? 'text-primary-700 scale-105'
                      : 'text-gray-400 group-hover:text-primary-500'}
                  `}>
                    {item.label}
                  </span>

                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 
                    w-1 h-1 bg-primary-600 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* 🔴 Logout Button */}
          <button
            onClick={() => setShowConfirmLogout(true)}
            className="flex flex-col items-center justify-center 
            p-2 sm:p-3 rounded-xl sm:rounded-2xl 
            text-gray-400 hover:bg-red-50 hover:text-red-500 
            transition-all duration-300 group"
          >
            <LogOut
              size={20}
              className="sm:w-6 sm:h-6 group-hover:scale-105 transition"
            />
            <span className="text-[10px] sm:text-[11px] font-medium tracking-wide mt-1">
              Exit
            </span>
          </button>

        </div>
      </nav>
    </div>
  )
}