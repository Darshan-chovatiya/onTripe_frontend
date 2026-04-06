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
  XCircle,
  Check,
  X
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

const PackageDetailModal = ({ isOpen, onClose, pkg, onApprove, onReject }) => {
  if (!pkg) return null

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Package Details: ${pkg.title}`} 
      size="xl"
    >
      <div className="space-y-6">
        {/* Cover Image */}
        <div className="relative h-64 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
           <img 
              src={getFileUrl(pkg.coverImage)} 
              onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200'}
              className="h-full w-full object-cover" 
              alt={pkg.title} 
           />
           <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-white/50">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
                 <MapPin size={14} /> {pkg.destination}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{pkg.title}</h2>
           </div>
        </div>

        {/* Approval Actions Section (Clean & Simple) */}
        {pkg.status === 'pending' && (
           <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                 <h4 className="text-sm font-bold text-gray-900">Awaiting Administrative Approval</h4>
                 <p className="text-xs text-gray-500 mt-1">Please review the itinerary and pricing before approving for distribution.</p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                 <button 
                   onClick={() => onReject(pkg._id)}
                   className="flex-1 sm:w-auto px-6 py-2 rounded-lg bg-white border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider hover:bg-red-50 flex items-center justify-center gap-2"
                 >
                    <X size={14} /> Reject
                 </button>
                 <button 
                   onClick={() => onApprove(pkg._id)}
                   className="flex-1 sm:w-auto px-6 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-700 flex items-center justify-center gap-2 shadow-md"
                 >
                    <Check size={14} /> Approve
                 </button>
              </div>
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[
                   { label: 'Base Fare', value: `₹${pkg.basePrice.toLocaleString()}`, icon: ShieldCheck, color: 'text-emerald-500' },
                   { label: 'Duration', value: `${pkg.totalDays} Days`, icon: Clock, color: 'text-blue-500' },
                   { label: 'Capacity', value: pkg.maxCapacity, icon: User, color: 'text-gray-500' },
                   { label: 'State', value: pkg.isActive ? 'Active' : 'Inactive', icon: CheckCircle, color: pkg.isActive ? 'text-emerald-500' : 'text-red-500' }
                 ].map((stat, i) => (
                   <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center">
                      <stat.icon size={16} className={`${stat.color} mb-2`} />
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</div>
                      <div className="text-xs font-bold text-gray-900">{stat.value}</div>
                   </div>
                 ))}
              </div>

              {/* Itinerary */}
              <div className="space-y-4">
                 <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Calendar size={18} className="text-blue-500" /> Itinerary Schedule
                 </h3>
                 <div className="space-y-4">
                    {pkg.itinerary?.map((day, idx) => (
                      <div key={idx} className="relative pl-8 border-l-2 border-gray-100 pb-4 last:pb-0">
                         <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
                         <h4 className="text-sm font-bold text-gray-900">Day {day.day}: {day.title}</h4>
                         <div className="mt-2 space-y-2">
                            {day.events?.map((evt, eIdx) => (
                               <div key={eIdx} className="p-3 bg-white border border-gray-100 rounded-lg flex items-center gap-3">
                                  <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                                     <Package size={14} />
                                  </div>
                                  <div className="text-xs">
                                     <div className="font-bold text-gray-900">{evt.title}</div>
                                     <div className="text-[10px] text-gray-500 uppercase tracking-wider">{evt.type}</div>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Agency Sidebar */}
           <div className="space-y-4">
              <div className="bg-gray-900 p-5 rounded-2xl text-white">
                 <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">Originating Agency</h4>
                 <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-4">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center"><User size={20} /></div>
                    <div>
                       <div className="text-sm font-bold">{pkg.createdBy?.name}</div>
                       <div className="text-[10px] text-gray-400">Agent ID: {pkg.createdBy?.agentCode}</div>
                    </div>
                 </div>
                 <div className="space-y-2 text-xs text-gray-400">
                    <div className="flex items-center gap-2"><Mail size={12} /> {pkg.createdBy?.email}</div>
                    <div className="flex items-center gap-2"><Phone size={12} /> {pkg.createdBy?.phone || 'N/A'}</div>
                 </div>
              </div>
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
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedPkg, setSelectedPkg] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchPackages = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        search: search || undefined,
        status: status === 'all' ? undefined : status
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
  }, [page, status, search])

  const handleApprove = async (id) => {
     try {
        const { data } = await adminApi.approvePackage(id)
        if (data.success) {
           toast.success('Package approved successfully')
           setIsModalOpen(false)
           fetchPackages()
        }
     } catch (err) {
        toast.error('Failed to approve package')
     }
  }

  const handleReject = async (id) => {
     const reason = prompt('Please enter rejection reason:')
     if (reason === null) return
     try {
        const { data } = await adminApi.rejectPackage(id, reason)
        if (data.success) {
           toast.success('Package rejected successfully')
           setIsModalOpen(false)
           fetchPackages()
        }
     } catch (err) {
        toast.error('Failed to reject package')
     }
  }

  const getStatusBadge = (status) => {
    const configs = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
      approved: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle }
    }
    const config = configs[status] || configs.pending
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.text}`}>
        <config.icon size={10} />
        {status}
      </span>
    )
  }

  const statusOptions = [
    { value: 'all', label: 'All Packages' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Packages Management</h1>
           <p className="text-gray-500 text-sm">Review and manage platform travel inventory</p>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search packages..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <CustomDropdown 
              value={status}
              onChange={setStatus}
              options={statusOptions}
              buttonClassName="!rounded-lg !border-gray-200 !text-sm !px-4 !py-2 h-auto"
           />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                 <tr>
                    <th className="px-6 py-4 font-bold text-gray-700">Package Details</th>
                    <th className="px-6 py-4 font-bold text-gray-700">Base Price</th>
                    <th className="px-6 py-4 font-bold text-gray-700">Origin Agency</th>
                    <th className="px-6 py-4 font-bold text-gray-700">Status</th>
                    <th className="px-6 py-4 font-bold text-gray-700 text-right">Actions</th>
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
                                   <div className="font-bold text-gray-900 truncate max-w-[200px]">{pkg.title}</div>
                                   <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                      <MapPin size={10} /> {pkg.destination}
                                   </div>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900">₹{pkg.basePrice.toLocaleString()}</td>
                          <td className="px-6 py-4">
                             <div className="text-gray-900 font-medium">{pkg.createdBy?.name}</div>
                             <div className="text-[10px] text-gray-500 uppercase tracking-widest">{pkg.createdBy?.agentCode}</div>
                          </td>
                          <td className="px-6 py-4">
                             {getStatusBadge(pkg.status)}
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
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  )
}

export default Packages
