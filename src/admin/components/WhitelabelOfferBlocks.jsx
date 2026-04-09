import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  ChevronRight,
  ExternalLink,
  IndianRupee,
  Layers,
  MapPin,
  Package,
  Phone,
  Sparkles,
  Users,
} from 'lucide-react'

export function getFileUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  const base = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
  return `${base}/${String(path).replace(/^\//, '')}`
}

function formatCommission(wl) {
  if (wl.commissionType === 'percentage') return `${wl.commissionValue ?? 0}%`
  if (wl.commissionType === 'flat') return `₹${Number(wl.commissionValue || 0).toLocaleString('en-IN')}`
  return '—'
}

function commissionCaption(wl) {
  if (wl.commissionType === 'percentage') return 'Percentage markup on base price'
  if (wl.commissionType === 'flat') return 'Flat amount added to base price'
  return ''
}

function initials(name) {
  if (!name || typeof name !== 'string') return '?'
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function AgencyChip({ badge, user, highlight }) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 ${
        highlight
          ? 'border-primary-300 bg-gradient-to-br from-primary-50 to-white shadow-sm ring-1 ring-primary-100'
          : 'border-gray-200/90 bg-white'
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
          highlight ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700'
        }`}
      >
        {initials(user?.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-gray-900">{user?.name || '—'}</span>
          <span
            className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              highlight ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {badge}
          </span>
        </div>
        <p className="truncate text-[11px] text-gray-500">{user?.email || '—'}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-700">
          <span className="font-mono font-medium text-primary-700">{user?.agentCode || '—'}</span>
          {user?.phone ? (
            <span className="inline-flex items-center gap-0.5 text-gray-600">
              <Phone className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
              {user.phone}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function WhitelabelAgencyChain({ wl }) {
  const seller = wl?.createdBy
  const mid = wl?.ownedByParent
  const showMid = seller?.role === 'sub_child_agent' && mid

  return (
    <div className="border-b border-gray-100 bg-gradient-to-b from-slate-50/80 to-white px-3 py-3 sm:px-4">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        <Users className="h-3.5 w-3.5 text-primary-600" strokeWidth={2} />
        Downstream agencies
      </div>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        {showMid ? (
          <>
            <AgencyChip badge="Child" user={mid} />
            <div className="flex shrink-0 justify-center text-gray-300" aria-hidden>
              <ChevronRight className="h-5 w-5 rotate-90 sm:rotate-0" strokeWidth={2} />
            </div>
            <AgencyChip badge="Sub-child · seller" user={seller} highlight />
          </>
        ) : (
          <AgencyChip badge="Child · seller" user={seller} highlight />
        )}
      </div>
    </div>
  )
}

const offerDetailsCard =
  'flex h-full min-h-[7.5rem] flex-col rounded-xl border border-gray-200 bg-gray-50/90 p-3 sm:p-3.5'

/**
 * Real inventory package this whitelabel is built from (same layout language as Package Whitelabels).
 */
export function SourcePackageSummary({ pkg, adminPackageLink = false }) {
  const coverUrl = useMemo(() => getFileUrl(pkg?.coverImage), [pkg?.coverImage])
  const hasPkg = pkg && (pkg._id || pkg.title)

  if (!hasPkg) {
    return (
      <div className="border-b border-gray-100 bg-slate-50/40 px-3 py-3 sm:px-4">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          <Package className="h-3.5 w-3.5 text-slate-600" strokeWidth={2} />
          Source package
        </div>
        <p className="text-xs text-gray-500">Source package is missing or was removed.</p>
      </div>
    )
  }

  const owner = pkg.createdBy
  const pid = pkg._id

  return (
    <div className="border-b border-gray-100 bg-slate-50/35 px-3 py-3 sm:px-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          <Package className="h-3.5 w-3.5 text-slate-600" strokeWidth={2} />
          Source package
        </div>
        {adminPackageLink && pid ? (
          <Link
            to={`/admin/packages/${pid}/whitelabels`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 transition-colors hover:text-primary-800"
            title="Open package whitelabels — all offers from this inventory package"
          >
            Package whitelabels
            <ExternalLink className="h-3 w-3 shrink-0 opacity-80" strokeWidth={2} />
          </Link>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-lg border border-gray-200/80 bg-gray-100 sm:h-[5.25rem] sm:w-36">
          {coverUrl ? (
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">
              <Layers className="h-8 w-8" strokeWidth={1.25} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h3 className="text-base font-semibold leading-snug text-gray-900">{pkg.title || '—'}</h3>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-600">
              {pkg.destination ? (
                <span className="inline-flex items-center gap-0.5">
                  <MapPin className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
                  {pkg.destination}
                </span>
              ) : null}
              {pkg.totalDays != null ? (
                <span className="inline-flex items-center gap-0.5">
                  <Calendar className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
                  {pkg.totalDays}d
                </span>
              ) : null}
              <span className="inline-flex items-center gap-0.5 font-medium tabular-nums text-gray-900">
                <IndianRupee className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
                {Number(pkg.basePrice || 0).toLocaleString('en-IN')} {pkg.currency || 'INR'}
              </span>
            </div>
          </div>
          {pkg.description ? (
            <p className="line-clamp-3 text-xs leading-relaxed text-gray-600">{pkg.description}</p>
          ) : null}
          {owner ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-white/80 px-2 py-1.5 text-xs">
              <span className="font-medium text-gray-500">Package owner</span>
              <span className="font-semibold text-gray-900">{owner.name || '—'}</span>
              <span className="text-gray-400">·</span>
              <span className="truncate text-gray-600">{owner.email || '—'}</span>
              <span className="font-medium text-primary-700">{owner.agentCode || '—'}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/**
 * basePkg = source package (shared or per-row originalPackage).
 * splitSourceAndOfferUI: when true (e.g. agent inventory), visually separate “whitelabel” from package context above.
 * showSourcePackageHint: compact footer line when source package block is not shown.
 */
export function NewOfferDetails({ wl, basePkg, showSourcePackageHint = false, splitSourceAndOfferUI = false }) {
  const orig = wl?.originalPackage || {}
  const baseTitle = orig.title || basePkg?.title || '—'
  const listTitle = (wl.customTitle && String(wl.customTitle).trim()) || baseTitle
  const finalPrice = Number(wl.finalPrice || 0)
  const packageBasePrice = Number(orig.basePrice ?? basePkg?.basePrice ?? 0)
  const currency = orig.currency || basePkg?.currency || 'INR'
  const titleChanged = Boolean(
    wl.customTitle && String(wl.customTitle).trim() && String(wl.customTitle).trim() !== String(baseTitle).trim()
  )
  const cap = commissionCaption(wl)
  const desc = wl.customDescription && String(wl.customDescription).trim() ? String(wl.customDescription).trim() : ''

  const showBaseBreakdown = splitSourceAndOfferUI && packageBasePrice > 0
  const titleCardExtra = splitSourceAndOfferUI
    ? titleChanged
      ? 'border-violet-200 bg-violet-50/50'
      : 'border-violet-100/90 bg-white/90'
    : titleChanged
      ? 'border-violet-200 bg-violet-50/50'
      : ''
  const priceCardExtra = splitSourceAndOfferUI ? 'border-violet-100/90 bg-white/90' : ''
  const descEmptyExtra = splitSourceAndOfferUI
    ? 'border-dashed border-violet-200/60 bg-violet-50/20'
    : 'border-dashed border-gray-200 bg-gray-50/50'

  return (
    <div
      className={
        splitSourceAndOfferUI
          ? 'bg-gradient-to-b from-violet-50/40 to-white px-3 py-3 sm:px-4'
          : 'bg-white px-3 py-3 sm:px-4'
      }
    >
      {splitSourceAndOfferUI ? (
        <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-900/80">
          <Sparkles className="h-3.5 w-3.5 text-violet-600" strokeWidth={2} />
          Whitelabel offer
        </div>
      ) : (
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Offer details</p>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
        <div className={`${offerDetailsCard} ${titleCardExtra}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            {splitSourceAndOfferUI ? 'Listing title' : 'Title'}
          </p>
          <p className="mt-1.5 flex-1 text-sm font-semibold leading-snug text-gray-900">{listTitle}</p>
          {titleChanged ? (
            <p className="mt-2 border-t border-gray-200/80 pt-2 text-[11px] text-violet-800/90">
              Override · {splitSourceAndOfferUI ? 'package was' : 'was'}{' '}
              <span className="line-through decoration-violet-300">{baseTitle}</span>
            </p>
          ) : (
            <p className="mt-auto pt-2 text-[11px] text-gray-400">Same as source package title</p>
          )}
        </div>

        <div className={`${offerDetailsCard} ${priceCardExtra}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Offer price</p>
          {/* {showBaseBreakdown ? (
            <p className="mt-1 text-[11px] tabular-nums text-gray-500">
              Package base · ₹{packageBasePrice.toLocaleString('en-IN')} <span className="text-gray-400">{currency}</span>
            </p>
          ) : null} */}
          <p className={`flex flex-wrap items-baseline gap-1.5 ${showBaseBreakdown ? 'mt-0.5' : 'mt-1.5'}`}>
            <span className="text-xl font-bold tabular-nums text-gray-900">₹{finalPrice.toLocaleString('en-IN')}</span>
            <span className="text-xs text-gray-500">{currency}</span>
          </p>
          {/* {showBaseBreakdown && finalPrice !== packageBasePrice ? (
            <p className="mt-1 text-[11px] font-medium text-violet-800/90">
              Δ{' '}
              {finalPrice >= packageBasePrice ? '+' : ''}
              ₹{Math.abs(finalPrice - packageBasePrice).toLocaleString('en-IN')} vs base
            </p>
          ) : null} */}
          <div className="mt-auto border-t border-gray-200/80 pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              {splitSourceAndOfferUI ? 'Commission rule' : 'Commission'}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">{formatCommission(wl)}</p>
            {/* {cap ? <p className="mt-0.5 text-[11px] text-gray-500">{cap}</p> : null} */}
          </div>
        </div>

        <div
          className={`${offerDetailsCard} ${
            desc ? 'border-amber-200/80 bg-amber-50/40' : descEmptyExtra
          }`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            {splitSourceAndOfferUI ? 'Custom listing copy' : 'Description'}
          </p>
          {desc ? (
            <p className="mt-1.5 flex-1 overflow-y-auto text-xs leading-relaxed text-gray-800 lg:max-h-[11rem] lg:min-h-0">
              {desc}
            </p>
          ) : (
            <p className="mt-1.5 flex-1 text-xs text-gray-400">
              {splitSourceAndOfferUI
                ? 'No override — buyers see the source package description.'
                : 'No custom description — source package copy applies.'}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2.5 text-[11px] text-gray-500">
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-semibold ${
            wl.isActive
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-gray-200 bg-gray-100 text-gray-700'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${wl.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {wl.isActive ? 'Active' : 'Inactive'}
        </span>
        <span>{wl.createdAt ? new Date(wl.createdAt).toLocaleDateString() : '—'}</span>
        {wl._id ? <span className="font-mono text-[10px] text-gray-400">WL {String(wl._id).slice(-10)}</span> : null}
        {showSourcePackageHint && orig?.title ? (
          <span className="max-w-[220px] truncate text-gray-400" title={orig.title}>
            Source package: {orig.title}
          </span>
        ) : null}
      </div>
    </div>
  )
}
