import { useEffect, useLayoutEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Building2, 
  Download,
  Search, 
  Eye, 
  Mail, 
  Phone, 
  Users,
  Building,
  ArrowRight,
  UserRound,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  Layers,
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import CustomDropdown from '@/shared/components/CustomDropdown.jsx'
import Modal from '@/shared/components/Modal.jsx'
import Pagination from '@/admin/components/Pagination.jsx'
import { exportToExcel } from '@/admin/utils/exportExcel.js'

export default function ChildAgencies({ agentRole = 'child_agent', pageTitle = 'Child Agencies' }) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialParentRef = searchParams.get('parentRef')
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [kycFilter, setKycFilter] = useState('all')
  const [parentFilter, setParentFilter] = useState(initialParentRef || 'all')
  const [parentOptions, setParentOptions] = useState([{ value: 'all', label: 'All parents' }])
  const [togglingId, setTogglingId] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)

  // Modal States
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Same component type is reused when switching Child ↔ Sub-child (only props change), so
  // useState(...) does not re-run. useLayoutEffect runs before fetch effects so we do not query
  // with a sub-child parent id while viewing child agencies (or vice versa).
  useLayoutEffect(() => {
    const parentRefFromUrl = searchParams.get('parentRef')
    setParentFilter(parentRefFromUrl || 'all')
  }, [agentRole, searchParams])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, kycFilter, parentFilter, agentRole])

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        role: agentRole,
        isActive: statusFilter === 'all' ? undefined : (statusFilter === 'active' ? 'true' : 'false'),
        search: debouncedSearch || undefined,
        kycStatus: kycFilter === 'all' ? undefined : kycFilter,
        parentRef: parentFilter === 'all' ? undefined : parentFilter,
      }
      const { data } = await adminApi.listAgents(params)
      if (data?.success) {
        setAgents(data.data.agents)
        setTotalPages(data.data.totalPages)
        setTotal(data.data.totalCount ?? 0)
      }
    } catch (error) {
      toast.error(`Failed to fetch ${agentRole === 'sub_child_agent' ? 'sub-child' : 'child'} agencies`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [page, debouncedSearch, statusFilter, kycFilter, parentFilter, agentRole])

  useEffect(() => {
    const loadParents = async () => {
      try {
        const roleForParents = agentRole === 'sub_child_agent' ? 'child_agent' : 'parent_agent'
        const { data } = await adminApi.listAgents({ role: roleForParents, limit: 200 })
        if (data?.success) {
          const opts = [
            { value: 'all', label: agentRole === 'sub_child_agent' ? 'All child agencies' : 'All parents' },
            ...data.data.agents.map((a) => ({ value: a._id, label: a.name })),
          ]
          setParentOptions(opts)
        }
      } catch {
        setParentOptions([{ value: 'all', label: agentRole === 'sub_child_agent' ? 'All child agencies' : 'All parents' }])
      }
    }
    loadParents()
  }, [agentRole])

  const handleToggleStatus = async (agentId) => {
    if (togglingId) return
    setTogglingId(agentId)
    try {
      const { data } = await adminApi.toggleAgent(agentId)
      if (data.success) {
        toast.success(data.message)
        fetchAgents()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed')
    } finally {
      setTogglingId(null)
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
      <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border min-w-[90px] shadow-sm ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    )
  }

  const customersPathForAgent = (id) =>
    agentRole === 'sub_child_agent'
      ? `/admin/sub-child-agencies/${id}/customers`
      : `/admin/child-agencies/${id}/customers`

  const AgentDetailModal = () => (
    <Modal
      isOpen={isDetailModalOpen}
      onClose={() => setIsDetailModalOpen(false)}
      title="Agency overview"
      size="lg"
    >
      {selectedAgent && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{selectedAgent.name}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {agentRole === 'sub_child_agent' ? 'Sub-child agency details' : 'Child agency details'}
            </p>
          </div>

          <div
            className={`grid gap-3 ${agentRole === 'sub_child_agent' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}
          >
            {agentRole !== 'sub_child_agent' ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-center">
                <div className="text-xs font-medium text-gray-500">Sub-child</div>
                <p className="mt-1 text-xl font-semibold text-gray-900">{selectedAgent.childCount ?? 0}</p>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setIsDetailModalOpen(false)
                navigate(
                  agentRole === 'sub_child_agent'
                    ? `/admin/sub-child-agencies/${selectedAgent._id}/whitelabels`
                    : `/admin/child-agencies/${selectedAgent._id}/whitelabels`
                )
              }}
              className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-center transition-colors hover:border-primary-200 hover:bg-primary-50/60"
              title="View all whitelabel packages for this agent"
            >
              <div className="text-xs font-medium text-gray-500">Whitelabels</div>
              <p className="mt-1 text-xl font-semibold text-gray-900">{selectedAgent.whitelabelCount ?? 0}</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsDetailModalOpen(false)
                navigate(customersPathForAgent(selectedAgent._id))
              }}
              className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-center transition-colors hover:border-primary-200 hover:bg-primary-50/60"
              title="View customers for this agency and its network"
            >
              <div className="text-xs font-medium text-gray-500">Customers</div>
              <p className="mt-1 text-xl font-semibold text-gray-900">{selectedAgent.customerCount ?? 0}</p>
            </button>
          </div>

          <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-gray-500">Agent code</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{selectedAgent.agentCode || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">KYC status</p>
              <div className="mt-1">{getStatusBadge(selectedAgent.kyc?.status)}</div>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-gray-500">Email</p>
              <p className="mt-1 break-all text-sm text-gray-900">{selectedAgent.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Phone</p>
              <p className="mt-1 text-sm text-gray-900">{selectedAgent.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">
                {agentRole === 'sub_child_agent' ? 'Child agencies' : 'Parent agencies'}
              </p>
              {(() => {
                const parents = Array.isArray(selectedAgent.allParents) && selectedAgent.allParents.length > 0
                  ? selectedAgent.allParents
                  : selectedAgent.parentName
                    ? [{ name: selectedAgent.parentName, agentCode: selectedAgent.parentCode, email: selectedAgent.parentEmail }]
                    : []
                if (parents.length === 0) {
                  return <p className="mt-1 text-sm text-gray-400">{agentRole === 'sub_child_agent' ? 'Direct child agency link unavailable' : 'Direct node'}</p>
                }
                return (
                  <div className="mt-1 space-y-1">
                    {parents.map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{p.name}</span>
                        {p.agentCode && <span className="rounded bg-primary-50 px-1.5 py-0.5 font-mono text-[10px] text-primary-700">{p.agentCode}</span>}
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const { data } = await adminApi.listAgents({
        role: agentRole, limit: 10000, page: 1,
        isActive: statusFilter === 'all' ? undefined : (statusFilter === 'active' ? 'true' : 'false'),
        search: debouncedSearch || undefined,
        kycStatus: kycFilter === 'all' ? undefined : kycFilter,
        parentRef: parentFilter === 'all' ? undefined : parentFilter,
      })
      const isSubChild = agentRole === 'sub_child_agent'
      await exportToExcel(
        (data?.data?.agents ?? []).map((a) => {
          const parents = Array.isArray(a.allParents) && a.allParents.length > 0
            ? a.allParents
            : a.parentName ? [{ name: a.parentName, agentCode: a.parentCode, email: a.parentEmail }] : []

          const parentCols = {}
          parents.forEach((p, i) => {
            const label = isSubChild ? `Child Agency ${i + 1}` : `Parent Agency ${i + 1}`
            parentCols[label] = p.name || ''
            parentCols[`${label} Code`] = p.agentCode || ''
            parentCols[`${label} Email`] = p.email || ''
          })

          return {
            Name: a.name, Email: a.email, Phone: a.phone || '',
            'Agent Code': a.agentCode || '',
            ...parentCols,
            'KYC Status': a.kyc?.status || 'pending',
            'Account Status': a.isActive ? 'Active' : 'Inactive',
            ...(isSubChild ? {} : { 'Sub-Child Count': a.childCount ?? 0 }),
            Whitelabels: a.whitelabelCount ?? 0, Customers: a.customerCount ?? 0,
            'Joined On': a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '',
          }
        }),
        isSubChild ? 'sub-child-agencies' : 'child-agencies',
        isSubChild ? 'Sub-Child Agencies' : 'Child Agencies'
      )
    } catch { toast.error('Export failed') }
    finally { setExportLoading(false) }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">{pageTitle}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {agentRole === 'sub_child_agent'
              ? 'Manage and monitor tertiary distribution entities.'
              : 'Manage and monitor secondary distribution entities.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exportLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
        >
          {exportLoading ? <Loader size="sm" /> : <Download size={16} strokeWidth={2} />}
          Export
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
            <input
              type="search"
              placeholder="Search name, email, or phone…"
              autoComplete="off"
              className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex lg:gap-3">
            <div className="w-full sm:min-w-[140px] lg:w-44">
              <CustomDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All accounts' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                className="w-full"
                buttonClassName="!py-2"
              />
            </div>
            <div className="w-full sm:min-w-[140px] lg:w-44">
              <CustomDropdown
                value={kycFilter}
                onChange={setKycFilter}
                options={[
                  { value: 'all', label: 'All KYC' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
                className="w-full"
                buttonClassName="!py-2"
              />
            </div>
            <div className="w-full sm:min-w-[180px] lg:w-56">
              <CustomDropdown
                value={parentFilter}
                onChange={setParentFilter}
                options={parentOptions}
                className="w-full"
                buttonClassName="!py-2"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader size="lg" />
            <p className="mt-4 text-xs text-gray-500">Loading agencies…</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <Building2 className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-gray-900">No agencies found</p>
            <p className="mt-1 text-sm text-gray-500">Try adjusting search or status filter.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table
                className={`w-full text-sm ${agentRole === 'sub_child_agent' ? 'min-w-[980px]' : 'min-w-[1100px]'}`}
              >
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">
                      {agentRole === 'sub_child_agent' ? 'Sub-child agency' : 'Child agency'}
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">
                      {agentRole === 'sub_child_agent' ? 'Child agency' : 'Parent agency'}
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Contact</th>
                    {agentRole !== 'sub_child_agent' ? (
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Sub-child</th>
                    ) : null}
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Whitelabels</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Customers</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">KYC</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agents.map((agent) => (
                    <tr key={agent._id} className="group transition-colors hover:bg-gray-50/80">
                      <td className="px-4 py-2.5">
                        <div className="flex items-start gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500 transition-transform group-hover:scale-[1.02]">
                            <Building2 className="h-4 w-4" strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-gray-900">{agent.name}</div>
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                              <Mail className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
                              <span className="truncate">{agent.email}</span>
                            </div>
                            <div className="mt-1 text-[11px] font-medium text-primary-700">
                              {agent.agentCode || '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {(() => {
                          const parents = Array.isArray(agent.allParents) && agent.allParents.length > 0
                            ? agent.allParents
                            : agent.parentName
                              ? [{ name: agent.parentName, agentCode: agent.parentCode }]
                              : []
                          if (parents.length === 0) return <span className="text-xs text-gray-400">—</span>
                          if (parents.length === 1) return (
                            <div>
                              <p className="text-xs font-medium text-gray-900 leading-tight">{parents[0].name}</p>
                              <p className="text-[10px] text-gray-400">Code: {parents[0].agentCode || '—'}</p>
                            </div>
                          )
                          const parentsPath = agentRole === 'sub_child_agent'
                            ? `/admin/sub-child-agencies/${agent._id}/parents`
                            : `/admin/child-agencies/${agent._id}/parents`
                          return (
                            <button
                              type="button"
                              onClick={() => navigate(parentsPath)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-900"
                              title="View all parent agencies"
                            >
                              <Building2 className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
                              <span className="tabular-nums">{parents.length}</span>
                            </button>
                          )
                        })()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 bg-white text-gray-400">
                            <Phone className="h-3 w-3" />
                          </div>
                          <span className="text-xs font-medium text-gray-700">{agent.phone || 'N/A'}</span>
                        </div>
                      </td>
                      {agentRole !== 'sub_child_agent' ? (
                        <td className="px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/sub-child-agencies?parentRef=${agent._id}`)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-900"
                          >
                            <Users className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
                            <span>{agent.childCount || 0}</span>
                          </button>
                        </td>
                      ) : null}
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              agentRole === 'sub_child_agent'
                                ? `/admin/sub-child-agencies/${agent._id}/whitelabels`
                                : `/admin/child-agencies/${agent._id}/whitelabels`
                            )
                          }
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium tabular-nums text-gray-800 transition-colors hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-900"
                          title="View all whitelabel packages for this agent"
                        >
                          <Layers className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
                          <span>{agent.whitelabelCount ?? 0}</span>
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => navigate(customersPathForAgent(agent._id))}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium tabular-nums text-gray-800 transition-colors hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-900"
                          title="View customers for this agency and its network"
                        >
                          <UserRound className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
                          <span>{agent.customerCount || 0}</span>
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          disabled={togglingId === agent._id}
                          onClick={() => handleToggleStatus(agent._id)}
                          className={`inline-flex min-w-[88px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                            agent.isActive
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/90'
                              : 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100/90'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${agent.isActive ? 'bg-emerald-500' : 'bg-red-500'} ${agent.isActive ? 'animate-pulse' : ''}`} />
                          {agent.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        {getStatusBadge(agent.kyc?.status)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 pr-5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAgent(agent)
                            setIsDetailModalOpen(true)
                          }}
                          className="inline-flex rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:border-primary-200 hover:text-primary-700 active:scale-95"
                          title="View agency"
                        >
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={10}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <AgentDetailModal />
    </div>
  )
}
