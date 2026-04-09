import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, MapPin, Clock, Users, IndianRupee,
  Edit2, ImageIcon, ImagePlus, MessageSquare, LayoutGrid,
  List, TrendingUp, Package, CheckCircle2, XCircle,
  Calendar, Star,
} from 'lucide-react'
import { usePackages } from '@/travelAgency/parentAgency/hooks/usePackages.js'
import PackageFormModal from '@/travelAgency/parentAgency/components/PackageFormModal.jsx'
import PackageImageModal from '@/travelAgency/parentAgency/components/PackageImageModal.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import Loader from '@/shared/components/Loader.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { AGENCY_PANEL_BASE } from '@/travelAgency/agency/constants.js'

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'

const imgUrl = (p) => {
  if (!p) return null
  if (p.startsWith('http')) return p
  return `${BASE_URL}/${String(p).replace(/^\//, '')}`
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=600'

function StatusPill({ isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition active:scale-95 ${
        isActive
          ? 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-400/40 hover:bg-emerald-500/20'
          : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200 hover:bg-gray-200'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
      {isActive ? 'Live' : 'Paused'}
    </button>
  )
}

function PackageGridCard({ pkg, onEdit, onCover, onGallery, onToggle, navigate }) {
  const cover = imgUrl(pkg.coverImage)
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/60 hover:-translate-y-0.5">
      {/* Cover image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={cover || PLACEHOLDER}
          alt={pkg.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Status pill top-right */}
        <div className="absolute right-3 top-3">
          <StatusPill isActive={pkg.isActive} onClick={() => onToggle(pkg)} />
        </div>

        {/* Price bottom-left */}
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-0.5 rounded-xl bg-white/95 px-2.5 py-1.5 shadow-sm backdrop-blur-sm">
            <IndianRupee className="h-3.5 w-3.5 text-primary-700" strokeWidth={2.5} />
            <span className="text-sm font-bold tabular-nums text-primary-900">
              {(Number(pkg.basePrice) || 0).toLocaleString('en-IN')}
            </span>
            <span className="ml-1 text-[10px] text-gray-500">{pkg.currency || 'INR'}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-1 text-sm font-semibold text-gray-900">{pkg.title}</h3>
          {pkg.destination && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
              {pkg.destination}
            </p>
          )}
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-gray-100">
            <Clock className="h-3 w-3 text-primary-500" strokeWidth={2} />
            {pkg.totalDays}d
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-gray-100">
            <Users className="h-3 w-3 text-primary-500" strokeWidth={2} />
            {pkg.maxCapacity} pax
          </span>
          {pkg.itinerary?.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2 py-1 text-[11px] font-medium text-primary-700 ring-1 ring-primary-100">
              <Calendar className="h-3 w-3" strokeWidth={2} />
              {pkg.itinerary.length} days planned
            </span>
          )}
        </div>

        {/* Revenue + bookings */}
        <div className="flex items-center gap-2 rounded-xl bg-gray-50/80 px-3 py-2 ring-1 ring-gray-100">
          <div className="flex-1 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Revenue</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-700">
              ₹{(Number(pkg.totalRevenue) || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="flex-1 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Bookings</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-800">{Number(pkg.bookingCount) || 0}</p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="flex-1 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Whitelabels</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-800">{Number(pkg.whitelabelCount) || 0}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => navigate(`${AGENCY_PANEL_BASE}/packages/${pkg._id}`)}
            className="col-span-2 rounded-xl bg-primary-600 py-2 text-xs font-semibold text-white transition hover:bg-primary-700 active:scale-[0.98]"
          >
            View details
          </button>
          <button
            type="button"
            onClick={() => onEdit(pkg)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2 text-xs font-medium text-gray-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800"
          >
            <Edit2 className="h-3.5 w-3.5" strokeWidth={2} />
            Edit
          </button>
          <button
            type="button"
            onClick={() => navigate(`${AGENCY_PANEL_BASE}/packages/${pkg._id}/community?title=${encodeURIComponent(pkg.title || '')}`)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2 text-xs font-medium text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
            Chat
          </button>
          <button
            type="button"
            onClick={() => onCover(pkg)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2 text-xs font-medium text-gray-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800"
          >
            <ImageIcon className="h-3.5 w-3.5" strokeWidth={2} />
            Cover
          </button>
          <button
            type="button"
            onClick={() => onGallery(pkg)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2 text-xs font-medium text-gray-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800"
          >
            <ImagePlus className="h-3.5 w-3.5" strokeWidth={2} />
            Gallery
          </button>
        </div>
      </div>
    </article>
  )
}

function PackageListRow({ pkg, onEdit, onCover, onGallery, onToggle, navigate }) {
  const cover = imgUrl(pkg.coverImage)
  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-primary-100 hover:shadow-md">
      {/* Thumbnail */}
      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
        <img
          src={cover || PLACEHOLDER}
          alt={pkg.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-gray-900">{pkg.title}</h3>
          <StatusPill isActive={pkg.isActive} onClick={() => onToggle(pkg)} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {pkg.destination && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-gray-400" strokeWidth={2} />{pkg.destination}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-gray-400" strokeWidth={2} />{pkg.totalDays} days
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3 text-gray-400" strokeWidth={2} />{pkg.maxCapacity} pax
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden items-center gap-6 sm:flex">
        <div className="text-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Price</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-900">
            ₹{(Number(pkg.basePrice) || 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Revenue</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-700">
            ₹{(Number(pkg.totalRevenue) || 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Bookings</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-800">{Number(pkg.bookingCount) || 0}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => navigate(`${AGENCY_PANEL_BASE}/packages/${pkg._id}`)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800"
        >
          View
        </button>
        <button
          type="button"
          onClick={() => onEdit(pkg)}
          className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 transition hover:border-primary-200 hover:text-primary-700"
          title="Edit"
        >
          <Edit2 className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => onCover(pkg)}
          className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 transition hover:border-sky-200 hover:text-sky-700"
          title="Cover"
        >
          <ImageIcon className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => onGallery(pkg)}
          className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 transition hover:border-violet-200 hover:text-violet-700"
          title="Gallery"
        >
          <ImagePlus className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => navigate(`${AGENCY_PANEL_BASE}/packages/${pkg._id}/community?title=${encodeURIComponent(pkg.title || '')}`)}
          className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 transition hover:border-emerald-200 hover:text-emerald-700"
          title="Community"
        >
          <MessageSquare className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

export default function Packages() {
  const { packages, loading, error, create, update, updateCover, updateGallery, deactivate, activate } = usePackages()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [formModal, setFormModal] = useState({ open: false, data: null })
  const [imageModal, setImageModal] = useState({ open: false, pkg: null, mode: 'cover' })
  const [confirmToggle, setConfirmToggle] = useState({ open: false, pkg: null })
  const [submitting, setSubmitting] = useState(false)

  const filtered = useMemo(() => {
    let list = packages
    if (statusFilter === 'active') list = list.filter((p) => p.isActive)
    if (statusFilter === 'inactive') list = list.filter((p) => !p.isActive)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((p) =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.destination || '').toLowerCase().includes(q)
    )
    return list
  }, [packages, search, statusFilter])

  const stats = useMemo(() => ({
    total: packages.length,
    live: packages.filter((p) => p.isActive).length,
    revenue: packages.reduce((s, p) => s + (Number(p.totalRevenue) || 0), 0),
    bookings: packages.reduce((s, p) => s + (Number(p.bookingCount) || 0), 0),
  }), [packages])

  const handleFormSubmit = async (formData, rawForm) => {
    setSubmitting(true)
    try {
      if (formModal.data) { await update(formModal.data._id, rawForm); toast.success('Package updated') }
      else { await create(formData); toast.success('Package created') }
      setFormModal({ open: false, data: null })
    } catch (err) { toast.error(getApiErrorMessage(err)) }
    finally { setSubmitting(false) }
  }

  const handleImageSubmit = async (formData) => {
    setSubmitting(true)
    try {
      if (imageModal.mode === 'cover') { await updateCover(imageModal.pkg._id, formData); toast.success('Cover updated') }
      else { await updateGallery(imageModal.pkg._id, formData); toast.success('Gallery updated') }
      setImageModal({ open: false, pkg: null, mode: 'cover' })
    } catch (err) { toast.error(getApiErrorMessage(err)) }
    finally { setSubmitting(false) }
  }

  const handleToggle = async () => {
    const pkg = confirmToggle.pkg
    if (!pkg) return
    try {
      if (pkg.isActive) { await deactivate(pkg._id); toast.success('Package paused') }
      else { await activate(pkg._id); toast.success('Package activated') }
    } catch (err) { toast.error(getApiErrorMessage(err)) }
    finally { setConfirmToggle({ open: false, pkg: null }) }
  }

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Packages</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage your travel packages.</p>
        </div>
        <button
          type="button"
          onClick={() => setFormModal({ open: true, data: null })}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-900/20 transition hover:bg-primary-700 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New package
        </button>
      </div>

      {/* ── Stats strip ── */}
      {packages.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total packages', value: stats.total, icon: Package, color: 'text-primary-700', bg: 'bg-primary-50' },
            { label: 'Live', value: stats.live, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Total revenue', value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-sky-700', bg: 'bg-sky-50' },
            { label: 'Total bookings', value: stats.bookings, icon: Calendar, color: 'text-violet-700', bg: 'bg-violet-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500">{label}</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* ── Filters + view toggle ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
          <input
            type="search"
            placeholder="Search by title or destination…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            {[['all', 'All'], ['active', 'Live'], ['inactive', 'Paused']].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setStatusFilter(v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === v ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          {/* View toggle */}
          <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-1.5 transition ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-1.5 transition ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}
              title="List view"
            >
              <List className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader size="lg" />
          <p className="mt-4 text-sm text-gray-400">Loading packages…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/60 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
            <Package className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900">
            {packages.length === 0 ? 'No packages yet' : 'No matches found'}
          </h3>
          <p className="mt-1 max-w-xs text-sm text-gray-500">
            {packages.length === 0
              ? 'Create your first package with destinations, pricing, and a day-by-day itinerary.'
              : 'Try adjusting your search or filter.'}
          </p>
          {packages.length === 0 && (
            <button
              type="button"
              onClick={() => setFormModal({ open: true, data: null })}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Create package
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((pkg) => (
            <PackageGridCard
              key={pkg._id}
              pkg={pkg}
              navigate={navigate}
              onEdit={(p) => setFormModal({ open: true, data: p })}
              onCover={(p) => setImageModal({ open: true, pkg: p, mode: 'cover' })}
              onGallery={(p) => setImageModal({ open: true, pkg: p, mode: 'gallery' })}
              onToggle={(p) => setConfirmToggle({ open: true, pkg: p })}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pkg) => (
            <PackageListRow
              key={pkg._id}
              pkg={pkg}
              navigate={navigate}
              onEdit={(p) => setFormModal({ open: true, data: p })}
              onCover={(p) => setImageModal({ open: true, pkg: p, mode: 'cover' })}
              onGallery={(p) => setImageModal({ open: true, pkg: p, mode: 'gallery' })}
              onToggle={(p) => setConfirmToggle({ open: true, pkg: p })}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
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
        isOpen={confirmToggle.open}
        onClose={() => setConfirmToggle({ open: false, pkg: null })}
        onConfirm={handleToggle}
        title={confirmToggle.pkg?.isActive ? 'Pause package?' : 'Activate package?'}
        message={
          confirmToggle.pkg?.isActive
            ? `"${confirmToggle.pkg?.title}" will be hidden from your network and linked whitelabels will be deactivated.`
            : `"${confirmToggle.pkg?.title}" will be visible to your network again.`
        }
        confirmText={confirmToggle.pkg?.isActive ? 'Pause' : 'Activate'}
        cancelText="Cancel"
        variant={confirmToggle.pkg?.isActive ? 'danger' : 'primary'}
      />
    </div>
  )
}
