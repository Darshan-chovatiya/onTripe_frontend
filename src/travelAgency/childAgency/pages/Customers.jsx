import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  UserCircle, Mail, Phone, Search, Bell, Send, History,
  Check, Download, RefreshCw, Users, Edit2, Eye, X, Plus, Upload,
} from 'lucide-react'
import ExcelImportModal from '@/travelAgency/shared/components/ExcelImportModal.jsx'
import {
  listCustomers, updateAgencyCustomer, toggleAgencyCustomerActive,
  sendNotification, getSentNotifications, createAgencyCustomer, importAgencyCustomers
} from '@/travelAgency/childAgency/services/childAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Modal from '@/shared/components/Modal.jsx'
import Pagination from '@/admin/components/Pagination.jsx'
import { exportToExcel } from '@/admin/utils/exportExcel.js'
import CustomerDetailModal from '@/travelAgency/shared/components/CustomerDetailModal.jsx'

const PAGE_SIZE = 10
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const getImgUrl = (p) => p ? (p.startsWith('http') ? p : `${API_BASE}/${String(p).replace(/^\//, '')}`) : null

export default function Customers() {
  const { toast } = useToast()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })
  const [exportLoading, setExportLoading] = useState(false)

  const [selectedIds, setSelectedIds] = useState(() => new Set())

  const [addOpen, setAddOpen] = useState(false)
  const [addBusy, setAddBusy] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', notes: '' })

  const [importFile, setImportFile] = useState(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importBusy, setImportBusy] = useState(false)

  const [viewTarget, setViewTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', notes: '' })
  const [editBusy, setEditBusy] = useState(false)
  const [toggleBusyId, setToggleBusyId] = useState(null)

  const [notifyOpen, setNotifyOpen] = useState(false)
  const [notifyBusy, setNotifyBusy] = useState(false)
  const [notifyForm, setNotifyForm] = useState({ subject: '', message: '', attachments: [] })

  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [history, setHistory] = useState([])

  const handleAddCustomer = async () => {
    if (!addForm.name.trim() || !addForm.phone.trim()) {
      toast.error('Name and phone are required'); return
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(addForm.phone.trim())) {
      toast.error('Please enter a valid 10-digit phone number'); return
    }
    setAddBusy(true)
    try {
      await createAgencyCustomer(addForm)
      toast.success('Customer added successfully')
      setAddOpen(false)
      setAddForm({ name: '', email: '', phone: '', notes: '' })
      fetchCustomers()
    } catch (err) { toast.error(getApiErrorMessage(err)) }
    finally { setAddBusy(false) }
  }

  const handleImportExcelSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFile(file)
    setImportModalOpen(true)
    e.target.value = ''
  }

  const handleFinalImport = async (customers) => {
    setImportBusy(true)
    try {
      const res = await importAgencyCustomers(customers)
      toast.success(`Import complete: ${res.data.data.imported} imported, ${res.data.data.skipped} skipped`)
      fetchCustomers()
    } catch (err) {
      toast.error('Excel import failed: ' + err.message)
    } finally {
      setImportBusy(false)
    }
  }

  useEffect(() => { setPage(1) }, [q])

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listCustomers({ page, limit: PAGE_SIZE, search: q.trim() })
      const customers = res.data?.data?.customers ?? []
      const pg = res.data?.data?.pagination
      setPagination(pg ?? { page, totalPages: Math.ceil(customers.length / PAGE_SIZE), totalCount: customers.length })
      setRows(customers.map(c => ({
        id: c.customer?._id || c._id,
        agencyCustomerId: c._id,
        name: c.name || c.customer?.name || '—',
        phone: c.phone || c.customer?.phone || '—',
        email: c.email || c.customer?.email || '—',
        profileImage: c.customer?.profileImage || c.profileImage || null,
        notes: c.notes || '',
        isActive: c.isActive !== false,
        createdAt: c.createdAt || null,
        updatedAt: c.updatedAt || null,
        lastActivity: c.updatedAt || c.createdAt,
      })))
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, q])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const allSelected = useMemo(() => rows.length > 0 && rows.every(r => selectedIds.has(r.id)), [rows, selectedIds])

  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const toggleSelectAll = () => setSelectedIds(prev => {
    const next = new Set(prev)
    const deselect = rows.every(r => next.has(r.id))
    rows.forEach(r => deselect ? next.delete(r.id) : next.add(r.id))
    return next
  })

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const res = await listCustomers({ page: 1, limit: 10000, search: q.trim() })
      const customers = res.data?.data?.customers ?? []
      await exportToExcel(
        customers.map((c, i) => ({
          '#': i + 1,
          Name: c.name || c.customer?.name || '',
          Phone: c.phone || c.customer?.phone || '',
          Email: c.email || c.customer?.email || '',
          Notes: c.notes || '',
          Status: c.isActive !== false ? 'Active' : 'Inactive',
          Created: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '',
        })),
        'customers', 'Customers'
      )
    } catch { toast.error('Export failed') }
    finally { setExportLoading(false) }
  }

  const openEdit = (row) => {
    setEditTarget(row)
    setEditForm({ name: row.name, email: row.email, notes: row.notes })
  }

  const saveEdit = async () => {
    if (!editTarget) return
    setEditBusy(true)
    try {
      await updateAgencyCustomer(editTarget.agencyCustomerId, {
        name: editForm.name, email: editForm.email, notes: editForm.notes,
      })
      setRows(prev => prev.map(r => r.agencyCustomerId === editTarget.agencyCustomerId
        ? { ...r, name: editForm.name, email: editForm.email, notes: editForm.notes } : r))
      toast.success('Customer updated')
      setEditTarget(null)
    } catch (err) { toast.error(getApiErrorMessage(err)) }
    finally { setEditBusy(false) }
  }

  const handleToggleActive = async (row) => {
    setToggleBusyId(row.agencyCustomerId)
    try {
      await toggleAgencyCustomerActive(row.agencyCustomerId)
      setRows(prev => prev.map(r => r.agencyCustomerId === row.agencyCustomerId ? { ...r, isActive: !r.isActive } : r))
      toast.success(row.isActive ? 'Customer deactivated' : 'Customer activated')
    } catch (err) { toast.error(getApiErrorMessage(err)) }
    finally { setToggleBusyId(null) }
  }

  const openNotify = () => {
    if (selectedIds.size === 0) { toast.error('Select at least one customer'); return }
    setNotifyOpen(true)
  }

  const sendNotify = async () => {
    if (!notifyForm.subject.trim() || !notifyForm.message.trim()) {
      toast.error('Subject and message are required'); return
    }
    setNotifyBusy(true)
    try {
      const form = new FormData()
      form.append('users', JSON.stringify([]))
      form.append('customers', JSON.stringify(Array.from(selectedIds)))
      form.append('subject', notifyForm.subject)
      form.append('message', notifyForm.message)
      notifyForm.attachments.forEach(f => form.append('attachments', f))
      const { data } = await sendNotification(form)
      if (data.success) {
        toast.success(`Notification sent to ${selectedIds.size} customer${selectedIds.size === 1 ? '' : 's'}`)
        setNotifyOpen(false)
        setNotifyForm({ subject: '', message: '', attachments: [] })
        setSelectedIds(new Set())
      }
    } catch (err) { toast.error(getApiErrorMessage(err) || 'Failed to send') }
    finally { setNotifyBusy(false) }
  }

  const openHistory = async () => {
    setHistoryOpen(true)
    setHistoryLoading(true)
    try {
      const { data } = await getSentNotifications()
      if (data.success) {
        setHistory((data.data.notifications || []).filter(n =>
          Array.isArray(n.recipients) && n.recipients.some(r => r.receiverType === 'Customer')
        ))
      }
    } catch { toast.error('Failed to load history') }
    finally { setHistoryLoading(false) }
  }

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">Travelers and leads linked to your agency.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
            {importBusy ? <RefreshCw size={15} className="animate-spin" /> : <Upload size={15} />}
            Import
            <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleImportExcelSelect} disabled={importBusy} />
          </label>

          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            <Plus size={15} />
            Add Customer
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={rows.length === 0 || exportLoading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {exportLoading ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
            Export
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
            disabled={selectedIds.size === 0}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
          >
            <Bell size={15} />
            Notify
          </button>
        </div>
      </div>

      {/* Card */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {/* Search */}
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
            <input
              className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
              placeholder="Search by name, phone or email…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
        </div>

        {/* Loading */}
        {loading && rows.length === 0 ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-100 p-4">
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
        {!loading && rows.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <Users className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-gray-900">
              {q ? 'No customers match your search' : 'No customers yet'}
            </p>
            {!q && <p className="mt-1 text-sm text-gray-500">Customers will appear here once bookings are created.</p>}
          </div>
        ) : null}

        {/* Table */}
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <button type="button" onClick={toggleSelectAll}
                      className="flex h-4.5 w-4.5 items-center justify-center rounded border transition-colors">
                      <span className={`flex h-5 w-5 items-center justify-center rounded border ${allSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 bg-white text-transparent'}`}>
                        <Check size={11} strokeWidth={4} />
                      </span>
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Customer</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Contact</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Last Activity</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(c => {
                  const initials = (c.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                  const imgUrl = getImgUrl(c.profileImage)
                  return (
                    <tr key={c.id} className="group border-b border-gray-50 transition-all last:border-0 hover:bg-gray-50/80">
                      <td className="px-4 py-3.5 align-middle">
                        <button type="button" onClick={() => toggleSelect(c.id)}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${selectedIds.has(c.id) ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-200 bg-white text-transparent hover:border-primary-400'}`}>
                          <Check size={13} strokeWidth={4} />
                        </button>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-[11px] font-bold text-white shadow-sm">
                            {imgUrl ? <img src={imgUrl} alt={c.name} className="h-full w-full object-cover" /> : initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">{c.name}</p>
                            {c.notes && <p className="mt-0.5 truncate text-[11px] text-gray-400">{c.notes}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <p className="flex items-center gap-1.5 text-[12px] text-gray-700"><Phone size={11} className="text-gray-400" />{c.phone}</p>
                        {c.email && c.email !== '—' && (
                          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-400"><Mail size={11} className="text-gray-400" />{c.email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${c.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-[12px] text-gray-400">
                        {c.lastActivity ? new Date(c.lastActivity).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-right">
                        <div className="inline-flex items-center gap-1">
                          <button type="button" onClick={() => setViewTarget(c)} title="View"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 shadow-sm transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600">
                            <Eye size={13} />
                          </button>
                          <button type="button" onClick={() => openEdit(c)} title="Edit"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 shadow-sm transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600">
                            <Edit2 size={13} />
                          </button>
                          <button type="button" onClick={() => handleToggleActive(c)} disabled={toggleBusyId === c.agencyCustomerId}
                            className={`flex h-8 items-center justify-center rounded-lg border px-2.5 text-[11px] font-bold shadow-sm transition disabled:opacity-50 ${c.isActive ? 'border-red-100 bg-white text-red-500 hover:bg-red-50' : 'border-emerald-100 bg-white text-emerald-600 hover:bg-emerald-50'}`}>
                            {toggleBusyId === c.agencyCustomerId ? '…' : c.isActive ? 'Deactivate' : 'Activate'}
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

        {rows.length > 0 ? (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.totalCount}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        ) : null}
      </div>

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={() => !addBusy && setAddOpen(false)} title="Add new customer" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
                value={addForm.name}
                onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone <span className="text-red-500">*</span></label>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
                value={addForm.phone}
                onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="Phone number"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
                value={addForm.email}
                onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))}
                placeholder="Email address (optional)"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
              value={addForm.notes}
              onChange={e => setAddForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Any internal notes…"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAddOpen(false)} disabled={addBusy} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">Cancel</button>
            <button type="button" onClick={handleAddCustomer} disabled={addBusy} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
              {addBusy ? 'Adding…' : 'Add Customer'}
            </button>
          </div>
        </div>
      </Modal>

      <ExcelImportModal 
        isOpen={importModalOpen} 
        onClose={() => setImportModalOpen(false)} 
        onImport={handleFinalImport} 
        file={importFile} 
      />

      {/* View Modal */}
      <CustomerDetailModal isOpen={!!viewTarget} onClose={() => setViewTarget(null)} customer={viewTarget} />

      {/* Edit Modal */}
      <Modal isOpen={!!editTarget} onClose={() => !editBusy && setEditTarget(null)} title="Edit customer" size="lg">
        {editTarget && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              Editing: <span className="font-semibold">{editTarget.name}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
                  value={editForm.name}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
                  value={editForm.email}
                  onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
                value={editForm.notes}
                onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditTarget(null)} disabled={editBusy} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">Cancel</button>
              <button type="button" onClick={saveEdit} disabled={editBusy} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
                {editBusy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Notify Modal */}
      <Modal isOpen={notifyOpen} onClose={() => !notifyBusy && setNotifyOpen(false)} title="Send notification" size="lg">
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Sending to <span className="font-semibold">{selectedIds.size}</span> customer{selectedIds.size === 1 ? '' : 's'}.
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Subject</label>
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
              value={notifyForm.subject}
              onChange={e => setNotifyForm(p => ({ ...p, subject: e.target.value }))}
              placeholder="E.g. Trip update"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Message</label>
            <textarea
              rows={6}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm leading-relaxed focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
              value={notifyForm.message}
              onChange={e => setNotifyForm(p => ({ ...p, message: e.target.value }))}
              placeholder="Write your message…"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Attachments (optional)</label>
            <input
              type="file" multiple accept="image/*,application/pdf"
              onChange={e => setNotifyForm(p => ({ ...p, attachments: Array.from(e.target.files || []) }))}
              className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-black"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setNotifyOpen(false)} disabled={notifyBusy} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">Cancel</button>
            <button type="button" onClick={sendNotify} disabled={notifyBusy} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
              <Send size={15} />
              {notifyBusy ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} title="Notification history" size="lg">
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
          {historyLoading ? (
            <div className="p-10 text-center text-sm text-gray-500">Loading…</div>
          ) : history.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">No notifications sent yet.</div>
          ) : history.map(item => (
            <div key={item._id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.subject}</p>
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">{item.message}</p>
                  <p className="mt-2 text-[11px] text-gray-600">
                    <span className="font-semibold">Sent to:</span>{' '}
                    {(item.recipients || []).map(r => r?.receiver?.name || r?.receiver?.email).filter(Boolean).slice(0, 4).join(', ')}
                    {(item.recipients || []).length > 4 ? '…' : ''}
                  </p>
                </div>
                <span className="text-[11px] text-gray-400 whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">{item.recipients?.length || 0} recipients</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">{(item.recipients || []).filter(r => r.status === 'sent').length} sent</span>
                {(item.recipients || []).some(r => r.status === 'failed') && (
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700">{(item.recipients || []).filter(r => r.status === 'failed').length} failed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
