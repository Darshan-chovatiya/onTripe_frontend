import { useEffect, useState } from 'react'
import { 
  Package, 
  MapPin, 
  User, 
  Calendar, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Clock,
  ShieldCheck,
  Phone,
  Mail,
  MoreVertical,
  Layers,
  UserCheck,
  CheckCircle,
  XCircle
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import Modal from '@/shared/components/Modal.jsx'

const getFileUrl = (path) => {
  if (!path) return null
  return path.startsWith('http') ? path : `http://localhost:5001/${path}`
}

const PackageDetailModal = ({ isOpen, onClose, pkg }) => {
  if (!pkg) return null

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Inventory Identity: ${pkg.title}`} 
      size="xl"
    >
      <div className="space-y-8 p-1">
        {/* Immersive Header */}
        <div className="relative h-72 rounded-[2rem] overflow-hidden border border-slate-200 shadow-2xl">
           <img 
              src={getFileUrl(pkg.coverImage)} 
              onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200'}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" 
              alt={pkg.title} 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90" />
           <div className="absolute bottom-8 left-8 right-8">
              <div className="flex items-center gap-2 text-primary-400 font-black text-[10px] uppercase tracking-[0.2em] mb-3">
                 <div className="h-6 w-6 rounded-lg bg-primary-500/20 backdrop-blur-md flex items-center justify-center border border-primary-500/30"><MapPin size={12} /></div>
                 {pkg.destination}
              </div>
              <h2 className="text-3xl font-black text-white leading-none tracking-tight">{pkg.title}</h2>
              <p className="text-slate-400 text-sm mt-3 font-medium max-w-2xl line-clamp-2">{pkg.description}</p>
           </div>
        </div>

        {/* Multi-Image Vault */}
        {pkg.images && pkg.images.length > 0 && (
           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Gallery</label>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                 {pkg.images.map((img, i) => (
                    <div key={i} className="h-24 w-32 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0 shadow-sm hover:scale-105 transition-transform cursor-pointer bg-slate-50">
                       <img 
                         src={getFileUrl(img)} 
                         onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=400'}
                         className="h-full w-full object-cover" 
                       />
                    </div>
                 ))}
              </div>
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-8">
              {/* Operational Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[
                   { label: 'Platform Fare', value: `₹${pkg.basePrice.toLocaleString()}`, icon: ShieldCheck, color: 'text-emerald-500' },
                   { label: 'Travel Duration', value: `${pkg.totalDays} Days`, icon: Clock, color: 'text-primary-500' },
                   { label: 'Booking Limit', value: pkg.maxCapacity, icon: User, color: 'text-slate-500' },
                   { label: 'Active State', value: pkg.isActive ? 'Public' : 'Private', icon: UserCheck, color: pkg.isActive ? 'text-emerald-500' : 'text-red-500' }
                 ].map((stat, i) => (
                   <div key={i} className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-xl transition-all hover:-translate-y-1">
                      <stat.icon size={20} className={`${stat.color} mb-3`} />
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</div>
                      <div className="text-sm font-black text-slate-900">{stat.value}</div>
                   </div>
                 ))}
              </div>

              {/* Comprehensive Itinerary */}
              <div className="space-y-6">
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 px-2">
                    <Calendar size={18} className="text-primary-500" /> Operational Matrix
                 </h3>
                 <div className="space-y-6">
                    {pkg.itinerary?.map((day, idx) => (
                      <div key={idx} className="relative pl-12 group last:pb-0 pb-8">
                         {/* Timeline Connector */}
                         <div className="absolute left-[15px] top-10 bottom-0 w-0.5 bg-slate-100 group-last:hidden" />
                         <div className="absolute left-0 top-0 h-8 w-8 rounded-xl bg-primary-600 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-primary-600/20 z-10 transition-transform group-hover:scale-110">
                            {day.day}
                         </div>
                         
                         <div className="space-y-4">
                            <div>
                               <h4 className="text-sm font-black text-slate-900 tracking-tight">{day.title}</h4>
                               {day.dateSuffix && <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">{day.dateSuffix}</span>}
                            </div>

                            {/* Detailed Events */}
                            {day.events && day.events.length > 0 && (
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {day.events.map((evt, eIdx) => (
                                     <div key={eIdx} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex gap-4 items-start hover:border-primary-100 transition-colors">
                                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-slate-50 overflow-hidden">
                                           {evt.image ? (
                                             <img 
                                               src={getFileUrl(evt.image)} 
                                               onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=200'}
                                               className="h-full w-full object-cover" 
                                             />
                                           ) : <Package size={16} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                           <div className="flex items-center justify-between gap-2 mb-1">
                                              <div className="text-[11px] font-black text-slate-900 truncate">{evt.title}</div>
                                              {evt.startTime && <div className="text-[9px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">{evt.startTime}</div>}
                                           </div>
                                           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60">{evt.type}</div>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            )}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Compliance section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                       <CheckCircle size={14} /> Service Inclusions
                    </label>
                    <div className="flex flex-wrap gap-2">
                       {pkg.inclusions?.map((item, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-tight border border-emerald-100">{item}</span>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                       <XCircle size={14} /> Service Exclusions
                    </label>
                    <div className="flex flex-wrap gap-2">
                       {pkg.exclusions?.map((item, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-tight border border-red-100">{item}</span>
                       )) || <span className="text-[10px] font-bold text-slate-400 italic">No specific exclusions identified</span>}
                    </div>
                 </div>
              </div>
           </div>

           {/* Agency Attribution */}
           <div className="space-y-6">
              <div className="sticky top-6 p-8 rounded-[2rem] bg-slate-900 text-white shadow-2xl shadow-slate-900/40 border border-slate-800 overflow-hidden group">
                 <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:rotate-12 transition-transform"><ShieldCheck size={180} /></div>
                 <div className="relative z-10">
                    <h3 className="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em] mb-6">Attributed Agency</h3>
                    <div className="flex items-center gap-5 mb-8">
                       <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-primary-400 shadow-xl group-hover:scale-110 transition-transform">
                          <User size={28} />
                       </div>
                       <div>
                          <div className="text-lg font-black text-white leading-none tracking-tight">{pkg.createdBy?.name}</div>
                          <div className="text-[11px] font-black text-primary-500 uppercase tracking-[0.15em] mt-2.5 px-3 py-1 bg-primary-500/10 rounded-xl border border-primary-500/20 inline-block">
                             {pkg.createdBy?.agentCode}
                          </div>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="flex items-center gap-4 text-[13px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer">
                          <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5"><Mail size={14} className="text-slate-500" /></div>
                          {pkg.createdBy?.email}
                       </div>
                       <div className="flex items-center gap-4 text-[13px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer">
                          <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5"><Phone size={14} className="text-slate-500" /></div>
                          {pkg.createdBy?.phone}
                       </div>
                       <div className="pt-6 mt-6 border-t border-white/5">
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-3">Governance Tier</div>
                          <div className="flex items-center gap-2">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                             <div className="text-[11px] font-black text-white uppercase tracking-[0.1em]">
                                {pkg.createdBy?.role?.replace('_', ' ')}
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </Modal>
  )
}

const Packages = () => {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedPkg, setSelectedPkg] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()

  const fetchPackages = async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.listPackages({ page, limit: 10, search: search || undefined })
      if (data?.success) {
        setPackages(data.data.packages)
        setTotalPages(data.data.totalPages)
      }
    } catch (error) {
      toast.error('Failed to retrieve inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handler = setTimeout(fetchPackages, 500)
    return () => clearTimeout(handler)
  }, [page, search])

  const handleImageError = (e) => {
    e.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200' // High-quality scenery placeholder
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Global Inventory</h1>
           <p className="text-sm font-bold text-slate-400 mt-2">Manage and audit all agency-created travel packages</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-full md:w-96 group focus-within:ring-4 focus-within:ring-primary-500/5 transition-all">
          <Search className="ml-2 text-slate-400 group-focus-within:text-primary-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by title or destination..."
            className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium text-slate-900"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
               <tr>
                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Package Registry</th>
                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Originating Agency</th>
                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inventory Pricing</th>
                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse"><td colSpan={4} className="px-6 py-5"><div className="h-12 bg-slate-100 rounded-xl" /></td></tr>
                  ))
               ) : packages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-slate-300">
                       <Package size={48} className="mx-auto mb-4 opacity-20" />
                       <h3 className="text-sm font-black text-slate-900">Inventory Exhausted</h3>
                       <p className="text-xs font-bold mt-1">No active packages matched your search filters</p>
                    </td>
                  </tr>
               ) : (
                 packages.map((pkg) => (
                   <tr key={pkg._id} className="hover:bg-slate-50 transition-colors group">
                     <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-xl border border-slate-200 overflow-hidden shrink-0 group-hover:scale-110 transition-transform bg-slate-50">
                              <img 
                                src={getFileUrl(pkg.coverImage)} 
                                onError={handleImageError}
                                className="h-full w-full object-cover" 
                              />
                           </div>
                           <div>
                              <div className="text-sm font-black text-slate-900 leading-tight">{pkg.title}</div>
                              <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1 uppercase tracking-tight"><MapPin size={10} className="text-primary-500" /> {pkg.destination}</div>
                           </div>
                        </div>
                     </td>
                     <td className="px-6 py-5">
                         <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors"><User size={16} /></div>
                            <div>
                               <div className="text-[11px] font-black text-slate-800 leading-none">{pkg.createdBy?.name}</div>
                               <div className="text-[9px] font-black text-primary-600 uppercase tracking-widest mt-1.5">{pkg.createdBy?.agentCode}</div>
                            </div>
                         </div>
                     </td>
                     <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-black text-slate-900 leading-none">₹{pkg.basePrice.toLocaleString()}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{pkg.totalDays} Days • {pkg.maxCapacity} Guests</div>
                     </td>
                     <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => { setSelectedPkg(pkg); setIsModalOpen(true); }}
                          className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all shadow-sm active:scale-90"
                        >
                          <Eye size={16} />
                        </button>
                     </td>
                   </tr>
                 ))
               )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-6 py-5 border-t border-slate-50 flex items-center justify-between bg-slate-50/10">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">P.{page} / {totalPages}</span>
             <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 px-3 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30 transition-all font-black text-[10px] uppercase"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8 px-3 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30 transition-all font-black text-[10px] uppercase"><ChevronRight size={16} /></button>
             </div>
          </div>
        )}
      </div>

      <PackageDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} pkg={selectedPkg} />
    </div>
  )
}

export default Packages
