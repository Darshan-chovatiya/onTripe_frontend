import { useEffect, useState } from 'react'
import { 
  Building2, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MoreVertical, 
  Eye, 
  UserCheck, 
  UserMinus,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import Modal from '@/shared/components/Modal.jsx'

export default function Agencies() {
  const { toast } = useToast()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('parent_agent')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
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
        // search: search || undefined // Backend doesn't support search yet but filter role does
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
  }, [page, roleFilter])

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
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"><CheckCircle2 size={12} /> Approved</span>
      case 'rejected':
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"><XCircle size={12} /> Rejected</span>
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800"><Clock size={12} /> Pending</span>
    }
  }

  const getRoleBadge = (role) => {
    const roles = {
      parent_agent: 'Parent Agency',
      child_agent: 'Child Agency',
      sub_child_agent: 'Sub-Child Agency'
    }
    return <span className="text-sm font-medium text-gray-700">{roles[role] || role}</span>
  }

  const getFileUrl = (path) => {
    if (!path) return '#'
    // Backend serves static files, baseURL is http://localhost:5001/api
    // Static files are likely at http://localhost:5001/
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'
    return `${baseUrl}/${path.replace(/\\/g, '/')}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agency Directory</h1>
          <p className="text-sm text-gray-500">Manage all registered travel agencies and their verification status.</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All Roles</option>
            <option value="parent_agent">Parent Agency</option>
            <option value="child_agent">Child Agency</option>
            <option value="sub_child_agent">Sub-Child Agency</option>
          </select>
        </div>
      </div>

      {/* Agents Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-700">
              <tr>
                <th className="px-6 py-4">Agency Details</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">KYC Status</th>
                <th className="px-6 py-4">Account</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Loader size="md" />
                  </td>
                </tr>
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    No agencies found.
                  </td>
                </tr>
              ) : agents.map((agent) => (
                <tr key={agent._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{agent.name}</div>
                        <div className="text-xs">{agent.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getRoleBadge(agent.role)}</td>
                  <td className="px-6 py-4">{getStatusBadge(agent.kyc?.status)}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleToggleAgent(agent._id)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                        agent.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800 hover:bg-green-200 hover:text-green-900'
                      }`}
                    >
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        setSelectedAgent(agent)
                        setIsKycModalOpen(true)
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-primary-600 transition-all"
                    >
                      <Eye size={16} /> Review KYC
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
            <p className="text-sm text-gray-700">
              Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 focus:outline-none disabled:opacity-50"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 focus:outline-none disabled:opacity-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* KYC Review Modal */}
      <Modal 
        isOpen={isKycModalOpen} 
        onClose={() => setIsKycModalOpen(false)}
        title="Agency KYC Review"
        size="lg"
      >
        {selectedAgent && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Agency Name</label>
                <div className="text-lg font-bold text-gray-900">{selectedAgent.name}</div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Current Status</label>
                <div className="mt-1">{getStatusBadge(selectedAgent.kyc?.status)}</div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Email Address</label>
                <div className="text-sm text-gray-700">{selectedAgent.email}</div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500">Phone Number</label>
                <div className="text-sm text-gray-700">{selectedAgent.phone || 'N/A'}</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-bold text-gray-900">
                <FileText size={18} className="text-primary-600" /> Uploaded Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Aadhar Front', path: selectedAgent.kyc?.aadharFront },
                  { label: 'Aadhar Back', path: selectedAgent.kyc?.aadharBack },
                  { label: 'PAN Card', path: selectedAgent.kyc?.panCard }
                ].map((doc, idx) => doc.path ? (
                  <div key={idx} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-primary-300 hover:shadow-md">
                    <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center p-2">
                       {/* If it's an image, show preview, otherwise show icon */}
                       {doc.path.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                         <img src={getFileUrl(doc.path)} alt={doc.label} className="h-full w-full object-contain rounded" />
                       ) : (
                         <div className="flex flex-col items-center gap-2 text-gray-400">
                            <FileText size={40} />
                            <span className="text-xs font-medium">DOCUMENT</span>
                         </div>
                       )}
                    </div>
                    <div className="bg-white p-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700">{doc.label}</span>
                      <a 
                        href={getFileUrl(doc.path)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div key={idx} className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-gray-400">
                    <FileText size={24} />
                    <span className="text-xs mt-2">{doc.label} Missing</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedAgent.kyc?.status === 'pending' && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Rejection Reason (only required if rejecting)</label>
                  <textarea 
                    className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="Provide clear reasons why the documents were rejected..."
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleKycAction('approve')}
                    disabled={isActionLoading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-bold text-white shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all disabled:opacity-50"
                  >
                    {isActionLoading ? <Loader size="sm" color="white" /> : <><UserCheck size={20} /> Approve Agency</>}
                  </button>
                  <button 
                    onClick={() => handleKycAction('reject')}
                    disabled={isActionLoading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 font-bold text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                  >
                    {isActionLoading ? <Loader size="sm" /> : <><UserMinus size={20} /> Reject KYC</>}
                  </button>
                </div>
              </div>
            )}

            {selectedAgent.kyc?.status !== 'pending' && (
               <div className="pt-2 text-center text-sm text-gray-500 italic">
                  This agency has already been {selectedAgent.kyc?.status}.
                  {selectedAgent.kyc?.rejectionReason && (
                    <div className="mt-2 text-red-600 font-medium bg-red-50 p-2 rounded-lg not-italic">
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
