import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Phone, Search, UserCircle, Bell, Send, History, Check, Download, RefreshCw, Plus, Upload } from 'lucide-react'
import { ROLES } from '@/shared/utils/constants.js'
import { useAgencyPermissions } from '@/travelAgency/agency/hooks/useAgencyPermissions.js'
import ChildCustomers from '@/travelAgency/childAgency/pages/Customers.jsx'
import {
  listCustomers as listChildCustomers,
  listBookings as listChildBookings,
} from '@/travelAgency/childAgency/services/childAgencyApi.js'
import {
  listCustomers as listParentCustomers,
  listBookings as listParentBookings,
  updateAgencyCustomer as updateParentAgencyCustomer,
  toggleAgencyCustomerActive as toggleParentAgencyCustomerActive,
  createAgencyCustomer as createParentAgencyCustomer,
  importAgencyCustomers as importParentAgencyCustomers
} from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Modal from '@/shared/components/Modal.jsx'
import ExcelJS from 'exceljs'
import {
  sendNotification as sendChildNotification,
  getSentNotifications as getChildSentNotifications,
  getNotificationPreview as getChildNotificationPreview,
} from '@/travelAgency/childAgency/services/childAgencyApi.js'
import {
  sendNotification as sendParentNotification,
  getSentNotifications as getParentSentNotifications,
  // getNotificationPreview as getParentNotificationPreview, // If implemented
} from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import {
  updateAgencyCustomer as updateChildAgencyCustomer,
  toggleAgencyCustomerActive as toggleChildAgencyCustomerActive,
  createAgencyCustomer as createChildAgencyCustomer,
  importAgencyCustomers as importChildAgencyCustomers
} from '@/travelAgency/childAgency/services/childAgencyApi.js'
import Pagination from '@/admin/components/Pagination.jsx'
import { exportToExcel } from '@/admin/utils/exportExcel.js'
import CustomerDetailModal from '@/travelAgency/shared/components/CustomerDetailModal.jsx'
import ExcelImportModal from '@/travelAgency/shared/components/ExcelImportModal.jsx'

const PAGE_SIZE = 10

