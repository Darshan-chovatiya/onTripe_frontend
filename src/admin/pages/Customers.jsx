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
  ArrowRight
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
        {/* Core Identity Card */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner flex flex-col md:flex-row gap-6 items-center">
            <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 border-4 border-white shadow-md">
                <Users size={32} />
            </div>
            <div className="text-center md:text-left flex-1">
                <h3 className="text-xl font-black text-slate-900 leading-none">{customer.name}</h3>
                <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                   <ShieldCheck size={14} className="text-primary-500" /> Platform Traveler
                </p>
            </div>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Corporate Alias', value: customer.name, icon: Users },
              { label: 'Electronic Mail', value: customer.email, icon: Mail },
              { label: 'Mobile Identity', value: customer.phone || 'Not Provided', icon: Phone },
              { label: 'Platform Since', value: new Date(customer.createdAt).toLocaleDateString(), icon: Calendar },
              { label: 'Account Identity', value: customer._id.slice(-8).toUpperCase(), icon: ShieldCheck },
              { label: 'Verified Status', value: 'Active Access', icon: UserCheck }
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-start gap-3">
                 <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><item.icon size={16} /></div>
                 <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 block">{item.label}</label>
                    <div className="text-xs font-bold text-slate-900">{item.value}</div>
                 </div>
              </div>
            ))}
        </div>

        {/* Action Panel */}
        <div className="p-5 rounded-2xl bg-primary-50/50 border border-primary-100 flex items-center justify-between">
           <div>
              <h4 className="text-[11px] font-black text-primary-900 uppercase tracking-widest">Travel History</h4>
              <p className="text-[10px] text-primary-600 font-bold mt-0.5">Explore this traveler's complete adventure log</p>
           </div>
           <button className="h-9 px-4 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary-600/20 hover:scale-105 transition-all active:scale-95">
              View Bookings <ArrowRight size={14} />
           </button>
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
        setCustomers(data.data.users)
        setTotalPages(data.data.totalPages)
      }
    } catch (error) {
      toast.error('Failed to retrieve customer registry')
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

         <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
               type="text"
               placeholder="Search travelers..."
               className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
            />
         </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
               <tr>
                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Traveler Profile</th>
                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Details</th>
                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Enrolled On</th>
                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-6 py-5"><div className="h-10 bg-slate-100 rounded-xl" /></td>
                    </tr>
                  ))
               ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                       <Users size={48} className="mx-auto text-slate-100 mb-4" />
                       <h3 className="text-sm font-black text-slate-900">No travelers found</h3>
                       <p className="text-xs text-slate-400 mt-1 font-bold">Try broadening your search identity</p>
                    </td>
                  </tr>
               ) : (
                 customers.map((customer) => (
                   <tr key={customer._id} className="hover:bg-slate-50 transition-colors group">
                     <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                              <Users size={18} />
                           </div>
                           <div>
                              <div className="text-sm font-bold text-slate-900 leading-tight">{customer.name}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {customer._id.slice(-6).toUpperCase()}</div>
                           </div>
                        </div>
                     </td>
                     <td className="px-6 py-5">
                         <div className="space-y-1">
                            <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5"><Mail size={12} className="text-slate-300" /> {customer.email}</div>
                            <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5"><Phone size={12} className="text-slate-300" /> {customer.phone || 'N/A'}</div>
                         </div>
                     </td>
                     <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{new Date(customer.createdAt).toLocaleDateString()}</div>
                     </td>
                     <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setIsModalOpen(true)
                          }}
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

        {/* Pagination Panel */}
        {totalPages > 1 && (
          <div className="px-6 py-5 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">P.{page} / {totalPages}</span>
             <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 px-3 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30 transition-all font-black text-[10px] uppercase"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 px-3 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30 transition-all font-black text-[10px] uppercase"
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
