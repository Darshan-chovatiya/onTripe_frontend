import { useState, useCallback } from 'react'
import { Ticket, Clock, FileText, Eye, Download, Loader2 } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { joinUploadUrl } from '@/shared/config/api.js'

const getFullUrl = (path) => (path ? joinUploadUrl(path) : null)

/** Safe filename for download; preserves extension from path when missing on name. */
function downloadFileName(ticket) {
  const raw = (ticket?.name || 'travel-ticket').trim() || 'travel-ticket'
  const cleaned = raw.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, ' ').trim()
  const path = String(ticket?.fileUrl || '')
  const extMatch = path.match(/\.([a-z0-9]{2,5})$/i)
  const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : ''
  const base = cleaned.slice(0, 120)
  if (ext && !base.toLowerCase().endsWith(ext)) return `${base}${ext}`
  return base || `ticket${ext || ''}`
}

function isImagePath(fileUrl) {
  return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(String(fileUrl || ''))
}

function isPdfPath(fileUrl) {
  return /\.pdf$/i.test(String(fileUrl || ''))
}

export default function TicketsModal({ isOpen, onClose, tickets = [] }) {
  const { toast } = useToast()
  const [downloadingIdx, setDownloadingIdx] = useState(null)

  const handleDownload = useCallback(
    async (ticket, idx) => {
      const url = getFullUrl(ticket.fileUrl)
      if (!url) {
        toast.error('No file URL for this ticket')
        return
      }
      const filename = downloadFileName(ticket)
      setDownloadingIdx(idx)
      try {
        const res = await fetch(url, { method: 'GET', mode: 'cors', credentials: 'omit' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = filename
        a.rel = 'noopener'
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(objectUrl)
      } catch {
        try {
          const res2 = await fetch(url, { method: 'GET', mode: 'cors', credentials: 'include' })
          if (!res2.ok) throw new Error(`HTTP ${res2.status}`)
          const blob = await res2.blob()
          const objectUrl = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = objectUrl
          a.download = filename
          a.rel = 'noopener'
          a.style.display = 'none'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(objectUrl)
        } catch {
          toast.error('Download failed. Try View to open the file, or check your connection.')
        }
      } finally {
        setDownloadingIdx(null)
      }
    },
    [toast]
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your Travel Tickets" size="lg">
      <div className="space-y-5">
        {!tickets || tickets.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <Ticket className="h-7 w-7 text-gray-400" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-medium text-gray-900">No tickets yet</p>
            <p className="mt-1 max-w-xs text-xs text-gray-500">Your agency can upload tickets here. Check back later or contact them.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {tickets.map((ticket, idx) => {
              const url = getFullUrl(ticket.fileUrl)
              const isImage = isImagePath(ticket.fileUrl)
              const isPdf = isPdfPath(ticket.fileUrl)
              const isBusy = downloadingIdx === idx

              return (
                <li
                  key={`${ticket.fileUrl || ''}-${idx}`}
                  className="flex flex-col gap-4 rounded-2xl border border-gray-200/90 bg-gray-50/50 p-4 transition hover:border-gray-300 hover:bg-white sm:flex-row sm:items-center sm:gap-5 sm:p-5"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white sm:h-[5.5rem] sm:w-[5.5rem]">
                      {isImage && url ? (
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-primary-500">
                          <FileText className="h-8 w-8" strokeWidth={1.5} />
                          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                            {isPdf ? 'PDF' : 'File'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <h4 className="truncate text-base font-semibold text-gray-900">{ticket.name || 'Ticket'}</h4>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        {ticket.uploadedAt
                          ? `Issued ${new Date(ticket.uploadedAt).toLocaleDateString(undefined, {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}`
                          : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
                    {url ? (
                      <>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-700 sm:flex-initial"
                        >
                          <Eye className="h-4 w-4" strokeWidth={2} />
                          View
                        </a>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDownload(ticket, idx)}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-60 sm:flex-initial"
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                          ) : (
                            <Download className="h-4 w-4" strokeWidth={2} />
                          )}
                          Download
                        </button>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">File unavailable</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Modal>
  )
}
