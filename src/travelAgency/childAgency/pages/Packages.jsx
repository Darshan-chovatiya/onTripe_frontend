import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  PackageOpen, Layers, Tags, Search, Package, Tag, TrendingUp,
  CheckCircle2, Plus, Filter, Ticket
} from 'lucide-react'
import { useChildPackages } from '@/travelAgency/childAgency/hooks/useChildPackages.js'
import { useChildBookings } from '@/travelAgency/childAgency/hooks/useChildBookings.js'
import AvailablePackageCard from '@/travelAgency/childAgency/components/AvailablePackageCard.jsx'
import WhitelabelPackageCard from '@/travelAgency/childAgency/components/WhitelabelPackageCard.jsx'
import WhitelabelModal from '@/travelAgency/childAgency/components/WhitelabelModal.jsx'
import Loader from '@/shared/components/Loader.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { mapWhitelabelBySourceId } from '@/travelAgency/childAgency/utils/whitelabelHelpers.js'
import { listParents } from '@/travelAgency/childAgency/services/childAgencyApi.js'
import WhitelabelAgentsModal from '@/shared/components/WhitelabelAgentsModal.jsx'
import AgentCommissionsModal from '@/shared/components/AgentCommissionsModal.jsx'

export default function Packages() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'whitelabels'
  const initialSearch = searchParams.get('search') || ''

  const { availablePackages, whitelabels, loading, error, createWhitelabel, updateWhitelabel } = useChildPackages()
  const { bookings } = useChildBookings()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [parentFilter, setParentFilter] = useState('all')
  const [search, setSearch] = useState(initialSearch)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [wlStatusFilter, setWlStatusFilter] = useState('all')
  const [inactiveParentIds, setInactiveParentIds] = useState(new Set())
  const [modal, setModal] = useState({ open: false, mode: 'create', sourcePackage: null, whitelabel: null })
  const [agentsModal, setAgentsModal] = useState({ open: false, agents: [], title: '' })
  const [commissionsModal, setCommissionsModal] = useState({ open: false, data: [], individualBookings: [], whitelabelAgents: [], title: '', basePrice: 0 })

  useEffect(() => {
    listParents().then(({ data }) => {
      const ids = new Set(
        (data?.data?.parents ?? [])
          .filter(p => p.status === 'approved' && !p.isActive)
          .map(p => String(p._id))
      )
      setInactiveParentIds(ids)
    }).catch(() => { })
  }, [])

  const parentOptions = useMemo(() => {
    const map = new Map()
    availablePackages.forEach((p) => {
      const id = p.createdBy?._id || p.createdBy
      const name = p.createdBy?.name || p.createdBy?.email || String(id)
      if (id) map.set(String(id), name)
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [availablePackages])



  const whitelabelBySourceId = useMemo(() => mapWhitelabelBySourceId(whitelabels), [whitelabels])

  const filteredAvailable = useMemo(() => {
    let list = availablePackages
    if (parentFilter !== 'all') list = list.filter(p => String(p.createdBy?._id || p.createdBy) === parentFilter)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(p => (p.title || '').toLowerCase().includes(q) || (p.destination || '').toLowerCase().includes(q))
    return list
  }, [availablePackages, parentFilter, search])

  const filteredWhitelabels = useMemo(() => {
    let list = whitelabels
    if (wlStatusFilter === 'live') list = list.filter(wl => wl.isActive)
    else if (wlStatusFilter === 'paused') list = list.filter(wl => !wl.isActive)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(wl => {
      const title = wl.customTitle || wl.originalPackage?.title || ''
      return title.toLowerCase().includes(q)
    })
    return list
  }, [whitelabels, search, wlStatusFilter])

  const packagesEligibleForNewWhitelabel = useMemo(
    () => availablePackages.filter((p) => {
      if (p.isSuspended || whitelabelBySourceId.has(String(p._id))) return false
      const displayStartDate = p.sourceType === 'whitelabel' ? p.originalPackage?.startDate : p.startDate
      if (!displayStartDate) return true
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const startDate = new Date(displayStartDate)
      startDate.setHours(0, 0, 0, 0)
      return startDate.getTime() >= today.getTime()
    }),
    [availablePackages, whitelabelBySourceId]
  )

  const stats = useMemo(() => ({
    available: availablePackages.length,
    whitelabels: whitelabels.length,
    active: whitelabels.filter(w => w.isActive).length,
    totalPeople: whitelabels.reduce((acc, w) => acc + (Number(w.bookingCount) || 0) + (Number(w.totalAdditionalTravelers) || 0), 0)
  }), [availablePackages, whitelabels])

  const handleModalSubmit = async (...args) => {
    setSubmitting(true)
    try {
      if (modal.mode === 'create') { await createWhitelabel(args[0]); toast.success('White-label created') }
      else { await updateWhitelabel(args[0], args[1]); toast.success('White-label updated') }
      setModal(m => ({ ...m, open: false }))
    } catch (err) { toast.error(getApiErrorMessage(err)) }
    finally { setSubmitting(false) }
  }

  const handleToggleActive = async (item) => {
    try {
      await updateWhitelabel(item._id, { isActive: !item.isActive })
      toast.success(item.isActive ? 'Offer paused' : 'Offer activated')
    } catch (err) { toast.error(getApiErrorMessage(err)) }
  }

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Packages</h1>
          <p className="mt-1 text-sm text-gray-500">Browse parent packages and manage your white-label offers.</p>
        </div>
        {/* {packagesEligibleForNewWhitelabel.length > 0 && (
          <button
            type="button"
            onClick={() => setModal({ open: true, mode: 'create', sourcePackage: null, whitelabel: null })}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New white-label
          </button>
        )} */}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Available packages', value: stats.available, icon: Package, color: 'text-primary-700', bg: 'bg-primary-50' },
          { label: 'My white-labels', value: stats.whitelabels, icon: Tag, color: 'text-violet-700', bg: 'bg-violet-50' },
          { label: 'Active offers', value: stats.active, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Total Bookings', value: stats.totalPeople, icon: Ticket, color: 'text-blue-700', bg: 'bg-blue-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500">{label}</p>
              <p className="text-lg font-bold tabular-nums text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Tabs + search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Tabs */}
        <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('available')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${activeTab === 'available' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Layers className="h-3.5 w-3.5" strokeWidth={2} />
            From parents
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === 'available' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {stats.available}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('whitelabels')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${activeTab === 'whitelabels' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Tags className="h-3.5 w-3.5" strokeWidth={2} />
            My white-labels
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === 'whitelabels' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {stats.whitelabels}
            </span>
          </button>
        </div>

        <div className="flex flex-1 gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
            <input
              type="search"
              placeholder="Search packages…"
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* Parent filter — only on available tab */}
          {activeTab === 'available' && parentOptions.length > 1 && (
            <select
              value={parentFilter}
              onChange={(e) => setParentFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-primary-300 focus:outline-none"
            >
              <option value="all">All parents</option>
              {parentOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          {/* Status filter — only on whitelabels tab */}
          {activeTab === 'whitelabels' && (
            <select
              value={wlStatusFilter}
              onChange={(e) => setWlStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-primary-300 focus:outline-none"
            >
              <option value="all">All offers</option>
              <option value="live">Live</option>
              <option value="paused">Paused</option>
            </select>
          )}        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader size="lg" />
          <p className="mt-4 text-sm text-gray-400">Loading packages…</p>
        </div>
      ) : activeTab === 'available' ? (
        filteredAvailable.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/60 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
              <PackageOpen className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-gray-900">No packages available</h3>
            <p className="mt-1 max-w-xs text-xs text-gray-500">Your parent agency must publish packages before they appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredAvailable.map((pkg) => (
              <AvailablePackageCard
                key={pkg._id}
                pkg={pkg}
                existingWhitelabel={whitelabelBySourceId.get(String(pkg._id)) ?? null}
                onCreateWhiteLabel={(p) => setModal({ open: true, mode: 'create', sourcePackage: p, whitelabel: null })}
                onEditWhiteLabel={(wl) => setModal({ open: true, mode: 'edit', sourcePackage: null, whitelabel: wl })}
                disabled={inactiveParentIds.has(String(pkg.createdBy?._id || pkg.createdBy))}
                hasBooking={(whitelabelBySourceId.get(String(pkg._id))?.bookingCount || 0) > 0}
              />
            ))}
          </div>
        )
      ) : (
        filteredWhitelabels.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/60 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <Tags className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-gray-900">No white-labels yet</h3>
            <p className="mt-1 max-w-xs text-xs text-gray-500">Create a white-label from any available package to start selling.</p>
            {packagesEligibleForNewWhitelabel.length > 0 && (
              <button
                type="button"
                onClick={() => setModal({ open: true, mode: 'create', sourcePackage: null, whitelabel: null })}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Create white-label
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredWhitelabels.map((wl) => (
              <WhitelabelPackageCard
                key={wl._id}
                item={wl}
                onEdit={(item) => setModal({ open: true, mode: 'edit', sourcePackage: null, whitelabel: item })}
                onToggleActive={handleToggleActive}
                onShowAgents={(item) => setAgentsModal({ open: true, agents: item.whitelabelAgents || [], title: `Agents who whitelabeled "${item.customTitle || item.originalPackage?.title}"` })}
                onShowCommissions={(item) => setCommissionsModal({
                  open: true,
                  data: item.agentEarningsBreakdown || [],
                  individualBookings: item.individualBookings || [],
                  whitelabelAgents: item.whitelabelAgents || [],
                  title: `Financial Breakdown: ${item.customTitle || item.originalPackage?.title}`,
                  basePrice: item.parentWhitelabel?.finalPrice || item.originalPackage?.basePrice || 0
                })}
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
                hasBooking={(wl.bookingCount || 0) > 0}
                disabled={inactiveParentIds.has(String(wl.ownedByParent?._id || wl.ownedByParent))}
              />
            ))}
          </div>
        )
      )}

      <WhitelabelModal
        isOpen={modal.open}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        mode={modal.mode}
        sourcePackage={modal.sourcePackage}
        whitelabel={modal.whitelabel}
        eligiblePackages={packagesEligibleForNewWhitelabel}
        onSubmit={handleModalSubmit}
        loading={submitting}
        hasBooking={(modal.whitelabel?.bookingCount || 0) > 0}
      />

      <WhitelabelAgentsModal
        isOpen={agentsModal.open}
        onClose={() => setAgentsModal({ open: false, agents: [], title: '' })}
        agents={agentsModal.agents}
        title={agentsModal.title}
      />

      <AgentCommissionsModal
        isOpen={commissionsModal.open}
        onClose={() => setCommissionsModal({ open: false, data: [], individualBookings: [], title: '' })}
        data={commissionsModal.data}
        individualBookings={commissionsModal.individualBookings}
        whitelabelAgents={commissionsModal.whitelabelAgents}
        basePrice={commissionsModal.basePrice}
        title={commissionsModal.title}
      />
    </div>
  )
}
