import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, MapPin, Clock, Users, IndianRupee,
  Edit2, ImageIcon, ImagePlus, MessageSquare, LayoutGrid,
  List, TrendingUp, Package, CheckCircle2, XCircle,
  Calendar, Star, Eye, Copy, Trash2, ShieldAlert, MoreVertical
} from 'lucide-react'
import { usePackages } from '@/travelAgency/parentAgency/hooks/usePackages.js'
import PackageFormModal from '@/travelAgency/parentAgency/components/PackageFormModal.jsx'
import PackageImageModal from '@/travelAgency/parentAgency/components/PackageImageModal.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import Loader from '@/shared/components/Loader.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getAnalytics, getPackageById } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { AGENCY_PANEL_BASE } from '@/travelAgency/agency/constants.js'
import WhitelabelAgentsModal from '@/shared/components/WhitelabelAgentsModal.jsx'
import AgentCommissionsModal from '@/shared/components/AgentCommissionsModal.jsx'

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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition active:scale-95 ${isActive
        ? 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-400/40 hover:bg-emerald-500/20'
        : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200 hover:bg-gray-200'
        }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
      {isActive ? 'Live' : 'Paused'}
    </button>
  )
}

const formatCompact = (num) => {
  if (num === undefined || num === null) return '0'
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(num)
}

