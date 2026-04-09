import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, RefreshCw, Users, UserCheck, UserX, Bell, Send, History, Check, Search, Download } from 'lucide-react'
import { useManageSubChildren } from '@/travelAgency/childAgency/hooks/useManageSubChildren.js'
import SubChildDetailModal from '@/travelAgency/childAgency/components/SubChildDetailModal.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { approveSubChildKyc, sendNotification, listPendingRequests, approveParentRequest, rejectParentRequest, listSubChildren } from '@/travelAgency/childAgency/services/childAgencyApi.js'
import Modal from '@/shared/components/Modal.jsx'
import PendingRequestsSection from '@/travelAgency/shared/components/PendingRequestsSection.jsx'
import Pagination from '@/admin/components/Pagination.jsx'
import { exportToExcel } from '@/admin/utils/exportExcel.js'

const PAGE_SIZE = 10

export default function ManageSubChildren() {
  const navigate = useNavigate()
  const { subChildren, loading, error, fetchSubChildren, fetchOne, setActive, pagination } = useManageSubChildren()
  const { toast } = useToast()
  const [detailId, setDetailId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [confirm, setConfirm] = useState({ open: false, sub: null, nextActive: false })
  const [kycTarget, setKycTarget] = useState(null)

  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [notifyBusy, setNotifyBusy] = useState(false)
  const [notifyForm, setNotifyForm] = useState({ subject: '', message: '', attachments: [] })
  const [search, setSearch] = useState('')
  const [kycFilter, setKycFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [exportLoading, setExportLoading] = useState(false)

  const attachmentUrl = (attachment) => attachment?.url || ''

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, kycFilter])

  // Fetch sub-children with pagination
  useEffect(() => {
    fetchSubChildren({
      page,
      limit: PAGE_SIZE,
      search: search.trim(),
      kycStatus: kycFilter === 'all' ? undefined : kycFilter
    })
  }, [fetchSubChildren, page, search, kycFilter])

  const refresh = () => {
    fetchSubChildren({
      page,
      limit: PAGE_SIZE,
      search: search.trim(),
      kycStatus: kycFilter === 'all' ? undefined : kycFilter
    })
  }

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

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const { data } = await listSubChildren({
        page: 1,
        limit: 10000,
        search: search.trim(),
        kycStatus: kycFilter === 'all' ? undefined : kycFilter
      })
      const rows = data?.data?.subChildren || []
      await exportToExcel(
        rows.map((s, idx) => ({
          '#': idx + 1,
          'Name': s.name || '',
          'Email': s.email || '',
          'Phone': s.phone || '',
          'KYC Status': s.kyc?.status || 'pending',
          'Status': s.isActive ? 'Active' : 'Inactive',
          'Link Status': s.linkStatus || 'approved'
        })),
        'sub-children',
        'Sub-Child Agencies'
      )
    } catch {
      toast.error('Export failed')
    } finally {
      setExportLoading(false)
    }
  }

  console.log('Sub-children pagination:', pagination)

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

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage sub-children</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sub-child agencies registered with your invitation codes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exportLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {exportLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => navigate('/agency/manage-downstream/notification-history')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
        </div>
      </header>

      <PendingRequestsSection
        listPendingRequests={listPendingRequests}
        approveRequest={approveParentRequest}
        rejectRequest={rejectParentRequest}
        label="sub-child agency"
        onAction={refresh}
      />

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
          {/* Filters */}
          <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
              <input
                className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 sm:w-48"
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value)}
            >
              <option value="all">All KYC statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

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
                  <tr key={sub._id} className={`hover:bg-gray-50/80 ${sub.linkStatus === 'rejected' ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSelect(sub._id)}
                        disabled={sub.linkStatus === 'rejected'}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs transition-colors ${
                          isSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-200 bg-white text-transparent hover:border-primary-400'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                        title={isSelected ? 'Selected' : 'Select'}
                      >
                        <Check className="h-3 w-3" strokeWidth={4} />
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {sub.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{sub.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{sub.phone || '—'}</td>
                    <td className="px-4 py-3">
                      {sub.linkStatus === 'rejected' ? (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                          Not verified
                        </span>
                      ) : (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          sub.kyc?.status === 'approved' ? 'bg-green-50 text-green-700' :
                          sub.kyc?.status === 'rejected' ? 'bg-red-50 text-red-700' :
                          'bg-yellow-50 text-yellow-700'
                        }`}>
                          {sub.kyc?.status || 'pending'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sub.linkStatus === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500">
                          <UserX className="h-3.5 w-3.5" /> Rejected
                        </span>
                      ) : sub.isActive ? (
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
                      {sub.linkStatus === 'rejected' ? (
                        <button
                          type="button"
                          onClick={() => setDetailId(sub._id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      ) : (
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
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.totalCount}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
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
