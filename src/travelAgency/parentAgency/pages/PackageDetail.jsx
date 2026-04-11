import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronRight, MapPin, Clock, Users, IndianRupee,
  CheckCircle2, XCircle, CalendarDays, Clock3, MapPinned,
  Layers, ImagePlus, Store, Sparkles, AlertTriangle,
  UtensilsCrossed, FileText, BadgeCheck, PauseCircle,
  Link2, Video, MessageSquare,
} from 'lucide-react'
import { AGENCY_PANEL_BASE } from '@/travelAgency/agency/constants.js'
import { getPackageById } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { getDetailExperiencesForDay } from '@/travelAgency/parentAgency/utils/packageItineraryTransforms.js'
import { destinationText } from '@/travelAgency/parentAgency/utils/packageDisplay.js'
import { joinUploadUrl } from '@/shared/config/api.js'

const imgUrl = (path) => (path ? joinUploadUrl(path) : null)

const EVENT_TYPE_COLORS = {
  activity:      'bg-blue-50 text-blue-800 ring-blue-100',
  hotel_checkin: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
  hotel_checkout:'bg-orange-50 text-orange-800 ring-orange-100',
  transfer:      'bg-violet-50 text-violet-800 ring-violet-100',
  meal:          'bg-amber-50 text-amber-900 ring-amber-100',
  adventure:     'bg-sky-50 text-sky-900 ring-sky-100',
  sightseeing:   'bg-cyan-50 text-cyan-900 ring-cyan-100',
  cultural:      'bg-fuchsia-50 text-fuchsia-900 ring-fuchsia-100',
  food:          'bg-amber-50 text-amber-900 ring-amber-100',
  leisure:       'bg-teal-50 text-teal-900 ring-teal-100',
  transport:     'bg-violet-50 text-violet-800 ring-violet-100',
  accommodation: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
  shopping:      'bg-pink-50 text-pink-900 ring-pink-100',
  other:         'bg-slate-100 text-slate-700 ring-slate-200',
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-gray-500">
      {Icon && <Icon className="h-4 w-4 text-primary-500" strokeWidth={2} />}
      {children}
    </h2>
  )
}

function formatDayDate(raw) {
  if (raw == null) return null
  try {
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return null }
}

