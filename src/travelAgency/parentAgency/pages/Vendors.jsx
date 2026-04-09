import { useEffect, useState } from 'react'
import { Plus, RefreshCw, Store, Eye, Edit2, Trash2, Search, Download } from 'lucide-react'
import { useVendors } from '@/travelAgency/parentAgency/hooks/useVendors.js'
import { listVendors } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import VendorFormModal from '@/travelAgency/parentAgency/components/VendorFormModal.jsx'
import VendorDetailModal from '@/travelAgency/parentAgency/components/VendorDetailModal.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import Button from '@/shared/components/Button.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import Pagination from '@/admin/components/Pagination.jsx'
import { exportToExcel } from '@/admin/utils/exportExcel.js'

const ALL_TYPES = ['hotel', 'transport', 'restaurant', 'activity_provider', 'guide', 'cruise', 'other']

const TYPE_COLORS = {
  hotel: 'bg-blue-50 text-blue-700',
  transport: 'bg-purple-50 text-purple-700',
  restaurant: 'bg-orange-50 text-orange-700',
  activity_provider: 'bg-green-50 text-green-700',
  guide: 'bg-yellow-50 text-yellow-700',
  cruise: 'bg-cyan-50 text-cyan-700',
  other: 'bg-gray-100 text-gray-600',
}

const PAGE_SIZE = 10

export default function Vendors() {
  const { vendors, loading, error, pagination, fetchVendors, create, update, remove } = useVendors()
  const { toast } = useToast()

  const [formModal, setFormModal] = useState({ open: false, data: null })
  const [detailVendor, setDetailVendor] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, vendor: null })
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [exportLoading, setExportLoading] = useState(false)

  const handleSubmit = async (payload) => {
    setSubmitting(true)
    try {
      if (formModal.data) {
        await update(formModal.data._id, payload)
        toast.success('Vendor updated')
      } else {
        await create(payload)
        toast.success('Vendor added')
      }
      setFormModal({ open: false, data: null })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      await remove(confirmDelete.vendor._id)
      toast.success('Vendor deactivated')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setConfirmDelete({ open: false, vendor: null })
    }
  }

  useEffect(() => {
    setPage(1)
  }, [search, typeFilter])

  useEffect(() => {
    fetchVendors({
      page,
      limit: PAGE_SIZE,
      search: search.trim(),
      type: typeFilter,
    })
  }, [fetchVendors, page, search, typeFilter])

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const { data } = await listVendors({
        page: 1,
        limit: 10000,
        search: search.trim(),
        type: typeFilter,
      })
      const rows = data?.data?.vendors || []
      await exportToExcel(
        rows.map((v, idx) => ({
          '#': idx + 1,
          Name: v.name || '',
          Type: (v.type || '').replace(/_/g, ' '),
          'Contact Person': v.contactPerson || '',
          Email: v.email || '',
          Phone: v.phone || '',
          City: v.city || '',
          State: v.state || '',
          Country: v.country || '',
          Address: v.address || '',
          Active: v.isActive ? 'Yes' : 'No',
        })),
        'vendors',
        'Vendors'
      )
    } catch {
      toast.error('Export failed')
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Vendors</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your service providers and contact details.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exportLoading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {exportLoading ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
            Export Excel
          </button>
          <Button onClick={() => setFormModal({ open: true, data: null })} className="inline-flex cursor-pointer items-center">
            <Plus size={16} className="mr-1 inline" /> Add Vendor
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
            <input
              className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
              placeholder="Search by name, contact, email or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 sm:w-56"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All types</option>
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {error ? <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        {loading && vendors.length === 0 ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
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

        {!loading && vendors.length === 0 && !error ? (
          <div className="px-4 py-14 text-center">
            <Store className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-gray-900">
              {search || typeFilter !== 'all' ? 'No vendors match your search' : 'No vendors yet'}
            </p>
            {search || typeFilter !== 'all' ? null : (
              <>
                <p className="mt-1 text-sm text-gray-500">Add your first vendor to get started.</p>
                <Button onClick={() => setFormModal({ open: true, data: null })} className="mt-4 cursor-pointer">
                  <Plus size={16} className="mr-1 inline" /> Add Vendor
                </Button>
              </>
            )}
          </div>
        ) : null}

        {vendors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Vendor</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Type</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Contact</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Location</th>
                  <th className="px-4 py-2.5 text-right align-middle text-xs font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vendors.map((v) => (
                  <tr key={v._id} className="transition-colors hover:bg-gray-50/80">
                    <td className="px-4 py-2.5 align-middle">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{v.name}</p>
                        {v.contactPerson ? <p className="mt-0.5 truncate text-xs text-gray-500">{v.contactPerson}</p> : null}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${TYPE_COLORS[v.type] || TYPE_COLORS.other}`}>
                        {v.type?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      {v.email ? <p className="text-xs text-gray-700">{v.email}</p> : <p className="text-xs text-gray-400">-</p>}
                      {v.phone ? <p className="mt-0.5 text-xs text-gray-500">{v.phone}</p> : null}
                    </td>
                    <td className="px-4 py-2.5 align-middle text-xs text-gray-600">{[v.city, v.state, v.country].filter(Boolean).join(', ') || '-'}</td>
                    <td className="px-4 py-2.5 align-middle text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setDetailVendor(v)}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                          title="View"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => setFormModal({ open: true, data: v })}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ open: true, vendor: v })}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                          title="Deactivate"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {vendors.length > 0 ? (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.totalCount}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        ) : null}
      </div>

      <VendorFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, data: null })}
        onSubmit={handleSubmit}
        initialData={formModal.data}
        loading={submitting}
      />

      <VendorDetailModal
        isOpen={!!detailVendor}
        onClose={() => setDetailVendor(null)}
        vendor={detailVendor}
        onEdit={(v) => setFormModal({ open: true, data: v })}
        onDeactivate={(v) => setConfirmDelete({ open: true, vendor: v })}
      />

      <ConfirmDialog
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, vendor: null })}
        onConfirm={handleDelete}
        title="Deactivate Vendor"
        message={`Are you sure you want to deactivate "${confirmDelete.vendor?.name}"?`}
        confirmText="Deactivate"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
