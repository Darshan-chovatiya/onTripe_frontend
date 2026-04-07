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
   Calendar,
   Filter
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import Modal from '@/shared/components/Modal.jsx'
import CustomDropdown from '@/shared/components/CustomDropdown.jsx'

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
         title="Whitelabel Details"
         size="lg"
      >
         <div className="space-y-4">
            {/* Section 1: Core Information */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
               <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                     <h2 className="text-xl font-bold text-zinc-900 leading-tight">{wl.customTitle || wl.originalPackage?.title}</h2>
                     <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs tracking-wider shrink-0">
                        <MapPin size={12} /> {wl.originalPackage?.destination}
                     </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">{wl.customDescription || wl.originalPackage?.description || 'No description provided for this iteration.'}</p>
                  
                  <div className="pt-2 flex flex-wrap gap-2">
                     <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-full" title="Duration">
                        <Clock size={12} className="text-zinc-500" />
                        <span className="text-[11px] font-bold text-zinc-900">{wl.originalPackage?.totalDays} Days</span>
                     </div>
                     <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-full" title="Commission">
                        <TrendingUp size={12} className="text-zinc-500" />
                        <span className="text-[11px] font-bold text-blue-600">+{wl.commissionValue}{wl.commissionType === 'percentage' ? '%' : ' INR'}</span>
                     </div>
                     <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-full" title="Status">
                        <div className={`h-1.5 w-1.5 rounded-full ${wl.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-[11px] font-bold text-zinc-900">{wl.isActive ? 'Active' : 'Inactive'}</span>
                     </div>
                     <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-full" title="Created date">
                        <Calendar size={12} className="text-zinc-500" />
                        <span className="text-[11px] font-bold text-zinc-900">{new Date(wl.createdAt).toLocaleDateString()}</span>
                     </div>
                  </div>
               </div>
               <div className="bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl shrink-0 text-center min-w-[180px]">
                  <div className="text-xs font-bold text-gray-400 mb-1 leading-none">Price Details</div>
                  <div className="text-xl font-black text-emerald-600">₹{wl.finalPrice.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 mt-1 font-bold line-through">Base: ₹{wl.originalPackage?.basePrice.toLocaleString()}</div>
               </div>
            </div>

            {/* Section 3: Agency details */}
            <div className="pt-5">
               <h3 className="text-xs font-bold text-gray-400 mb-4">Agency Details</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 border border-gray-100 rounded-xl bg-white shadow-sm">
                     <div className="text-xs font-bold text-gray-400 mb-1">Agency Name</div>
                     <div className="text-sm font-bold text-zinc-900">{wl.createdBy?.name || 'N/A'}</div>
                  </div>
                  <div className="p-3 border border-gray-100 rounded-xl bg-white shadow-sm">
                     <div className="text-xs font-bold text-gray-400 mb-1">Email Address</div>
                     <div className="text-sm font-bold text-zinc-900 truncate">{wl.createdBy?.email || 'N/A'}</div>
                  </div>
                  <div className="p-3 border border-gray-100 rounded-xl bg-white shadow-sm">
                     <div className="text-xs font-bold text-gray-400 mb-1">Agency Role</div>
                     <div className="text-sm font-bold text-zinc-900">{wl.createdBy?.role?.replace('_', ' ').toUpperCase() || 'Agent'}</div>
                  </div>
               </div>
            </div>

            {/* Section 4: Itinerary details */}
            <div className="pt-5">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-gray-400 leading-none">Itinerary Details</h3>
                  <div className="text-xs text-gray-400 font-bold tracking-tight">Standard Sequence Profile</div>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {wl.originalPackage?.itinerary?.slice(0, 8).map((day, idx) => (
                    <div key={idx} className="p-3 border border-gray-100 rounded-xl bg-gray-50/30 flex items-center gap-3 shadow-sm">
                       <div className="h-6 w-6 rounded bg-zinc-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">{day.day}</div>
                       <div className="text-xs font-bold text-zinc-900 truncate">{day.title}</div>
                    </div>
                  ))}
               </div>
               {wl.originalPackage?.itinerary?.length > 8 && (
                  <p className="text-xs text-gray-400 font-bold mt-3">+ {wl.originalPackage.itinerary.length - 8} Additional Days in Logic Chain</p>
               )}
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
   const [agentRole, setAgentRole] = useState('all')
   const [page, setPage] = useState(1)
   const [totalPages, setTotalPages] = useState(1)
   const [selectedWL, setSelectedWL] = useState(null)
   const [isModalOpen, setIsModalOpen] = useState(false)

   const roleOptions = [
      { label: 'All Levels', value: 'all' },
      { label: 'Parent Agency', value: 'parent_agency' },
      { label: 'Child Agent', value: 'child_agent' },
      { label: 'Subchild Agent', value: 'subchild_agent' }
   ]

   const fetchWhitelabels = async () => {
      setLoading(true)
      try {
         const params = { 
            page, 
            limit: 10, 
            search,
            role: agentRole !== 'all' ? agentRole : undefined
         }
         const { data: res } = await adminApi.listWhitelabelPackages(params)
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
   }, [page, search, agentRole])

   return (
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h1 className="text-2xl font-bold text-zinc-900">Whitelabel Lineage</h1>
               <p className="text-gray-500 text-sm">Audit inventory iterations and agency distribution density</p>
            </div>

            <div className="flex items-center gap-3">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                     type="text"
                     placeholder="Search custom titles..."
                     className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64 shadow-sm"
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                  />
               </div>

               <div className="flex items-center gap-2">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden lg:block">Filter:</div>
                  <CustomDropdown
                     value={agentRole}
                     onChange={setAgentRole}
                     options={roleOptions}
                     className="w-44"
                     buttonClassName="!py-2"
                  />
               </div>
            </div>
         </div>

         <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto min-h-[400px]">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                     <tr>
                        <th className="px-6 py-4 font-bold text-zinc-900">Iteration Name</th>
                        <th className="px-6 py-4 font-bold text-zinc-900">From Package</th>
                        <th className="px-6 py-4 font-bold text-zinc-900">Agency</th>
                        <th className="px-6 py-4 font-bold text-zinc-900">Price Update</th>
                        <th className="px-6 py-4 font-bold text-zinc-900 text-right pr-12">Actions</th>
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
                                 <div className="font-bold text-zinc-900">{wl.customTitle || 'Standard Iteration'}</div>
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
                                 <div className="text-zinc-900 font-medium">{wl.createdBy?.name}</div>
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
