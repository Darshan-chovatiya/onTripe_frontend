import { useState } from 'react'
import { Plus, RefreshCw, Store, Phone, Mail, MapPin, Edit2, Trash2 } from 'lucide-react'
import { useVendors } from '@/travelAgency/parentAgency/hooks/useVendors.js'
import VendorFormModal from '@/travelAgency/parentAgency/components/VendorFormModal.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import Button from '@/shared/components/Button.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

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

export default function Vendors() {
  const { vendors, loading, error, fetchVendors, create, update, remove } = useVendors()
  const { toast } = useToast()

  const [formModal, setFormModal] = useState({ open: false, data: null })
  const [confirmDelete, setConfirmDelete] = useState({ open: false, vendor: null })
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

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
      v.city?.toLowerCase().includes(search.toLowerCase())
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
          placeholder="Search by name, contact or city…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="input-field sm:w-48"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="all">All</option>
          {ALL_TYPES.map(t => (
            <option key={t} value={t}>{t.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

      {/* Loading skeleton */}
      {loading && vendors.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
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

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(v => (
            <div key={v._id} className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-gray-900 text-base leading-tight">{v.name}</h3>
                  {v.contactPerson && <p className="text-xs text-gray-500 mt-0.5">{v.contactPerson}</p>}
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium flex-shrink-0 ${TYPE_COLORS[v.type] || TYPE_COLORS.other}`}>
                  {v.type?.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-gray-500">
                {v.email && <p className="flex items-center gap-1.5"><Mail size={12} />{v.email}</p>}
                {v.phone && <p className="flex items-center gap-1.5"><Phone size={12} />{v.phone}</p>}
                {(v.city || v.country) && (
                  <p className="flex items-center gap-1.5">
                    <MapPin size={12} />{[v.city, v.state, v.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>

              {v.docs?.length > 0 && (
                <p className="text-xs text-gray-400">{v.docs.length} document(s)</p>
              )}

              <div className="flex gap-2 pt-1 border-t border-gray-100">
                <button
                  onClick={() => setFormModal({ open: true, data: v })}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => setConfirmDelete({ open: true, vendor: v })}
                  className="ml-auto flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13} /> Deactivate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <VendorFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, data: null })}
        onSubmit={handleSubmit}
        initialData={formModal.data}
        loading={submitting}
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
