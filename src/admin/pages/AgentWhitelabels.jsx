import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Building2, ChevronRight, Download, Layers, Loader2, Mail, Phone, ShieldCheck } from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { NewOfferDetails, SourcePackageSummary } from '@/admin/components/WhitelabelOfferBlocks.jsx'

export default function AgentWhitelabels() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { toast } = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast

  const isSubChildContext = pathname.includes('sub-child-agencies')
  const listPath = isSubChildContext ? '/admin/sub-child-agencies' : '/admin/child-agencies'
  const listLabel = isSubChildContext ? 'Sub-child Agencies' : 'Child Agencies'

  const [loading, setLoading] = useState(true)
  const [agent, setAgent] = useState(null)
  const [parentAgency, setParentAgency] = useState(null)
  const [rows, setRows] = useState([])
  const [exportLoading, setExportLoading] = useState(false)

  const load = useCallback(async () => {
    if (!agentId) return
    setLoading(true)
    try {
      const { data } = await adminApi.listWhitelabelsByAgent(agentId)
      if (data?.success && data.data) {
        setAgent(data.data.agent || null)
        setParentAgency(data.data.parentAgency || null)
        setRows(Array.isArray(data.data.whitelabels) ? data.data.whitelabels : [])
      } else {
        setAgent(null)
        setParentAgency(null)
        setRows([])
      }
    } catch {
      toastRef.current.error('Could not load whitelabels')
      setAgent(null)
      setParentAgency(null)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    load()
  }, [load])

  const roleLabel =
    agent?.role === 'sub_child_agent'
      ? 'Sub-child agency'
      : agent?.role === 'child_agent'
        ? 'Child agency'
        : isSubChildContext
          ? 'Sub-child agency'
          : 'Child agency'

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const { exportToExcel } = await import('@/admin/utils/exportExcel.js')
      const isSubChild = agent?.role === 'sub_child_agent' || isSubChildContext
      await exportToExcel(
        rows.map((wl, idx) => {
          const basePkg = wl.originalPackage
          const basePrice = Number(basePkg?.basePrice || 0)
          const finalPrice = Number(wl.finalPrice || 0)
          const commission = wl.commissionType === 'percentage'
            ? `${wl.commissionValue ?? 0}%`
            : wl.commissionType === 'flat'
              ? `₹${Number(wl.commissionValue || 0).toLocaleString('en-IN')}`
              : '—'

          return {
            '#': idx + 1,
            'Whitelabel Title': wl.customTitle || basePkg?.title || '—',
            'Custom Description': wl.customDescription || '—',

            // Chain differs: child whitelabels from original; sub-child from child's whitelabel
            'Source Type': isSubChild
              ? 'Sub-child (whitelabelled from child whitelabel)'
              : 'Child (whitelabelled from original package)',
            'Original Package': basePkg?.title || '—',
            'Original Package Owner': basePkg?.createdBy?.name || '—',
            'Original Package Owner Code': basePkg?.createdBy?.agentCode || '—',

            ...(isSubChild ? {
              'Child Agency (Whitelabel Source)': wl.ownedByParent?.name || parentAgency?.name || '—',
              'Child Agency Code': wl.ownedByParent?.agentCode || parentAgency?.agentCode || '—',
              'Child Agency Email': wl.ownedByParent?.email || parentAgency?.email || '—',
              'Sub-Child Agent': agent?.name || '—',
              'Sub-Child Agent Code': agent?.agentCode || '—',
              'Sub-Child Agent Email': agent?.email || '—',
            } : {
              'Child Agent': agent?.name || '—',
              'Child Agent Code': agent?.agentCode || '—',
              'Child Agent Email': agent?.email || '—',
              'Parent Agency': wl.ownedByParent?.name || parentAgency?.name || '—',
              'Parent Agency Code': wl.ownedByParent?.agentCode || parentAgency?.agentCode || '—',
            }),

            'Destination': basePkg?.destination || '—',
            'Total Days': basePkg?.totalDays ?? '—',
            'Base Price (INR)': basePrice,
            'Commission': commission,
            'Commission Type': wl.commissionType || '—',
            'Final Offer Price (INR)': finalPrice,
            'Status': wl.isActive ? 'Active' : 'Inactive',
            'Created On': wl.createdAt ? new Date(wl.createdAt).toLocaleDateString() : '—',
          }
        }),
        `whitelabels-${agent?.name || 'agent'}`,
        'Whitelabels'
      )
    } catch { toastRef.current.error('Export failed') }
    finally { setExportLoading(false) }
  }

  if (loading && !agent) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" strokeWidth={2} />
        <p className="text-sm text-gray-500">Loading whitelabels…</p>
      </div>
    )
  }

  if (!loading && !agent) {
    return (
      <div className="animate-fade-in space-y-4">
        <p className="text-sm text-gray-600">Agent not found or not allowed.</p>
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
        <span className="font-semibold text-gray-900">Whitelabels</span>
      </nav>

      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Agent whitelabels</h1>
        <p className="mt-1 text-sm text-gray-500">
          Each card shows the real source package, then how this agency resells it as a whitelabel offer.
        </p>
      </div>

      {agent ? (
        <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-3 py-2 sm:px-4">
            <Building2 className="h-3.5 w-3.5 text-primary-600" strokeWidth={2} />
            <h2 className="text-xs font-semibold text-gray-900">{roleLabel}</h2>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500">
                <Building2 className="h-6 w-6" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
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
                {parentAgency ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-2 py-1.5 text-xs">
                    <span className="font-medium text-gray-500">Parent agency</span>
                    <span className="font-semibold text-gray-900">{parentAgency.name || '—'}</span>
                    <span className="text-gray-400">·</span>
                    <span className="truncate text-gray-600">{parentAgency.email || '—'}</span>
                    <span className="font-medium text-primary-700">{parentAgency.agentCode || '—'}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-gray-900">Whitelabel offers</h2>
          <div className="flex items-center gap-2">
            {!loading && rows.length > 0 && (
              <>
                <span className="text-xs text-gray-500">{rows.length} offer{rows.length === 1 ? '' : 's'}</span>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exportLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  {exportLoading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Download className="h-4 w-4" strokeWidth={2} />}
                  Export
                </button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" strokeWidth={2} />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-10 text-center shadow-sm">
            <Layers className="mx-auto h-10 w-10 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-semibold text-gray-900">No whitelabel packages</p>
            <p className="mt-1 text-sm text-gray-500">This agent has not created any whitelabel offers yet.</p>
            <button
              type="button"
              onClick={() => navigate(listPath)}
              className="mt-4 text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              Back to {listLabel}
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((wl) => (
              <li
                key={String(wl._id)}
                className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <SourcePackageSummary pkg={wl.originalPackage || null} adminPackageLink />
                <NewOfferDetails wl={wl} basePkg={wl.originalPackage || null} splitSourceAndOfferUI />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
