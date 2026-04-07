import { useEffect, useState } from 'react'
import { 
  Building2, 
  Search, 
  Eye, 
  Mail, 
  Phone, 
  Users,
  Building,
  ArrowRight,
  UserRound
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import CustomDropdown from '@/shared/components/CustomDropdown.jsx'
import Modal from '@/shared/components/Modal.jsx'

export default function ChildAgencies() {
  const { toast } = useToast()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modal States
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isSubChildModalOpen, setIsSubChildModalOpen] = useState(false)
  const [subChildren, setSubChildren] = useState([])
  const [loadingSubChildren, setLoadingSubChildren] = useState(false)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [agencyCustomers, setAgencyCustomers] = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  // Debouncing search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 500)
    return () => clearTimeout(handler)
  }, [searchQuery])

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        role: 'child_agent',
        isActive: statusFilter === 'all' ? undefined : (statusFilter === 'active' ? 'true' : 'false'),
        search: debouncedSearch || undefined
      }
      const { data } = await adminApi.listAgents(params)
      if (data?.success) {
        setAgents(data.data.agents)
        setTotalPages(data.data.totalPages)
      }
    } catch (error) {
      toast.error('Failed to fetch child agencies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [page, debouncedSearch, statusFilter])

  const handleToggleStatus = async (agentId) => {
    try {
      const { data } = await adminApi.toggleAgent(agentId)
      if (data.success) {
        toast.success(data.message)
        fetchAgents()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed')
    }
  }

  const handleFetchSubChildren = async (parentId) => {
    setLoadingSubChildren(true)
    setIsSubChildModalOpen(true)
    try {
      // Fetch sub-child agents for this parent
      const { data } = await adminApi.listAgents({ parentRef: parentId, role: 'sub_child_agent' })
      if (data?.success) {
        setSubChildren(data.data.agents)
      }
    } catch (error) {
      toast.error('Failed to resolve sub-hierarchy')
    } finally {
      setLoadingSubChildren(false)
    }
  }

  const handleFetchCustomers = async (parentId) => {
    setLoadingCustomers(true)
    setIsCustomerModalOpen(true)
    try {
      const { data } = await adminApi.getAgencyCustomers(parentId)
      if (data?.success) {
        setAgencyCustomers(data.data.customers)
      }
    } catch (error) {
      toast.error('Failed to retrieve associated traveler profiles')
    } finally {
      setLoadingCustomers(false)
    }
  }

  const AgentDetailModal = () => (
    <Modal
      isOpen={isDetailModalOpen}
      onClose={() => setIsDetailModalOpen(false)}
      title="Agency Identity Detail"
      size="lg"
    >
      {selectedAgent && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
             <div className="h-16 w-16 bg-white rounded-2xl border border-gray-200 flex items-center justify-center shadow-sm">
                <Building2 size={32} className="text-primary-500" />
             </div>
             <div>
                <h3 className="text-xl font-black text-zinc-900 leading-tight">{selectedAgent.name}</h3>
                <div className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-1">Agent Code: {selectedAgent.agentCode || 'N/A'}</div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-4 rounded-xl border border-gray-100 bg-white space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</div>
                <div className="text-sm font-bold text-zinc-900">{selectedAgent.email}</div>
             </div>
             <div className="p-4 rounded-xl border border-gray-100 bg-white space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Number</div>
                <div className="text-sm font-bold text-zinc-900">{selectedAgent.phone || 'N/A'}</div>
             </div>
             <div className="p-4 rounded-xl border border-gray-100 bg-white space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Created</div>
                <div className="text-sm font-bold text-zinc-900">{new Date(selectedAgent.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
             </div>
             <div className="p-4 rounded-xl border border-gray-100 bg-white space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Parent Entity</div>
                <div className="text-sm font-bold text-zinc-900">{selectedAgent.parentName || 'Direct Platform Agent'}</div>
             </div>
          </div>

          {selectedAgent.kyc && (
            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30">
               <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Internal Notes / KYC Status</h4>
               <p className="text-xs text-amber-800 font-medium italic opacity-80">This node is currently under {selectedAgent.kyc.status} status within the distribution network.</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  )

  const SubChildModal = () => (
    <Modal
      isOpen={isSubChildModalOpen}
      onClose={() => setIsSubChildModalOpen(false)}
      title="Sub-Child Agencies"
      size="xl"
    >
      <div className="space-y-4">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Hierarchy Layer: Sub-Distributors</p>
        
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
           {loadingSubChildren ? (
              <div className="p-12 flex flex-col items-center justify-center">
                 <Loader size="md" />
                 <p className="text-[10px] font-bold text-gray-400 mt-4 tracking-widest uppercase">Fetching Network Nodes...</p>
              </div>
           ) : subChildren.length === 0 ? (
              <div className="p-12 text-center">
                 <p className="text-sm text-gray-400 font-medium italic">No sub-child agencies identified for this parent node.</p>
              </div>
           ) : (
              <table className="w-full text-left">
                 <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                       <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identity</th>
                       <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Details</th>
                       <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {subChildren.map(sub => (
                      <tr key={sub._id} className="hover:bg-gray-50/50 transition-colors">
                         <td className="px-6 py-4">
                            <div className="text-sm font-bold text-zinc-900">{sub.name}</div>
                            <div className="text-[9px] font-black text-primary-600 uppercase tracking-widest">{sub.agentCode}</div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="text-xs text-gray-500 font-medium">{sub.email}</div>
                         </td>
                         <td className="px-6 py-4 text-right">
                             <span className={`inline-block w-2 h-2 rounded-full mr-2 ${sub.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{sub.isActive ? 'Active' : 'Inactive'}</span>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           )}
        </div>
      </div>
    </Modal>
  )

  const CustomerModal = () => (
    <Modal
      isOpen={isCustomerModalOpen}
      onClose={() => setIsCustomerModalOpen(false)}
      title="Registered Traveler Matrix"
      size="xl"
    >
      <div className="space-y-4">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-none">Entity: Managed Travelers & Hierarchy Clients</p>
        
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm min-h-[300px]">
           {loadingCustomers ? (
              <div className="p-12 flex flex-col items-center justify-center">
                 <Loader size="md" />
                 <p className="text-[10px] font-bold text-gray-400 mt-4 tracking-widest uppercase">Querying Traveler Cluster...</p>
              </div>
           ) : agencyCustomers.length === 0 ? (
              <div className="p-12 text-center">
                 <p className="text-sm text-gray-400 font-medium italic">No travelers are currently mapped to this distribution node.</p>
              </div>
           ) : (
              <table className="w-full text-left">
                 <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                       <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Traveler</th>
                       <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Agent Role</th>
                       <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Managed By</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {agencyCustomers.map((ac, idx) => (
                      <tr key={ac._id || idx} className="hover:bg-gray-50/50 transition-colors">
                         <td className="px-6 py-4">
                            <div className="text-sm font-bold text-zinc-900">{ac.customer?.name}</div>
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{ac.customer?.email || 'OFFLINE REGISTRY'}</div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-fit uppercase tracking-tighter">
                               {ac.customer?.role || 'REGULAR'}
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="text-xs text-gray-600 font-bold">{ac.managedBy?.name}</div>
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{ac.managedBy?.role}</div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           )}
        </div>
      </div>
    </Modal>
  )

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Child Agencies</h1>
          <p className="text-gray-500 text-sm">Manage and monitor secondary distribution nodes and sub-agencies</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search agencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden lg:block">Status:</div>
          <CustomDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
            className="w-full lg:w-44"
            buttonClassName="!py-2.5"
          />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-32">
              <Loader size="lg" />
              <p className="text-[10px] font-bold text-gray-400 mt-4 tracking-widest uppercase italic font-black">Syncing Data...</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-32 text-center">
              <h4 className="text-sm font-bold text-zinc-900 leading-none">No agencies found</h4>
              <p className="text-xs text-gray-500 mt-1 font-medium italic">Adjust your search or filters to see more results.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Child Agency</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Contact Info</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Parent Agency</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-900 uppercase tracking-widest text-center">Hierarchy</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-900 uppercase tracking-widest text-center">Customers</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-900 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-900 uppercase tracking-widest text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agents.map((agent) => (
                  <tr key={agent._id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-zinc-900 leading-tight truncate max-w-[150px]">{agent.name}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">ID: {agent._id.slice(-6).toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-[11px] font-bold text-gray-600 flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5"><Mail size={12} className="text-gray-300" /> {agent.email}</div>
                        <div className="flex items-center gap-2 text-primary-500 font-bold uppercase tracking-tighter">
                           <Phone size={10} /> {agent.phone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                        {agent.parentName ? (
                            <div className="flex flex-col gap-0.5">
                                <div className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                                    <Building size={12} className="text-gray-300" />
                                    {agent.parentName}
                                </div>
                                <div className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">
                                    Code: {agent.parentCode || 'N/A'}
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-300 text-[10px] font-bold uppercase tracking-widest border border-dashed border-gray-200 px-2 py-1 rounded w-fit">Direct Node</div>
                        )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-center">
                        <button 
                          onClick={() => handleFetchSubChildren(agent._id)}
                          className="inline-flex items-center justify-center p-2 rounded-lg bg-gray-50 border border-gray-200 gap-2 min-w-[45px] hover:bg-primary-50 hover:border-primary-200 group-hover:shadow-sm transition-all shadow-sm"
                        >
                             <Users size={12} className="text-gray-400 group-hover:text-primary-600" />
                             <span className="text-xs font-black text-zinc-900">{agent.childCount || 0}</span>
                        </button>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-center">
                        <button 
                          onClick={() => handleFetchCustomers(agent._id)}
                          className="inline-flex items-center justify-center p-2 rounded-lg bg-gray-50 border border-gray-200 gap-2 min-w-[45px] hover:bg-emerald-50 hover:border-emerald-200 group-hover:shadow-sm transition-all shadow-sm"
                        >
                             <UserRound size={12} className="text-gray-400 group-hover:text-emerald-600" />
                             <span className="text-xs font-black text-zinc-900">{agent.customerCount || 0}</span>
                        </button>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-center">
                         <button 
                           onClick={() => handleToggleStatus(agent._id)}
                           className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all active:scale-95 shadow-sm min-w-[85px] ${
                             agent.isActive 
                             ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50' 
                             : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100/50'
                           }`}
                         >
                           <div className={`w-1 h-1 rounded-full ${agent.isActive ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'}`} />
                           {agent.isActive ? 'Active' : 'Inactive'}
                         </button>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right pr-6">
                         <button 
                           onClick={() => {
                             setSelectedAgent(agent)
                             setIsDetailModalOpen(true)
                           }}
                           className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-gray-100 hover:border-blue-100 shadow-sm active:scale-90"
                           title="View Full Profile"
                         >
                           <Eye size={16} />
                         </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Improved Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 disabled:opacity-30 transition-all font-bold"
              >
                Prev
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 disabled:opacity-30 transition-all font-bold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pop-up Modals */}
      <AgentDetailModal />
      <SubChildModal />
      <CustomerModal />
    </div>
  )
}
