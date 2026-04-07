import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  IndianRupee,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Clock3,
  MapPinned,
  Layers,
  ImagePlus,
  Store,
  Sparkles,
  AlertTriangle,
  UtensilsCrossed,
  FileText,
  BadgeCheck,
  PauseCircle,
  Link2,
  Video,
} from 'lucide-react'
import { AGENCY_PANEL_BASE } from '@/travelAgency/agency/constants.js'
import { getPackageById } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { getDetailExperiencesForDay } from '@/travelAgency/parentAgency/utils/packageItineraryTransforms.js'
import { destinationText } from '@/travelAgency/parentAgency/utils/packageDisplay.js'

const BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const imgUrl = (path) => (path ? `${BASE}/${path.replace(/\\/g, '/')}` : null)

const EVENT_TYPE_COLORS = {
  activity: 'bg-blue-50 text-blue-800 ring-blue-100',
  hotel_checkin: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
  hotel_checkout: 'bg-orange-50 text-orange-800 ring-orange-100',
  transfer: 'bg-violet-50 text-violet-800 ring-violet-100',
  meal: 'bg-amber-50 text-amber-900 ring-amber-100',
  adventure: 'bg-sky-50 text-sky-900 ring-sky-100',
  sightseeing: 'bg-cyan-50 text-cyan-900 ring-cyan-100',
  cultural: 'bg-fuchsia-50 text-fuchsia-900 ring-fuchsia-100',
  food: 'bg-amber-50 text-amber-900 ring-amber-100',
  leisure: 'bg-teal-50 text-teal-900 ring-teal-100',
  transport: 'bg-violet-50 text-violet-800 ring-violet-100',
  accommodation: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
  shopping: 'bg-pink-50 text-pink-900 ring-pink-100',
  other: 'bg-slate-100 text-slate-700 ring-slate-200',
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-primary-700">
      {Icon && <Icon className="h-4 w-4 text-primary-500" strokeWidth={2} />}
      {children}
    </h2>
  )
}

