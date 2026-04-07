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
  Edit2,
  ImagePlus,
  Store,
  Sparkles,
  AlertTriangle,
} from 'lucide-react'
import { AGENCY_PANEL_BASE } from '@/travelAgency/agency/constants.js'
import { listMyPackages } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { getDisplayEventsForDay } from '@/travelAgency/parentAgency/utils/packageItineraryTransforms.js'
import { destinationText } from '@/travelAgency/parentAgency/utils/packageDisplay.js'

const BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const imgUrl = (path) => (path ? `${BASE}/${path.replace(/\\/g, '/')}` : null)

const EVENT_TYPE_COLORS = {
  activity: 'bg-blue-50 text-blue-800 ring-blue-100',
  hotel_checkin: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
  hotel_checkout: 'bg-orange-50 text-orange-800 ring-orange-100',
  transfer: 'bg-violet-50 text-violet-800 ring-violet-100',
  meal: 'bg-amber-50 text-amber-900 ring-amber-100',
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

export default function PackageDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pkg, setPkg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeDay, setActiveDay] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(null)

  useEffect(() => {
    listMyPackages()
      .then((res) => {
        const found = (res.data?.data?.packages || []).find((p) => p._id === id)
        if (!found) setError('Package not found')
        else setPkg(found)
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse space-y-6 px-1 pb-10 pt-2">
        <div className="h-10 w-40 rounded-lg bg-gray-200" />
        <div className="aspect-[21/9] rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200" />
        <div className="h-8 w-2/3 rounded-lg bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-100" />
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
  const displayEvents = currentDay ? getDisplayEventsForDay(currentDay) : []

  return (
    <div className="animate-fade-in mx-auto max-w-4xl space-y-10 pb-14 pt-2">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition hover:border-primary-200 hover:text-primary-800"
        >
          <ArrowLeft size={16} className="transition group-hover:-translate-x-0.5" />
          Back
        </button>
        <button
          type="button"
          onClick={() => navigate(`${AGENCY_PANEL_BASE}/packages`, { state: { editId: pkg._id } })}
          className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary-900/15 transition hover:bg-primary-700"
        >
          <Edit2 size={14} />
          Edit package
        </button>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-200/80 bg-gray-900 shadow-xl shadow-gray-300/40">
        <div className="aspect-[21/9] min-h-[200px] sm:min-h-[260px]">
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 text-primary-200/80">
              <Sparkles className="h-12 w-12 opacity-60" strokeWidth={1.25} />
              <span className="text-sm font-medium">No cover image</span>
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                pkg.isActive ? 'bg-emerald-500 text-white' : 'bg-white/95 text-red-600 ring-1 ring-white/50'
              }`}
            >
              {pkg.isActive ? 'Live' : 'Inactive'}
            </span>
          </div>
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-white drop-shadow-sm sm:text-3xl md:text-4xl">
            {pkg.title}
          </h1>
          {dest && (
            <div className="mt-3 flex gap-2 border-l-2 border-white/40 pl-3">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-white/80" aria-hidden />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">Destination</p>
                <p className="mt-0.5 max-w-3xl text-sm font-medium leading-relaxed text-white/95 [overflow-wrap:anywhere] sm:text-base">
                  {dest}
                </p>
              </div>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/90">
            {pkg.totalDays && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-white/70" />
                {pkg.totalDays} days
              </span>
            )}
            {pkg.maxCapacity && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-white/70" />
                Up to {pkg.maxCapacity} guests
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 font-semibold tabular-nums backdrop-blur-sm">
              <IndianRupee className="h-4 w-4" />
              {Number(pkg.basePrice).toLocaleString('en-IN')}
              {pkg.currency && <span className="ml-1 text-xs font-normal opacity-90">{pkg.currency}</span>}
            </span>
          </div>
        </div>
      </div>

      {pkg.description && (
        <div className="rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-sm ring-1 ring-gray-100/80">
          <SectionLabel icon={Sparkles}>Overview</SectionLabel>
          <p className="text-base leading-relaxed text-gray-700">{pkg.description}</p>
        </div>
      )}

      {pkg.importantNotes?.length > 0 && (
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/30 p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-amber-900">
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
        <div>
          <SectionLabel icon={ImagePlus}>Gallery</SectionLabel>
          <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
            {pkg.images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setGalleryOpen(i)}
                className="group flex-shrink-0 overflow-hidden rounded-2xl ring-2 ring-transparent transition hover:ring-primary-400"
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
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/80 to-white p-6 shadow-sm">
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
            <div className="rounded-2xl border border-rose-100 bg-gradient-to-b from-rose-50/80 to-white p-6 shadow-sm">
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
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-100/80">
          <SectionLabel icon={CalendarDays}>Itinerary</SectionLabel>

          <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
            {itinerary.map((day, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveDay(i)}
                className={`flex min-w-[5.5rem] shrink-0 flex-col items-center rounded-2xl px-4 py-2.5 text-center transition-all ${
                  activeDay === i
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-900/20'
                    : 'bg-slate-100 text-gray-700 hover:bg-slate-200'
                }`}
              >
                <span className="text-xs font-semibold opacity-80">Day</span>
                <span className="text-lg font-bold leading-none">{day.day}</span>
                {day.dateSuffix && (
                  <span className={`mt-1 text-[10px] ${activeDay === i ? 'text-white/80' : 'text-gray-500'}`}>
                    {day.dateSuffix}
                  </span>
                )}
              </button>
            ))}
          </div>

          {currentDay && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 sm:p-6">
              <h3 className="text-lg font-bold text-gray-900">
                Day {currentDay.day}
                {currentDay.dateSuffix ? ` · ${currentDay.dateSuffix}` : ''}
                {currentDay.title ? ` — ${currentDay.title}` : ''}
              </h3>
              {currentDay.description && (
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{currentDay.description}</p>
              )}

              {displayEvents.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {displayEvents.map((ev, ei) => (
                    <div
                      key={ei}
                      className="overflow-hidden rounded-2xl border border-white bg-white shadow-sm ring-1 ring-gray-100"
                    >
                      {ev.image && (
                        <img src={imgUrl(ev.image)} alt="" className="h-44 w-full object-cover sm:h-48" />
                      )}
                      <div className="border-l-4 border-primary-500 p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h4 className="font-semibold text-gray-900">{ev.title}</h4>
                          {ev.type && (
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${EVENT_TYPE_COLORS[ev.type] || EVENT_TYPE_COLORS.other}`}
                            >
                              {ev.type.replace('_', ' ')}
                            </span>
                          )}
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
                          {ev.duration && (
                            <span className="inline-flex items-center gap-1">
                              <Layers size={12} className="text-primary-500" />
                              {ev.duration}
                            </span>
                          )}
                          {ev.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPinned size={12} className="text-primary-500" />
                              {ev.location}
                            </span>
                          )}
                          {ev.vendor && (
                            <span className="inline-flex items-center gap-1 font-medium text-primary-700">
                              <Store size={12} />
                              {ev.vendor?.name || 'Vendor assigned'}
                              {ev.vendor?.type && ` · ${ev.vendor.type.replace('_', ' ')}`}
                            </span>
                          )}
                        </div>
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