function formatDateTime(raw) {
  if (raw == null) return null
  try {
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch { return null }
}

function humanizeCategory(cat) {
  if (cat == null || cat === '') return ''
  return String(cat).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function experienceBadgeClass(ev) {
  const k = ev.category || ev.type
  return EVENT_TYPE_COLORS[k] || EVENT_TYPE_COLORS[ev.type] || EVENT_TYPE_COLORS.other
}

function VendorBlock({ vendor }) {
  if (vendor == null) return null
  if (typeof vendor === 'object' && vendor !== null && 'name' in vendor) {
    const v = vendor
    const typeLabel = v.type ? String(v.type).replace(/_/g, ' ') : ''
    const place = [v.city, v.address].filter(Boolean).join(' · ')
    return (
      <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-700">
        <p className="flex items-center gap-1.5 font-semibold text-gray-900">
          <Store className="h-3.5 w-3.5 shrink-0 text-gray-500" />{v.name}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-gray-500">
          {typeLabel && <span className="capitalize">{typeLabel}</span>}
          {v.phone && <span>{v.phone}</span>}
          {v.contactPerson && <span>Contact: {v.contactPerson}</span>}
          {place && <span className="[overflow-wrap:anywhere]">{place}</span>}
        </div>
      </div>
    )
  }
  const id = String(vendor)
  return <p className="mt-1 text-xs text-gray-400">Vendor ref{id.length >= 8 ? ` · ${id.slice(0, 8)}…` : ''}</p>
}

function MealsDetail({ meals }) {
  if (!meals || typeof meals !== 'object') return null
  const rows = []
  if (meals.breakfast) rows.push({ label: 'Breakfast', time: meals.breakfastTime, loc: meals.breakfastLocation, ven: meals.breakfastVendor })
  if (meals.lunch)     rows.push({ label: 'Lunch',     time: meals.lunchTime,     loc: meals.lunchLocation,     ven: meals.lunchVendor })
  if (meals.dinner)    rows.push({ label: 'Dinner',    time: meals.dinnerTime,    loc: meals.dinnerLocation,    ven: meals.dinnerVendor })
  if (!rows.length) return null
  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <UtensilsCrossed className="h-3.5 w-3.5 text-amber-600" />
        {rows.map(r => (
          <span key={r.label} className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-100">
            {r.label}
          </span>
        ))}
      </div>
      <div className="space-y-2">
        {rows.map(r => {
          const timeLoc = [r.time, r.loc].filter(x => x != null && String(x).trim()).join(' · ')
          return (
            <div key={r.label} className="rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2 text-xs">
              <p className="font-semibold text-amber-950">{r.label}</p>
              {timeLoc && <p className="mt-0.5 text-amber-900/80">{timeLoc}</p>}
              {r.ven && <VendorBlock vendor={r.ven} />}
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
      .then(res => {
        const found = res.data?.data?.package
        if (!found) setError('Package not found')
        else setPkg(found)
      })
      .catch(err => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="animate-fade-in space-y-5 pb-10">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-gray-200" />
        <div className="aspect-[3/1] max-h-72 animate-pulse rounded-2xl bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[1,2,3,4].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
        <div className="h-32 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-100 bg-red-50 px-6 py-12 text-center">
        <p className="font-medium text-red-800">{error}</p>
        <button type="button" onClick={() => navigate(`${AGENCY_PANEL_BASE}/packages`)} className="mt-4 text-sm font-semibold text-primary-700 hover:underline">
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
  const statusLabel = pkg.status === 'approved' ? 'Approved' : pkg.status === 'pending' ? 'Pending review' : pkg.status === 'rejected' ? 'Rejected' : pkg.status || '—'
  const statusCls = pkg.status === 'approved' ? 'bg-emerald-50 text-emerald-800 ring-emerald-100' : pkg.status === 'rejected' ? 'bg-red-50 text-red-800 ring-red-100' : 'bg-amber-50 text-amber-900 ring-amber-100'

  return (
    <div className="animate-fade-in space-y-6 pb-16">

      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <Link to={`${AGENCY_PANEL_BASE}/packages`} className="text-gray-500 hover:text-gray-800 transition-colors">
          Packages
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
        <span className="truncate text-gray-900 max-w-[240px]" title={pkg.title}>{pkg.title}</span>
      </nav>

      {/* Cover image */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 shadow-sm">
        <div className="relative aspect-[3/1] max-h-[min(320px,40vh)] min-h-[160px]">
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-800 to-slate-900 text-slate-400">
              <Sparkles className="h-10 w-10 opacity-40" strokeWidth={1.25} />
              <span className="text-xs font-medium">No cover image</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {/* Overlay: title + badges */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
            <h1 className="text-xl font-bold text-white sm:text-2xl">{pkg.title}</h1>
            {dest && (
              <p className="mt-1 flex items-center gap-1 text-sm text-white/75">
                <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />{dest}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${pkg.isActive ? 'bg-emerald-500 text-white' : 'bg-white/90 text-red-600'}`}>
                {pkg.isActive ? <><BadgeCheck className="h-3 w-3" />Active</> : <><PauseCircle className="h-3 w-3" />Paused</>}
              </span>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusCls}`}>
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Community button — top right */}
          <div className="absolute right-4 top-4">
            <button
              type="button"
              onClick={() => navigate(`${AGENCY_PANEL_BASE}/packages/${pkg._id}/community?title=${encodeURIComponent(pkg.title || '')}`)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
              Community
            </button>
          </div>
        </div>
      </div>

      {/* Key stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
            <Clock className="h-3.5 w-3.5 text-gray-400" /> Duration
          </p>
          <p className="mt-1.5 text-lg font-bold text-gray-900">{pkg.totalDays}<span className="ml-1 text-sm font-normal text-gray-500">days</span></p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
            <IndianRupee className="h-3.5 w-3.5 text-gray-400" /> Base price
          </p>
          <p className="mt-1.5 text-lg font-bold tabular-nums text-gray-900">
            ₹{Number(pkg.basePrice).toLocaleString('en-IN')}
            {pkg.currency && <span className="ml-1 text-xs font-normal text-gray-500">{pkg.currency}</span>}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
            <Users className="h-3.5 w-3.5 text-gray-400" /> Max capacity
          </p>
          <p className="mt-1.5 text-lg font-bold text-gray-900">{pkg.maxCapacity}<span className="ml-1 text-sm font-normal text-gray-500">guests</span></p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
            <CalendarDays className="h-3.5 w-3.5 text-gray-400" /> Created
          </p>
          <p className="mt-1.5 text-sm font-semibold text-gray-900">{formatDateTime(pkg.createdAt) || '—'}</p>
        </div>
      </div>

      {/* Rejection / review info */}
      {(pkg.rejectionReason?.trim() || pkg.reviewedAt) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5" /> Review info
          </div>
          <div className="mt-2 space-y-1 text-sm text-amber-900">
            {pkg.rejectionReason?.trim() && <p><span className="font-medium">Reason: </span>{pkg.rejectionReason.trim()}</p>}
            {pkg.reviewedAt && <p><span className="font-medium">Reviewed: </span>{formatDateTime(pkg.reviewedAt)}</p>}
            {typeof pkg.reviewedBy === 'object' && pkg.reviewedBy?.name && (
              <p><span className="font-medium">By: </span>{pkg.reviewedBy.name}</p>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {pkg.description?.trim() && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <SectionTitle icon={FileText}>Description</SectionTitle>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{pkg.description.trim()}</p>
        </div>
      )}

      {/* Important notes */}
      {pkg.importantNotes?.length > 0 && (
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/40 p-5 shadow-sm">
          <SectionTitle icon={AlertTriangle}>Important notes</SectionTitle>
          <ul className="space-y-2">
            {pkg.importantNotes.map((n, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-amber-950">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Inclusions / Exclusions */}
      {(pkg.inclusions?.length > 0 || pkg.exclusions?.length > 0) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {pkg.inclusions?.length > 0 && (
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/80 to-white p-5 shadow-sm">
              <SectionTitle icon={CheckCircle2}>Inclusions</SectionTitle>
              <ul className="space-y-2">
                {pkg.inclusions.map((inc, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-emerald-900/90">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />{inc}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {pkg.exclusions?.length > 0 && (
            <div className="rounded-2xl border border-rose-100 bg-gradient-to-b from-rose-50/80 to-white p-5 shadow-sm">
              <SectionTitle icon={XCircle}>Exclusions</SectionTitle>
              <ul className="space-y-2">
                {pkg.exclusions.map((exc, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-rose-900/90">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />{exc}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Gallery */}
      {pkg.images?.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <SectionTitle icon={ImagePlus}>Gallery</SectionTitle>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {pkg.images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setGalleryOpen(i)}
                className="group flex-shrink-0 overflow-hidden rounded-xl ring-2 ring-transparent transition hover:ring-primary-400"
              >
                <img src={imgUrl(img)} alt="" className="h-28 w-40 object-cover transition duration-300 group-hover:scale-105 sm:h-32 sm:w-44" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Itinerary */}
      {itinerary.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <SectionTitle icon={CalendarDays}>Day-by-day itinerary</SectionTitle>

          {/* Day tabs */}
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
            {itinerary.map((day, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveDay(i)}
                className={`flex min-w-[5.5rem] shrink-0 flex-col items-center rounded-xl px-4 py-2.5 text-center transition-all ${
                  activeDay === i
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-900/15'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase opacity-80">Day</span>
                <span className="text-xl font-bold leading-none">{day.day}</span>
                {(day.dateSuffix || formatDayDate(day.date)) && (
                  <span className={`mt-1 max-w-[5rem] truncate text-[10px] ${activeDay === i ? 'text-white/80' : 'text-gray-400'}`}>
                    {day.dateSuffix || formatDayDate(day.date)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active day content */}
          {currentDay && (
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-bold text-gray-900">
                  Day {currentDay.day}{currentDay.title ? ` — ${currentDay.title}` : ''}
                </h3>
                {formatDayDate(currentDay.date) && (
                  <span className="text-xs text-gray-400">{formatDayDate(currentDay.date)}</span>
                )}
              </div>
              {currentDay.description && (
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{currentDay.description}</p>
              )}
              <MealsDetail meals={currentDay.meals} />
              {currentDay.notes?.trim() && (
                <p className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">Day notes: </span>{currentDay.notes.trim()}
                </p>
              )}

              {detailExperiences.length > 0 ? (
                <div className="mt-5 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Activities & experiences</p>
                  {detailExperiences.map((ev, ei) => (
                    <div key={ei} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                      {ev.images?.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto border-b border-gray-100 bg-gray-50 px-2 py-2">
                          {ev.images.map((src, ii) => (
                            <img key={ii} src={imgUrl(src)} alt="" className="h-36 min-w-[200px] flex-shrink-0 rounded-lg object-cover sm:h-40 sm:min-w-[240px]" />
                          ))}
                        </div>
                      )}
                      <div className="border-l-4 border-primary-400 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h4 className="font-semibold text-gray-900">{ev.title}</h4>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {ev.isHighlight && (
                              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-800 ring-1 ring-violet-200">Highlight</span>
                            )}
                            {ev.isOptional && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-600 ring-1 ring-gray-200">Optional</span>
                            )}
                            {(ev.category || ev.type) && (
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${experienceBadgeClass(ev)}`}>
                                {humanizeCategory(ev.category || ev.type)}
                              </span>
                            )}
                          </div>
                        </div>
                        {ev.description && <p className="mt-1.5 text-sm text-gray-600">{ev.description}</p>}
                        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          {ev.startTime && (
                            <span className="inline-flex items-center gap-1">
                              <Clock3 size={11} className="text-primary-400" />
                              {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}
                            </span>
                          )}
                          {ev.durationStr && (
                            <span className="inline-flex items-center gap-1">
                              <Layers size={11} className="text-primary-400" />{ev.durationStr}
                            </span>
                          )}
                          {ev.location && (
                            <span className="inline-flex items-center gap-1 [overflow-wrap:anywhere]">
                              <MapPinned size={11} className="shrink-0 text-primary-400" />{ev.location}
                            </span>
                          )}
                          {ev.mapsLink && (
                            <a href={ev.mapsLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary-700 hover:underline">
                              <Link2 size={11} />Maps
                            </a>
                          )}
                          {ev.videoUrl && (
                            <a href={ev.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary-700 hover:underline">
                              <Video size={11} />Video
                            </a>
                          )}
                        </div>
                        {(ev.difficulty || ev.minAge != null || ev.maxAge != null) && (
                          <p className="mt-2 text-xs text-gray-500">
                            {ev.difficulty && <span className="mr-3"><span className="font-medium text-gray-700">Difficulty: </span>{humanizeCategory(ev.difficulty)}</span>}
                            {(ev.minAge != null || ev.maxAge != null) && (
                              <span>Age {ev.minAge != null ? ev.minAge : '—'}–{ev.maxAge != null ? ev.maxAge : '—'}</span>
                            )}
                          </p>
                        )}
                        {ev.whatToBring?.length > 0 && (
                          <div className="mt-2.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">What to bring</p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {ev.whatToBring.map((item, bi) => (
                                <span key={bi} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 ring-1 ring-gray-200/80">{item}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                          <span className="font-medium text-gray-700">Pricing: </span>
                          {ev.includedInPrice ? 'Included in base price' : 'Not included'}
                          {ev.extraCost != null && ev.extraCost > 0 && (
                            <span className="ml-2 tabular-nums text-gray-800">+ {Number(ev.extraCost).toLocaleString('en-IN')} {pkg.currency || 'INR'} extra</span>
                          )}
                        </p>
                        {ev.vendorNotes?.trim() && (
                          <p className="mt-2 rounded-md border border-dashed border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600">
                            <span className="font-medium text-gray-700">Vendor notes: </span>{ev.vendorNotes.trim()}
                          </p>
                        )}
                        {ev.vendor && <VendorBlock vendor={ev.vendor} />}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-400 italic">No activities listed for this day.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Gallery lightbox */}
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
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
