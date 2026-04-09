import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, Search, Calendar, History, LogOut, User } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useState } from 'react'

export default function CustomerLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [showConfirmLogout, setShowConfirmLogout] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/customer/login', { replace: true })
  }

  const navItems = [
    { to: '/customer/booking', icon: Calendar, label: 'My Trip' },
    { to: '/customer/trip-history', icon: History, label: 'History' },
    { to: '/customer/profile', icon: User, label: 'Profile' },
  ]

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      {/* Logout Confirmation Modal */}
      {showConfirmLogout && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fade-in">
          <div 
            className="absolute inset-0 bg-gray-950/20 backdrop-blur-md" 
            onClick={() => setShowConfirmLogout(false)} 
          />
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/5 p-8 md:p-10 w-full max-w-sm text-center relative z-10 animate-scale-in">
             <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <LogOut size={32} strokeWidth={2.5} />
             </div>
             <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Logout ?</h2>
             <p className="text-sm font-bold text-gray-400 mb-8 uppercase tracking-widest leading-relaxed">
               Are you sure you want to Logout ?
             </p>
             <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowConfirmLogout(false)}
                  className="flex items-center justify-center gap-2 py-4 bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                   No
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-200 dark:shadow-none active:scale-95 transition-all"
                >
                   Yes
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Persistent App-like Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 pt-2 pointer-events-none">
        <div className="max-w-lg mx-auto bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl border border-gray-200/50 dark:border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center justify-around p-2 pointer-events-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-500 group relative
                ${isActive ? 'text-primary-600 -translate-y-2' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className={`
                    transition-all duration-500 flex items-center justify-center
                    ${isActive ? 'p-3 rounded-full bg-primary-600 text-white shadow-xl shadow-primary-200 scale-125' : 'group-hover:scale-110'}
                  `}>
                    <item.icon 
                      size={24} 
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 mt-1.5 ${isActive ? 'text-primary-700 font-black scale-110' : 'text-gray-400 group-hover:text-primary-500'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* Logout Button */}
          <button
            onClick={() => setShowConfirmLogout(true)}
            className="flex flex-col items-center justify-center p-3 rounded-2xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-300 group"
          >
            <LogOut size={24} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.1em] mt-1.5">Exit</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

