import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Building2,
  ChevronRight,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Modal from '@/shared/components/Modal.jsx'
import { getFileUrl } from '@/admin/components/WhitelabelOfferBlocks.jsx'

function hasText(v) {
  return v !== undefined && v !== null && String(v).trim() !== ''
}

function formatDate(v) {
  if (!v) return ''
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function availableDocuments(docsRoot) {
  const docs = docsRoot || {}
  const rows = [
    { label: 'Aadhaar front', path: docs.aadharFront },
    { label: 'Aadhaar back', path: docs.aadharBack },
    { label: 'PAN', path: docs.panCard },
    { label: 'Passport', path: docs.passport },
    { label: 'Visa', path: docs.visaDoc },
  ]
  const withPaths = rows.filter((r) => hasText(r.path))
  const other = Array.isArray(docs.otherDocs) ? docs.otherDocs : []
  other.forEach((path, i) => {
    if (hasText(path)) withPaths.push({ label: `Other document ${i + 1}`, path })
  })
  return withPaths
}

function DetailRow({ label, children, className = '' }) {
  return (
    <div className={`rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="mt-1 text-sm font-medium text-gray-900">{children}</div>
    </div>
  )
}

function AgencyCustomerDetailModal({ ac, onClose, agencyName }) {
  if (!ac) return null
  const c = ac.customer || {}
  const displayName = (ac.name && String(ac.name).trim()) || c.name || 'Unnamed traveler'
  const platformEmail = c.email || '—'
  const platformPhone = c.phone || '—'
  const platformName = c.name || '—'

  const agencyEmail = (ac.email && String(ac.email).trim()) || ''
  const agencyPhone = (ac.phone && String(ac.phone).trim()) || ''
  const docsList = availableDocuments(ac.docs)
  const hasNotes = hasText(ac.notes)
  const dobStr = ac.dob ? formatDate(ac.dob) : ''

  const agencyDetailRows = []
  if (hasText(ac.name)) agencyDetailRows.push({ key: 'n', label: 'Display name', value: ac.name })
  if (hasText(agencyEmail)) agencyDetailRows.push({ key: 'e', label: 'Email', value: agencyEmail })
  if (hasText(agencyPhone)) agencyDetailRows.push({ key: 'p', label: 'Phone', value: agencyPhone })
  if (dobStr) agencyDetailRows.push({ key: 'd', label: 'Date of birth', value: dobStr })
  if (hasText(ac.gender)) agencyDetailRows.push({ key: 'g', label: 'Gender', value: ac.gender })
  if (hasText(ac.nationality)) agencyDetailRows.push({ key: 'nat', label: 'Nationality', value: ac.nationality })
  if (hasText(ac.address))
    agencyDetailRows.push({ key: 'a', label: 'Address', value: ac.address, multiline: true })
  if (hasText(ac.aadharNumber))
    agencyDetailRows.push({ key: 'ad', label: 'Aadhaar', value: ac.aadharNumber })
  if (hasText(ac.passportNumber))
    agencyDetailRows.push({ key: 'ps', label: 'Passport no.', value: ac.passportNumber })
  if (ac.createdAt) {
    const d = formatDate(ac.createdAt)
    if (d) agencyDetailRows.push({ key: 'c', label: 'Record created', value: d })
  }
  if (ac.updatedAt) {
    const d = formatDate(ac.updatedAt)
    if (d) agencyDetailRows.push({ key: 'u', label: 'Record updated', value: d })
  }

  const custId = c._id
  const hasAgencyDetails = agencyDetailRows.length > 0

  return (
    <Modal
      isOpen={Boolean(ac)}
      onClose={onClose}
      title={displayName}
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <p className="text-xs text-gray-500">
            Agency-specific profile{agencyName ? ` · ${agencyName}` : ''}
          </p>
          {custId ? (
            <Link
              to={`/admin/customers/${custId}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              Open platform profile
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          ) : null}
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-semibold text-gray-800">Platform traveler</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <DetailRow label="Name">{platformName}</DetailRow>
            <DetailRow label="Phone">{platformPhone}</DetailRow>
            <DetailRow label="Email" className="sm:col-span-2">
              {hasText(platformEmail) && platformEmail !== '—' ? (
                <a href={`mailto:${platformEmail}`} className="text-primary-800 hover:text-primary-950">
                  {platformEmail}
                </a>
              ) : (
                '—'
              )}
            </DetailRow>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold text-gray-800">Profile for this agency</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                ac.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {ac.isActive !== false ? 'Active' : 'Inactive'}
            </span>
          </div>

          {hasAgencyDetails ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {agencyDetailRows.map((row) => (
                <DetailRow key={row.key} label={row.label} className={row.multiline ? 'sm:col-span-2' : ''}>
                  <span className={row.multiline ? 'whitespace-pre-wrap' : ''}>{row.value}</span>
                </DetailRow>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No extra fields on this agency record — platform traveler data applies.</p>
          )}
        </div>

        {hasNotes ? (
          <div className="border-t border-gray-100 pt-6">
            <p className="mb-2 text-xs font-semibold text-gray-800">Agency notes</p>
            <p className="whitespace-pre-wrap rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-sm text-gray-900">
              {ac.notes}
            </p>
          </div>
        ) : null}

        {docsList.length > 0 ? (
          <div className="border-t border-gray-100 pt-6">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-gray-800">
              <FileText className="h-4 w-4 text-primary-700" strokeWidth={2} />
              Documents ({docsList.length})
            </p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {docsList.map((doc) => {
                const href = getFileUrl(doc.path) || doc.path
                return (
                  <li key={`${doc.label}-${doc.path}`}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-sm transition-colors hover:border-primary-200 hover:bg-primary-50/40"
                    >
                      <span className="font-medium text-gray-800">{doc.label}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 group-hover:text-primary-900">
                        Open
                        <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}

export default function AgentCustomers() {
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
  const [notAllowed, setNotAllowed] = useState(false)
  const [detailAc, setDetailAc] = useState(null)

  const load = useCallback(async () => {
    if (!agentId) return
    setLoading(true)
    setNotAllowed(false)
    try {
      const agentRes = await adminApi.getAgent(agentId)
      const agentPayload = agentRes.data?.data?.agent
      if (!agentRes.data?.success || !agentPayload) {
        setAgent(null)
        setParentAgency(null)
        setRows([])
        return
      }

      const allowedRoles = ['child_agent', 'sub_child_agent']
      if (!allowedRoles.includes(agentPayload.role)) {
        setAgent(null)
        setParentAgency(null)
        setRows([])
        setNotAllowed(true)
        return
      }

      setAgent(agentPayload)

      const parentRef = agentPayload.parentRef
      if (parentRef) {
        const pid = typeof parentRef === 'object' && parentRef?._id ? parentRef._id : parentRef
        try {
          const { data: pData } = await adminApi.getAgent(pid)
          if (pData?.success && pData.data?.agent) {
            setParentAgency(pData.data.agent)
          } else {
            setParentAgency(null)
          }
        } catch {
          setParentAgency(null)
        }
      } else {
        setParentAgency(null)
      }

      try {
        const customersRes = await adminApi.getAgencyCustomers(agentId)
        if (customersRes.data?.success && customersRes.data.data) {
          setRows(Array.isArray(customersRes.data.data.customers) ? customersRes.data.data.customers : [])
        } else {
          setRows([])
        }
      } catch {
        toastRef.current.error('Could not load customer list')
        setRows([])
      }
    } catch {
      toastRef.current.error('Could not load agency')
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

  if (loading && !agent && !notAllowed) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" strokeWidth={2} />
        <p className="text-sm text-gray-500">Loading customers…</p>
      </div>
    )
  }

  if (notAllowed) {
    return (
      <div className="animate-fade-in space-y-4">
        <p className="text-sm text-gray-600">Customer list is only available for child and sub-child agencies.</p>
        <Link to={listPath} className="text-sm font-medium text-primary-700 hover:text-primary-800">
          ← Back to {listLabel}
        </Link>
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
        <span className="font-semibold text-gray-900">Customers</span>
      </nav>

      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Agency customers</h1>
        <p className="mt-1 text-sm text-gray-500">
          Travelers managed by this {roleLabel.toLowerCase()} and its sub-child network (if any).
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
          <h2 className="text-base font-semibold text-gray-900">Customer directory</h2>
          {!loading && rows.length > 0 ? (
            <span className="text-xs text-gray-500">
              {rows.length} record{rows.length === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white py-12 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" strokeWidth={2} />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-10 text-center shadow-sm">
            <Users className="mx-auto h-10 w-10 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-semibold text-gray-900">No customers yet</p>
            <p className="mt-1 text-sm text-gray-500">No traveler profiles are linked to this agency hierarchy.</p>
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
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Customer</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Email</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Phone</th>
                    <th className="w-[72px] px-4 py-2.5 text-right text-xs font-medium text-gray-600">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((ac, idx) => {
                    const c = ac.customer || {}
                    const displayName = (ac.name && String(ac.name).trim()) || c.name || 'Unnamed'
                    const displayEmail = (ac.email && String(ac.email).trim()) || c.email || '—'
                    const displayPhone = (ac.phone && String(ac.phone).trim()) || c.phone || '—'
                    return (
                      <tr key={ac._id || idx} className="transition-colors hover:bg-gray-50/80">
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500">
                              <UserRound className="h-4 w-4" strokeWidth={2} />
                            </div>
                            <div className="min-w-0 truncate text-sm font-semibold text-gray-900">{displayName}</div>
                          </div>
                        </td>
                        <td className="max-w-[220px] px-4 py-2.5 align-middle">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
                            <span className="truncate text-xs text-gray-800" title={displayEmail !== '—' ? displayEmail : ''}>
                              {displayEmail}
                            </span>
                          </div>
                        </td>
                        <td className="max-w-[160px] px-4 py-2.5 align-middle">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
                            <span className="truncate text-xs text-gray-800">{displayPhone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right align-middle">
                          <button
                            type="button"
                            onClick={() => setDetailAc(ac)}
                            className="inline-flex rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:border-primary-200 hover:text-primary-700 active:scale-95"
                            title="View customer details"
                          >
                            <Eye className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <AgencyCustomerDetailModal
        ac={detailAc}
        onClose={() => setDetailAc(null)}
        agencyName={agent?.name}
      />
{/* 
      <div>
        <Link to={listPath} className="text-sm font-medium text-primary-700 hover:text-primary-800">
          ← Back to {listLabel}
        </Link>
      </div> */}
    </div>
  )
}
