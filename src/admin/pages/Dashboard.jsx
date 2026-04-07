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
    <div className="space-y-6 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-bold text-zinc-900">Dashboard Overview</h1>
            <p className="text-gray-500 text-sm font-medium">Real-time platform analytics and distribution metrics</p>
         </div>

         <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm">
            <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
               <Calendar size={16} />
            </div>
            <div className="pr-2">
               <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">System Registry Date</div>
               <div className="text-xs font-bold text-zinc-900 leading-none">
                  {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
               </div>
            </div>
         </div>
      </div>

      {/* Stat Cards Grid - Simplified & Professional */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color} mb-4 border border-current/10`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-black text-zinc-900">{stat.value}</h3>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{stat.detail}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Hierarchy Activity - Standardized Table */}
        <div className="lg:col-span-8 space-y-4">
           <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                 <div className="h-8 w-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center"><TrendingUp size={16} /></div>
                 <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Recent Network Growth</h3>
              </div>
              <button 
                onClick={() => window.location.hash = '#/admin/agencies'}
                className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 flex items-center gap-1.5 transition-colors"
              >
                 Identity Registry <ArrowUpRight size={12} />
              </button>
           </div>

           <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50/80 border-b border-slate-200">
                       <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">Entry Identity</th>
                          <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">Node Level</th>
                          <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest text-right pr-8">Registered</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {data?.recentAgents?.map((agent) => (
                          <tr key={agent._id} className="hover:bg-slate-50/50 transition-colors">
                             <td className="px-6 py-4">
                                <div className="text-sm font-bold text-zinc-900">{agent.name}</div>
                                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">{agent.email}</div>
                             </td>
                             <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${
                                   agent.role === 'parent_agent' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                                   agent.role === 'child_agent' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                   'bg-slate-50 text-slate-700 border-slate-100 shadow-sm'
                                }`}>
                                   {agent.role.replace(/_/g, ' ')}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <div className="text-xs font-bold text-zinc-900 whitespace-nowrap">{new Date(agent.createdAt).toLocaleDateString()}</div>
                                <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">Platform Entry</div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        {/* Compliance Snapshot - Flat Professional Design */}
        <div className="lg:col-span-4 space-y-4">
           <div className="flex items-center gap-2 px-1">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center"><ShieldCheck size={16} /></div>
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Compliance Pulse</h3>
           </div>

           <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="space-y-4">
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">KYC Audit State</div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-50/30 border border-emerald-100">
                       <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Validated</div>
                       <div className="text-2xl font-black text-emerald-700 leading-none">{kycApproved}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50/30 border border-amber-100">
                       <div className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Waiting</div>
                       <div className="text-2xl font-black text-amber-700 leading-none">{kycPending}</div>
                    </div>
                 </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                 <div className="flex items-center gap-2 text-zinc-900">
                    <AlertCircle size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Registry Alert</span>
                 </div>
                 <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
                    {kycPending > 0 ? (
                      <><span className="text-amber-600">{kycPending} identities</span> await approval. Verification required for full distribution.</>
                    ) : (
                      <>Hierarchy registry is fully synchronized and validated.</>
                    )}
                 </p>
              </div>

              <button 
                onClick={() => window.location.hash = '#/admin/agencies'}
                className="w-full py-3.5 rounded-xl bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/10 active:scale-95"
              >
                 Access Auditor Portal <ChevronRight size={14} />
              </button>
           </div>
        </div>
      </div>
    </div>
  )
}
