import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle, Clock, Eye, Mail, Phone, User, XCircle } from 'lucide-react'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import Modal from '@/shared/components/Modal.jsx'
import { filePublicUrl } from '@/travelAgency/shared/utils/bookingDetailHelpers.js'

const KYC_STATUS_STYLE = {
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  pending:  'bg-amber-50 text-amber-700 ring-amber-100',
  rejected: 'bg-red-50 text-red-700 ring-red-100',
}

function KycModal({ agent, onClose }) {
  if (!agent) return null
  const kyc = agent.kyc || {}

  const docs = [
    { label: 'Aadhar Front', path: kyc.aadharFront },
    { label: 'Aadhar Back',  path: kyc.aadharBack },
    { label: 'PAN Card',     path: kyc.panCard },
    ...(kyc.otherDocs || []).map((p, i) => ({ label: `Other Doc ${i + 1}`, path: p })),
  ].filter(d => d.path)

  return (
    <Modal isOpen={!!agent} onClose={onClose} title="KYC Details" size="lg">
      <div className="space-y-4 text-sm">
        {/* Basic info */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-1">
          <div><span className="font-medium text-gray-600">Name:</span> <span className="text-gray-900">{agent.name || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Email:</span> <span className="text-gray-900">{agent.email || '—'}</span></div>
          <div><span className="font-medium text-gray-600">Phone:</span> <span className="text-gray-900">{agent.phone || '—'}</span></div>
        </div>

        {/* KYC status */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">KYC Status:</span>
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${KYC_STATUS_STYLE.pending}`}>
            pending
          </span>
          <span className="text-xs text-gray-400">(not yet reviewed by you)</span>
        </div>

        {/* Aadhar number */}
        {kyc.aadharNumber && (
          <div><span className="font-medium text-gray-600">Aadhar Number:</span> <span className="text-gray-900">{kyc.aadharNumber}</span></div>
        )}

        {/* KYC documents */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Documents</p>
          {docs.length === 0 ? (
            <p className="text-xs text-gray-400">No documents uploaded.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {docs.map((d) => {
                const href = filePublicUrl(d.path)
                return href ? (
                  <a
                    key={d.label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-100 hover:bg-primary-100"
                  >
                    {d.label}
                  </a>
                ) : null
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

/**
 * @param {{ listPendingRequests: Function, approveRequest: Function, rejectRequest: Function, label: string, onAction?: Function }} props
 */
export default function PendingRequestsSection({ listPendingRequests, approveRequest, rejectRequest, label, onAction }) {
  const { toast } = useToast()
  const toastRef = useRef(toast)
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [viewAgent, setViewAgent] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await listPendingRequests()
      setPending(data?.data?.pending ?? [])
    } catch (err) {
      toastRef.current.error(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [listPendingRequests])

  useEffect(() => { refresh() }, [refresh])

  const handleApprove = async (id, name) => {
    setBusyId(id)
    try {
      await approveRequest(id)
      toast.success(`${name} approved and linked`)
      setPending(prev => prev.filter(p => String(p._id) !== String(id)))
      onAction?.()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (id, name) => {
    setBusyId(id)
    try {
      await rejectRequest(id)
      toast.success(`Request from ${name} rejected`)
      setPending(prev => prev.filter(p => String(p._id) !== String(id)))
      onAction?.()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  if (!loading && pending.length === 0) return null

  return (
    <>
      <section className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-600" />
          <h2 className="text-base font-semibold text-amber-900">
            Pending {label} requests
            {pending.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-900">
                {pending.length}
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <p className="text-sm text-amber-700">Loading…</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((p) => (
              <li
                key={p._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{p.name}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                      {p.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{p.email}</span>}
                      {p.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{p.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                    <Clock className="h-3 w-3" /> Pending
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewAgent(p)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    title="View KYC details"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={busyId === p._id}
                    onClick={() => handleApprove(p._id, p.name)}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === p._id}
                    onClick={() => handleReject(p._id, p.name)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <KycModal agent={viewAgent} onClose={() => setViewAgent(null)} />
    </>
  )
}