function DetailRow({ icon: Icon, label, children, className = '' }) {
  return (
    <div className={`flex gap-3 border-b border-gray-100 py-3 last:border-0 ${className}`}>
      {Icon && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-gray-900 [overflow-wrap:anywhere]">{children}</div>
      </div>
    </div>
  )
}

function formatDayDate(raw) {
  if (raw == null) return null
  try {
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return null
  }
}

function formatDateTime(raw) {
  if (raw == null) return null
  try {
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return null
  }
}

function humanizeCategory(cat) {
  if (cat == null || cat === '') return ''
  return String(cat)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function experienceBadgeClass(ev) {
  const k = ev.category || ev.type
  return EVENT_TYPE_COLORS[k] || EVENT_TYPE_COLORS[ev.type] || EVENT_TYPE_COLORS.other
}

/** @param {{ vendor: unknown }} props */
function VendorBlock({ vendor }) {
  if (vendor == null) return null
  if (typeof vendor === 'object' && vendor !== null && 'name' in vendor) {
    const v = /** @type {{ name?: string, type?: string, phone?: string, city?: string, address?: string, contactPerson?: string }} */ (
      vendor
    )
    const typeLabel = v.type ? String(v.type).replace(/_/g, ' ') : ''
    const place = [v.city, v.address].filter(Boolean).join(' · ')
    return (
      <div className="mt-2 rounded-lg border border-primary-100 bg-primary-50/50 px-3 py-2 text-xs text-gray-800">
        <p className="flex items-center gap-1.5 font-semibold text-primary-900">
          <Store className="h-3.5 w-3.5 shrink-0" />
          {v.name}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-gray-600">
          {typeLabel && <span className="capitalize">{typeLabel}</span>}
          {v.phone && <span>{v.phone}</span>}
          {v.contactPerson && <span>Contact: {v.contactPerson}</span>}
          {place && <span className="[overflow-wrap:anywhere]">{place}</span>}
        </div>
      </div>
    )
  }
  const id = String(vendor)
  return (
    <p className="mt-1 text-xs text-gray-500">
      Vendor reference
      {id.length >= 8 ? ` · ${id.slice(0, 8)}…` : ''}
    </p>
  )
}

/** @param {{ meals: Record<string, unknown> | null | undefined }} props */
function MealsDetail({ meals }) {
  if (!meals || typeof meals !== 'object') return null
  const rows = []
  if (meals.breakfast) {
    rows.push({
      label: 'Breakfast',
      time: meals.breakfastTime,
      loc: meals.breakfastLocation,
      ven: meals.breakfastVendor,
    })
  }
  if (meals.lunch) {
    rows.push({ label: 'Lunch', time: meals.lunchTime, loc: meals.lunchLocation, ven: meals.lunchVendor })
  }
  if (meals.dinner) {
    rows.push({
      label: 'Dinner',
      time: meals.dinnerTime,
      loc: meals.dinnerLocation,
      ven: meals.dinnerVendor,
    })
  }
  if (!rows.length) return null
  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <UtensilsCrossed className="h-4 w-4 text-amber-600" />
        {rows.map((r) => (
          <span
            key={r.label}
            className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-100"
          >
            {r.label}
          </span>
        ))}
      </div>
      <div className="space-y-2">
        {rows.map((r) => {
          const timeLoc = [r.time, r.loc].filter((x) => x != null && String(x).trim()).join(' · ')
          return (
            <div key={r.label} className="rounded-lg border border-amber-100 bg-amber-50/35 px-3 py-2 text-xs">
              <p className="font-semibold text-amber-950">{r.label}</p>
              {timeLoc ? <p className="mt-1 text-amber-950/90">{timeLoc}</p> : null}
              {r.ven ? <VendorBlock vendor={r.ven} /> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function PackageDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pkg, setPkg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeDay, setActiveDay] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(null)

  useEffect(() => {
    setActiveDay(0)
    setLoading(true)
    setError(null)
    getPackageById(id)
      .then((res) => {
        const found = res.data?.data?.package
        if (!found) setError('Package not found')
        else setPkg(found)
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6 pb-10">
        <div className="h-9 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="aspect-[2/1] max-h-80 animate-pulse rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
          <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-100 bg-red-50/80 px-6 py-12 text-center">
        <p className="font-medium text-red-800">{error}</p>
        <button
          type="button"
          onClick={() => navigate(`${AGENCY_PANEL_BASE}/packages`)}
          className="mt-4 text-sm font-semibold text-primary-700 hover:underline"
        >
          Back to packages
        </button>
      </div>
    )
  }

  const cover = imgUrl(pkg.coverImage)
  const dest = destinationText(pkg.destination)
  const itinerary = pkg.itinerary || []
  const currentDay = itinerary[activeDay]
  const detailExperiences = currentDay ? getDetailExperiencesForDay(currentDay) : []
  const adminStatus = pkg.status && pkg.status !== 'approved' ? pkg.status : null
  const statusLabel =
    pkg.status === 'approved' ? 'Approved' : pkg.status === 'pending' ? 'Pending review' : pkg.status === 'rejected' ? 'Rejected' : pkg.status || '—'

  return (
    <div className="animate-fade-in space-y-8 pb-14">
      {/* Back — matches list pages; no edit in header */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => navigate(`${AGENCY_PANEL_BASE}/packages`)}
          className="group inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-primary-800"
        >
          <ArrowLeft size={18} className="transition group-hover:-translate-x-0.5" />
          Back to packages
        </button>
      </div>

      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 shadow-lg">
        <div className="relative aspect-[2/1] max-h-[min(420px,50vh)] min-h-[200px]">
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 text-primary-200/80">
              <Sparkles className="h-12 w-12 opacity-60" strokeWidth={1.25} />
              <span className="text-sm font-medium">No cover image</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                  pkg.isActive ? 'bg-emerald-500 text-white' : 'bg-white/95 text-red-600 ring-1 ring-white/50'
                }`}
              >
                {pkg.isActive ? (
                  <>
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Active listing
                  </>
                ) : (
                  <>
                    <PauseCircle className="h-3.5 w-3.5" />
                    Paused
                  </>
                )}
              </span>
              {adminStatus && (
                <span className="rounded-full bg-amber-400/95 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-950">
                  Review: {adminStatus}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-white drop-shadow-sm sm:text-3xl md:text-4xl">
              {pkg.title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/95">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur-sm">
                <Clock className="h-4 w-4 text-white/80" />
                {pkg.totalDays} days
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur-sm">
                <Users className="h-4 w-4 text-white/80" />
                Max {pkg.maxCapacity} guests
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 font-semibold tabular-nums backdrop-blur-sm">
                <IndianRupee className="h-4 w-4" />
                {Number(pkg.basePrice).toLocaleString('en-IN')}
                {pkg.currency && <span className="ml-1 text-xs font-normal opacity-90">{pkg.currency}</span>}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trip details + description */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="h-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ring-1 ring-gray-100/80">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-900">
              <MapPin className="h-4 w-4 text-primary-600" />
              Trip details
            </h2>
            <p className="mb-4 text-xs text-gray-500">Key facts for this package</p>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/50 px-3">
              <DetailRow icon={MapPin} label="Destination">
                {dest || <span className="text-gray-400">Not set</span>}
              </DetailRow>
              <DetailRow icon={Clock} label="Duration">
                {pkg.totalDays} {pkg.totalDays === 1 ? 'day' : 'days'}
              </DetailRow>
              <DetailRow icon={Users} label="Maximum group size">
                {pkg.maxCapacity} {pkg.maxCapacity === 1 ? 'guest' : 'guests'}
              </DetailRow>
              <DetailRow icon={IndianRupee} label="Base price">
                {Number(pkg.basePrice).toLocaleString('en-IN')} {pkg.currency || 'INR'}
              </DetailRow>
              <DetailRow icon={BadgeCheck} label="Listing status">
                {pkg.isActive ? 'Visible to your network' : 'Hidden — not offered to agents'}
              </DetailRow>
              <DetailRow icon={FileText} label="Admin review status">
                <span className="capitalize">{statusLabel}</span>
              </DetailRow>
              {pkg.rejectionReason?.trim() && (
                <DetailRow icon={AlertTriangle} label="Rejection reason" className="border-amber-100 bg-amber-50/40">
                  <span className="text-amber-950">{pkg.rejectionReason.trim()}</span>
                </DetailRow>
              )}
              {(pkg.reviewedAt || (pkg.reviewedBy && typeof pkg.reviewedBy === 'object')) && (
                <>
                  <DetailRow icon={CalendarDays} label="Reviewed at">
                    {formatDateTime(pkg.reviewedAt) || '—'}
                  </DetailRow>
                  <DetailRow icon={Users} label="Reviewed by">
                    {typeof pkg.reviewedBy === 'object' && pkg.reviewedBy !== null && 'name' in pkg.reviewedBy ? (
                      <>
                        {String(/** @type {{ name?: string }} */ (pkg.reviewedBy).name || '')}
                        {'email' in pkg.reviewedBy && pkg.reviewedBy.email ? (
                          <span className="block text-xs font-normal text-gray-500">
                            {String(/** @type {{ email?: string }} */ (pkg.reviewedBy).email)}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      '—'
                    )}
                  </DetailRow>
                </>
              )}
              <DetailRow icon={Clock3} label="Created">
                {formatDateTime(pkg.createdAt) || '—'}
              </DetailRow>
              <DetailRow icon={Clock3} label="Last updated">
                {formatDateTime(pkg.updatedAt) || '—'}
              </DetailRow>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="h-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ring-1 ring-gray-100/80">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-900">
              <FileText className="h-4 w-4 text-primary-600" />
              Description
            </h2>
            <p className="mb-3 text-xs text-gray-500">What travelers should know</p>
            {pkg.description?.trim() ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{pkg.description.trim()}</p>
            ) : (
              <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                No description has been added. Edit this package from the list to add one.
              </p>
            )}
          </div>
        </div>
      </div>

      {pkg.importantNotes?.length > 0 && (
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/40 p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-amber-950">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <h3 className="text-sm font-bold uppercase tracking-wide">Important notes</h3>
          </div>
          <ul className="space-y-2">
            {pkg.importantNotes.map((n, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-amber-950">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {pkg.images?.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <SectionLabel icon={ImagePlus}>Gallery</SectionLabel>
          <div className="-mx-1 flex gap-3 overflow-x-auto pb-1 pt-1">
            {pkg.images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setGalleryOpen(i)}
                className="group flex-shrink-0 overflow-hidden rounded-xl ring-2 ring-transparent transition hover:ring-primary-400"
              >
                <img
                  src={imgUrl(img)}
                  alt=""
                  className="h-28 w-40 object-cover transition duration-300 group-hover:scale-105 sm:h-32 sm:w-44"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {(pkg.inclusions?.length > 0 || pkg.exclusions?.length > 0) && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {pkg.inclusions?.length > 0 && (
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/90 to-white p-6 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-900">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Inclusions
              </h3>
              <ul className="space-y-2.5">
                {pkg.inclusions.map((inc, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-emerald-900/90">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    {inc}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {pkg.exclusions?.length > 0 && (
            <div className="rounded-2xl border border-rose-100 bg-gradient-to-b from-rose-50/90 to-white p-6 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-rose-900">
                <XCircle className="h-5 w-5 text-rose-500" />
                Exclusions
              </h3>
              <ul className="space-y-2.5">
                {pkg.exclusions.map((exc, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-rose-900/90">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                    {exc}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {itinerary.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-gray-100/80">
          <SectionLabel icon={CalendarDays}>Day-by-day itinerary</SectionLabel>

          <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
            {itinerary.map((day, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveDay(i)}
                className={`flex min-w-[5.75rem] shrink-0 flex-col items-center rounded-2xl px-4 py-2.5 text-center transition-all ${
                  activeDay === i
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-900/15'
                    : 'bg-slate-100 text-gray-700 hover:bg-slate-200'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase opacity-90">Day</span>
                <span className="text-xl font-bold leading-none">{day.day}</span>
                {(day.dateSuffix || formatDayDate(day.date)) && (
                  <span className={`mt-1 max-w-[5rem] truncate text-[10px] ${activeDay === i ? 'text-white/85' : 'text-gray-500'}`}>
                    {day.dateSuffix || formatDayDate(day.date)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {currentDay && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-bold text-gray-900">
                  Day {currentDay.day}
                  {currentDay.title ? ` — ${currentDay.title}` : ''}
                </h3>
                {formatDayDate(currentDay.date) && (
                  <span className="text-xs font-medium text-gray-500">{formatDayDate(currentDay.date)}</span>
                )}
              </div>
              {currentDay.description && (
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{currentDay.description}</p>
              )}
              <MealsDetail meals={currentDay.meals} />
              {currentDay.notes?.trim() && (
                <p className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Day notes: </span>
                  {currentDay.notes.trim()}
                </p>
              )}

              {detailExperiences.length > 0 ? (
                <div className="mt-6 space-y-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Activities & experiences</p>
                  {detailExperiences.map((ev, ei) => (
                    <div
                      key={ei}
                      className="overflow-hidden rounded-2xl border border-white bg-white shadow-sm ring-1 ring-gray-100"
                    >
                      {ev.images?.length > 0 && (
                        <div className="-mx-px flex gap-2 overflow-x-auto border-b border-gray-100 bg-gray-50/80 px-2 py-2 [-webkit-overflow-scrolling:touch]">
                          {ev.images.map((src, ii) => (
                            <img
                              key={ii}
                              src={imgUrl(src)}
                              alt=""
                              className="h-40 min-w-[220px] flex-shrink-0 rounded-lg object-cover sm:h-44 sm:min-w-[260px]"
                            />
                          ))}
                        </div>
                      )}
                      <div className="border-l-4 border-primary-500 p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h4 className="font-semibold text-gray-900">{ev.title}</h4>
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {ev.isHighlight && (
                              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-800 ring-1 ring-violet-200">
                                Highlight
                              </span>
                            )}
                            {ev.isOptional && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 ring-1 ring-slate-200">
                                Optional
                              </span>
                            )}
                            {(ev.category || ev.type) && (
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${experienceBadgeClass(ev)}`}
                              >
                                {humanizeCategory(ev.category || ev.type)}
                              </span>
                            )}
                          </div>
                        </div>
                        {ev.description && <p className="mt-2 text-sm text-gray-600">{ev.description}</p>}
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
                          {ev.startTime && (
                            <span className="inline-flex items-center gap-1">
                              <Clock3 size={12} className="text-primary-500" />
                              {ev.startTime}
                              {ev.endTime ? ` – ${ev.endTime}` : ''}
                            </span>
                          )}
                          {ev.durationStr && (
                            <span className="inline-flex items-center gap-1">
                              <Layers size={12} className="text-primary-500" />
                              {ev.durationStr}
                            </span>
                          )}
                          {ev.location && (
                            <span className="inline-flex items-center gap-1 [overflow-wrap:anywhere]">
                              <MapPinned size={12} className="shrink-0 text-primary-500" />
                              {ev.location}
                            </span>
                          )}
                          {ev.mapsLink && (
                            <a
                              href={ev.mapsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-primary-700 hover:underline"
                            >
                              <Link2 size={12} />
                              Maps
                            </a>
                          )}
                          {ev.videoUrl && (
                            <a
                              href={ev.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-primary-700 hover:underline"
                            >
                              <Video size={12} />
                              Video
                            </a>
                          )}
                        </div>
                        {(ev.difficulty || ev.minAge != null || ev.maxAge != null) && (
                          <p className="mt-2 text-xs text-gray-600">
                            {ev.difficulty && (
                              <span className="mr-3">
                                <span className="font-semibold text-gray-700">Difficulty: </span>
                                {humanizeCategory(ev.difficulty)}
                              </span>
                            )}
                            {(ev.minAge != null || ev.maxAge != null) && (
                              <span>
                                <span className="font-semibold text-gray-700">Age: </span>
                                {ev.minAge != null ? ev.minAge : '—'}–{ev.maxAge != null ? ev.maxAge : '—'}
                              </span>
                            )}
                          </p>
                        )}
                        {ev.whatToBring?.length > 0 && (
                          <div className="mt-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">What to bring</p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {ev.whatToBring.map((item, bi) => (
                                <span
                                  key={bi}
                                  className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-800 ring-1 ring-gray-200/80"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="mt-3 text-xs text-gray-600">
                          <span className="font-semibold text-gray-700">Pricing: </span>
                          {ev.includedInPrice ? 'Included in base price' : 'Not included in base price'}
                          {ev.extraCost != null && ev.extraCost > 0 && (
                            <span className="ml-2 tabular-nums text-gray-800">
                              + {Number(ev.extraCost).toLocaleString('en-IN')} {pkg.currency || 'INR'} extra
                            </span>
                          )}
                        </div>
                        {ev.vendorNotes?.trim() && (
                          <p className="mt-2 rounded-md border border-dashed border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600">
                            <span className="font-semibold text-gray-700">Vendor notes: </span>
                            {ev.vendorNotes.trim()}
                          </p>
                        )}
                        {ev.vendor ? <VendorBlock vendor={ev.vendor} /> : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm italic text-gray-500">No activities listed for this day.</p>
              )}
            </div>
          )}
        </div>
      )}

      {galleryOpen !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setGalleryOpen(null)}
          role="presentation"
        >
          <img
            src={imgUrl(pkg.images[galleryOpen])}
            alt=""
            className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
