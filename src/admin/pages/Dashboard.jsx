import { useEffect, useState } from 'react'
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Package, 
  ShieldCheck, 
  AlertCircle,
  ChevronRight,
  ArrowUpRight,
  Calendar
} from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import adminApi from '@/admin/services/adminApi'
import Loader from '@/shared/components/Loader.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await adminApi.getAnalytics()
        if (res.data?.success) {
          setData(res.data.data)
        }
      } catch (error) {
        console.error('Analytics sync failed', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) return (
    <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center space-y-4">
       <Loader size="lg" />
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Platform Intelligence...</p>
    </div>
  )

  const kycPending = data?.kycStatusCounts?.find(c => c._id === 'pending')?.count || 0
  const kycApproved = data?.kycStatusCounts?.find(c => c._id === 'approved')?.count || 0

  const stats = [
    { label: 'Total Travelers', value: data?.totalCustomers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50/50', detail: 'Across all nodes' },
    { label: 'Verified Agencies', value: kycApproved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50/50', detail: 'KYC Validated' },
    { label: 'Pending Audits', value: kycPending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50/50', detail: 'Action Required' },
    { label: 'Inventory Assets', value: data?.totalPackages || 0, icon: Package, color: 'text-primary-600', bg: 'bg-primary-50/50', detail: 'Live Packages' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header & Activity Snapshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-bold text-zinc-900">Command Center</h1>
            <p className="text-gray-500 text-sm">Platform overview and live distribution metrics for {user?.name || 'Administrator'}</p>
         </div>

         <div className="flex items-center gap-3 bg-white border border-gray-200 p-2 rounded-xl shadow-sm">
            <div className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
               <Calendar size={18} />
            </div>
            <div className="pr-4">
               <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">System Date</div>
               <div className="text-sm font-bold text-zinc-900 leading-none">
                  {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
               </div>
            </div>
         </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200/60 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 h-24 w-24 -mr-8 -mt-8 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform ${stat.bg.replace('/50', '')}`} />
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color} mb-6 shadow-sm group-hover:rotate-6 transition-all`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-black text-slate-900 leading-none">{stat.value}</h3>
                <span className="text-[10px] font-bold text-slate-400 mb-1 leading-none italic">{stat.detail}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Node Activity */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center"><TrendingUp size={20} /></div>
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic">Recent Hierarchy Expansion</h3>
              </div>
              <button className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline flex items-center gap-1.5">
                 View Hierarchy <ArrowUpRight size={12} />
              </button>
           </div>

           <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                       <tr>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Entry Identity</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Node Level</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Timestamp</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {data?.recentAgents?.map((agent) => (
                          <tr key={agent._id} className="hover:bg-slate-50/30 transition-colors group">
                             <td className="px-6 py-4">
                                <div className="text-sm font-bold text-slate-900">{agent.name}</div>
                                <div className="text-[10px] text-slate-400 font-bold tracking-tight italic">{agent.email}</div>
                             </td>
                             <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                   agent.role === 'parent_agent' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                                   agent.role === 'child_agent' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                   'bg-slate-50 text-slate-700 border-slate-100'
                                }`}>
                                   {agent.role.replace('_', ' ')}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{new Date(agent.createdAt).toLocaleDateString()}</div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        {/* System Monitoring */}
        <div className="space-y-6">
           <div className="flex items-center gap-3 px-2">
              <div className="h-10 w-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-600/20"><ShieldCheck size={20} /></div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic">Compliance Pulse</h3>
           </div>

           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute bottom-0 right-0 -mb-12 -mr-12 h-64 w-64 bg-primary-600/20 blur-[100px] rounded-full group-hover:scale-125 transition-all duration-700" />
              
              <div className="relative space-y-8">
                 <div className="space-y-2">
                    <div className="text-[10px] font-black text-primary-400 uppercase tracking-[0.3em] leading-none mb-4">KYC Global Snapshot</div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                       <span className="text-xs font-bold text-slate-400">Validated Entities</span>
                       <span className="text-2xl font-black text-emerald-400 leading-none">{kycApproved} <span className="text-[10px] text-slate-500 font-bold">Approved</span></span>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                       <span className="text-xs font-bold text-slate-400">Security Waitlist</span>
                       <span className="text-2xl font-black text-amber-400 leading-none">{kycPending} <span className="text-[10px] text-slate-500 font-bold">Pending</span></span>
                    </div>
                 </div>

                 <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center gap-3 text-amber-500">
                       <AlertCircle size={18} />
                       <span className="text-[11px] font-black uppercase tracking-widest">Administrative Alert</span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 leading-relaxed italic">
                       There are <span className="text-white font-bold">{kycPending} agencies</span> awaiting identity verification. Process pending audits to keep the platform compliant.
                    </p>
                 </div>

                 <button className="w-full py-4 rounded-2xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-600/30 hover:bg-primary-500 transition-all active:scale-95 flex items-center justify-center gap-3">
                    Launch Identity Audit <ChevronRight size={14} />
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
