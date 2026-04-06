import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  TrendingUp, 
  CheckCircle2, 
  Clock 
} from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'

export default function Dashboard() {
  const { user } = useAuth()

  const stats = [
    { label: 'Total Users', value: '1,280', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50/50' },
    { label: 'Verified Agencies', value: '456', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
    { label: 'Pending KYC', value: '12', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50/50' },
    { label: 'Monthly Growth', value: '+14.5%', icon: TrendingUp, color: 'text-primary-600', bg: 'bg-primary-50/50' },
  ]

  return (
    <div className="space-y-7 animate-fade-in">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h1>
        <p className="text-sm text-slate-500 font-medium">Hello{user?.name ? `, ${user.name}` : ''}. Here is what's happening today.</p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group active:scale-[0.98]">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bg} ${stat.color} mb-4 transition-transform group-hover:scale-110`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Section (Primary Area) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-50 border border-primary-100 text-primary-600 shadow-sm">
              <LayoutDashboard className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Admin Intelligence Dashboard</h2>
              <p className="max-w-2xl text-sm font-medium text-slate-500 leading-relaxed">
                Your administrative control center is now fully operational. View key metrics across the entire OnTrip ecosystem, manage agent hierarchies, and track global bookings from this centralized portal.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions (Sidebar area in grid) */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-7 border-dashed flex flex-col justify-center text-center">
          <p className="text-sm font-bold text-slate-900">Need to help?</p>
          <p className="text-xs text-slate-500 mt-1 mb-4 font-medium">Quickly jump to important sections.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50">Manage Users</button>
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50">Audit Agencies</button>
          </div>
        </div>
      </div>
    </div>
  )
}
