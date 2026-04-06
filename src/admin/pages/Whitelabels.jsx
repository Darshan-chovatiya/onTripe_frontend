import { useEffect, useState } from 'react'
import { 
  Layers, 
  User, 
  MapPin, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  Building2,
  Package,
  Eye,
  ShieldCheck,
  Clock,
  Mail,
  Phone,
  Calendar
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import Modal from '@/shared/components/Modal.jsx'

const getFileUrl = (path) => {
  if (!path) return null
  return path.startsWith('http') ? path : `http://localhost:5001/${path}`
}

const WhitelabelDetailModal = ({ isOpen, onClose, wl }) => {
  if (!wl) return null

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Whitelabel Details: ${wl.customTitle || 'Standard'}`} 
      size="xl"
    >
      <div className="space-y-6">
        {/* Simple Cover Image Section */}
        <div className="relative h-60 rounded-xl overflow-hidden border border-gray-200">
           <img 
              src={getFileUrl(wl.originalPackage?.coverImage)} 
              onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200'}
              className="h-full w-full object-cover" 
              alt={wl.customTitle} 
           />
           <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-white/50">
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                 <Layers size={12} /> Custom Iteration Identity
              </div>
              <h2 className="text-xl font-bold text-gray-900 leading-none">{wl.customTitle || wl.originalPackage?.title}</h2>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              {/* Simple Pricing & Description Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Pricing Delta Analysis</div>
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-[9px] text-gray-400 uppercase font-bold">Platform Base</p>
                          <div className="text-lg font-bold text-gray-400 line-through">₹{wl.originalPackage?.basePrice.toLocaleString()}</div>
                       </div>
                       <ArrowRight className="text-gray-300" size={16} />
                       <div className="text-right">
                          <p className="text-[9px] text-emerald-600 uppercase font-bold">Retail Price</p>
                          <div className="text-xl font-bold text-emerald-600">₹{wl.finalPrice.toLocaleString()}</div>
                       </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-200/50 flex justify-between items-center">
                       <span className="text-[10px] font-bold text-gray-500 uppercase">Agent Margin:</span>
                       <span className="text-sm font-bold text-blue-600">+{wl.commissionValue}{wl.commissionType === 'percentage' ? '%' : ' INR'}</span>
                    </div>
                 </div>

                 <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Internal Remarks</div>
                    <p className="text-xs text-gray-600 leading-relaxed italic line-clamp-4">
                       "{wl.customDescription || 'No professional custom description provided for this iteration.'}"
                    </p>
                 </div>
              </div>

              {/* Original Itinerary Snapshot (Simplified) */}
              <div className="space-y-4">
                 <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Calendar size={18} className="text-blue-500" /> Source Inventory Logic
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {wl.originalPackage?.itinerary?.slice(0, 4).map((day, idx) => (
                      <div key={idx} className="p-3 bg-white border border-gray-100 rounded-lg flex items-center gap-3">
                         <div className="h-7 w-7 rounded bg-gray-50 text-gray-400 flex items-center justify-center font-bold text-[10px] border border-gray-100">D{day.day}</div>
                         <div className="text-xs font-bold text-gray-700 truncate">{day.title}</div>
                      </div>
                    ))}
                 </div>
                 {wl.originalPackage?.itinerary?.length > 4 && (
                    <p className="text-[10px] text-gray-400 italic text-center">+ {wl.originalPackage.itinerary.length - 4} additional days in logic chain</p>
                 )}
              </div>
           </div>

           {/* Standard Sidebar - Matching Packages Page */}
           <div className="space-y-4">
              <div className="bg-gray-900 p-5 rounded-xl text-white">
                 <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">Ownership Identity</h4>
                 <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-4">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center"><User size={20} /></div>
                    <div>
                       <div className="text-sm font-bold">{wl.createdBy?.name}</div>
                       <div className="text-[10px] text-gray-400">{wl.createdBy?.role.replace('_', ' ')} · {wl.createdBy?.agentCode}</div>
                    </div>
                 </div>
                 <div className="space-y-2 text-xs text-gray-400">
                    <div className="flex items-center gap-2"><Mail size={12} /> {wl.createdBy?.email}</div>
                    <div className="flex items-center gap-2"><Phone size={12} /> {wl.createdBy?.phone || 'N/A'}</div>
                 </div>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                 <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Traceability</div>
                 <div className="text-xs font-bold text-gray-900">Created {new Date(wl.createdAt).toLocaleDateString()}</div>
              </div>
           </div>
        </div>
      </div>
    </Modal>
  )
}

const Whitelabels = () => {
  const { toast } = useToast()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedWL, setSelectedWL] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchWhitelabels = async () => {
    setLoading(true)
    try {
      const { data: res } = await adminApi.listWhitelabelPackages({ page, limit: 10, search })
      if (res.success) {
        setData(res.data.whitelabels)
        setTotalPages(res.data.totalPages)
      }
    } catch (err) {
      toast.error('Failed to resolve lineages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWhitelabels()
  }, [page, search])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Whitelabel Lineage</h1>
           <p className="text-gray-500 text-sm">Audit inventory iterations and agency distribution density</p>
        </div>

        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
           <input 
             type="text" 
             placeholder="Search custom titles..."
             className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-80 shadow-sm"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
         <div className="overflow-x-auto min-h-[400px]">
           <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                 <tr>
                    <th className="px-6 py-4 font-bold text-gray-700">Iteration Details</th>
                    <th className="px-6 py-4 font-bold text-gray-700">Source Package</th>
                    <th className="px-6 py-4 font-bold text-gray-700">Owner Agency</th>
                    <th className="px-6 py-4 font-bold text-gray-700">Pricing Delta</th>
                    <th className="px-6 py-4 font-bold text-gray-700 text-right pr-12">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {loading ? (
                    Array(5).fill(0).map((_, i) => (
                       <tr key={i} className="animate-pulse">
                          <td colSpan={5} className="px-6 py-8"><div className="h-10 bg-gray-50 rounded" /></td>
                       </tr>
                    ))
                 ) : data.length === 0 ? (
                    <tr>
                       <td colSpan={5} className="py-20 text-center text-gray-500 italic">No whitelabel iterations identified.</td>
                    </tr>
                 ) : (
                    data.map((wl) => (
                       <tr key={wl._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                             <div className="font-bold text-gray-900">{wl.customTitle || 'Standard Iteration'}</div>
                             <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Custom Identity</div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="h-10 w-14 bg-gray-100 rounded overflow-hidden border border-gray-100 shrink-0">
                                   <img 
                                     src={getFileUrl(wl.originalPackage?.coverImage)} 
                                     onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=100'}
                                     className="h-full w-full object-cover" 
                                   />
                                </div>
                                <div className="min-w-0">
                                   <div className="font-medium text-blue-600 truncate max-w-[150px]">{wl.originalPackage?.title}</div>
                                   <div className="text-[10px] text-gray-500 flex items-center gap-0.5 uppercase tracking-wider">
                                       <MapPin size={8} /> {wl.originalPackage?.destination}
                                   </div>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="text-gray-900 font-medium">{wl.createdBy?.name}</div>
                             <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{wl.createdBy?.agentCode}</div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                                <span className="text-gray-400 line-through">₹{wl.originalPackage?.basePrice.toLocaleString()}</span>
                                <ArrowRight size={12} className="text-gray-300" />
                                <span className="font-bold text-emerald-600">₹{wl.finalPrice.toLocaleString()}</span>
                             </div>
                             <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                Margin: +{wl.commissionValue}{wl.commissionType === 'percentage' ? '%' : ' INR'}
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right pr-12">
                             <button 
                               onClick={() => {
                                  setSelectedWL(wl)
                                  setIsModalOpen(true)
                               }}
                               className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                               title="View Full Identity"
                             >
                                <Eye size={18} />
                             </button>
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
         </div>

         {totalPages > 1 && (
           <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                 <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 disabled:opacity-30 transition-all">Prev</button>
                 <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 disabled:opacity-30 transition-all">Next</button>
              </div>
           </div>
         )}
      </div>

      <WhitelabelDetailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        wl={selectedWL}
      />
    </div>
  )
}

export default Whitelabels
