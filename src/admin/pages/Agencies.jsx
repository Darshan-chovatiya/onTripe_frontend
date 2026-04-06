import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  Building2, 
  Search, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Eye, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Plus,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Calendar
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import Modal from '@/shared/components/Modal.jsx'
import CustomDropdown from '@/shared/components/CustomDropdown'

export default function Agencies() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'parent_agent')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debouncing search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 500)
    return () => clearTimeout(handler)
  }, [searchQuery])

  useEffect(() => {
    const r = searchParams.get('role')
    if (r) {
      setRoleFilter(r)
      setPage(1)
    }
  }, [searchParams])
  
  // KYC Modal State
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [isKycModalOpen, setIsKycModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isActionLoading, setIsActionLoading] = useState(false)

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        role: roleFilter || undefined,
        search: debouncedSearch || undefined
      }
      const { data } = await adminApi.listAgents(params)
      if (data?.success) {
        setAgents(data.data.agents)
        setTotalPages(data.data.totalPages)
      }
    } catch (error) {
      toast.error('Failed to fetch agents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [page, roleFilter, debouncedSearch])

  const handleKycActionDirect = async (agentId, action, reason = '') => {
    setIsActionLoading(true)
    try {
      let res
      if (action === 'approve') {
        res = await adminApi.approveKyc(agentId)
      } else {
        res = await adminApi.rejectKyc(agentId, reason)
      }

      if (res.data.success) {
        toast.success(`KYC ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
        fetchAgents()
      }
    } catch (error) {
      toast.error(`Failed to ${action} KYC`)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleKycAction = async (action) => {
    if (!selectedAgent) return
    setIsActionLoading(true)
    try {
      let res
      if (action === 'approve') {
        res = await adminApi.approveKyc(selectedAgent._id)
      } else {
        if (!rejectionReason.trim()) {
          toast.error('Please provide a reason for rejection')
          setIsActionLoading(false)
          return
        }
        res = await adminApi.rejectKyc(selectedAgent._id, rejectionReason)
      }

      if (res.data.success) {
        toast.success(`KYC ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
        setIsKycModalOpen(false)
        fetchAgents()
      }
    } catch (error) {
      toast.error(`Failed to ${action} KYC`)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleToggleAgent = async (id) => {
    try {
      const { data } = await adminApi.toggleAgent(id)
      if (data.success) {
        toast.success(data.message)
        fetchAgents()
      }
    } catch (error) {
      toast.error('Failed to toggle agent status')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      approved: { icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Approved' },
      pending: { icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending' },
      rejected: { icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200', label: 'Rejected' },
    }
    const badge = badges[status] || badges.pending
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border min-w-[100px] ${badge.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.label}
      </span>
    )
  }

  const getRoleLabel = (role) => {
    const roles = {
      parent_agent: 'Parent Agencies',
      child_agent: 'Child Agencies',
      sub_child_agent: 'Sub-Child Agencies'
    }
    return roles[role] || 'Agencies'
  }

  const getFileUrl = (path) => {
    if (!path) return '#'
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'
    const cleanBase = baseUrl.trim().replace(/\/api$/, '')
    return `${cleanBase}/${path.replace(/\\/g, '/')}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight tracking-tight">{getRoleLabel(roleFilter)}</h1>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">Manage, verify, and track your {getRoleLabel(roleFilter).toLowerCase()} and their performance</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5 shadow-sm" />
          <span>Add Agency</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card !p-4 bg-white/80 backdrop-blur-sm border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Search Agencies</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or performance..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field !pl-12 !py-3"
              />
            </div>
          </div>
          <div className="w-full sm:w-64">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Global Filter</label>
            <CustomDropdown
              value="all"
              onChange={() => {}}
              options={[{ value: 'all', label: 'All Status' }]}
              placeholder="All Status"
              className="w-full"
              buttonClassName="!h-[48px] !rounded-lg !border-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Agencies Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center">
          <Loader size="lg" />
          <p className="text-sm text-gray-500 mt-4 font-medium tracking-wide">LOADING AGENCIES...</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No agencies found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filter to find what you're looking for.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ring-1 ring-black/5">
          <div className="overflow-visible">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">Agency Identity</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">Account Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">Compliance (KYC)</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest leading-none pr-10">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {agents.map((agent) => (
                  <tr key={agent._id} className="relative hover:bg-gray-50/80 transition-colors hover:z-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-bold text-gray-900 truncate max-w-[200px]">
                          {agent.name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {agent.email}
                            </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <button 
                            onClick={() => handleToggleAgent(agent._id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 min-w-[100px] border ${
                                agent.isActive 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            }`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${agent.isActive ? 'bg-emerald-600' : 'bg-red-600'}`} />
                            {agent.isActive ? 'Active' : 'Inactive'}
                        </button>
                    </td>
                    <td className="px-6 py-4">
                        <div className="max-w-[130px]">
                            {agent.kyc?.status === 'approved' ? (
                                <div className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 min-w-[100px]">
                                    <CheckCircle className="w-3.5 h-3.5" /> Approved
                                </div>
                            ) : (
                                <button 
                                    onClick={() => {
                                        setSelectedAgent(agent)
                                        setIsKycModalOpen(true)
                                    }}
                                    className="transition-transform active:scale-95"
                                >
                                    {getStatusBadge(agent.kyc?.status)}
                                </button>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => {
                            setSelectedAgent(agent)
                            setIsKycModalOpen(true)
                          }}
                          className="p-2.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all border border-gray-100 hover:border-primary-100 shadow-sm active:scale-90"
                          title="View Intelligence"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAgent(agent)
                            setIsKycModalOpen(true)
                          }}
                          className="p-2.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-gray-100 hover:border-emerald-100 shadow-sm active:scale-90"
                          title="Audit Compliance"
                        >
                          <FileText className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="bg-gray-50/50 border-t border-gray-100 px-6 py-4 flex items-center justify-between">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                    Displaying Page <span className="text-gray-900 mx-1">{page}</span> of <span className="text-gray-900 mx-1">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="btn-secondary !p-2 !rounded-lg disabled:opacity-20"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="btn-secondary !p-2 !rounded-lg disabled:opacity-20"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
          )}
        </div>
      )}

      {/* KYC Review Modal */}
      <Modal 
        isOpen={isKycModalOpen} 
        onClose={() => setIsKycModalOpen(false)}
        title="Agency KYC Review"
        size="lg"
      >
        {selectedAgent && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Entity Nomenclature</label>
                <div className="text-lg font-bold text-gray-900">{selectedAgent.name}</div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Verification Status</label>
                <div className="mt-1">{getStatusBadge(selectedAgent.kyc?.status)}</div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Correspondence Email</label>
                <div className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {selectedAgent.email}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mobile Identification</label>
                <div className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {selectedAgent.phone || 'N/A'}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-tight">
                <FileText className="w-4 h-4 text-primary-600" />
                Uploaded Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Aadhar Front', path: selectedAgent.kyc?.aadharFront },
                  { label: 'Aadhar Back', path: selectedAgent.kyc?.aadharBack },
                  { label: 'PAN Card', path: selectedAgent.kyc?.panCard }
                ].map((doc, idx) => doc.path ? (
                  <div key={idx} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
                    <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center p-2 overflow-hidden">
                       {doc.path.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                         <img src={getFileUrl(doc.path)} alt={doc.label} className="h-full w-full object-cover rounded-lg group-hover:scale-105 transition-transform" />
                       ) : (
                         <div className="flex flex-col items-center gap-2 text-gray-400">
                            <FileText size={32} />
                         </div>
                       )}
                    </div>
                    <div className="bg-white p-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{doc.label}</span>
                      <a 
                        href={getFileUrl(doc.path)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div key={idx} className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-gray-400">
                    <FileText className="w-6 h-6 opacity-20" />
                    <span className="text-[10px] font-bold mt-2 uppercase tracking-widest">{doc.label} Missing</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedAgent.kyc?.status === 'pending' && (
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Compliance Audit Feedback</label>
                  <textarea 
                    className="w-full rounded-lg border border-gray-300 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 bg-white transition-all min-h-[100px] resize-none"
                    placeholder="Provide specific reasons for compliance failure..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleKycAction('approve')}
                    disabled={isActionLoading}
                    className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 flex-1 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {isActionLoading ? <Loader size="sm" color="white" /> : <><ShieldCheck className="w-5 h-5 shadow-sm" /> Approve Credentials</>}
                  </button>
                  <button 
                    onClick={() => handleKycAction('reject')}
                    disabled={isActionLoading}
                    className="btn-secondary !text-red-600 !border-red-200 hover:!bg-red-50 flex-1 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {isActionLoading ? <Loader size="sm" /> : <><ShieldAlert className="w-5 h-5" /> Reject Compliance</>}
                  </button>
                </div>
              </div>
            )}

            {selectedAgent.kyc?.status !== 'pending' && (
               <div className="pt-2 text-center text-sm text-gray-500 italic bg-gray-50 p-4 rounded-xl border border-gray-100">
                  This agency has already been {selectedAgent.kyc?.status}.
                  {selectedAgent.kyc?.rejectionReason && (
                    <div className="mt-2 text-red-600 font-bold not-italic">
                      Reason: {selectedAgent.kyc.rejectionReason}
                    </div>
                  )}
               </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
