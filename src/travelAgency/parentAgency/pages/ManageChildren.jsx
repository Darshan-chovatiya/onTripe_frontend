import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
  rejectChildKyc,
  sendNotification,
  listPendingRequests,
  approveParentRequest,
  rejectParentRequest,
  createChildAgent,
  updateChildAgent,
} from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import ChildAgentDetailModal from '@/travelAgency/parentAgency/components/ChildAgentDetailModal.jsx'
import ChildAgentFormModal from '@/travelAgency/parentAgency/components/ChildAgentFormModal.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Modal from '@/shared/components/Modal.jsx'
import PendingRequestsSection from '@/travelAgency/shared/components/PendingRequestsSection.jsx'
import Pagination from '@/admin/components/Pagination.jsx'
import { exportToExcel } from '@/admin/utils/exportExcel.js'
import { Plus, Pencil } from 'lucide-react'
import { filePublicUrl } from '@/travelAgency/shared/utils/bookingDetailHelpers.js'

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
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const getImgUrl = (p) => p ? (p.startsWith('http') ? p : `${API_BASE}/${String(p).replace(/^\//, '')}`) : null

export default function ManageChildren() {
  const navigate = useNavigate()
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

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState(null)
  
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectBusy, setRejectBusy] = useState(false)

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

  const handleRejectKyc = async () => {
    if (!rejectTarget || !rejectReason.trim()) return
    setRejectBusy(true)
    try {
      await rejectChildKyc(rejectTarget._id, rejectReason)
      toast.success(`KYC rejected for ${rejectTarget.name}`)
      await fetchChildren()
      setRejectTarget(null)
      setRejectReason('')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setRejectBusy(false)
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
          'KYC Remark': c.kyc?.rejectionReason || '',
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

  const handleSaveChildAgent = async (formData, id) => {
    try {
      if (id) {
        await updateChildAgent(id, formData)
        toast.success('Child agent updated successfully')
      } else {
        await createChildAgent(formData)
        toast.success('Child agent created successfully')
      }
      fetchChildren()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      throw err
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
            disabled={children.length === 0 || exportLoading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {exportLoading ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => navigate('/agency/manage-downstream/notification-history')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
          <button
            type="button"
            onClick={() => { setEditingAgent(null); setIsFormOpen(true) }}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
          >
            <Plus size={16} />
            Add Child Agency
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
              <thead>
                <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <button type="button" onClick={toggleSelectAllFiltered}
                      className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-700">
                      <span className={`flex h-4.5 w-4.5 items-center justify-center rounded border ${allFilteredSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 bg-white text-transparent'}`}>
                        <Check size={11} strokeWidth={4} />
                      </span>
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Agent</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Contact</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">KYC</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Remarks</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {children.map(child => {
                  const kycStatus = child.kyc?.status || 'pending'
                  const KycIcon = KYC_ICONS[kycStatus] || Clock
                  const isSelected = selectedIds.has(child._id)
                  const isRejected = child.linkStatus === 'rejected'

                  return (
                    <tr key={child._id} className="group transition-colors hover:bg-gray-50/50">
                      <td className="px-4 py-4">
                        <button type="button" onClick={() => toggleSelect(child._id)} disabled={isRejected}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${isSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-200 bg-white text-transparent hover:border-primary-400'} disabled:opacity-40`}>
                          <Check size={13} strokeWidth={4} />
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {child.agencyLogo ? (
                            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-gray-200">
                              <img src={filePublicUrl(child.agencyLogo)} alt={child.name} className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs">
                              {child.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">{child.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {child.agentCode && <span className="font-mono text-[10px] text-gray-400">{child.agentCode}</span>}
                              {child.createdByAdmin && (
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700 ring-1 ring-blue-200">
                                  Created by admin
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <p className="flex items-center gap-1.5 text-[12px] text-gray-700"><Mail size={11} className="text-gray-400" />{child.email || '—'}</p>
                        {child.phone && <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-400"><Phone size={11} className="text-gray-400" />{child.phone}</p>}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        {isRejected ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />Not verified
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${KYC_STYLES[kycStatus]}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                            {kycStatus}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        {kycStatus === 'rejected' && child.kyc?.rejectionReason ? (
                          <p className="max-w-[180px] truncate text-[11px] font-bold text-red-600" title={child.kyc.rejectionReason}>
                            {child.kyc.rejectionReason}
                          </p>
                        ) : (
                          <span className="text-[11px] text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        {isRejected ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />Rejected
                          </span>
                        ) : (
                          <button onClick={() => setToggleTarget(child)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all hover:ring-2 hover:ring-offset-1 ${child.isActive ? 'bg-emerald-50 text-emerald-700 hover:ring-emerald-200' : 'bg-red-50 text-red-700 hover:ring-red-200'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${child.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {child.isActive ? 'Active' : 'Deactivated'}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-right">
                        <div className="inline-flex items-center gap-1">
                          {kycStatus === 'pending' && (
                            <>
                              <button onClick={() => setKycTarget(child)} title="Approve KYC"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm transition hover:bg-emerald-100">
                                <CheckCircle size={13} />
                              </button>
                              <button onClick={() => setRejectTarget(child)} title="Reject KYC"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 shadow-sm transition hover:bg-red-100">
                                <XCircle size={13} />
                              </button>
                            </>
                          )}
                          <button onClick={() => setViewId(child._id)} title="View"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 shadow-sm transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600">
                            <Eye size={13} />
                          </button>
                          <button onClick={() => { setEditingAgent(child); setIsFormOpen(true) }} title="Edit"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600">
                            <Pencil size={13} />
                          </button>
                        </div>
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

      {/* Detail modal */}
      <ChildAgentDetailModal
        isOpen={!!viewId}
        onClose={() => setViewId(null)}
        childId={viewId}
        onEdit={(child) => {
          setEditingAgent(child)
          setIsFormOpen(true)
          setViewId(null)
        }}
      />

      <ChildAgentFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        agent={editingAgent}
        onSave={handleSaveChildAgent}
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

      <Modal isOpen={!!rejectTarget} onClose={() => !rejectBusy && setRejectTarget(null)} title="Reject KYC" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Provide a reason for rejecting the KYC for <span className="font-bold text-gray-900">{rejectTarget?.name}</span>.</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            placeholder="E.g. Aadhar card image is blurry or documents don't match."
            className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-400/5"
          />
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setRejectTarget(null)} disabled={rejectBusy}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleRejectKyc} disabled={rejectBusy || !rejectReason.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50">
              {rejectBusy && <RefreshCw size={14} className="animate-spin" />}
              Reject KYC
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

