import { useState } from 'react'
import { Plus, RefreshCw, Store, Eye, Edit2, Trash2 } from 'lucide-react'
import { useVendors } from '@/travelAgency/parentAgency/hooks/useVendors.js'
import VendorFormModal from '@/travelAgency/parentAgency/components/VendorFormModal.jsx'
import VendorDetailModal from '@/travelAgency/parentAgency/components/VendorDetailModal.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import Button from '@/shared/components/Button.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

const ALL_TYPES = ['hotel', 'transport', 'restaurant', 'activity_provider', 'guide', 'cruise', 'other']

const TYPE_COLORS = {
  hotel:             'bg-blue-50 text-blue-700',
  transport:         'bg-purple-50 text-purple-700',
  restaurant:        'bg-orange-50 text-orange-700',
  activity_provider: 'bg-green-50 text-green-700',
  guide:             'bg-yellow-50 text-yellow-700',
  cruise:            'bg-cyan-50 text-cyan-700',
  other:             'bg-gray-100 text-gray-600',
}

export default function Vendors() {
  const { vendors, loading, error, fetchVendors, create, update, remove } = useVendors()
  const { toast } = useToast()

  const [formModal, setFormModal]     = useState({ open: false, data: null })
  const [detailVendor, setDetailVendor] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, vendor: null })
  const [submitting, setSubmitting]   = useState(false)
  const [search, setSearch]           = useState('')
  const [typeFilter, setTypeFilter]   = useState('all')

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

  const filtered = vendors.filter(v => {
    const matchSearch = !search ||
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
      v.city?.toLowerCase().includes(search.toLowerCase()) ||
      v.email?.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || v.type === typeFilter
    return matchSearch && matchType
  })

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your service vendors</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchVendors} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" aria-label="Refresh">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <Button onClick={() => setFormModal({ open: true, data: null })}>
            <Plus size={16} className="mr-1 inline" /> Add Vendor
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          className="input-field flex-1"
          placeholder="Search by name, contact, email or city…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="input-field sm:w-48"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          {ALL_TYPES.map(t => (
            <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      {vendors.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-gray-500">Total: <span className="font-semibold text-gray-800">{vendors.length}</span></span>
          {ALL_TYPES.filter(t => vendors.some(v => v.type === t)).map(t => (
            <span key={t} className="text-gray-500 capitalize">
              {t.replace('_', ' ')}: <span className="font-semibold text-gray-800">{vendors.filter(v => v.type === t).length}</span>
            </span>
          ))}
        </div>
      )}

      {/* Error */}
      {error && <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

      {/* Loading skeleton */}
      {loading && vendors.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 animate-pulse flex gap-4">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0" />
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
          <Store className="h-14 w-14 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">
            {vendors.length === 0 ? 'No vendors yet' : 'No vendors match your search'}
          </h3>
          {vendors.length === 0 && (
            <>
              <p className="text-sm text-gray-400 mt-1 mb-5">Add your first vendor to get started.</p>
              <Button onClick={() => setFormModal({ open: true, data: null })}>
                <Plus size={16} className="mr-1 inline" /> Add Vendor
              </Button>
            </>
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
                  <th className="px-5 py-3 text-left">Vendor</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Contact</th>
                  <th className="px-5 py-3 text-left">Location</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(v => (
                  <tr key={v._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{v.name}</p>
                      {v.contactPerson && <p className="text-xs text-gray-400 mt-0.5">{v.contactPerson}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${TYPE_COLORS[v.type] || TYPE_COLORS.other}`}>
                        {v.type?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 space-y-0.5">
                      {v.email && <p className="text-xs text-gray-600">{v.email}</p>}
                      {v.phone && <p className="text-xs text-gray-400">{v.phone}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">
                      {[v.city, v.state, v.country].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setDetailVendor(v)}
                          className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => setFormModal({ open: true, data: v })}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ open: true, vendor: v })}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Deactivate"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
        onEdit={v => setFormModal({ open: true, data: v })}
        onDeactivate={v => setConfirmDelete({ open: true, vendor: v })}
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
