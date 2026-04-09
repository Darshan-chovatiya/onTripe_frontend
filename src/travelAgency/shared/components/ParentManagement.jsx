import { useCallback, useEffect, useRef, useState } from 'react'
import { Building2, CheckCircle, Clock, Plus, XCircle } from 'lucide-react'
import Button from '@/shared/components/Button.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

/**
 * @param {{ listParents: Function, addParent: Function, toggleParentActive: Function, label: string }} props
 */
export default function ParentManagement({ listParents, addParent, toggleParentActive, label }) {
  const { toast } = useToast()
  const toastRef = useRef(toast)
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const [adding, setAdding] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await listParents()
      setParents(data?.data?.parents ?? [])
    } catch (err) {
      toastRef.current.error(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [listParents])

  useEffect(() => { refresh() }, [refresh])

  const handleAdd = async (e) => {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    setAdding(true)
    try {
      await addParent(trimmed)
      toast.success('Request sent — awaiting approval')
      setCode('')
      await refresh()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setAdding(false)
    }
  }

  const handleToggle = async (p) => {
    setTogglingId(p._id)
    try {
      await toggleParentActive(p._id)
      setParents(prev => prev.map(item =>
        String(item._id) === String(p._id)
          ? { ...item, isActive: !item.isActive }
          : item
      ))
      toast.success(p.isActive ? 'Parent deactivated — packages hidden' : 'Parent activated')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <section className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{label}</h2>
          <p className="text-xs text-gray-500">Add a parent code to link your account. Pending until approved.</p>
        </div>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          className="input-field flex-1"
          placeholder="Enter parent agent code…"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={adding}
        />
        <Button type="submit" disabled={adding || !code.trim()}>
          <Plus className="mr-1 inline h-4 w-4" />
          {adding ? 'Adding…' : 'Add'}
        </Button>
      </form>

      {/* List */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : parents.length === 0 ? (
        <p className="text-sm text-gray-400">No parent agencies linked yet.</p>
      ) : (
        <ul className="space-y-2">
          {parents.map((p) => (
            <li
              key={p._id}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                p.status === 'approved' && !p.isActive
                  ? 'border-gray-200 bg-gray-100/60'
                  : 'border-gray-100 bg-gray-50/80'
              }`}
            >
              <div className="min-w-0">
                <p className={`truncate text-sm font-medium ${p.status === 'approved' && !p.isActive ? 'text-gray-400' : 'text-gray-900'}`}>
                  {p.name || '—'}
                </p>
                <p className="text-xs text-gray-500">{p.email || p.phone || p.agentCode || ''}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {/* Status badge */}
                {p.status === 'approved' ? (
                  p.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                      <CheckCircle className="h-3 w-3" /> Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500 ring-1 ring-inset ring-gray-200">
                      Inactive
                    </span>
                  )
                ) : p.status === 'rejected' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-100">
                    <XCircle className="h-3 w-3" /> Rejected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-100">
                    <Clock className="h-3 w-3" /> Pending
                  </span>
                )}

                {/* Active/Inactive toggle — only for approved */}
                {p.status === 'approved' && (
                  <button
                    type="button"
                    onClick={() => handleToggle(p)}
                    disabled={togglingId === p._id}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                      p.isActive
                        ? 'border border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600'
                        : 'border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {togglingId === p._id ? '…' : p.isActive ? 'Set inactive' : 'Set active'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
