import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  Building2, 
  Users, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Phone, 
  Mail, 
  ArrowRight,
  UserCheck,
  LayoutGrid,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import Modal from '@/shared/components/Modal.jsx'
import CustomDropdown from '@/shared/components/CustomDropdown.jsx'

// Internal component for Sub-Child Agency Listing inside nested Modal
const SubChildAgenciesModal = ({ isOpen, onClose, parentAgency, onToggleStatus, getStatusBadge }) => {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const fetchSubChildren = async () => {
    if (!parentAgency) return
    setLoading(true)
    try {
      const params = {
        page,
        limit: 5,
        role: 'sub_child_agent',
        parentRef: parentAgency._id,
        isActive: status === 'all' ? undefined : (status === 'active' ? 'true' : 'false'),
        search: search || undefined
      }
      const { data } = await adminApi.listAgents(params)
      if (data?.success) {
        setAgents(data.data.agents)
        setTotalPages(data.data.totalPages)
      }
    } catch (error) {
      toast.error('Failed to fetch sub-child agencies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) fetchSubChildren()
  }, [isOpen, parentAgency, page, status, search])

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Sub-Agency Network: ${parentAgency?.name}`} 
      size="lg"
    >
      <div className="space-y-4">
        {/* Simplified Header with Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
           <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 leading-none">Search Agency</label>
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Name, email or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 transition-all"
                />
              </div>
           </div>
           <div className="w-full sm:w-36">
              <label className="block text-[10px] font-base text-slate-400 uppercase tracking-widest mb-1.5 ml-1 leading-none">Filter</label>
              <CustomDropdown
                value={status}
                onChange={setStatus}
                options={statusOptions}
                placeholder="Filter"
                buttonClassName="!h-[38px] !rounded-lg !bg-white !border-slate-200 !text-xs !font-medium"
              />
           </div>
        </div>

        {/* Modal Content */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
           <div className="overflow-x-auto min-h-[300px]">
             {loading ? (
               <div className="flex flex-col items-center justify-center p-20">
                 <Loader size="md" />
                 <p className="text-[10px] font-bold text-slate-400 mt-4 tracking-widest uppercase italic font-black">Syncing Hierarchy...</p>
               </div>
             ) : agents.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-20 text-center">
                 <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200 border border-slate-100 mb-3"><Users size={24} /></div>
                 <h4 className="text-sm font-bold text-slate-900 leading-none">No Sub-Child Agents Found</h4>
                 <p className="text-xs text-slate-400 mt-1 font-medium">This agency has no registered sub-child nodes currently.</p>
               </div>
             ) : (
               <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">Sub-Child Agency</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">Contact Hub</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">KYC Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">Joined On</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest text-right pr-6">Account Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {agents.map((agent) => (
                      <tr key={agent._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-3.5">
                           <div className="text-xs font-bold text-slate-900 truncate max-w-[140px] leading-tight">{agent.name}</div>
                           <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">ID: {agent._id.slice(-6).toUpperCase()}</div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="text-[10px] font-bold text-slate-600 flex flex-col gap-0.5">
                                <div className="flex items-center gap-1"><Mail size={10} className="text-slate-300" /> {agent.email}</div>
                                <div className="flex items-center gap-1"><Phone size={10} className="text-slate-300" /> {agent.phone || 'N/A'}</div>
                            </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                            {getStatusBadge(agent.kyc?.status)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{new Date(agent.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                          <button 
                            onClick={async () => {
                               await onToggleStatus(agent._id)
                               fetchSubChildren()
                            }}
                            className={`inline-flex items-center justify-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 min-w-[75px] shadow-sm ${
                                agent.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                            }`}
                          >
                             <div className={`w-1 h-1 rounded-full ${agent.isActive ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'}`} />
                             {agent.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             )}
           </div>
        </div>
        {/* Modal Footer / Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">P.{page} / {totalPages}</div>
            <div className="flex gap-1.5">
               <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"><ChevronLeft size={14}/></button>
               <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"><ChevronRight size={14}/></button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

// Internal component for Agency Customer Listing
const AgencyCustomersModal = ({ isOpen, onClose, agency }) => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchCustomers = async () => {
    if (!agency) return
    setLoading(true)
    try {
      const { data } = await adminApi.getAgencyCustomers(agency._id)
      if (data?.success) {
        setCustomers(data.data.customers)
      }
    } catch (error) {
      toast.error('Failed to resolve traveler network')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) fetchCustomers()
  }, [isOpen, agency])

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Customers: ${agency?.name}`} 
      size="lg"
    >
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
           <div className="overflow-x-auto min-h-[400px]">
             {loading ? (
               <div className="flex flex-col items-center justify-center p-20">
                 <Loader size="md" />
                 <p className="text-[10px] font-bold text-slate-400 mt-4 tracking-widest uppercase italic font-black">Loading Customer List...</p>
               </div>
             ) : customers.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-20 text-center">
                 <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200 border border-slate-100 mb-3"><Users size={24} /></div>
                 <h4 className="text-sm font-bold text-slate-900 leading-none">No Customers Found</h4>
                 <p className="text-xs text-slate-400 mt-1 font-medium italic">No customers are currently linked to this agency.</p>
               </div>
             ) : (
               <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">Customer Name</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">Contact Details</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">Managed By</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest text-right pr-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((customer) => (
                      <tr key={customer._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors"><Users size={14} /></div>
                              <div className="text-sm font-bold text-slate-900 truncate max-w-[160px]">{customer.name}</div>
                           </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-[10px] font-bold text-slate-600 flex flex-col gap-0.5">
                                <div className="flex items-center gap-1"><Mail size={10} className="text-slate-300" /> {customer.email}</div>
                                <div className="flex items-center gap-1"><Phone size={10} className="text-slate-300" /> {customer.phone || 'N/A'}</div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                               <div className="text-[10px] font-black text-slate-900 leading-none uppercase">{customer.parentRef?.name}</div>
                               <div className="text-[9px] font-bold text-primary-500 uppercase tracking-tighter mt-1 italic opacity-60">
                                  {customer.parentRef?.role === 'child_agent' ? 'Managed Direct' : 'Handled by Sub-Agent'}
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${customer.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                              <div className={`h-1 w-1 rounded-full ${customer.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                              {customer.isActive ? 'Active' : 'Inactive'}
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             )}
           </div>
        </div>
      </div>
    </Modal>
  )
}

const AgencyNetwork = () => {
  const { parentId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [parentAgency, setParentAgency] = useState(null)
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [activeChild, setActiveChild] = useState(null)
  const [isSubModalOpen, setIsSubModalOpen] = useState(false)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [selectedChildForCustomers, setSelectedChildForCustomers] = useState(null)
  
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchParentAndChildren = async () => {
    setLoading(true)
    try {
      // 1. Fetch Parent Details via dedicated identity resolver
      const parentRes = await adminApi.getAgent(parentId)
      if (parentRes.data?.success) {
        setParentAgency(parentRes.data.data.agent)
      }

      // 2. Fetch Children
      const params = {
        role: 'child_agent',
        parentRef: parentId,
        page,
        limit: 10,
        isActive: status === 'all' ? undefined : (status === 'active' ? 'true' : 'false'),
        search: search || undefined
      }
      const { data } = await adminApi.listAgents(params)
      if (data?.success) {
        setChildren(data.data.agents)
        setTotalPages(data.data.totalPages)
      }
    } catch (error) {
      toast.error('Network synchronization failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParentAndChildren()
  }, [parentId, page, status, search])

  const handleToggleStatus = async (agentId) => {
    try {
       const { data } = await adminApi.toggleAgent(agentId)
       if (data.success) {
          toast.success(data.message)
          fetchParentAndChildren()
       }
    } catch (err) {
       toast.error('Identity update failed')
    }
  }

  const getStatusBadge = (status) => {
    const configs = {
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
      approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' }
    }
    const config = configs[status] || configs.pending
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${config.bg} ${config.text} border ${config.border} shadow-sm`}>
        {status}
      </div>
    )
  }

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]

  if (loading && !parentAgency) return (
    <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center space-y-4">
       <Loader size="lg" />
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Initializing Network Matrix...</p>
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
         <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-2">
               <Link to="/admin/agencies" className="hover:text-blue-600 transition-colors">Agencies</Link>
               <ChevronRight size={12} />
               <span className="text-zinc-900">Network Explorer</span>
            </div>
            <div className="flex items-center gap-3">
               <h1 className="text-2xl font-bold text-zinc-900">{parentAgency?.name}</h1>
               <div className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-100 italic">
                  {parentAgency?.agentCode}
               </div>
            </div>
            <p className="text-gray-500 text-sm mt-1">Audit distribution hierarchy and performance metrics for this hub</p>
         </div>

         <div className="flex items-center gap-3">
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-center shadow-sm">
               <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Direct Nodes</div>
               <div className="text-xl font-bold text-zinc-900">{parentAgency?.childCount || 0}</div>
            </div>
            <button 
               onClick={() => navigate(-1)}
               className="flex items-center gap-2 border border-gray-200 text-zinc-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
            >
               <ChevronLeft size={16} /> Back
            </button>
         </div>
      </div>

      {/* Main Network Table - Replacing Side Panel UI with Grid-Table */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/20 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
           <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-600/20"><LayoutGrid size={18} /></div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest italic">Child Agency Hierarchy</h3>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="relative group">
                 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary-500" />
                 <input 
                   type="text" 
                   placeholder="Identity sync..."
                   className="h-10 w-64 bg-white border border-slate-200 rounded-xl px-10 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 transition-all"
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                 />
              </div>
              <CustomDropdown 
                value={status}
                onChange={setStatus}
                options={statusOptions}
                buttonClassName="!p-2"
              />
           </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
           <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                 <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">Child Agency</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">Contact Hub</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">KYC Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest text-center">Sub-Hierarchy</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest text-center">Traveler Matrix</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest">Joined On</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-900 uppercase tracking-widest text-right pr-10">Account Status</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {loading ? (
                    Array(5).fill(0).map((_, i) => (
                       <tr key={i} className="animate-pulse">
                          <td colSpan={7} className="px-6 py-4"><div className="h-10 bg-slate-50 rounded-xl" /></td>
                       </tr>
                    ))
                 ) : children.length === 0 ? (
                    <tr>
                       <td colSpan={7} className="py-20 text-center">
                          <Users size={40} className="mx-auto text-slate-200 mb-3" />
                          <h4 className="text-sm font-black text-slate-900 uppercase">Hierarchy Empty</h4>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">No matching child nodes identified</p>
                       </td>
                    </tr>
                 ) : (
                   children.map((child) => (
                     <tr key={child._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm group-hover:scale-105 transition-transform"><Building2 size={16} /></div>
                              <div>
                                 <div className="text-[13px] font-black text-slate-900 leading-none mb-1.5">{child.name}</div>
                                 <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight italic">ID: {child._id.slice(-6).toUpperCase()}</div>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-[10px] font-bold text-slate-600 flex flex-col gap-1">
                                <div className="flex items-center gap-1.5"><Mail size={12} className="text-slate-300" /> {child.email}</div>
                                <div className="flex items-center gap-1.5"><Phone size={12} className="text-slate-300" /> {child.phone || 'N/A'}</div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(child.kyc?.status)}
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex justify-center">
                               <button 
                                 onClick={() => {
                                    setActiveChild(child)
                                    setIsSubModalOpen(true)
                                 }}
                                 className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2.5 transition-all hover:bg-primary-50 hover:border-primary-100 hover:shadow-sm"
                               >
                                  <Users size={14} className="text-slate-400" />
                                  <span className="text-[11px] font-black text-slate-900">{child.childCount || 0}</span>
                                  <ArrowRight size={12} className="text-primary-500 opacity-0 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                               </button>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex justify-center">
                               <button 
                                 onClick={() => {
                                    setSelectedChildForCustomers(child)
                                    setIsCustomerModalOpen(true)
                                 }}
                                 className="h-9 px-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center gap-2 transition-all hover:bg-emerald-600 hover:text-white hover:border-emerald-600 shadow-sm shadow-emerald-500/10 active:scale-95"
                               >
                                  <Users size={14} />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Audit</span>
                               </button>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                            {new Date(child.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right pr-10">
                           <button 
                             onClick={() => handleToggleStatus(child._id)}
                             className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm transition-all active:scale-90 min-w-[85px] ${
                                 child.isActive 
                                 ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                                 : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'
                             }`}
                           >
                              <div className={`h-1.5 w-1.5 rounded-full ${child.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                              {child.isActive ? 'Active' : 'Inactive'}
                           </button>
                        </td>
                     </tr>
                   ))
                 )}
              </tbody>
           </table>
        </div>

        {totalPages > 1 && (
          <div className="px-8 py-5 border-t border-slate-50 flex items-center justify-between bg-slate-50/10">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Matrix P.{page} of {totalPages}</span>
             <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 px-3 rounded-lg border border-slate-200 text-slate-500 font-black text-[10px] uppercase hover:bg-white disabled:opacity-30 transition-all"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8 px-3 rounded-lg border border-slate-200 text-slate-500 font-black text-[10px] uppercase hover:bg-white disabled:opacity-30 transition-all"><ChevronRight size={16} /></button>
             </div>
          </div>
        )}
      </div>

      {/* Re-implementing the Modal approach for sub-children as requested */}
      <SubChildAgenciesModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        parentAgency={activeChild}
        onToggleStatus={handleToggleStatus}
        getStatusBadge={getStatusBadge}
      />

      <AgencyCustomersModal 
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        agency={selectedChildForCustomers}
      />
    </div>
  )
}

export default AgencyNetwork
