import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Package, MapPin, User, Clock, Calendar,
  Layers, Ticket, IndianRupee, MessageSquare, Star,
  ShieldAlert, ShieldCheck,
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import Loader from '@/shared/components/Loader.jsx'

const getFileUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  const base = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
  return `${base}/${String(path).replace(/^\//, '')}`
}

const dayActivities = (day) => {
  if (!day) return []
  if (Array.isArray(day.experiences) && day.experiences.length) return day.experiences
  if (Array.isArray(day.events) && day.events.length) return day.events
  return []
}

const activityTitle = (ev) => ev?.name || ev?.title || 'Activity'

export default function AdminPackageDetail() {
  const { packageId } = useParams()
  const navigate = useNavigate()
  const [pkg, setPkg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    adminApi.listPackages({ packageId })
      .then(async () => {
        // listPackages doesn't return single — use the packages list and find by id
        // Actually fetch via the packages list filtered — or use a direct approach
      })
      .catch(() => {})

    // Use listPackages with a large limit and find the package
    adminApi.listPackages({ limit: 1000 })
      .then((res) => {
        if (!cancelled) {
          const list = res.data?.data?.packages || []
          const found = list.find((p) => p._id === packageId)
          if (found) { setPkg(found); setLoading(false) }
          else { setErr('Package not found.'); setLoading(false) }
        }
      })
      .catch(() => { if (!cancelled) { setErr('Could not load package.'); setLoading(false) } })

    return () => { cancelled = true }
  }, [packageId])

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader size="lg" />
      </div>
    )
  }

  if (err || !pkg) {
    return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err || 'Package not found.'}</div>
  }

  const price = Number(pkg.basePrice) || 0

  return (
    <div className="animate-fade-in space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/admin/packages')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50" aria-label="Back">
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">{pkg.title}</h1>
            {pkg.destination && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-700">
                <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />{pkg.destination}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Link to={`/admin/packages/${packageId}/bookings`}
            className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50">
            <Ticket className="h-3.5 w-3.5" strokeWidth={2} /> Bookings
          </Link>
          <Link to={`/admin/packages/${packageId}/whitelabels`}
            className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50">
            <Layers className="h-3.5 w-3.5" strokeWidth={2} /> Whitelabels
          </Link>
          <Link to={`/admin/packages/${packageId}/community`}
            className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50">
            <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} /> Community
          </Link>
          <Link to={`/admin/packages/${packageId}/reviews`}
            className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50">
            <Star className="h-3.5 w-3.5" strokeWidth={2} /> Reviews
          </Link>
        </div>
      </div>

      {/* Summary */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-sm leading-relaxed text-gray-600">{pkg.description?.trim() || 'No description provided.'}</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-800">
                <Clock className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />{pkg.totalDays ?? '—'} days
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-800">
                <User className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />Max {pkg.maxCapacity ?? '—'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-800">
                <Package className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />{pkg.currency || 'INR'}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium ${pkg.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-gray-200 bg-gray-100 text-gray-700'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${pkg.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                {pkg.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-800">
                <Ticket className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
                {Number(pkg.bookingCount) || 0} booking{(Number(pkg.bookingCount) || 0) === 1 ? '' : 's'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-800">
                <Layers className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
                {Number(pkg.whitelabelCount) || 0} whitelabel{(Number(pkg.whitelabelCount) || 0) === 1 ? '' : 's'}
              </span>
              {pkg.isSuspended && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Suspended
                </span>
              )}
            </div>
          </div>
          <div className="min-w-[160px] shrink-0 rounded-xl border border-gray-200 bg-gray-50/80 px-5 py-4 text-center">
            <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Base price</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">₹{price.toLocaleString('en-IN')}</div>
            <div className="mt-0.5 text-[11px] text-gray-500">Per person</div>
          </div>
        </div>
      </section>

      {/* Cover & gallery */}
      {(pkg.coverImage || pkg.images?.length > 0) && (
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">Cover & gallery</h3>
          <div className="flex flex-wrap gap-2">
            {pkg.coverImage && <img src={getFileUrl(pkg.coverImage)} alt="" className="h-24 w-32 rounded-lg border border-gray-200 object-cover" />}
            {pkg.images?.map((img, i) => <img key={i} src={getFileUrl(img)} alt="" className="h-24 w-32 rounded-lg border border-gray-200 object-cover" />)}
          </div>
        </section>
      )}

      {/* Parent agency */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">Parent agency</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="text-[11px] font-medium text-gray-500">Name</div>
            <div className="mt-0.5 text-sm font-semibold text-gray-900">{pkg.createdBy?.name || '—'}</div>
            <div className="mt-1 text-xs font-medium text-primary-700">{pkg.createdBy?.agentCode || '—'}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="text-[11px] font-medium text-gray-500">Email</div>
            <div className="mt-0.5 truncate text-sm font-medium text-gray-900">{pkg.createdBy?.email || '—'}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="text-[11px] font-medium text-gray-500">Phone</div>
            <div className="mt-0.5 text-sm font-medium text-gray-900">{pkg.createdBy?.phone || '—'}</div>
          </div>
        </div>
      </section>

      {/* Inclusions / Exclusions / Notes */}
      {(pkg.inclusions?.length > 0 || pkg.exclusions?.length > 0 || pkg.importantNotes?.length > 0) && (
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {pkg.inclusions?.length > 0 && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <h4 className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Inclusions</h4>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700">
                  {pkg.inclusions.map((line, i) => <li key={i}>{line}</li>)}
                </ul>
              </div>
            )}
            {pkg.exclusions?.length > 0 && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <h4 className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Exclusions</h4>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700">
                  {pkg.exclusions.map((line, i) => <li key={i}>{line}</li>)}
                </ul>
              </div>
            )}
            {pkg.importantNotes?.length > 0 && (
              <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-3 md:col-span-3">
                <h4 className="text-[11px] font-medium uppercase tracking-wide text-amber-900/80">Important notes</h4>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-950/90">
                  {pkg.importantNotes.map((line, i) => <li key={i}>{line}</li>)}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Itinerary timeline */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">Itinerary</h3>
          <span className="text-xs text-gray-400">{pkg.itinerary?.length || 0} days</span>
        </div>
        {pkg.itinerary?.length ? (
          <div className="relative">
            <div className="absolute left-[18px] top-0 h-full w-px bg-gray-200" />
            <div className="space-y-0">
              {pkg.itinerary.map((day, idx) => {
                const acts = dayActivities(day)
                return (
                  <div key={idx} className="relative pl-12 pb-6 last:pb-0">
                    <div className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white ring-4 ring-white">
                      {day.day ?? idx + 1}
                    </div>
                    <div className="mb-2 flex items-baseline gap-2 pt-1">
                      <span className="text-sm font-semibold text-gray-900">{day.title || `Day ${day.day ?? idx + 1}`}</span>
                      {day.dateSuffix && <span className="text-[11px] text-gray-400">{day.dateSuffix}</span>}
                    </div>
                    {day.description && <p className="mb-3 text-xs leading-relaxed text-gray-500">{day.description}</p>}
                    {acts.length > 0 && (
                      <div className="space-y-2">
                        {acts.map((ev, eIdx) => (
                          <div key={eIdx} className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                            <div className="flex flex-col items-center pt-0.5">
                              <div className="h-2 w-2 rounded-full bg-primary-500 ring-2 ring-primary-100" />
                              {eIdx < acts.length - 1 && <div className="mt-1 w-px flex-1 bg-gray-200" />}
                            </div>
                            <div className="min-w-0 flex-1 pb-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-gray-900">{activityTitle(ev)}</span>
                                {(ev.category || ev.type) && (
                                  <span className="rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium capitalize text-primary-700 ring-1 ring-primary-100">{ev.category || ev.type}</span>
                                )}
                                {ev.startTime && <span className="text-[11px] text-gray-400">{ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}</span>}
                              </div>
                              {ev.location && <p className="mt-0.5 text-[11px] text-gray-400">📍 {ev.location}</p>}
                              {ev.description && <p className="mt-1 text-[11px] leading-snug text-gray-500">{ev.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {!acts.length && <p className="text-xs italic text-gray-400">No activities scheduled</p>}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No itinerary data.</p>
        )}
      </section>
    </div>
  )
}