export default function AgencyCustomers() {
  const navigate = useNavigate()
  const { role, can, P } = useAgencyPermissions()
  const { toast } = useToast()
  const toastRef = useRef(toast)

  if (role === ROLES.CHILD_AGENCY) return <ChildCustomers />
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, totalPages: 1, totalCount: 0 })
  const [exportLoading, setExportLoading] = useState(false)

  const [selectedIds, setSelectedIds] = useState(() => new Set())

  const [addOpen, setAddOpen] = useState(false)
  const [addBusy, setAddBusy] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', notes: '' })

  const [importFile, setImportFile] = useState(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importBusy, setImportBusy] = useState(false)

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

  const [editOpen, setEditOpen] = useState(false)
  const [editBusy, setEditBusy] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [toggleBusyId, setToggleBusyId] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [viewTarget, setViewTarget] = useState(null)

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

  const fileHref = (pathValue) =>
    pathValue
      ? `${publicBaseUrl}/${String(pathValue).replace(/^\/+/, '')}`
      : ''

  const selectedCount = selectedIds.size

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
      if (role === ROLES.CHILD_AGENCY) await createChildAgencyCustomer(addForm)
      else await createParentAgencyCustomer(addForm)

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
      const res = role === ROLES.CHILD_AGENCY 
        ? await importChildAgencyCustomers(customers)
        : await importParentAgencyCustomers(customers)

      toast.success(`Import complete: ${res.data.data.imported} imported, ${res.data.data.skipped} skipped`)
      fetchCustomers()
    } catch (err) {
      toast.error('Excel import failed: ' + err.message)
    } finally {
      setImportBusy(false)
    }
  }

  // Reset page when search changes
  useEffect(() => {
    setPage(1)
  }, [q])

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        search: q.trim()
      }
      
      const res =
        role === ROLES.CHILD_AGENCY
          ? await listChildCustomers(params)
          : await listParentCustomers(params)
      const customers = res.data?.data?.customers ?? []
      const paginationData = res.data?.data?.pagination
      
      if (paginationData) {
        setPagination(paginationData)
      } else {
        // Fallback if backend doesn't return pagination
        setPagination({
          page,
          limit: PAGE_SIZE,
          totalPages: Math.ceil(customers.length / PAGE_SIZE),
          totalCount: customers.length
        })
      }

      // Fetch all bookings to calculate trip counts
      const bookingsRes =
        role === ROLES.CHILD_AGENCY
          ? await listChildBookings({ page: 1, limit: 10000 })
          : await listParentBookings({ page: 1, limit: 10000 })
      const bookings = bookingsRes.data?.data?.bookings ?? []
      const bookingMapByAgencyCustomer = new Map()
      bookings.forEach((b) => {
        const agencyCustomerKey = b?.agencyCustomer?._id
          ? String(b.agencyCustomer._id)
          : b?.agencyCustomer
            ? String(b.agencyCustomer)
            : null
        if (!agencyCustomerKey) return
        const existing = bookingMapByAgencyCustomer.get(agencyCustomerKey) || []
        existing.push(b)
        bookingMapByAgencyCustomer.set(agencyCustomerKey, existing)
      })

      const normalizedRows = customers.map((item) => ({
        // Backend notification endpoint expects Customer `_id` (not AgencyCustomer `_id`)
        id: item.customer?._id || item._id,
        agencyCustomerId: item._id,
        name: item.name || item.customer?.name || '—',
        phone: item.phone || item.customer?.phone || '—',
        email: item.email || item.customer?.email || '—',
        notes: item.notes || '',
        dob: item.dob || null,
        gender: item.gender || '',
        nationality: item.nationality || '',
        address: item.address || '',
        aadharNumber: item.aadharNumber || '',
        passportNumber: item.passportNumber || '',
        docs: item.docs || {},
        tripsData: bookingMapByAgencyCustomer.get(String(item._id)) || [],
        trips: (bookingMapByAgencyCustomer.get(String(item._id)) || []).length,
        lastActivity: item.updatedAt || item.createdAt,
        isActive: item.isActive !== false,
        createdAt: item.createdAt || null,
        updatedAt: item.updatedAt || null,
      }))

      setRows(normalizedRows)
    } catch (err) {
      toastRef.current.error(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [role, page, q])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const allFilteredSelected = useMemo(() => {
    if (rows.length === 0) return false
    return rows.every((c) => selectedIds.has(c.id))
  }, [rows, selectedIds])

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
      const shouldDeselect = rows.length > 0 && rows.every((c) => next.has(c.id))
      if (shouldDeselect) rows.forEach((c) => next.delete(c.id))
      else rows.forEach((c) => next.add(c.id))
      return next
    })
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const params = {
        page: 1,
        limit: 10000,
        search: q.trim()
      }
      
      const res =
        role === ROLES.CHILD_AGENCY
          ? await listChildCustomers(params)
          : await listParentCustomers(params)
      const customers = res.data?.data?.customers ?? []
      
      await exportToExcel(
        customers.map((c, idx) => ({
          '#': idx + 1,
          'Name': c.name || c.customer?.name || '',
          'Phone': c.phone || c.customer?.phone || '',
          'Email': c.email || c.customer?.email || '',
          'Notes': c.notes || '',
          'Status': c.isActive !== false ? 'Active' : 'Inactive',
          'Created': c.createdAt ? new Date(c.createdAt).toLocaleString() : ''
        })),
        'customers',
        'Customers'
      )
    } catch {
      toast.error('Export failed')
    } finally {
      setExportLoading(false)
    }
  }

  console.log('Customers pagination:', pagination)

  const canManageCustomers = can(P.CUSTOMERS)

  const openEditCustomer = (row) => {
    if (!canManageCustomers) return
    setEditTarget(row)
    setEditForm({
      name: row.name || '',
      email: row.email || '',
      phone: row.phone || '',
      notes: row.notes || '',
    })
    setEditOpen(true)
  }

  const openViewCustomer = (row) => {
    setViewTarget(row)
    setViewOpen(true)
  }

  const openCustomerTripsPage = (row) => {
    navigate(`/agency/customers/${row.agencyCustomerId}/trips`)
  }

  const saveEditCustomer = async () => {
    if (!editTarget) return
    setEditBusy(true)
    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
        notes: editForm.notes,
      }

      if (role === ROLES.CHILD_AGENCY) {
        await updateChildAgencyCustomer(editTarget.agencyCustomerId, payload)
      } else if (role === ROLES.PARENT_AGENCY) {
        await updateParentAgencyCustomer(editTarget.agencyCustomerId, payload)
      }

      setRows((prev) =>
        prev.map((r) =>
          r.agencyCustomerId === editTarget.agencyCustomerId
            ? {
                ...r,
                name: editForm.name,
                email: editForm.email,
                notes: editForm.notes,
              }
            : r
        )
      )
      setViewTarget((prev) =>
        prev && prev.agencyCustomerId === editTarget.agencyCustomerId
          ? {
              ...prev,
              name: editForm.name,
              email: editForm.email,
              notes: editForm.notes,
            }
          : prev
      )
      toast.success('Customer updated successfully')
      setEditOpen(false)
      setEditTarget(null)
      setSelectedIds(new Set())
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Failed to update customer')
    } finally {
      setEditBusy(false)
    }
  }

  const toggleCustomerActive = async (row) => {
    if (!canManageCustomers) return
    setToggleBusyId(row.agencyCustomerId)
    try {
      if (role === ROLES.CHILD_AGENCY) {
        await toggleChildAgencyCustomerActive(row.agencyCustomerId)
      } else if (role === ROLES.PARENT_AGENCY) {
        await toggleParentAgencyCustomerActive(row.agencyCustomerId)
      }
      setRows((prev) =>
        prev.map((r) =>
          r.agencyCustomerId === row.agencyCustomerId
            ? {
                ...r,
                isActive: !r.isActive,
              }
            : r
        )
      )
      setViewTarget((prev) =>
        prev && prev.agencyCustomerId === row.agencyCustomerId
          ? {
              ...prev,
              isActive: !prev.isActive,
            }
          : prev
      )
      toast.success(row.isActive ? 'Customer deactivated' : 'Customer activated')
      setSelectedIds(new Set())
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Failed to update customer status')
    } finally {
      setToggleBusyId(null)
    }
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

      const res =
        role === ROLES.CHILD_AGENCY
          ? await sendChildNotification(form)
          : await sendParentNotification(form)
      
      const { data } = res
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
      const res =
        role === ROLES.CHILD_AGENCY
          ? await getChildSentNotifications()
          : await getParentSentNotifications()
      const { data } = res
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
      // Both APIs use the same global preview endpoint internally, so either works
      // but let's use the child one as a default previewer for now if parent doesn't have it
      const { data } = await getChildNotificationPreview(notificationId)
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
        <div className="flex flex-col w-full sm:w-auto sm:flex-row sm:items-center gap-2">
          {canManageCustomers && (
            <>
              <label className="w-full sm:w-auto inline-flex cursor-pointer justify-center items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                {importBusy ? <RefreshCw size={15} className="animate-spin" /> : <Upload size={15} />}
                Import
                <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleImportExcelSelect} disabled={importBusy} />
              </label>

              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="w-full sm:w-auto inline-flex justify-center cursor-pointer items-center gap-2 rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-all active:scale-[0.98]"
              >
                <Plus size={15} />
                Add Customer
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleExport}
            disabled={rows.length === 0 || exportLoading}
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {exportLoading ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
            Export
          </button>
          <button
            type="button"
            onClick={() => navigate('/agency/customers/notification-history')}
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <History size={16} />
            History
          </button>
          <button
            type="button"
            onClick={openNotify}
            disabled={selectedCount === 0}
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
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
                {canManageCustomers ? <th className="px-4 py-3 font-medium text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((c) => (
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
                  <td className="px-4 py-3 text-gray-800">
                    <button
                      type="button"
                      onClick={() => openCustomerTripsPage(c)}
                      className="inline-flex rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                    >
                      {c.trips}
                    </button>
                  </td>
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
                  {canManageCustomers ? (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openViewCustomer(c)}
                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditCustomer(c)}
                          disabled={editBusy}
                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCustomerActive(c)}
                          disabled={toggleBusyId === c.agencyCustomerId}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            c.isActive
                              ? 'border border-red-100 bg-white text-red-700 hover:bg-red-50'
                              : 'border border-primary-200 bg-white text-primary-700 hover:bg-primary-50'
                          } disabled:opacity-60`}
                        >
                          {toggleBusyId === c.agencyCustomerId
                            ? 'Please wait…'
                            : c.isActive
                              ? 'Deactivate'
                              : 'Activate'}
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">Loading customers…</p>
        ) : null}
        {!loading && rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">No customers match your search.</p>
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

      {/* Add customer */}
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
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <button type="button" onClick={() => setAddOpen(false)} disabled={addBusy} className="w-full sm:w-auto rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">Cancel</button>
            <button type="button" onClick={handleAddCustomer} disabled={addBusy} className="w-full sm:w-auto flex justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
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

      {/* View customer details */}
      <CustomerDetailModal isOpen={viewOpen} onClose={() => setViewOpen(false)} customer={viewTarget} />

      {/* Edit customer */}
      <Modal
        isOpen={editOpen}
        onClose={() => !editBusy && setEditOpen(false)}
        title="Edit customer"
        size="lg"
      >
        {!editTarget ? (
          <div className="p-6 text-sm text-gray-500">No customer selected.</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Editing: <span className="font-semibold">{editTarget.name}</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
                  disabled={editBusy}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
                  disabled={editBusy}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  value={editForm.phone}
                  readOnly
                  className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">Phone number cannot be edited by agents.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Notes</label>
                <input
                  type="text"
                  value={editForm.notes}
                  onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
                  disabled={editBusy}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                disabled={editBusy}
                className="w-full sm:w-auto rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditCustomer}
                disabled={editBusy}
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {editBusy ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </Modal>

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

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setNotifyOpen(false)}
              disabled={notifyBusy}
              className="w-full sm:w-auto rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={sendNotify}
              disabled={notifyBusy}
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
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
