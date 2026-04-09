import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle, Clock, Mail, Phone, User, XCircle } from 'lucide-react'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

/**
 * @param {{ listPendingRequests: Function, approveRequest: Function, rejectRequest: Function, label: string }} props
 */
export default function PendingRequestsSection({ listPendingRequests, approveRequest, rejectRequest, label }) {
  const { toast } = useToast()
  const toastRef = useRef(toast)
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState(null)

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
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  if (!loading && pending.length === 0) return null

  return (
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
  )
}
