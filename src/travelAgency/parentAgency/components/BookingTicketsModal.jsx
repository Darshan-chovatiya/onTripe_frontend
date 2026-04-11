import { useState } from 'react'
import { Upload, Trash2, FileText, ExternalLink, X, Plus } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import Button from '@/shared/components/Button.jsx'
import { uploadBookingTickets, deleteBookingTicket } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { joinUploadUrl } from '@/shared/config/api.js'

/** @type {{ file: File, name: string }[]} */
const EMPTY = []

export default function BookingTicketsModal({ isOpen, onClose, booking, onUpdated }) {
  const { toast } = useToast()
  const [entries, setEntries] = useState(EMPTY)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const tickets = booking?.tickets || []

  const handleFileAdd = (e) => {
    const picked = Array.from(e.target.files)
    setEntries(prev => [
      ...prev,
      ...picked.map(f => ({ file: f, name: f.name.replace(/\.[^.]+$/, '') })),
    ])
    e.target.value = ''
  }

  const updateName = (idx, val) =>
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, name: val } : e))

  const removeEntry = (idx) =>
    setEntries(prev => prev.filter((_, i) => i !== idx))

  const handleUpload = async () => {
    if (!entries.length) return
    const invalid = entries.some(e => !e.name.trim())
    if (invalid) { toast.error('Please enter a name for every ticket'); return }

    setUploading(true)
    try {
      const fd = new FormData()
      entries.forEach(e => {
        fd.append('tickets', e.file)
        fd.append('ticketNames', e.name.trim())
      })
      const res = await uploadBookingTickets(booking._id, fd)
      toast.success('Tickets uploaded')

      // Patch returned tickets with the custom names the user entered,
      // matched by position (new tickets are appended at the end).
      const returnedTickets = res.data?.data?.tickets || []
      const existingCount = tickets.length
      const patched = returnedTickets.map((t, i) => {
        const entryIndex = i - existingCount
        if (entryIndex >= 0 && entries[entryIndex]) {
          return { ...t, name: entries[entryIndex].name.trim() }
        }
        return t
      })

      setEntries(EMPTY)
      onUpdated(patched)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (ticketId) => {
    setDeletingId(ticketId)
    try {
      const res = await deleteBookingTicket(booking._id, ticketId)
      toast.success('Ticket removed')
      onUpdated(res.data?.data?.tickets)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tickets — ${booking?.bookingId || ''}`}
      size="md"
      footer={
        <div className="flex justify-end p-4">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      }
    >
      <div className="space-y-5">

        {/* Upload area */}
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-4 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <span className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Plus size={14} /> Add files
            </span>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              className="sr-only"
              onChange={handleFileAdd}
            />
          </label>

          {entries.length > 0 && (
            <div className="space-y-2">
              {entries.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <FileText size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500 truncate max-w-[120px] flex-shrink-0" title={entry.file.name}>
                    {entry.file.name}
                  </span>
                  <input
                    type="text"
                    placeholder="Ticket name *"
                    value={entry.name}
                    onChange={e => updateName(idx, e.target.value)}
                    className="input-field flex-1 text-sm py-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeEntry(idx)}
                    className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <Button onClick={handleUpload} disabled={uploading} className="mt-1">
                {uploading ? (
                  <span className="flex items-center gap-1.5"><Upload size={14} className="animate-bounce" /> Uploading…</span>
                ) : (
                  <span className="flex items-center gap-1.5"><Upload size={14} /> Upload {entries.length} ticket(s)</span>
                )}
              </Button>
            </div>
          )}

          <p className="text-xs text-gray-400">Accepted: PDF, JPG, PNG — max 10 MB each, up to 20 files</p>
        </div>

        {/* Existing tickets */}
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">No tickets uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{tickets.length} Ticket(s)</p>
            {tickets.map(t => (
              <div key={t._id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 hover:bg-gray-50 transition-colors">
                <div className="h-9 w-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {t.name || t.fileUrl?.split('/').pop() || 'Ticket'}
                  </p>
                  {t.uploadedAt && (
                    <p className="text-xs text-gray-400">
                      {new Date(t.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <a
                    href={joinUploadUrl(t.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                    title="Open"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <button
                    onClick={() => handleDelete(t._id)}
                    disabled={deletingId === t._id}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    {deletingId === t._id ? <X size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
