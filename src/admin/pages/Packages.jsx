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
   CheckCircle,
   Check,
   MessageSquare
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import Modal from '@/shared/components/Modal.jsx'
import CustomDropdown from '@/shared/components/CustomDropdown.jsx'
import CommunityChat from '@/customer/components/CommunityChat.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'

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
         title="Package Details"
         size="lg"
      >
         <div className="space-y-4">
            {/* Section 1: Core Information */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
               <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                     <h2 className="text-xl font-bold text-zinc-900 leading-tight">{pkg.title}</h2>
                     <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs tracking-wider shrink-0">
                        <MapPin size={12} /> {pkg.destination}
                     </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">{pkg.description || 'No description provided.'}</p>
                  
                  <div className="pt-2 flex flex-wrap gap-2">
                     <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-full" title="Duration">
                        <Clock size={12} className="text-zinc-500" />
                        <span className="text-[11px] font-bold text-zinc-900">{pkg.totalDays} Days</span>
                     </div>
                     <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-full" title="Capacity">
                        <User size={12} className="text-zinc-500" />
                        <span className="text-[11px] font-bold text-zinc-900">{pkg.maxCapacity} Max</span>
                     </div>
                     <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-full" title="Status">
                        <div className={`h-1.5 w-1.5 rounded-full ${pkg.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-[11px] font-bold text-zinc-900">{pkg.isActive ? 'Active' : 'Inactive'}</span>
                     </div>
                     <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-full" title="Currency">
                        <Package size={12} className="text-zinc-500" />
                        <span className="text-[11px] font-bold text-zinc-900">{pkg.currency || 'INR'}</span>
                     </div>
                  </div>
               </div>
               <div className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl shrink-0 text-center min-w-[160px]">
                  <div className="text-xs font-bold text-gray-400 mb-1 leading-none">Price Details</div>
                  <div className="text-xl font-black text-zinc-900">₹{pkg.basePrice.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 mt-0.5 font-bold tracking-tighter leading-none">Net per person</div>
               </div>
            </div>

            {/* Section 3: Agency Details */}
            <div className="pt-5">
               <h3 className="text-xs font-bold text-gray-400 mb-4">Agency Details</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 border border-gray-100 rounded-xl bg-white shadow-sm">
                     <div className="text-xs font-bold text-gray-400 mb-1">Agency Name</div>
                     <div className="text-sm font-bold text-zinc-900">{pkg.createdBy?.name || 'N/A'}</div>
                     <div className="text-xs text-blue-600 font-bold mt-0.5">ID: {pkg.createdBy?.agentCode || 'N/A'}</div>
                  </div>
                  <div className="p-3 border border-gray-100 rounded-xl bg-white shadow-sm">
                     <div className="text-xs font-bold text-gray-400 mb-1">Email Address</div>
                     <div className="text-sm font-bold text-zinc-900 truncate">{pkg.createdBy?.email || 'N/A'}</div>
                     <div className="text-xs text-gray-400 font-bold mt-0.5">Contact Line</div>
                  </div>
                  <div className="p-3 border border-gray-100 rounded-xl bg-white shadow-sm">
                     <div className="text-xs font-bold text-gray-400 mb-1">Contact Number</div>
                     <div className="text-sm font-bold text-zinc-900">{pkg.createdBy?.phone || 'Not available'}</div>
                     <div className="text-xs text-gray-400 font-bold mt-0.5">Direct Line</div>
                  </div>
               </div>
            </div>

            {/* Section 4: Itinerary Details */}
            <div className="pt-5">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-gray-400 leading-none">Itinerary Details</h3>
                  <div className="text-xs text-gray-400 font-bold tracking-tight">{pkg.itinerary?.length || 0} Days Overview</div>
               </div>

               <div className="space-y-3">
                  {pkg.itinerary?.map((day, idx) => (
                     <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-gray-50/50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded bg-gray-900 text-white flex items-center justify-center text-xs font-black">{day.day}</div>
                              <h4 className="text-sm font-bold text-zinc-900 tracking-tight">{day.title}</h4>
                           </div>
                           {day.dateSuffix && <span className="text-xs font-bold text-gray-400">{day.dateSuffix}</span>}
                        </div>
                        <div className="p-3 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                           {day.events?.map((evt, eIdx) => (
                              <div key={eIdx} className="p-2.5 border border-gray-50 rounded-lg bg-gray-50/30 flex items-start gap-2.5">
                                 <div className="mt-0.5 h-6 w-6 shrink-0 rounded bg-white border border-gray-100 flex items-center justify-center text-gray-400">
                                    <Package size={12} />
                                 </div>
                                 <div className="min-w-0">
                                    <div className="font-bold text-zinc-900 text-xs truncate leading-tight tracking-tight">{evt.title}</div>
                                    <div className="flex items-center gap-2 mt-0.5 leading-none text-xs">
                                       <div className="text-xs text-blue-600 font-bold tracking-tighter bg-blue-50 px-1 rounded">{evt.type}</div>
                                       {evt.startTime && <div className="text-xs text-gray-400 font-bold tracking-tighter">@ {evt.startTime}</div>}
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Section 5: Photo Gallery */}
            <div className="pt-5">
               <h3 className="text-xs font-bold text-gray-400 mb-4 leading-none">Photo Gallery</h3>
               <div className="flex gap-3 overflow-x-auto pb-3">
                  {pkg.images?.length > 0 ? (
                     pkg.images.map((img, i) => (
                        <img key={i} src={getFileUrl(img)} className="h-20 w-28 object-cover rounded-lg border border-gray-200 shrink-0 shadow-sm" />
                     ))
                  ) : (
                     <div className="text-xs text-gray-400 font-bold tracking-tighter leading-none">No Gallery Assets Found</div>
                  )}
               </div>
            </div>
         </div>
      </Modal>
   )
}

const Packages = () => {
   const { toast } = useToast()
   const [packages, setPackages] = useState([])
   const [loading, setLoading] = useState(true)
   const [search, setSearch] = useState('')
   const [page, setPage] = useState(1)
   const [totalPages, setTotalPages] = useState(1)
   const [selectedPkg, setSelectedPkg] = useState(null)
   const [isModalOpen, setIsModalOpen] = useState(false)
   const [chatPackageId, setChatPackageId] = useState(null)
   const { user } = useAuth()

   const fetchPackages = async () => {
      setLoading(true)
      try {
         const params = {
            page,
            limit: 10,
            search: search || undefined
         }
         const { data } = await adminApi.listPackages(params)
         if (data?.success) {
            setPackages(data.data.packages)
            setTotalPages(data.data.totalPages)
         }
      } catch (error) {
         toast.error('Failed to fetch packages')
      } finally {
         setLoading(false)
      }
   }

   useEffect(() => {
      fetchPackages()
   }, [page, search])



   return (
      <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-bold text-zinc-900">Packages Management</h1>
            <p className="text-gray-500 text-sm">Review platform travel inventory and distribution state</p>
         </div>

         <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
               type="text"
               placeholder="Search packages..."
               className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
            />
         </div>
      </div>

         <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                     <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">Package Name</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">Base Price</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">Agency</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest text-right pr-12">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {loading ? (
                        Array(5).fill(0).map((_, i) => (
                           <tr key={i} className="animate-pulse">
                              <td colSpan={5} className="px-6 py-8"><div className="h-10 bg-gray-50 rounded" /></td>
                           </tr>
                        ))
                     ) : packages.length === 0 ? (
                        <tr>
                           <td colSpan={5} className="py-20 text-center text-gray-500">No packages found for the selected filters.</td>
                        </tr>
                     ) : (
                        packages.map((pkg) => (
                           <tr key={pkg._id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="h-12 w-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
                                       <img
                                          src={getFileUrl(pkg.coverImage)}
                                          onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=100'}
                                          className="h-full w-full object-cover"
                                       />
                                    </div>
                                    <div className="min-w-0">
                                       <div className="font-bold text-zinc-900 truncate max-w-[200px]">{pkg.title}</div>
                                       <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                          <MapPin size={10} /> {pkg.destination}
                                       </div>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4 font-bold text-zinc-900">₹{pkg.basePrice.toLocaleString()}</td>
                              <td className="px-6 py-4">
                                 <div className="text-zinc-900 font-medium">{pkg.createdBy?.name}</div>
                                 <div className="text-[10px] text-gray-500 uppercase tracking-widest">{pkg.createdBy?.agentCode}</div>
                              </td>
                              <td className="px-6 py-4 text-right">

                                 <button
                                    onClick={() => {
                                       setSelectedPkg(pkg)
                                       setIsModalOpen(true)
                                    }}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    title="View Details"
                                 >
                                    <Eye size={18} />
                                 </button>
                                 <button
                                    onClick={() => setChatPackageId(pkg._id)}
                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                    title="Community Chat"
                                 >
                                    <MessageSquare size={18} />
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
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Page {page} of {totalPages}</span>
                  <div className="flex gap-2">
                     <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 disabled:opacity-30 transition-all">Prev</button>
                     <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 disabled:opacity-30 transition-all">Next</button>
                  </div>
               </div>
            )}
         </div>

         <PackageDetailModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            pkg={selectedPkg}
         />

         <Modal
            isOpen={!!chatPackageId}
            onClose={() => setChatPackageId(null)}
            title="Community chat"
            size="xl"
         >
            {chatPackageId ? <CommunityChat packageId={chatPackageId} currentUserId={user?.id} /> : null}
         </Modal>
      </div>
   )
}

export default Packages
