import { useState } from 'react'
import { Plus, RefreshCw, PackageOpen } from 'lucide-react'
import { usePackages } from '@/travelAgency/parentAgency/hooks/usePackages.js'
import PackageCard from '@/travelAgency/parentAgency/components/PackageCard.jsx'
import PackageFormModal from '@/travelAgency/parentAgency/components/PackageFormModal.jsx'
import PackageImageModal from '@/travelAgency/parentAgency/components/PackageImageModal.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import Button from '@/shared/components/Button.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

export default function Packages() {
  const { packages, loading, error, fetchPackages, create, update, updateCover, updateGallery, deactivate } = usePackages()
  const { toast } = useToast()

  const [formModal, setFormModal] = useState({ open: false, data: null })
  const [imageModal, setImageModal] = useState({ open: false, pkg: null, mode: 'cover' })
  const [confirmDeactivate, setConfirmDeactivate] = useState({ open: false, pkg: null })
  const [submitting, setSubmitting] = useState(false)

  // Create / Edit submit
  const handleFormSubmit = async (formData, rawForm) => {
    setSubmitting(true)
    try {
      if (formModal.data) {
        await update(formModal.data._id, rawForm)
        toast.success('Package updated successfully')
      } else {
        await create(formData)
        toast.success('Package created successfully')
      }
      setFormModal({ open: false, data: null })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleImageSubmit = async (formData) => {
    setSubmitting(true)
    try {
      if (imageModal.mode === 'cover') {
        await updateCover(imageModal.pkg._id, formData)
        toast.success('Cover image updated')
      } else {
        await updateGallery(imageModal.pkg._id, formData)
        toast.success('Gallery updated')
      }
      setImageModal({ open: false, pkg: null, mode: 'cover' })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = async () => {
    if (!confirmDeactivate.pkg) return
    try {
      await deactivate(confirmDeactivate.pkg._id)
      toast.success('Package deactivated')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setConfirmDeactivate({ open: false, pkg: null })
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Packages</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your travel packages</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPackages} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" aria-label="Refresh">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <Button onClick={() => setFormModal({ open: true, data: null })}>
            <Plus size={16} className="mr-1 inline" /> New Package
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Loading skeleton */}
      {loading && packages.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && packages.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <PackageOpen className="h-14 w-14 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No packages yet</h3>
          <p className="text-sm text-gray-400 mt-1 mb-5">Create your first travel package to get started.</p>
          <Button onClick={() => setFormModal({ open: true, data: null })}>
            <Plus size={16} className="mr-1 inline" /> Create Package
          </Button>
        </div>
      )}

      {/* Grid */}
      {packages.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map(pkg => (
            <PackageCard
              key={pkg._id}
              pkg={pkg}
              onEdit={(p) => setFormModal({ open: true, data: p })}
              onUpdateCover={(p) => setImageModal({ open: true, pkg: p, mode: 'cover' })}
              onUpdateGallery={(p) => setImageModal({ open: true, pkg: p, mode: 'gallery' })}
              onDeactivate={(p) => setConfirmDeactivate({ open: true, pkg: p })}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <PackageFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, data: null })}
        onSubmit={handleFormSubmit}
        initialData={formModal.data}
        loading={submitting}
      />

      <PackageImageModal
        isOpen={imageModal.open}
        onClose={() => setImageModal({ open: false, pkg: null, mode: 'cover' })}
        onSubmit={handleImageSubmit}
        mode={imageModal.mode}
        loading={submitting}
      />

      <ConfirmDialog
        isOpen={confirmDeactivate.open}
        onClose={() => setConfirmDeactivate({ open: false, pkg: null })}
        onConfirm={handleDeactivate}
        title="Deactivate Package"
        message={`Are you sure you want to deactivate "${confirmDeactivate.pkg?.title}"? This will also deactivate linked whitelabel packages.`}
        confirmText="Deactivate"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
