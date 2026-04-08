import { useMemo, useState } from 'react'
import { Eye, RefreshCw, Users, UserCheck, UserX, Bell, Send, History, Check } from 'lucide-react'
import { useManageSubChildren } from '@/travelAgency/childAgency/hooks/useManageSubChildren.js'
import SubChildDetailModal from '@/travelAgency/childAgency/components/SubChildDetailModal.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { approveSubChildKyc, sendNotification, getSentNotifications, getNotificationPreview } from '@/travelAgency/childAgency/services/childAgencyApi.js'
import Modal from '@/shared/components/Modal.jsx'

export default function ManageSubChildren() {
  const { subChildren, loading, error, refresh, fetchOne, setActive } = useManageSubChildren()
  const { toast } = useToast()
  const [detailId, setDetailId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [confirm, setConfirm] = useState({ open: false, sub: null, nextActive: false })
  const [kycTarget, setKycTarget] = useState(null)

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

  const attachmentUrl = (attachment) => attachment?.url || ''

  const runToggle = async (sub, nextActive) => {
    setBusyId(sub._id)
    try {
      await setActive(sub._id, nextActive)
      toast.success(nextActive ? 'Sub-child account activated' : 'Sub-child account deactivated')
      setConfirm({ open: false, sub: null, nextActive: false })
      if (!nextActive && detailId && String(detailId) === String(sub._id)) {
        setDetailId(null)
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      throw err
    } finally {
      setBusyId(null)
    }
  }

  const requestToggle = (sub, nextActive) => {
    if (!nextActive) {
      setConfirm({ open: true, sub, nextActive })
      return
    }
    runToggle(sub, nextActive)
  }

  const handleApproveKyc = async () => {
    if (!kycTarget) return
    setBusyId(kycTarget._id)
    try {
      await approveSubChildKyc(kycTarget._id)
      toast.success(`KYC approved for ${kycTarget.name}`)
      refresh()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setBusyId(null)
      setKycTarget(null)
    }
  }

  const filtered = subChildren
  const selectedCount = selectedIds.size
  const allSelected = useMemo(() => {
    if (filtered.length === 0) return false
    return filtered.every((s) => selectedIds.has(s._id))
  }, [filtered, selectedIds])

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const shouldDeselect = filtered.length > 0 && filtered.every((s) => next.has(s._id))
      if (shouldDeselect) filtered.forEach((s) => next.delete(s._id))
      else filtered.forEach((s) => next.add(s._id))
      return next
    })
  }

  const openNotify = () => {
    if (selectedIds.size === 0) {
      toast.error('Select at least one sub-child agent')
      return
    }
    setNotifyOpen(true)
  }

  const sendNotify = async () => {
    if (selectedIds.size === 0) {
      toast.error('Select at least one sub-child agent')
      return
    }
    if (!notifyForm.subject.trim() || !notifyForm.message.trim()) {
      toast.error('Subject and message are required')
      return
    }

    setNotifyBusy(true)
    try {
      const form = new FormData()
      form.append('users', JSON.stringify(Array.from(selectedIds)))
      form.append('customers', JSON.stringify([]))
      form.append('subject', notifyForm.subject)
      form.append('message', notifyForm.message)
      notifyForm.attachments.forEach((file) => form.append('attachments', file))

      const { data } = await sendNotification(form)
      if (data.success) {
        toast.success(`Notification queued for ${selectedIds.size} sub-child agents`)
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
        // Only show notifications sent to sub-child agents (User receivers)
        setHistory(
          notifications.filter(
            (n) =>
              Array.isArray(n.recipients) &&
              n.recipients.some((r) => r.receiverType === 'User' && r?.receiver?.role === 'sub_child_agent')
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
          <h1 className="text-2xl font-bold text-gray-900">Manage sub-children</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sub-child agencies registered with your invitation codes. Review their profile, then activate or
            deactivate access as needed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openHistory}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            <History className="h-4 w-4" />
            History
          </button>
          <button
            type="button"
            onClick={openNotify}
            disabled={loading || selectedCount === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
          >
            <Bell className="h-4 w-4" />
            Notify
          </button>
          <button
            type="button"
            onClick={() => refresh()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {loading && subChildren.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="animate-pulse space-y-3 p-6">
            <div className="h-4 w-1/3 rounded bg-gray-200" />
            <div className="h-10 rounded bg-gray-100" />
            <div className="h-10 rounded bg-gray-100" />
            <div className="h-10 rounded bg-gray-100" />
          </div>
        </div>
      ) : null}

      {!loading && subChildren.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 py-16 text-center">
          <Users className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">No sub-child agencies yet</p>
          <p className="mt-1 max-w-md text-xs text-gray-400">
            Generate a sub-child invitation code from your agency tools. When agents register with that code, they
            will appear in this list.
          </p>
        </div>
      ) : null}

      {subChildren.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/80">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900"
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded border ${
                          allSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 bg-white text-transparent'
                        }`}
                      >
                        <Check className="h-3 w-3" strokeWidth={4} />
                      </span>
                      Select
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Phone</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">KYC</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subChildren.map((sub) => {
                  const isSelected = selectedIds.has(sub._id)
                  return (
                  <tr key={sub._id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSelect(sub._id)}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs transition-colors ${
                          isSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-200 bg-white text-transparent hover:border-primary-400'
                        }`}
                        title={isSelected ? 'Selected' : 'Select'}
                      >
                        <Check className="h-3 w-3" strokeWidth={4} />
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{sub.name}</td>
                    <td className="px-4 py-3 text-gray-600">{sub.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{sub.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        sub.kyc?.status === 'approved' ? 'bg-green-50 text-green-700' :
                        sub.kyc?.status === 'rejected' ? 'bg-red-50 text-red-700' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {sub.kyc?.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sub.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <UserCheck className="h-3.5 w-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
                          <UserX className="h-3.5 w-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailId(sub._id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                        {sub.kyc?.status === 'pending' && (
                          <button
                            type="button"
                            disabled={busyId === sub._id}
                            onClick={() => setKycTarget(sub)}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          >
                            Approve KYC
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busyId === sub._id}
                          onClick={() => requestToggle(sub, !sub.isActive)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                            sub.isActive
                              ? 'border border-red-100 text-red-700 hover:bg-red-50'
                              : 'border border-primary-200 text-primary-700 hover:bg-primary-50'
                          }`}
                        >
                          {sub.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <Modal isOpen={notifyOpen} onClose={() => !notifyBusy && setNotifyOpen(false)} title="Notify sub-children" size="lg">
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Sending to <span className="font-semibold">{selectedCount}</span> selected sub-child agent{selectedCount === 1 ? '' : 's'}.
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Subject</label>
            <input
              type="text"
              value={notifyForm.subject}
              onChange={(e) => setNotifyForm((p) => ({ ...p, subject: e.target.value }))}
              placeholder="E.g. New policy update"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Message</label>
            <textarea
              rows={7}
              value={notifyForm.message}
              onChange={(e) => setNotifyForm((p) => ({ ...p, message: e.target.value }))}
              placeholder="Write a clear message for your sub-child agents…"
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
                            .filter((a) => a?.filename && (a?.url || a?.path))
                            .map((a) => (
                              <a
                                key={`${a.filename}-${a.url || a.path}`}
                                href={attachmentUrl(a)}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full bg-gray-50 px-2 py-0.5 font-semibold text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-100"
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

      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Email preview"
        size="xl"
      >
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
                          .filter((a) => a?.filename && (a?.url || a?.path))
                          .map((a) => (
                            <a
                              key={`${a.filename}-${a.url || a.path}`}
                              href={attachmentUrl(a)}
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

      <SubChildDetailModal
        isOpen={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        subId={detailId}
        fetchOne={fetchOne}
        busyId={busyId}
        onToggleActive={async (sub, next) => {
          if (!next) {
            setConfirm({ open: true, sub, nextActive: false })
            return
          }
          await runToggle(sub, true)
        }}
      />

      <ConfirmDialog
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false, sub: null, nextActive: false })}
        onConfirm={() => confirm.sub && runToggle(confirm.sub, confirm.nextActive)}
        title="Deactivate sub-child?"
        message={`${confirm.sub?.name || 'This agent'} will not be able to sign in until the account is activated again.`}
        confirmText="Deactivate"
        cancelText="Cancel"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!kycTarget}
        onClose={() => setKycTarget(null)}
        onConfirm={handleApproveKyc}
        title="Approve KYC"
        message={`Approve KYC for "${kycTarget?.name}"? They will gain full access to the platform.`}
        confirmText="Approve"
        cancelText="Cancel"
        variant="primary"
      />
    </div>
  )
}
