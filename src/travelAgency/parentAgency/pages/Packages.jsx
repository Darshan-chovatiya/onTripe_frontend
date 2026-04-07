import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus, PackageOpen } from 'lucide-react'
import { usePackages } from '@/travelAgency/parentAgency/hooks/usePackages.js'
import PackageCard from '@/travelAgency/parentAgency/components/PackageCard.jsx'
import PackageFormModal from '@/travelAgency/parentAgency/components/PackageFormModal.jsx'
import PackageImageModal from '@/travelAgency/parentAgency/components/PackageImageModal.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import Button from '@/shared/components/Button.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

export default function Packages() {
  const { packages, loading, error, create, update, updateCover, updateGallery, deactivate, activate } =
    usePackages()
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  const [formModal, setFormModal] = useState({ open: false, data: null })
  const [imageModal, setImageModal] = useState({ open: false, pkg: null, mode: 'cover' })
  const [confirmDeactivate, setConfirmDeactivate] = useState({ open: false, pkg: null })
  const [confirmActivate, setConfirmActivate] = useState({ open: false, pkg: null })
  const [submitting, setSubmitting] = useState(false)

  const stats = useMemo(() => {
    const live = packages.filter((p) => p.isActive).length
    const paused = packages.length - live
    return { live, paused, total: packages.length }
  }, [packages])

  useEffect(() => {
    const editId = location.state?.editId
    if (!editId || loading) return
    const p = packages.find((x) => String(x._id) === String(editId))
    if (p) {
      setFormModal({ open: true, data: p })
    } else {
      toast.error('Package not found or you no longer have access.')
    }
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.state?.editId, packages, loading, location.pathname, navigate, toast])

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

  const handleActivate = async () => {
    if (!confirmActivate.pkg) return
    try {
      await activate(confirmActivate.pkg._id)
      toast.success('Package activated')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setConfirmActivate({ open: false, pkg: null })
    }
  }

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      {/* Header — same pattern as Vendors, Bookings, Child Agents */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Packages</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage your travel packages</p>
        </div>
        <Button onClick={() => setFormModal({ open: true, data: null })}>
          <Plus size={16} className="mr-1 inline" /> New Package
        </Button>
      </div>

      {packages.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-gray-500">
            Total: <span className="font-semibold text-gray-800">{stats.total}</span>
          </span>
          <span className="text-gray-500">
            Live: <span className="font-semibold text-emerald-700">{stats.live}</span>
          </span>
          <span className="text-gray-500">
            Paused: <span className="font-semibold text-gray-800">{stats.paused}</span>
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading && packages.length === 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md animate-pulse"
            >
              <div className="aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-4/5 max-w-[85%] rounded-lg bg-gray-200" />
                <div className="h-3 w-full rounded bg-gray-100" />
                <div className="h-3 w-2/3 rounded bg-gray-100" />
                <div className="flex gap-2 pt-2">
                  <div className="h-9 flex-1 rounded-xl bg-gray-100" />
                  <div className="h-9 flex-1 rounded-xl bg-gray-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && packages.length === 0 && !error && (
        <div className="relative overflow-hidden rounded-3xl border border-dashed border-primary-200/80 bg-gradient-to-b from-white to-primary-50/30 px-6 py-16 text-center sm:px-12">
          <div className="mx-auto flex max-w-md flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 shadow-inner">
              <PackageOpen className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No packages yet</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Create your first package with destinations, pricing, and a day-by-day plan. You can add photos anytime.
            </p>
            <Button onClick={() => setFormModal({ open: true, data: null })} className="mt-6">
              <Plus size={16} className="mr-1.5 inline" /> Create package
            </Button>
          </div>
        </div>
      )}

      {packages.length > 0 && (
        <section>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg._id}
                pkg={pkg}
                onEdit={(p) => setFormModal({ open: true, data: p })}
                onUpdateCover={(p) => setImageModal({ open: true, pkg: p, mode: 'cover' })}
                onUpdateGallery={(p) => setImageModal({ open: true, pkg: p, mode: 'gallery' })}
                onDeactivate={(p) => setConfirmDeactivate({ open: true, pkg: p })}
                onActivate={(p) => setConfirmActivate({ open: true, pkg: p })}
              />
            ))}
          </div>
        </section>
      )}

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

      <ConfirmDialog
        isOpen={confirmActivate.open}
        onClose={() => setConfirmActivate({ open: false, pkg: null })}
        onConfirm={handleActivate}
        title="Activate Package"
        message={`Activate "${confirmActivate.pkg?.title}"? Linked whitelabel offers will be turned back on for child agents.`}
        confirmText="Activate"
        cancelText="Cancel"
        variant="primary"
      />
    </div>
  )
}
