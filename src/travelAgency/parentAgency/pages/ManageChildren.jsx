import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  RefreshCw,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Mail,
  Phone,
  User,
  ShieldCheck,
  UserCheck,
  Bell,
  Send,
  History,
  Check,
} from 'lucide-react'
import {
  listChildAgencies,
  toggleChildAgentStatus,
  approveChildKyc,
  sendNotification,
  getSentNotifications,
  listPendingRequests,
  approveParentRequest,
  rejectParentRequest,
} from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import ChildAgentDetailModal from '@/travelAgency/parentAgency/components/ChildAgentDetailModal.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Modal from '@/shared/components/Modal.jsx'
import PendingRequestsSection from '@/travelAgency/shared/components/PendingRequestsSection.jsx'

const KYC_STYLES = {
  approved: 'bg-green-50 text-green-700',
  pending:  'bg-yellow-50 text-yellow-700',
  rejected: 'bg-red-50 text-red-700',
}

const KYC_ICONS = {
  approved: CheckCircle,
  pending:  Clock,
  rejected: XCircle,
}

export default function ManageChildren() {
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [kycFilter, setKycFilter] = useState('all')
  const [viewId, setViewId] = useState(null)
  const [toggleTarget, setToggleTarget] = useState(null)
  const [toggling, setToggling] = useState(false)
  const [kycTarget, setKycTarget] = useState(null)
  const { toast } = useToast()

  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [notifyBusy, setNotifyBusy] = useState(false)
  const [notifyForm, setNotifyForm] = useState({ subject: '', message: '', attachments: [] })
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [history, setHistory] = useState([])

  const fetchChildren = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listChildAgencies()
      setChildren(res.data?.data?.children || [])
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchChildren() }, [fetchChildren])

  const handleToggle = async () => {
    if (!toggleTarget) return
    setToggling(true)
    try {
      await toggleChildAgentStatus(toggleTarget._id)
      toast.success(toggleTarget.isActive ? `${toggleTarget.name} deactivated` : `${toggleTarget.name} activated`)
      await fetchChildren()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setToggling(false)
      setToggleTarget(null)
    }
  }

  const handleApproveKyc = async () => {
    if (!kycTarget) return
    try {
      await approveChildKyc(kycTarget._id)
      toast.success(`KYC approved for ${kycTarget.name}`)
      await fetchChildren()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setKycTarget(null)
    }
  }

  const filtered = children.filter(c => {
    const matchSearch = !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    const matchKyc = kycFilter === 'all' || c.kyc?.status === kycFilter
    return matchSearch && matchKyc
  })

  const selectedCount = selectedIds.size
  const allFilteredSelected = useMemo(() => {
    if (filtered.length === 0) return false
    return filtered.every((c) => selectedIds.has(c._id))
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
      const shouldDeselect = filtered.length > 0 && filtered.every((c) => next.has(c._id))
      if (shouldDeselect) filtered.forEach((c) => next.delete(c._id))
      else filtered.forEach((c) => next.add(c._id))
      return next
    })
  }

  const openNotify = () => {
    if (selectedIds.size === 0) {
      toast.error('Select at least one child agent')
      return
    }
    setNotifyOpen(true)
  }

  const sendNotify = async () => {
    if (selectedIds.size === 0) {
      toast.error('Select at least one child agent')
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
        toast.success(`Notification queued for ${selectedIds.size} child agents`)
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
        // Parent history: only notifications sent to direct child agents
        setHistory(
          notifications.filter((n) =>
            Array.isArray(n.recipients)
              ? n.recipients.some((r) => r?.receiverType === 'User' && r?.receiver?.role === 'child_agent')
              : false
          )
        )
      }
    } catch (err) {
      toast.error('Failed to load notification history')
    } finally {
      setHistoryLoading(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Child Agents</h1>
          <p className="text-sm text-gray-500 mt-0.5">Agents linked to your network</p>
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
            title={selectedCount === 0 ? 'Select child agents first' : 'Send notification'}
          >
            <Bell size={16} />
            Notify
          </button>
          <button onClick={fetchChildren} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" aria-label="Refresh">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Pending requests */}
      <PendingRequestsSection
        listPendingRequests={listPendingRequests}
        approveRequest={approveParentRequest}
        rejectRequest={rejectParentRequest}
        label="child agency"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          className="input-field flex-1"
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input-field sm:w-44" value={kycFilter} onChange={e => setKycFilter(e.target.value)}>
          <option value="all">All KYC Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Stats */}
      {children.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-gray-500">Total: <span className="font-semibold text-gray-800">{children.length}</span></span>
          <span className="text-gray-500">Approved: <span className="font-semibold text-gray-800">{children.filter(c => c.kyc?.status === 'approved').length}</span></span>
          <span className="text-gray-500">Pending: <span className="font-semibold text-gray-800">{children.filter(c => c.kyc?.status === 'pending').length}</span></span>
          <span className="text-gray-500">Rejected: <span className="font-semibold text-gray-800">{children.filter(c => c.kyc?.status === 'rejected').length}</span></span>
        </div>
      )}

      {/* Error */}
      {error && <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

      {/* Loading skeleton */}
      {loading && children.length === 0 && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 animate-pulse flex gap-4">
              <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-14 w-14 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">
            {children.length === 0 ? 'No child agents yet' : 'No agents match your search'}
          </h3>
          {children.length === 0 && (
            <p className="text-sm text-gray-400 mt-1">Share your agent code so child agents can link to you.</p>
          )}
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                  <th className="px-5 py-3 text-left">
                    <button
                      type="button"
                      onClick={toggleSelectAllFiltered}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
                      title={allFilteredSelected ? 'Deselect all in view' : 'Select all in view'}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded border ${
                          allFilteredSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 bg-white text-transparent'
                        }`}
                      >
                        <Check size={12} strokeWidth={4} />
                      </span>
                      Select
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left">Agent Name</th>
                  <th className="px-5 py-3 text-left">Contact Info</th>
                  <th className="px-5 py-3 text-left">KYC Status</th>
                  <th className="px-5 py-3 text-left">Account Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(child => {
                  const kycStatus = child.kyc?.status || 'pending'
                  const KycIcon = KYC_ICONS[kycStatus] || Clock
                  const isSelected = selectedIds.has(child._id)

                  return (
                    <tr key={child._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => toggleSelect(child._id)}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                            isSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-200 bg-white text-transparent hover:border-primary-400'
                          }`}
                          title={isSelected ? 'Selected' : 'Select'}
                        >
                          <Check size={14} strokeWidth={4} />
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{child.name}</p>
                            <p className="text-xs text-gray-400">Agent ID: {child._id.slice(-6).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="flex items-center gap-1.5 text-gray-700"><Mail size={12} className="text-gray-400" />{child.email || '—'}</p>
                        {child.phone && <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5"><Phone size={11} className="text-gray-400" />{child.phone}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${KYC_STYLES[kycStatus]}`}>
                          <KycIcon size={12} />
                          {kycStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => setToggleTarget(child)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all hover:ring-2 hover:ring-offset-1 ${
                            child.isActive 
                              ? 'bg-green-50 text-green-700 hover:ring-green-200' 
                              : 'bg-red-50 text-red-700 hover:ring-red-200'
                          }`}
                          title={child.isActive ? 'Click to Deactivate' : 'Click to Activate'}
                        >
                          <ShieldCheck size={12} />
                          {child.isActive ? 'Active' : 'Deactivated'}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-3">
                          <button 
                            onClick={() => setViewId(child._id)} 
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all" 
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          
                          {child.kyc?.status === 'pending' && (
                            <button
                              onClick={() => setKycTarget(child)}
                              className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all"
                              title="Approve KYC"
                            >
                              <UserCheck size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={notifyOpen} onClose={() => !notifyBusy && setNotifyOpen(false)} title="Send notification" size="lg">
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Sending to <span className="font-semibold">{selectedCount}</span> selected child agent{selectedCount === 1 ? '' : 's'}.
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
              placeholder="Write a clear message for your child agents…"
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
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.attachments
                            .filter((a) => a?.filename)
                            .map((a) =>
                              a?.url ? (
                                <a
                                  key={`${item._id}-${a.filename}`}
                                  href={a.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-primary-700 ring-1 ring-inset ring-primary-200 hover:bg-primary-50"
                                >
                                  {a.filename}
                                </a>
                              ) : (
                                <span key={`${item._id}-${a.filename}`} className="rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700 ring-1 ring-inset ring-gray-200">
                                  {a.filename}
                                </span>
                              )
                            )}
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
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Detail modal */}
      <ChildAgentDetailModal
        isOpen={!!viewId}
        onClose={() => setViewId(null)}
        childId={viewId}
      />

      {/* Toggle status confirm */}
      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggle}
        title={toggleTarget?.isActive ? 'Deactivate Child Agent' : 'Activate Child Agent'}
        message={
          toggleTarget?.isActive
            ? `Deactivating "${toggleTarget?.name}" will prevent them from signing in until their account is reactivated.`
            : `Activating "${toggleTarget?.name}" will allow them to sign in again.`
        }
        confirmText={toggleTarget?.isActive ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        variant={toggleTarget?.isActive ? 'danger' : 'primary'}
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

