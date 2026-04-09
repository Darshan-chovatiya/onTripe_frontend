import { useCallback, useEffect, useRef, useState } from 'react'
import { Building2, CheckCircle, Clock, Plus, Trash2, X } from 'lucide-react'
import Button from '@/shared/components/Button.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

/**
 * @param {{ listParents: Function, addParent: Function, removeParent: Function, label: string }} props
 */
export default function ParentManagement({ listParents, addParent, removeParent, label }) {
  const { toast } = useToast()
  const toastRef = useRef(toast)
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState(null)

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

  const handleRemove = async (parentId) => {
    setRemovingId(parentId)
    try {
      await removeParent(parentId)
      toast.success('Parent removed')
      setParents(prev => prev.filter(p => String(p._id) !== String(parentId)))
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setRemovingId(null)
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
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{p.name || '—'}</p>
                <p className="text-xs text-gray-500">{p.email || p.phone || p.agentCode || ''}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {p.status === 'approved' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                    <CheckCircle className="h-3 w-3" /> Approved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-100">
                    <Clock className="h-3 w-3" /> Pending
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(p._id)}
                  disabled={removingId === p._id}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  title="Remove"
                >
                  {removingId === p._id ? <X className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
