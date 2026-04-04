import { Users, Ticket, Heart, Zap } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'

export default function ChildDashboard() {
  const { user } = useAuth()

  const stats = [
    { label: 'Sub-agents', value: '4', icon: Users, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Completed Tours', value: '82', icon: Ticket, color: 'bg-green-50 text-green-600' },
    { label: 'Customer Rating', value: '4.8', icon: Heart, color: 'bg-rose-50 text-rose-600' },
    { label: 'Monthly Sales', value: '₹1.8L', icon: Zap, color: 'bg-amber-50 text-amber-600' }
  ]

  return (
    <div className="animate-fade-in">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hello, {user?.name || 'Agent'}</h1>
          <p className="text-gray-500 text-sm">Child Agency Operations Center</p>
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

      {/* Main Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">Sub-Agent Network Details</h2>
          <div className="flex items-center justify-center h-48 bg-gray-50 rounded-xl border border-gray-100 italic text-gray-400">
            No recent activity found. Start booking today!
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
             <h2 className="text-lg font-bold text-gray-900 mb-4">Agency Information</h2>
             <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 mb-4 font-semibold text-primary-900">
                Invitation Code: <span className="font-mono bg-white px-2 py-1 rounded border border-primary-200">ONTRIP-C82-99</span>
                <p className="text-xs font-normal text-primary-600 mt-1 block">Share this code with your sub-agents to register them under your network.</p>
             </div>
             <div className="text-gray-500 text-sm italic py-4">Detailed statistics for individual sub-agents will be available here soon.</div>
          </div>
      </div>
    </div>
  )
}
