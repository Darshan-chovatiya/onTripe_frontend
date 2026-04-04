import { Users, FileText, Ticket, TrendingUp } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'

export default function ParentDashboard() {
  const { user } = useAuth()

  const stats = [
    { label: 'Child Agencies', value: '12', icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Bookings', value: '148', icon: Ticket, color: 'bg-green-50 text-green-600' },
    { label: 'Monthly Revenue', value: '₹4.2L', icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
    { label: 'Pending KYC', value: '3', icon: FileText, color: 'bg-orange-50 text-orange-600' }
  ]

  return (
    <div className="animate-fade-in">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name || 'Partner'}</h1>
          <p className="text-gray-500 text-sm">Parent Agent Control Panel</p>
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

      {/* Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Partner Performance Overview</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 italic text-sm text-center px-6">Performance analytics for your child agencies will appear here once booking data is synchronized.</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full text-left p-4 rounded-xl border border-gray-100 hover:bg-primary-50 hover:border-primary-100 transition-all group">
              <span className="block font-semibold text-gray-900 group-hover:text-primary-600">Register Child Agency</span>
              <span className="text-xs text-gray-500">Create a sub-network partner</span>
            </button>
            <button className="w-full text-left p-4 rounded-xl border border-gray-100 hover:bg-primary-50 hover:border-primary-100 transition-all group">
              <span className="block font-semibold text-gray-900 group-hover:text-primary-600">Upload New Package</span>
              <span className="text-xs text-gray-500">Add inventory for agents to book</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
