import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { listParents } from '@/travelAgency/subChild/services/subChildApi.js'
export default function SubChildPackages() {
  const navigate = useNavigate()
  const { availablePackages, whitelabels, loading, error, createWhitelabel, updateWhitelabel } = useSubChildPackages()
  const { bookings } = useSubChildBookings()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [inactiveParentIds, setInactiveParentIds] = useState(new Set())
  const [loadingParents, setLoadingParents] = useState(true)
  const [parents, setParents] = useState([])
  const [selectedParentFilter, setSelectedParentFilter] = useState('all')

  useEffect(() => {
    setLoadingParents(true)
    listParents().then(({ data }) => {
      const ids = new Set()
      const parentsList = data?.data?.parents ?? []
      
      console.log('[SubChild Packages] All parents:', parentsList.map(p => ({
        id: p._id,
        name: p.name,
        childAgencyId: p.childAgency?._id || p.childAgency,
        status: p.status,
        isActive: p.isActive
      })))
      
      parentsList.forEach(p => {
        if (p.status === 'approved' && !p.isActive) {
          // Add the child agency ID (the actual parent agency that owns packages)
          if (p.childAgency?._id) ids.add(String(p.childAgency._id))
          else if (p.childAgency) ids.add(String(p.childAgency))
          // Also add the parent record ID as fallback
          ids.add(String(p._id))
        }
      })
      
      console.log('[SubChild Packages] Inactive parent IDs:', Array.from(ids))
      setInactiveParentIds(ids)
      setParents(parentsList.filter(p => p.status === 'approved'))
    }).catch(() => {}).finally(() => setLoadingParents(false))
  }, [])

  // Calculate which packages have bookings
  const bookedWhiteLabelIds = useMemo(() => {
    const ids = new Set()
    bookings.forEach((b) => {
      const wlId = b.whitelabelPackage?._id || b.whitelabelPackage
      if (wlId) ids.add(String(wlId))
    })
    return ids
  }, [bookings])

  // Helper to check if a package is from an inactive parent
  const isFromInactiveParent = useCallback((pkg) => {
    if (loadingParents || inactiveParentIds.size === 0) return false
    
    // Check the parent whitelabel owner (the child agency who created the whitelabel we're viewing)
    const parentWlOwnerId = pkg.__parentWhitelabelOwnerId
    if (parentWlOwnerId && inactiveParentIds.has(String(parentWlOwnerId))) {
      console.log('[SubChild Packages] Package disabled - parent WL owner match:', {
        packageId: pkg._id,
        packageTitle: pkg.title,
        parentWlOwnerId,
        inactiveParentIds: Array.from(inactiveParentIds)
      })
      return true
    }
    
    // Also check package creator as fallback
    const creatorId = pkg.createdBy?._id || pkg.createdBy
    if (creatorId && inactiveParentIds.has(String(creatorId))) {
      console.log('[SubChild Packages] Package disabled - creator match:', {
        packageId: pkg._id,
        packageTitle: pkg.title,
        creatorId,
        inactiveParentIds: Array.from(inactiveParentIds)
      })
      return true
    }
    
    return false
  }, [inactiveParentIds, loadingParents])

  // Helper to check if a whitelabel is from an inactive parent
  const isWhitelabelFromInactiveParent = useCallback((wl) => {
    if (loadingParents || inactiveParentIds.size === 0) return false
    
    // Check the parent who owns this whitelabel
    const parentId = wl.ownedByParent?._id || wl.ownedByParent
    if (parentId && inactiveParentIds.has(String(parentId))) return true
    
    // Also check the original package creator
    const creatorId = wl.originalPackage?.createdBy?._id || wl.originalPackage?.createdBy
    if (creatorId && inactiveParentIds.has(String(creatorId))) return true
    
    return false
  }, [inactiveParentIds, loadingParents])
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
  
  // Filter packages by selected parent
  const filteredAvailablePackages = useMemo(() => {
    if (selectedParentFilter === 'all') return availablePackages
    
    return availablePackages.filter(pkg => {
      const parentWlOwnerId = pkg.__parentWhitelabelOwnerId
      const creatorId = pkg.createdBy?._id || pkg.createdBy
      
      // Match against the selected parent's child agency ID
      const selectedParent = parents.find(p => String(p._id) === selectedParentFilter)
      if (!selectedParent) return false
      
      const selectedParentChildAgencyId = String(selectedParent.childAgency?._id || selectedParent.childAgency || selectedParent._id)
      
      return String(parentWlOwnerId) === selectedParentChildAgencyId || String(creatorId) === selectedParentChildAgencyId
    })
  }, [availablePackages, selectedParentFilter, parents])
  
  // Filter whitelabels by selected parent
  const filteredWhitelabels = useMemo(() => {
    if (selectedParentFilter === 'all') return whitelabels
    
    return whitelabels.filter(wl => {
      const parentId = wl.ownedByParent?._id || wl.ownedByParent
      const creatorId = wl.originalPackage?.createdBy?._id || wl.originalPackage?.createdBy
      
      // Match against the selected parent's child agency ID
      const selectedParent = parents.find(p => String(p._id) === selectedParentFilter)
      if (!selectedParent) return false
      
      const selectedParentChildAgencyId = String(selectedParent.childAgency?._id || selectedParent.childAgency || selectedParent._id)
      
      return String(parentId) === selectedParentChildAgencyId || String(creatorId) === selectedParentChildAgencyId
    })
  }, [whitelabels, selectedParentFilter, parents])
  
  const packagesEligibleForNewWhitelabel = useMemo(
    () => filteredAvailablePackages.filter((p) => !whitelabelByPackageId.has(String(p._id))),
    [filteredAvailablePackages, whitelabelByPackageId]
  )
  
  // Get unique parents who have packages or whitelabels
  const parentsWithPackages = useMemo(() => {
    const parentIds = new Set()
    
    // Check available packages
    availablePackages.forEach(pkg => {
      const parentWlOwnerId = pkg.__parentWhitelabelOwnerId
      const creatorId = pkg.createdBy?._id || pkg.createdBy
      
      parents.forEach(p => {
        const parentChildAgencyId = String(p.childAgency?._id || p.childAgency || p._id)
        if (String(parentWlOwnerId) === parentChildAgencyId || String(creatorId) === parentChildAgencyId) {
          parentIds.add(String(p._id))
        }
      })
    })
    
    // Check whitelabels
    whitelabels.forEach(wl => {
      const parentId = wl.ownedByParent?._id || wl.ownedByParent
      const creatorId = wl.originalPackage?.createdBy?._id || wl.originalPackage?.createdBy
      
      parents.forEach(p => {
        const parentChildAgencyId = String(p.childAgency?._id || p.childAgency || p._id)
        if (String(parentId) === parentChildAgencyId || String(creatorId) === parentChildAgencyId) {
          parentIds.add(String(p._id))
        }
      })
    })
    
    return parents.filter(p => parentIds.has(String(p._id)))
  }, [availablePackages, whitelabels, parents])

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
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Packages from parent agencies</h2>
          </div>
          
          {/* Parent filter dropdown */}
          {parentsWithPackages.length > 1 && (
            <div className="flex items-center gap-2">
              <label htmlFor="parent-filter" className="text-sm text-gray-600">Filter by parent:</label>
              <select
                id="parent-filter"
                value={selectedParentFilter}
                onChange={(e) => setSelectedParentFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm transition hover:border-gray-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="all">All parents</option>
                {parentsWithPackages.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name || p.email || 'Unnamed parent'}
                  </option>
                ))}
              </select>
            </div>
          )}
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

        {!loading && filteredAvailablePackages.length === 0 && availablePackages.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 py-16 text-center">
            <PackageOpen className="mb-3 h-12 w-12 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">No packages available yet</p>
          </div>
        ) : null}

        {!loading && filteredAvailablePackages.length === 0 && availablePackages.length > 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 py-16 text-center">
            <PackageOpen className="mb-3 h-12 w-12 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">No packages from selected parent</p>
            <button
              onClick={() => setSelectedParentFilter('all')}
              className="mt-3 text-sm text-primary-600 hover:text-primary-700 underline"
            >
              Show all packages
            </button>
          </div>
        ) : null}

        {filteredAvailablePackages.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAvailablePackages.map((pkg) => (
              <AvailablePackageCard
                key={`${pkg._id}-${pkg.__parentWhitelabelId || 'pkg'}`}
                pkg={pkg}
                existingWhitelabel={whitelabelByPackageId.get(String(pkg._id)) ?? null}
                onCreateWhiteLabel={(p) => openCreate(p)}
                onEditWhiteLabel={openEdit}
                disabled={isFromInactiveParent(pkg)}
              />
            ))}
          </div>
        ) : null}
      </section>

      {(loading || availablePackages.length > 0) && (
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <Tags className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Your white-label packages</h2>
        </div>
        {!loading && filteredWhitelabels.length === 0 && whitelabels.length === 0 ? (
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
        {!loading && filteredWhitelabels.length === 0 && whitelabels.length > 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 py-12 text-center">
            <Tags className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">No white-label packages from selected parent</p>
            <button
              onClick={() => setSelectedParentFilter('all')}
              className="mt-3 text-sm text-primary-600 hover:text-primary-700 underline"
            >
              Show all white-label packages
            </button>
          </div>
        ) : null}
        {filteredWhitelabels.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredWhitelabels.map((wl) => (
              <WhitelabelPackageCard
                key={wl._id}
                item={wl}
                onEdit={openEdit}
                onToggleActive={handleToggleActive}
                onChat={() => {
                  const pid = wl.originalPackage?._id || wl.originalPackage
                  if (!pid) return
                  const t = wl.customTitle || (typeof wl.originalPackage === 'object' && wl.originalPackage?.title) || 'Package'
                  navigate(`/agency/packages/${pid}/community?title=${encodeURIComponent(t)}`)
                }}
                onRating={(it) => {
                  const pid = it.originalPackage?._id || it.originalPackage
                  navigate(`/agency/packages/${pid}/reviews?readOnly=true`)
                }}
                hasBooking={bookedWhiteLabelIds.has(String(wl._id))}
                disabled={isWhitelabelFromInactiveParent(wl)}
              />
            ))}
          </div>
        ) : null}
        </section>
      )}

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

    </div>
  )
}
