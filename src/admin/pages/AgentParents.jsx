import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Building2,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Users,
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'

export default function AgentParents() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { toast } = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast

  const isSubChildContext = pathname.includes('sub-child-agencies')
  const listPath = isSubChildContext ? '/admin/sub-child-agencies' : '/admin/child-agencies'
  const listLabel = isSubChildContext ? 'Sub-child Agencies' : 'Child Agencies'
  const parentLabel = isSubChildContext ? 'Child agencies' : 'Parent agencies'

  const [loading, setLoading] = useState(true)
  const [agent, setAgent] = useState(null)
  const [parents, setParents] = useState([])

  const load = useCallback(async () => {
    if (!agentId) return
    setLoading(true)
    try {
      const { data } = await adminApi.getAgent(agentId)
      const agentPayload = data?.data?.agent
      if (!data?.success || !agentPayload) {
        setAgent(null)
        setParents([])
        return
      }
      setAgent(agentPayload)

      // Resolve all approved parents
      const approvedIds = Array.isArray(agentPayload.approvedParents)
        ? agentPayload.approvedParents.map((p) => (typeof p === 'object' ? p._id : p))
        : []

      // Also include primaryRef if not already in approvedParents
      const primaryId = agentPayload.parentRef
        ? (typeof agentPayload.parentRef === 'object' ? agentPayload.parentRef._id : agentPayload.parentRef)
        : null

      const allIds = [...new Set([
        ...(primaryId ? [String(primaryId)] : []),
        ...approvedIds.map(String),
      ])]

      if (allIds.length === 0) {
        setParents([])
        setLoading(false)
        return
      }

      // Fetch each parent
      const results = await Promise.allSettled(allIds.map((id) => adminApi.getAgent(id)))
      const resolved = results
        .filter((r) => r.status === 'fulfilled' && r.value.data?.success)
        .map((r) => r.value.data.data.agent)
      setParents(resolved)
    } catch {
      toastRef.current.error('Could not load parent agencies')
      setAgent(null)
      setParents([])
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    load()
  }, [load])

  if (loading && !agent) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" strokeWidth={2} />
        <p className="text-sm text-gray-500">Loading parents…</p>
      </div>
    )
  }

  if (!loading && !agent) {
    return (
      <div className="animate-fade-in space-y-4">
        <p className="text-sm text-gray-600">Agent not found.</p>
        <Link to={listPath} className="text-sm font-medium text-primary-700 hover:text-primary-800">
          ← Back to {listLabel}
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-4">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link to={listPath} className="font-medium text-primary-700 transition-colors hover:text-primary-800">
          {listLabel}
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
        <span className="max-w-[min(100vw-8rem,240px)] truncate font-medium text-gray-800" title={agent?.name}>
          {agent?.name || 'Agency'}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
        <span className="font-semibold text-gray-900">{parentLabel}</span>
      </nav>

      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">{parentLabel}</h1>
        <p className="mt-1 text-sm text-gray-500">
          All {parentLabel.toLowerCase()} linked to this agency.
        </p>
      </div>

      {/* Agent info card */}
      {agent ? (
        <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-3 py-2 sm:px-4">
            <Building2 className="h-3.5 w-3.5 text-primary-600" strokeWidth={2} />
            <h2 className="text-xs font-semibold text-gray-900">
              {isSubChildContext ? 'Sub-child agency' : 'Child agency'}
            </h2>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500">
                <Building2 className="h-6 w-6" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="text-base font-semibold text-gray-900">{agent.name || '—'}</h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
                    <span className="truncate">{agent.email || '—'}</span>
                  </span>
                  {agent.phone ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
                      {agent.phone}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1 font-medium text-primary-700">
                    <ShieldCheck className="h-3 w-3 shrink-0" strokeWidth={2} />
                    {agent.agentCode || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Parents list */}
      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-gray-900">{parentLabel}</h2>
          {!loading && parents.length > 0 && (
            <span className="text-xs text-gray-500">{parents.length} linked</span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" strokeWidth={2} />
          </div>
        ) : parents.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-10 text-center shadow-sm">
            <Users className="mx-auto h-10 w-10 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-semibold text-gray-900">No {parentLabel.toLowerCase()} linked</p>
            <p className="mt-1 text-sm text-gray-500">This agency has no approved parent relationships.</p>
            <button
              type="button"
              onClick={() => navigate(listPath)}
              className="mt-4 text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              Back to {listLabel}
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Agency</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Email</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Phone</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">KYC</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parents.map((p) => (
                    <tr key={p._id} className="transition-colors hover:bg-gray-50/80">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500">
                            <Building2 className="h-4 w-4" strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-gray-900">{p.name}</div>
                            <div className="mt-0.5 font-mono text-[10px] text-primary-700">{p.agentCode || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[220px] px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
                          <span className="truncate text-xs text-gray-800">{p.email || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
                          <span className="text-xs text-gray-800">{p.phone || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          p.kyc?.status === 'approved' ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : p.kyc?.status === 'rejected' ? 'border-red-200 bg-red-50 text-red-800'
                          : 'border-amber-200 bg-amber-50 text-amber-800'
                        }`}>
                          {p.kyc?.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          p.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${p.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
