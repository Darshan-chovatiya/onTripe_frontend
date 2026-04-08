import { useMemo, useState } from 'react'
import { PackageOpen, Layers, Tags } from 'lucide-react'
import { useSubChildPackages } from '@/travelAgency/subChild/hooks/useSubChildPackages.js'
import { useSubChildBookings } from '@/travelAgency/subChild/hooks/useSubChildBookings.js'
import AvailablePackageCard from '@/travelAgency/childAgency/components/AvailablePackageCard.jsx'
import WhitelabelPackageCard from '@/travelAgency/childAgency/components/WhitelabelPackageCard.jsx'
import WhitelabelModal from '@/travelAgency/childAgency/components/WhitelabelModal.jsx'
import Button from '@/shared/components/Button.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { mapWhitelabelByOriginalPackageId } from '@/travelAgency/childAgency/utils/whitelabelHelpers.js'
import Modal from '@/shared/components/Modal.jsx'
import CommunityChat from '@/customer/components/CommunityChat.jsx'

export default function SubChildPackages() {
  const { availablePackages, whitelabels, loading, error, createWhitelabel, updateWhitelabel, currentUserId } = useSubChildPackages()
  const { bookings } = useSubChildBookings()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [chatPackageId, setChatPackageId] = useState(null)

  // Calculate which packages have bookings
  const bookedWhiteLabelIds = useMemo(() => {
    const ids = new Set()
    bookings.forEach((b) => {
      const wlId = b.whitelabelPackage?._id || b.whitelabelPackage
      if (wlId) ids.add(String(wlId))
    })
    return ids
  }, [bookings])
  const [modal, setModal] = useState({
    open: false,
    mode: 'create',
    sourcePackage: null,
    whitelabel: null,
  })

  const openCreate = (pkg = null) => {
    setModal({ open: true, mode: 'create', sourcePackage: pkg, whitelabel: null })
  }
  const openEdit = (item) => {
    setModal({ open: true, mode: 'edit', sourcePackage: null, whitelabel: item })
  }
  const closeModal = () => setModal((m) => ({ ...m, open: false }))

  const whitelabelByPackageId = useMemo(() => mapWhitelabelByOriginalPackageId(whitelabels), [whitelabels])
  const packagesEligibleForNewWhitelabel = useMemo(
    () => availablePackages.filter((p) => !whitelabelByPackageId.has(String(p._id))),
    [availablePackages, whitelabelByPackageId]
  )

  const handleModalSubmit = async (...args) => {
    setSubmitting(true)
    try {
      if (modal.mode === 'create') {
        await createWhitelabel(args[0])
        toast.success('White-label package created')
      } else {
        await updateWhitelabel(args[0], args[1])
        toast.success('White-label package updated')
      }
      closeModal()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (item) => {
    try {
      await updateWhitelabel(item._id, { isActive: !item.isActive })
      toast.success(item.isActive ? 'Offer deactivated' : 'Offer activated')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  return (
    <div className="animate-fade-in space-y-10">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Packages</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse packages shared by your parent network, then create and manage your white-label offers.
        </p>
      </header>

      {error ? <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <Layers className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Packages from parent agencies</h2>
        </div>

        {loading && availablePackages.length === 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm animate-pulse">
                <div className="h-44 bg-gray-200" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!loading && availablePackages.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 py-16 text-center">
            <PackageOpen className="mb-3 h-12 w-12 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">No packages available yet</p>
          </div>
        ) : null}

        {availablePackages.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {availablePackages.map((pkg) => (
              <AvailablePackageCard
                key={`${pkg._id}-${pkg.__parentWhitelabelId || 'pkg'}`}
                pkg={pkg}
                existingWhitelabel={whitelabelByPackageId.get(String(pkg._id)) ?? null}
                onCreateWhiteLabel={(p) => openCreate(p)}
                onEditWhiteLabel={openEdit}
              />
            ))}
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <Tags className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Your white-label packages</h2>
        </div>
        {!loading && whitelabels.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white py-12 text-center shadow-sm">
            <p className="text-sm text-gray-500">You have not created any white-label packages yet.</p>
            <Button
              type="button"
              className="mt-4"
              variant="secondary"
              onClick={() => openCreate(null)}
              disabled={!packagesEligibleForNewWhitelabel.length}
            >
              Create your first white-label
            </Button>
          </div>
        ) : null}
        {whitelabels.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {whitelabels.map((wl) => (
              <WhitelabelPackageCard
                key={wl._id}
                item={wl}
                onEdit={openEdit}
                onToggleActive={handleToggleActive}
                onChat={() => setChatPackageId(wl.originalPackage?._id || wl.originalPackage)}
                hasBooking={bookedWhiteLabelIds.has(String(wl._id))}
              />
            ))}
          </div>
        ) : null}
      </section>

      <WhitelabelModal
        isOpen={modal.open}
        onClose={closeModal}
        mode={modal.mode}
        sourcePackage={modal.sourcePackage}
        whitelabel={modal.whitelabel}
        eligiblePackages={packagesEligibleForNewWhitelabel}
        onSubmit={handleModalSubmit}
        loading={submitting}
      />

      <Modal
        isOpen={!!chatPackageId}
        onClose={() => setChatPackageId(null)}
        title="Community chat"
        size="xl"
      >
        {chatPackageId ? <CommunityChat packageId={chatPackageId} currentUserId={currentUserId} /> : null}
      </Modal>
    </div>
  )
}
