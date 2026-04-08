import { useEffect, useMemo, useRef, useState } from 'react'
import { Mail, Phone, Search, UserCircle, Bell, Send, History, Check } from 'lucide-react'
import { ROLES } from '@/shared/utils/constants.js'
import { useAgencyPermissions } from '@/travelAgency/agency/hooks/useAgencyPermissions.js'
import { listCustomers as listChildCustomers } from '@/travelAgency/childAgency/services/childAgencyApi.js'
import { listCustomers as listSubCustomers } from '@/travelAgency/subChild/services/subChildApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Modal from '@/shared/components/Modal.jsx'
import {
  sendNotification,
  getSentNotifications,
  getNotificationPreview,
} from '@/travelAgency/childAgency/services/childAgencyApi.js'

export default function AgencyCustomers() {
  const { role } = useAgencyPermissions()
  const { toast } = useToast()
  const toastRef = useRef(toast)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])

  const [selectedIds, setSelectedIds] = useState(() => new Set())

  const [notifyOpen, setNotifyOpen] = useState(false)
  const [notifyBusy, setNotifyBusy] = useState(false)
  const [notifyForm, setNotifyForm] = useState({ subject: '', message: '', attachments: [] })

  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [history, setHistory] = useState([])

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewMeta, setPreviewMeta] = useState(null)

  const publicBaseUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_API_BASE_URL
    const base = !envUrl || envUrl.includes('VITE_API_BASE_URL') ? 'http://localhost:5001' : envUrl.trim().replace(/\/+$/, '')
    return base.endsWith('/api') ? base.slice(0, -4) : base
  }, [])

  const attachmentHref = (attachment) =>
    attachment?.url
      ? attachment.url
      : attachment?.path
        ? `${publicBaseUrl}/${String(attachment.path).replace(/^\/+/, '')}`
        : ''

  const selectedCount = selectedIds.size

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (role !== ROLES.CHILD_AGENCY && role !== ROLES.SUB_CHILD) {
        setRows([])
        return
      }
      setLoading(true)
      try {
        const res =
          role === ROLES.CHILD_AGENCY
            ? await listChildCustomers()
            : await listSubCustomers()
        const customers = res.data?.data?.customers ?? []
        if (cancelled) return
        setRows(
          customers.map((item) => ({
            // Backend notification endpoint expects Customer `_id` (not AgencyCustomer `_id`)
            id: item.customer?._id || item._id,
            name: item.name || item.customer?.name || '—',
            phone: item.customer?.phone || '—',
            email: item.email || item.customer?.email || '—',
            trips: Array.isArray(item.bookings) ? item.bookings.length : 0,
            lastActivity: item.updatedAt || item.createdAt,
            isActive: item.isActive !== false,
          }))
        )
      } catch (err) {
        if (!cancelled) toastRef.current.error(getApiErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [role])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.phone.replace(/\s/g, '').includes(s) ||
        c.email.toLowerCase().includes(s)
    )
  }, [q, rows])

  const allFilteredSelected = useMemo(() => {
    if (filtered.length === 0) return false
    return filtered.every((c) => selectedIds.has(c.id))
  }, [filtered, selectedIds])

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const shouldDeselect = filtered.length > 0 && filtered.every((c) => next.has(c.id))
      if (shouldDeselect) filtered.forEach((c) => next.delete(c.id))
      else filtered.forEach((c) => next.add(c.id))
      return next
    })
  }

  const openNotify = () => {
    if (selectedCount === 0) {
      toast.error('Select at least one customer')
      return
    }
    setNotifyOpen(true)
  }

  const sendNotify = async () => {
    if (selectedCount === 0) {
      toast.error('Select at least one customer')
      return
    }
    if (!notifyForm.subject.trim() || !notifyForm.message.trim()) {
      toast.error('Subject and message are required')
      return
    }

    setNotifyBusy(true)
    try {
      const form = new FormData()
      form.append('users', JSON.stringify([]))
      form.append('customers', JSON.stringify(Array.from(selectedIds)))
      form.append('subject', notifyForm.subject)
      form.append('message', notifyForm.message)
      notifyForm.attachments.forEach((file) => form.append('attachments', file))

      const { data } = await sendNotification(form)
      if (data.success) {
        toast.success(`Notification sent to ${selectedCount} customer${selectedCount === 1 ? '' : 's'}`)
        setNotifyOpen(false)
        setNotifyForm({ subject: '', message: '', attachments: [] })
        setSelectedIds(new Set())
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Failed to send notification')
    } finally {
      setNotifyBusy(false)
    }
  }

  const openHistory = async () => {
    setHistoryOpen(true)
    setHistoryLoading(true)
    try {
      const { data } = await getSentNotifications()
      if (data.success) {
        const notifications = data.data.notifications || []
        // Only show notifications sent to customers
        setHistory(
          notifications.filter((n) =>
            Array.isArray(n.recipients) && n.recipients.some((r) => r.receiverType === 'Customer')
          )
        )
      }
    } catch (err) {
      toast.error('Failed to load notification history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const openPreview = async (notificationId) => {
    setPreviewOpen(true)
    setPreviewLoading(true)
    setPreviewHtml('')
    setPreviewMeta(null)
    try {
      const { data } = await getNotificationPreview(notificationId)
      if (data.success) {
        setPreviewHtml(data.data.html || '')
        setPreviewMeta(data.data.notification || null)
      }
    } catch (err) {
      toast.error('Failed to load email preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Travelers and leads linked to your agency.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openHistory}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <History size={16} />
            History
          </button>
          <button
            type="button"
            onClick={openNotify}
            disabled={selectedCount === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
          >
            <Bell size={16} />
            Notify
          </button>
        </div>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, phone, or email…"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 shadow-sm outline-none ring-primary-500/20 placeholder:text-gray-400 focus:border-primary-300 focus:ring-2"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-gray-500">
                <th className="w-10 px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={toggleSelectAllFiltered}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900"
                    title={allFilteredSelected ? 'Deselect all in view' : 'Select all in view'}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded border ${
                        allFilteredSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 bg-white text-transparent'
                      }`}
                    >
                      <Check size={12} strokeWidth={4} />
                    </span>
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Contact</th>
                <th className="px-4 py-3 font-medium">Trips</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Last activity</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSelect(c.id)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                        selectedIds.has(c.id)
                          ? 'border-primary-600 bg-primary-600 text-white'
                          : 'border-gray-200 bg-white text-transparent hover:border-primary-400'
                      }`}
                      title={selectedIds.has(c.id) ? 'Selected' : 'Select'}
                    >
                      <Check size={16} strokeWidth={4} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium text-gray-900">
                      <UserCircle className="h-4 w-4 shrink-0 text-primary-500" aria-hidden />
                      {c.name}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        {c.phone}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        {c.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{c.trips}</td>
                  <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                    {c.lastActivity ? new Date(c.lastActivity).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        c.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">Loading customers…</p>
        ) : null}
        {!loading && filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">No customers match your search.</p>
        ) : null}
      </div>

      {/* Notify customers */}
      <Modal isOpen={notifyOpen} onClose={() => !notifyBusy && setNotifyOpen(false)} title="Send notification" size="lg">
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Sending to <span className="font-semibold">{selectedCount}</span> selected customer{selectedCount === 1 ? '' : 's'}.
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Subject</label>
            <input
              type="text"
              value={notifyForm.subject}
              onChange={(e) => setNotifyForm((p) => ({ ...p, subject: e.target.value }))}
              placeholder="E.g. Update your travel schedule"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Message</label>
            <textarea
              rows={7}
              value={notifyForm.message}
              onChange={(e) => setNotifyForm((p) => ({ ...p, message: e.target.value }))}
              placeholder="Write a clear message for your customers…"
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm leading-relaxed focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Attachments (optional)</label>
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                setNotifyForm((p) => ({ ...p, attachments: files }))
              }}
              className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-black"
            />
            {notifyForm.attachments.length > 0 && (
              <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                <div className="font-semibold text-gray-700 mb-1">Selected files</div>
                <ul className="list-disc pl-5 space-y-0.5">
                  {notifyForm.attachments.map((f) => (
                    <li key={`${f.name}-${f.size}`}>{f.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setNotifyOpen(false)}
              disabled={notifyBusy}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={sendNotify}
              disabled={notifyBusy}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
            >
              <Send size={16} />
              {notifyBusy ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </Modal>

      {/* History */}
      <Modal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} title="Notification history" size="lg">
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
          {historyLoading ? (
            <div className="p-10 text-center text-sm text-gray-500">Loading…</div>
          ) : history.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">No notifications sent yet.</div>
          ) : (
            history.map((item) => (
              <div key={item._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{item.subject}</div>
                    <div className="mt-1 text-xs text-gray-500 line-clamp-2">{item.message}</div>
                    <div className="mt-2 text-[11px] text-gray-600">
                      <span className="font-semibold">Sent to:</span>{' '}
                      {(item.recipients || [])
                        .map((r) => r?.receiver?.email || r?.receiver?.name)
                        .filter(Boolean)
                        .slice(0, 4)
                        .join(', ')}
                      {(item.recipients || []).length > 4 ? '…' : ''}
                    </div>
                    {Array.isArray(item.attachments) && item.attachments.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span className="font-semibold">Attachments:</span>{' '}
                        <span className="inline-flex flex-wrap gap-2">
                          {item.attachments
                            .filter((a) => a?.filename)
                            .map((a) => (
                              <a
                                key={`${a.filename}-${a.url || a.path}`}
                                href={attachmentHref(a)}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-100"
                              >
                                {a.filename}
                              </a>
                            ))}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-400 whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">
                    {item.recipients?.length || 0} recipients
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                    {(item.recipients || []).filter((r) => r.status === 'sent').length} sent
                  </span>
                  {(item.recipients || []).some((r) => r.status === 'failed') && (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700">
                      {(item.recipients || []).filter((r) => r.status === 'failed').length} failed
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => openPreview(item._id)}
                    className="rounded-full bg-primary-50 px-2 py-0.5 text-primary-700 hover:bg-primary-100"
                  >
                    Preview
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Email preview */}
      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title="Email preview" size="xl">
        <div className="space-y-4">
          {previewLoading ? (
            <div className="p-10 text-center text-sm text-gray-500">Loading…</div>
          ) : (
            <>
              {previewMeta ? (
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700 space-y-2">
                  <div>
                    <span className="font-semibold">Sent:</span>{' '}
                    {previewMeta.createdAt ? new Date(previewMeta.createdAt).toLocaleString() : '—'}
                  </div>
                  <div>
                    <span className="font-semibold">Recipients:</span>{' '}
                    {(previewMeta.recipients || [])
                      .map((r) => r?.receiver?.email || r?.receiver?.name || String(r.receiver || ''))
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </div>
                  {Array.isArray(previewMeta.attachments) && previewMeta.attachments.length > 0 && (
                    <div>
                      <span className="font-semibold">Attachments:</span>{' '}
                      <span className="inline-flex flex-wrap gap-2">
                        {previewMeta.attachments
                          .filter((a) => a?.filename)
                          .map((a) => (
                            <a
                              key={`${a.filename}-${a.url || a.path}`}
                              href={attachmentHref(a)}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-200 hover:bg-primary-50"
                            >
                              {a.filename}
                            </a>
                          ))}
                      </span>
                    </div>
                  )}
                </div>
              ) : null}

              <div className="rounded-2xl border border-gray-200 overflow-hidden">
                <iframe
                  title="Email HTML preview"
                  className="w-full h-[60vh] bg-white"
                  srcDoc={previewHtml || '<div style="padding:16px;font-family:Arial;">No preview available.</div>'}
                />
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