function PackageGridCard({ pkg, onEdit, onClone, onCover, onGallery, onToggle, onDelete, onShowAgents, onShowCommissions, navigate }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const cover = imgUrl(pkg.coverImage)
  const isExpired = useMemo(() => {
    if (!pkg.startDate) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(pkg.startDate)
    startDate.setHours(0, 0, 0, 0)
    return startDate.getTime() < today.getTime()
  }, [pkg.startDate])

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-gray-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/60 hover:-translate-y-0.5">
      {/* Cover image container */}
      <div className="relative h-44 overflow-hidden bg-gray-100">
        <img
          src={cover || PLACEHOLDER}
          alt={pkg.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Suspension & WL badges (top-left) */}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {pkg.isSuspended && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-sm">
              <ShieldAlert className="h-3 w-3" />
              Suspended
            </div>
          )}
          {pkg.whitelabelCount > 0 && (
            <div className="inline-flex items-center gap-1 rounded-full bg-violet-600/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm ring-1 ring-white/20">
              Whitelabeled
            </div>
          )}
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

      {/* Actions & Status (top-right) — OUTSIDE overflow-hidden container to prevent menu clipping */}
      <div className="absolute right-3 top-3 z-30 flex items-center gap-2">
        <button type="button"
          onClick={(e) => { e.stopPropagation(); onToggle(pkg) }}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm backdrop-blur-sm transition active:scale-95 ${pkg.isActive
            ? 'bg-emerald-500/90 text-white hover:bg-emerald-600'
            : 'bg-black/50 text-white/80 hover:bg-black/70'
            }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${pkg.isActive ? 'bg-white animate-pulse' : 'bg-white/50'}`} />
          {pkg.isActive ? 'Live' : 'Paused'}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-gray-900"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }} />
              <div className="absolute right-0 top-full z-20 mt-1 w-48 origin-top-right overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in duration-150">
                <div className="py-1">
                  <button onClick={(e) => { e.stopPropagation(); onEdit(pkg); setMenuOpen(false) }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    <Edit2 className="h-4 w-4 text-gray-400" /> Edit Package
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onClone(pkg); setMenuOpen(false) }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    <Copy className="h-4 w-4 text-gray-400" /> Clone Package
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onCover(pkg); setMenuOpen(false) }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    <ImageIcon className="h-4 w-4 text-gray-400" /> Change Cover
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onGallery(pkg); setMenuOpen(false) }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    <ImagePlus className="h-4 w-4 text-gray-400" /> Photo Gallery
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`${AGENCY_PANEL_BASE}/packages/${pkg._id}/community?title=${encodeURIComponent(pkg.title || '')}`); setMenuOpen(false) }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    <MessageSquare className="h-4 w-4 text-gray-400" /> Community Chat
                  </button>
                  <div className="my-1 border-t border-gray-50" />
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(pkg); setMenuOpen(false) }}
                    disabled={pkg.whitelabelCount > 0 || pkg.bookingCount > 0}
                    className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold ${pkg.whitelabelCount > 0 || pkg.bookingCount > 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-red-600 hover:bg-red-50'
                      }`}
                  >
                    <Trash2 className="h-4 w-4" /> Delete Package
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Title + destination */}
        <div>
          <h3 className="line-clamp-1 text-sm font-semibold text-gray-900">{pkg.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {pkg.destination && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
                {pkg.destination}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-400" strokeWidth={2} />
              {pkg.totalDays}d
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3 text-gray-400" strokeWidth={2} />
              {pkg.maxCapacity} max
            </span>
            {pkg.itinerary?.length > 0 && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-gray-400" strokeWidth={2} />
                {pkg.itinerary.length} days
              </span>
            )}
          </div>
        </div>

        {/* Stats row — 4 numbers inline */}
        <div className="grid grid-cols-5 divide-x divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/60 overflow-hidden">
          <div className="px-0.5 py-2.5 text-center" title={`₹${(pkg.totalRevenue || 0).toLocaleString('en-IN')}`}>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400 truncate">Revenue</p>
            <p className="mt-0.5 text-xs font-bold tabular-nums text-sky-700 truncate">
              ₹{formatCompact(pkg.totalRevenue)}
            </p>
          </div>
          <div className="px-0.5 py-2.5 text-center" title={`₹${(pkg.totalParentEarnings || 0).toLocaleString('en-IN')}`}>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400 truncate">Earnings</p>
            <p className="mt-0.5 text-xs font-bold tabular-nums text-primary-700 truncate">
              ₹{formatCompact(pkg.totalParentEarnings)}
            </p>
          </div>
          <div className="px-0.5 py-2.5 text-center" title={`₹${(pkg.totalChildEarnings || 0).toLocaleString('en-IN')}`}>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400 truncate">Child</p>
            <button type="button" onClick={() => onShowCommissions?.(pkg)}
              className="mt-0.5 block w-full text-xs font-bold tabular-nums text-emerald-700 hover:underline truncate">
              ₹{formatCompact(pkg.totalChildEarnings)}
            </button>
          </div>
          <div className="px-0.5 py-2.5 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400 truncate">Bookings</p>
            <button type="button"
              onClick={() => navigate(`${AGENCY_PANEL_BASE}/bookings?packageId=${pkg._id}`)}
              className="mt-0.5 block w-full text-xs font-bold tabular-nums text-primary-600 hover:underline truncate">
              {Number(pkg.bookingCount) || 0}
            </button>
          </div>
          <div className="px-0.5 py-2.5 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400 truncate">WL</p>
            <button type="button"
              disabled={!pkg.whitelabelCount}
              onClick={() => onShowAgents?.({ ...pkg, whitelabelAgents: pkg.whitelabelAgents })}
              className={`mt-0.5 block w-full text-xs font-bold tabular-nums transition truncate ${pkg.whitelabelCount ? 'text-violet-600 hover:underline' : 'text-gray-400'}`}>
              {pkg.whitelabelCount || 0}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto pt-2">
          {/* Primary CTA */}
          <div className="flex gap-2">
            <button type="button"
              onClick={() => navigate(`${AGENCY_PANEL_BASE}/packages/${pkg._id}`)}
              className="flex-1 rounded-xl bg-primary-600 py-2.5 text-xs font-bold text-white transition hover:bg-gray-800 active:scale-[0.98]">
              View Details
            </button>
            <button type="button"
              disabled={isExpired}
              title={isExpired ? "Package start date has passed" : "Book Now"}
              onClick={() => navigate(`${AGENCY_PANEL_BASE}/bookings/create?packageId=${pkg._id}`)}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold text-white transition shadow-sm ${isExpired ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'}`}>
              {isExpired ? 'Expired' : 'Book Now'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function PackageListRow({ pkg, onEdit, onClone, onCover, onGallery, onToggle, onDelete, onShowAgents, onShowCommissions, navigate }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const cover = imgUrl(pkg.coverImage)
  const isExpired = useMemo(() => {
    if (!pkg.startDate) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(pkg.startDate)
    startDate.setHours(0, 0, 0, 0)
    return startDate.getTime() < today.getTime()
  }, [pkg.startDate])
  return (
    <div className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-primary-100 hover:shadow-md">
      {/* Thumbnail + Info */}
      <div className="flex items-center gap-4 min-w-0 flex-1 w-full">
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
            {pkg.whitelabelCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-700 ring-1 ring-inset ring-violet-200">
                Whitelabeled
              </span>
            )}
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
              <Users className="h-3 w-3 text-gray-400" strokeWidth={2} />{pkg.maxCapacity} max
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden items-center gap-4 lg:flex px-2">
        <div className="text-center" title={`₹${(pkg.totalRevenue || 0).toLocaleString('en-IN')}`}>
          <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">Revenue</p>
          <p className="mt-0.5 text-xs font-bold tabular-nums text-sky-700">
            ₹{formatCompact(pkg.totalRevenue)}
          </p>
        </div>
        <div className="text-center" title={`₹${(pkg.totalParentEarnings || 0).toLocaleString('en-IN')}`}>
          <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">My Earnings</p>
          <p className="mt-0.5 text-xs font-bold tabular-nums text-primary-700">
            ₹{formatCompact(pkg.totalParentEarnings)}
          </p>
        </div>
        <div className="text-center" title={`₹${(pkg.totalChildEarnings || 0).toLocaleString('en-IN')}`}>
          <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">Child Comm.</p>
          <button
            type="button"
            onClick={() => onShowCommissions?.(pkg)}
            className="mt-0.5 inline-block text-xs font-bold tabular-nums text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            ₹{formatCompact(pkg.totalChildEarnings)}
          </button>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">Bookings</p>
          <button
            type="button"
            onClick={() => navigate(`${AGENCY_PANEL_BASE}/bookings?packageId=${pkg._id}`)}
            className="mt-0.5 inline-block text-xs font-bold tabular-nums text-primary-600 hover:text-primary-800 hover:underline"
          >
            {Number(pkg.bookingCount) || 0}
          </button>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">Whitelabels</p>
          <button
            type="button"
            disabled={!pkg.whitelabelCount}
            onClick={() => onShowAgents?.({ ...pkg, whitelabelAgents: pkg.whitelabelAgents })}
            className={`mt-0.5 inline-block text-xs font-bold tabular-nums transition ${pkg.whitelabelCount ? 'text-violet-600 hover:text-violet-800 hover:underline' : 'text-gray-400'}`}
          >
            {pkg.whitelabelCount || 0}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t border-gray-50 sm:border-0 sm:ml-auto">
        <button type="button"
          disabled={isExpired}
          title={isExpired ? "Package start date has passed" : "Book Now"}
          onClick={() => navigate(`${AGENCY_PANEL_BASE}/bookings/create?packageId=${pkg._id}`)}
          className={`flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-bold text-white transition shadow-sm ${isExpired ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'}`}>
          <Calendar className="h-3.5 w-3.5" />
          {isExpired ? 'Expired' : 'Book'}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-gray-400 hover:text-gray-900"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }} />
              <div className="absolute right-0 top-full z-20 mt-1 w-48 origin-top-right overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in duration-150">
                <div className="py-1">
                  <button onClick={(e) => { e.stopPropagation(); navigate(`${AGENCY_PANEL_BASE}/packages/${pkg._id}`); setMenuOpen(false) }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    <Eye className="h-4 w-4 text-gray-400" /> View Package
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onEdit(pkg); setMenuOpen(false) }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    <Edit2 className="h-4 w-4 text-gray-400" /> Edit Package
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onClone(pkg); setMenuOpen(false) }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    <Copy className="h-4 w-4 text-gray-400" /> Clone Package
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onCover(pkg); setMenuOpen(false) }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    <ImageIcon className="h-4 w-4 text-gray-400" /> Change Cover
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onGallery(pkg); setMenuOpen(false) }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    <ImagePlus className="h-4 w-4 text-gray-400" /> Photo Gallery
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`${AGENCY_PANEL_BASE}/packages/${pkg._id}/community?title=${encodeURIComponent(pkg.title || '')}`); setMenuOpen(false) }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    <MessageSquare className="h-4 w-4 text-gray-400" /> Community Chat
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onToggle(pkg); setMenuOpen(false) }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    <div className={`h-2 w-2 rounded-full ${pkg.isActive ? 'bg-red-500' : 'bg-emerald-500'}`} /> {pkg.isActive ? 'Pause Package' : 'Activate Package'}
                  </button>
                  <div className="my-1 border-t border-gray-50" />
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(pkg); setMenuOpen(false) }}
                    disabled={pkg.whitelabelCount > 0 || pkg.bookingCount > 0}
                    className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold ${pkg.whitelabelCount > 0 || pkg.bookingCount > 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-red-600 hover:bg-red-50'
                      }`}
                  >
                    <Trash2 className="h-4 w-4" /> Delete Package
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Packages() {
  const { packages, loading, error, create, update, updateCover, updateGallery, deactivate, activate, remove } = usePackages()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [formModal, setFormModal] = useState({ open: false, data: null, isClone: false })
  const [imageModal, setImageModal] = useState({ open: false, pkg: null, mode: 'cover' })
  const [confirmToggle, setConfirmToggle] = useState({ open: false, pkg: null })
  const [confirmDelete, setConfirmDelete] = useState({ open: false, pkg: null })
  const [agentsModal, setAgentsModal] = useState({ open: false, agents: [], title: '' })
  const [commissionsModal, setCommissionsModal] = useState({ open: false, data: [], individualBookings: [], whitelabelAgents: [], title: '', basePrice: 0 })
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

  const [analytics, setAnalytics] = useState(null)
  useEffect(() => {
    getAnalytics().then(res => setAnalytics(res.data?.data)).catch(() => { })
  }, [])

  const stats = useMemo(() => ({
    total: packages.length,
    live: packages.filter((p) => p.isActive).length,
    revenue: packages.reduce((s, p) => s + (Number(p.totalRevenue) || 0), 0),
    bookings: packages.reduce((s, p) => s + (Number(p.bookingCount) || 0), 0),
    earnings: packages.reduce((s, p) => s + (Number(p.totalParentEarnings) || 0), 0),
    child: packages.reduce((s, p) => s + (Number(p.totalChildEarnings) || 0), 0),
    wl: packages.reduce((s, p) => s + (Number(p.whitelabelCount) || 0), 0),
  }), [packages])

  const handleFormSubmit = async (formData) => {
    setSubmitting(true)
    try {
      await create(formData)
      toast.success('Package cloned')
      setFormModal({ open: false, data: null, isClone: false })
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

  const handleShowCommissions = async (pkg) => {
    try {
      const res = await getPackageById(pkg._id)
      const fullPkg = res.data?.data?.package || pkg
      console.log("fullPkg", fullPkg, pkg)
      setCommissionsModal({
        open: true,
        data: pkg.agentEarningsBreakdown || [],
        individualBookings: pkg.individualBookings || [],
        whitelabelAgents: pkg.whitelabels || [],
        title: `Financial Breakdown: ${fullPkg.title}`,
        basePrice: fullPkg.basePrice,
        revenue: fullPkg.totalRevenue,
        earnings: fullPkg.totalParentEarnings
      })
    } catch (err) {
      console.error('Failed to fetch package details:', err)
      setCommissionsModal({
        open: true,
        data: pkg.agentEarningsBreakdown || [],
        individualBookings: pkg.individualBookings || [],
        whitelabelAgents: pkg.whitelabels || [],
        title: `Financial Breakdown: ${pkg.title}`,
        basePrice: pkg.basePrice,
        revenue: pkg.totalRevenue,
        earnings: pkg.totalParentEarnings
      })
    }
  }

  const handleDelete = async () => {
    const pkg = confirmDelete.pkg
    if (!pkg) return
    try {
      await remove(pkg._id)
      toast.success('Package deleted')
    } catch (err) { toast.error(getApiErrorMessage(err)) }
    finally { setConfirmDelete({ open: false, pkg: null }) }
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
          onClick={() => navigate('/agency/packages/create')}
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
            { label: 'Total revenue', value: `₹${formatCompact(stats.revenue)}`, fullValue: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-sky-700', bg: 'bg-sky-50' },
            { label: 'Total bookings', value: stats.bookings, icon: Calendar, color: 'text-violet-700', bg: 'bg-violet-50' },
          ].map(({ label, value, fullValue, icon: Icon, color, bg }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm" title={fullValue || String(value)}>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-gray-500 truncate">{label}</p>
                <p className="mt-0.5 text-base sm:text-lg font-bold tabular-nums text-gray-900 truncate">{value}</p>
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
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          {/* Status filter */}
          <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            {[['all', 'All'], ['active', 'Live'], ['inactive', 'Paused']].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setStatusFilter(v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${statusFilter === v ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
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
              onClick={() => navigate('/agency/packages/create')}
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
              onEdit={(p) => navigate(`/agency/packages/edit/${p._id}`)}
              onClone={(p) => navigate(`/agency/packages/clone/${p._id}`)}
              onCover={(p) => setImageModal({ open: true, pkg: p, mode: 'cover' })}
              onGallery={(p) => setImageModal({ open: true, pkg: p, mode: 'gallery' })}
              onToggle={(p) => setConfirmToggle({ open: true, pkg: p })}
              onDelete={(p) => setConfirmDelete({ open: true, pkg: p })}
              onShowAgents={(p) => setAgentsModal({ open: true, agents: p.whitelabelAgents || [], title: `Agents who whitelabeled "${p.title}"` })}
              onShowCommissions={handleShowCommissions}
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
              onEdit={(p) => navigate(`/agency/packages/edit/${p._id}`)}
              onClone={(p) => navigate(`/agency/packages/clone/${p._id}`)}
              onCover={(p) => setImageModal({ open: true, pkg: p, mode: 'cover' })}
              onGallery={(p) => setImageModal({ open: true, pkg: p, mode: 'gallery' })}
              onToggle={(p) => setConfirmToggle({ open: true, pkg: p })}
              onDelete={(p) => setConfirmDelete({ open: true, pkg: p })}
              onShowAgents={(p) => setAgentsModal({ open: true, agents: p.whitelabelAgents || [], title: `Agents who whitelabeled "${p.title}"` })}
              onShowCommissions={handleShowCommissions}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}

      <PackageImageModal
        isOpen={imageModal.open}
        onClose={() => setImageModal({ open: false, pkg: null, mode: 'cover' })}
        pkg={imageModal.pkg}
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

      <ConfirmDialog
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, pkg: null })}
        onConfirm={handleDelete}
        title="Delete package?"
        message={`Are you sure you want to delete "${confirmDelete.pkg?.title}"? This will remove it from your list and all linked whitelabels. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <WhitelabelAgentsModal
        isOpen={agentsModal.open}
        onClose={() => setAgentsModal({ open: false, agents: [], title: '' })}
        agents={agentsModal.agents}
        title={agentsModal.title}
      />

      <AgentCommissionsModal
        isOpen={commissionsModal.open}
        onClose={() => setCommissionsModal({ open: false, data: [], individualBookings: [], title: '', revenue: 0, earnings: 0 })}
        data={commissionsModal.data}
        individualBookings={commissionsModal.individualBookings}
        whitelabelAgents={commissionsModal.whitelabelAgents}
        basePrice={commissionsModal.basePrice}
        revenue={commissionsModal.revenue}
        earnings={commissionsModal.earnings}
        title={commissionsModal.title}
      />
    </div>
  )
}
