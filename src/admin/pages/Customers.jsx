import { useEffect, useState } from 'react'
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Calendar,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Building2,
  FileText,
  Building,
  ExternalLink,
  MapPin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import Modal from '@/shared/components/Modal.jsx'

const CustomerDetailModal = ({ isOpen, onClose, customer }) => {
  if (!customer) return null

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Customer Profile View" 
      size="lg"
    >
      <div className="space-y-6">
        {/* SECTION 1: GLOBAL PROFILE (MASTER DATA) */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-gray-100">
           <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-primary-600 shadow-sm shrink-0">
                  <Users size={32} />
              </div>
              <div className="space-y-1">
                 <h3 className="text-xl font-bold text-zinc-900 leading-tight">{customer.name}</h3>
                 <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                       <Phone size={12} className="text-gray-400" /> {customer.phone}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                       <Mail size={12} className="text-gray-400" /> {customer.email || 'N/A'}
                    </span>
                 </div>
              </div>
           </div>
           <div className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl shrink-0 text-center min-w-[150px]">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 leading-none">Joined Platforms</div>
              <div className="text-sm font-black text-zinc-900">{new Date(customer.createdAt).toLocaleDateString()}</div>
              <div className="text-[10px] text-primary-600 mt-1 font-bold">Verified Link</div>
           </div>
        </div>

        {/* SECTION 2: AGENCY-SPECIFIC PROFILES */}
        <div className="space-y-4">
           <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Agency Profiles</h4>

           {!customer.agencyProfiles || customer.agencyProfiles.length === 0 ? (
             <div className="p-8 text-center rounded-xl border border-gray-100 bg-gray-50/50">
                <p className="text-sm text-gray-500 italic">No associated agency profiles identified.</p>
             </div>
           ) : (
             <div className="space-y-4">
                {customer.agencyProfiles.map((profile, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-blue-200 transition-all shadow-sm">
                     {/* Agency Header - Unified style */}
                     <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <Building2 size={14} className="text-gray-400" />
                           <div className="text-xs font-bold text-zinc-900 leading-none">{profile.managedBy?.name}</div>
                           <div className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-widest">
                             {profile.managedBy?.agentCode}
                           </div>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${profile.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {profile.isActive ? 'Active' : 'Inactive'}
                        </span>
                     </div>

                     <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Profile Info */}
                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                              <div className="space-y-0.5">
                                 <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Alias</label>
                                 <div className="text-xs font-bold text-zinc-900">{profile.name || '-'}</div>
                              </div>
                              <div className="space-y-0.5">
                                 <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Nationality</label>
                                 <div className="text-xs font-bold text-zinc-900">{profile.nationality || '-'}</div>
                              </div>
                              <div className="space-y-0.5">
                                 <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Identity No.</label>
                                 <div className="text-xs font-bold text-zinc-900">{profile.aadharNumber || '-'}</div>
                              </div>
                              <div className="space-y-0.5">
                                 <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Passport</label>
                                 <div className="text-xs font-bold text-zinc-900">{profile.passportNumber || '-'}</div>
                              </div>
                           </div>
                           
                           {profile.notes && (
                             <div className="p-3 bg-gray-50 rounded-lg border-l-2 border-gray-200 italic text-[11px] text-gray-600">
                                {profile.notes}
                             </div>
                           )}
                        </div>

                        {/* Documents Vault */}
                        <div className="space-y-3">
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Identity Docs</label>
                           <div className="grid grid-cols-2 gap-2">
                              {[
                                { label: 'Aadhar F', path: profile.docs?.aadharFront },
                                { label: 'Aadhar B', path: profile.docs?.aadharBack },
                                { label: 'PAN Card', path: profile.docs?.panCard },
                                { label: 'Passport', path: profile.docs?.passport }
                              ].map((doc, dIdx) => (
                                <div key={dIdx} className={`px-3 py-2 rounded-lg border flex items-center justify-between group/doc ${doc.path ? 'bg-white border-gray-100 hover:border-primary-100' : 'bg-gray-50 border-transparent opacity-50'}`}>
                                   <div className="text-[10px] font-bold text-gray-500 uppercase">{doc.label}</div>
                                   {doc.path && (
                                      <a href={doc.path} target="_blank" rel="noreferrer" className="text-primary-500 hover:text-primary-700">
                                         <ExternalLink size={12} />
                                      </a>
                                   )}
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>
    </Modal>
  )
}

const Customers = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.listCustomers({
        page,
        limit: 10,
        search: search || undefined
      })
      if (data?.success) {
        setCustomers(data.data.customers)
        setTotalPages(data.data.totalPages)
      }
    } catch (error) {
      toast.error('Failed to retrieve traveler registry')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handler = setTimeout(fetchCustomers, 500)
    return () => clearTimeout(handler)
  }, [page, search])

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-bold text-zinc-900">Customer Management</h1>
            <p className="text-gray-500 text-sm">Review platform travelers and manage traveler identity records</p>
         </div>

         <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input
                  type="text"
                  placeholder="Name, email or phone..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
               />
            </div>
         </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
               <tr>
                 <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">Traveler Identity</th>
                 <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest text-center">Agency Profiles</th>
                 <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">Contact Details</th>
                 <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest text-right pr-12">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-6 py-6"><div className="h-10 bg-gray-50 rounded" /></td>
                    </tr>
                  ))
               ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-gray-500 italic">No travelers identified in this registry.</td>
                  </tr>
               ) : (
                 customers.map((customer) => (
                   <tr key={customer._id} className="hover:bg-gray-50/50 transition-colors">
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                              <Users size={18} />
                           </div>
                           <div>
                              <div className="font-bold text-zinc-900 italic leading-none mb-1">{customer.name}</div>
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {customer._id.slice(-6).toUpperCase()}</div>
                           </div>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200">
                           <Building size={10} className="text-gray-400" />
                           <span className="text-xs font-bold text-zinc-900">{customer.agencyProfiles?.length || 0}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                         <div className="space-y-1">
                            <div className="text-xs font-medium text-gray-600 flex items-center gap-1.5"><Mail size={12} className="text-gray-300" /> {customer.email || 'N/A'}</div>
                            <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5"><Phone size={12} className="text-gray-300" /> {customer.phone}</div>
                         </div>
                     </td>
                     <td className="px-6 py-4 text-right pr-6">
                        <button 
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setIsModalOpen(true)
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-gray-100 hover:border-blue-100 shadow-sm active:scale-90"
                          title="View Details"
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

        {/* Pagination Panel */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
             <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Page {page} of {totalPages}</span>
             <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 px-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-30 transition-all font-bold text-[10px] uppercase"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 px-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-30 transition-all font-bold text-[10px] uppercase"
                >
                  <ChevronRight size={16} />
                </button>
             </div>
          </div>
        )}
      </div>

      <CustomerDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        customer={selectedCustomer} 
      />
    </div>
  )
}

export default Customers
