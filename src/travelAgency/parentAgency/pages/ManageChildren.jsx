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
  Download,
  Search,
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
import Pagination from '@/admin/components/Pagination.jsx'
import { exportToExcel } from '@/admin/utils/exportExcel.js'

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

const PAGE_SIZE = 10

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
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })
  const [exportLoading, setExportLoading] = useState(false)

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
      const res = await listChildAgencies({
        page,
        limit: PAGE_SIZE,
        search: search.trim(),
        kycStatus: kycFilter === 'all' ? undefined : kycFilter,
      })
      const childrenData = res.data?.data?.children || []
      const paginationData = res.data?.data?.pagination || { page: 1, totalPages: 1, totalCount: childrenData.length }
      
      console.log('[ManageChildren] Pagination data:', paginationData)
      
      setChildren(childrenData)
      setPagination({
        page: paginationData.page || 1,
        totalPages: paginationData.totalPages || Math.ceil(childrenData.length / PAGE_SIZE),
        totalCount: paginationData.totalCount || childrenData.length,
      })
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, search, kycFilter])

  useEffect(() => { fetchChildren() }, [fetchChildren])

  useEffect(() => {
    setPage(1)
  }, [search, kycFilter])

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

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const res = await listChildAgencies({
        page: 1,
        limit: 10000,
        search: search.trim(),
        kycStatus: kycFilter === 'all' ? undefined : kycFilter,
      })
      const rows = res.data?.data?.children || []
      await exportToExcel(
        rows.map((c, idx) => ({
          '#': idx + 1,
          'Name': c.name || '',
          'Email': c.email || '',
          'Phone': c.phone || '',
          'KYC Status': c.kyc?.status || 'pending',
          'Account Status': c.isActive ? 'Active' : 'Deactivated',
          'Link Status': c.linkStatus || '',
        })),
        'child-agents',
        'Child Agents'
      )
    } catch {
      toast.error('Export failed')
    } finally {
      setExportLoading(false)
    }
  }

  const allFilteredSelected = useMemo(() => {
    if (children.length === 0) return false
    return children.every((c) => selectedIds.has(c._id))
  }, [children, selectedIds])

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
      const shouldDeselect = children.length > 0 && children.every((c) => next.has(c._id))
      if (shouldDeselect) children.forEach((c) => next.delete(c._id))
      else children.forEach((c) => next.add(c._id))
      return next
    })
  }

  const selectedCount = selectedIds.size

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
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Child Agents</h1>
          <p className="mt-1 text-sm text-gray-500">Agents linked to your network.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exportLoading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {exportLoading ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
            Export Excel
          </button>
          <button
            type="button"
            onClick={openHistory}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <History size={15} />
            History
          </button>
          <button
            type="button"
            onClick={openNotify}
            disabled={selectedCount === 0}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
            title={selectedCount === 0 ? 'Select child agents first' : 'Send notification'}
          >
            <Bell size={15} />
            Notify
          </button>

        </div>
      </div>

      {/* Pending requests */}
      <PendingRequestsSection
        listPendingRequests={listPendingRequests}
        approveRequest={approveParentRequest}
        rejectRequest={rejectParentRequest}
        label="child agency"
        onAction={fetchChildren}
      />

      {/* Card */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
            <input
              className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
              placeholder="Search by name, email or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 sm:w-44"
            value={kycFilter}
            onChange={e => setKycFilter(e.target.value)}
          >
            <option value="all">All KYC Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Error */}
        {error ? <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        {/* Loading skeleton */}
        {loading && children.length === 0 ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-100 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-gray-200" />
                    <div className="h-3 w-1/2 rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Empty */}
        {!loading && children.length === 0 && !error ? (
          <div className="px-4 py-14 text-center">
            <Users className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-gray-900">
              {search || kycFilter !== 'all' ? 'No agents match your search' : 'No child agents yet'}
            </p>
            {!search && kycFilter === 'all' && (
              <p className="mt-1 text-sm text-gray-500">Share your agent code so child agents can link to you.</p>
            )}
          </div>
        ) : null}

        {/* Table */}
        {children.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">
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
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Agent Name</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Contact Info</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">KYC Status</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Account Status</th>
                  <th className="px-4 py-2.5 text-right align-middle text-xs font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {children.map(child => {
                  const kycStatus = child.kyc?.status || 'pending'
                  const KycIcon = KYC_ICONS[kycStatus] || Clock
                  const isSelected = selectedIds.has(child._id)
                  const isRejected = child.linkStatus === 'rejected'

                  return (
                    <tr key={child._id} className={`transition-colors ${isRejected ? 'bg-red-50/40 hover:bg-red-50/60' : 'hover:bg-gray-50/80'}`}>
                      <td className="px-4 py-2.5 align-middle">
                        <button
                          type="button"
                          onClick={() => toggleSelect(child._id)}
                          disabled={isRejected}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                            isSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-200 bg-white text-transparent hover:border-primary-400'
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                          title={isSelected ? 'Selected' : 'Select'}
                        >
                          <Check size={14} strokeWidth={4} />
                        </button>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <User size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {child.name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-gray-500">Agent ID: {child._id.slice(-6).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 text-xs text-gray-700"><Mail size={12} className="text-gray-400" />{child.email || '—'}</p>
                          {child.phone && <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5"><Phone size={11} className="text-gray-400" />{child.phone}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        {isRejected ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                            Not verified
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${KYC_STYLES[kycStatus]}`}>
                            <KycIcon size={12} />
                            {kycStatus}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        {isRejected ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                            Rejected
                          </span>
                        ) : (
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
                        )}
                      </td>
                      <td className="px-4 py-2.5 align-middle text-right">
                        {isRejected ? (
                          <button 
                            onClick={() => setViewId(child._id)} 
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900" 
                            title="View Details"
                          >
                            <Eye size={12} />
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button 
                              onClick={() => setViewId(child._id)} 
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900" 
                              title="View Details"
                            >
                              <Eye size={12} />
                            </button>
                            {child.kyc?.status === 'pending' && (
                              <button
                                onClick={() => setKycTarget(child)}
                                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                                title="Approve KYC"
                              >
                                <UserCheck size={13} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {children.length > 0 ? (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.totalCount}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        ) : null}
      </div>

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

