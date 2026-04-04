import { Users, Ticket, Award, Calendar } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'

export default function SubChildDashboard() {
  const { user } = useAuth()

  const stats = [
    { label: 'Upcoming Trips', value: '3', icon: Calendar, color: 'bg-primary-50 text-primary-600' },
    { label: 'Completed Bookings', value: '14', icon: Award, color: 'bg-green-50 text-green-600' },
    { label: 'Active Leads', value: '42', icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Wallet balance', value: '₹12K', icon: Ticket, color: 'bg-emerald-50 text-emerald-600' }
  ]

  return (
    <div className="animate-fade-in">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0] || 'Partner'}</h1>
          <p className="text-gray-500 text-sm">Sub-Agent Personal Operations Hub</p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <div className={`mb-4 inline-flex p-3 rounded-xl ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Trip Schedule</h2>
          <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Follow-up Call</h4>
                  <p className="text-xs text-gray-500">Group Tour #A-201 (Pending payment)</p>
                </div>
                <span className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100">Pending</span>
              </div>
              <div className="p-4 bg-green-50/50 rounded-xl border border-green-100 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-green-900 text-sm">Awaiting Documentation</h4>
                  <p className="text-xs text-green-700">Flight Tickets - Summer Special</p>
                </div>
                <span className="text-xs font-bold text-green-600">Reviewing</span>
              </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center min-h-[200px]">
             <Ticket className="h-12 w-12 text-gray-200 mb-2" />
             <h2 className="text-gray-400 font-medium italic">Booking analytics are not available yet.</h2>
             <p className="text-xs text-gray-400 text-center mt-2 px-8">Transactions through your Child Agency partner will synchronize here in real-time.</p>
          </div>
      </div>
    </div>
  )
}
