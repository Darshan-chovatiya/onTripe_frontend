import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ChevronRight,
  Loader2,
  Ticket,
  User,
  MapPin,
  Calendar,
  Package,
  IndianRupee,
  Clock,
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'

const getFileUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  const base = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
  return `${base}/${String(path).replace(/^\//, '')}`
}

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=120'

function paymentBadgeClass(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'paid') return 'border-emerald-200 bg-emerald-50 text-emerald-900'
  if (s === 'partial') return 'border-sky-200 bg-sky-50 text-sky-900'
  if (s === 'refunded') return 'border-violet-200 bg-violet-50 text-violet-900'
  if (s === 'pending') return 'border-amber-200 bg-amber-50 text-amber-900'
  return 'border-gray-200 bg-gray-100 text-gray-700'
}

function bookingStatusBadgeClass(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'confirmed') return 'border-emerald-200 bg-emerald-50 text-emerald-900'
  if (s === 'ongoing') return 'border-sky-200 bg-sky-50 text-sky-900'
  if (s === 'completed') return 'border-gray-200 bg-gray-100 text-gray-800'
  if (s === 'cancelled') return 'border-red-200 bg-red-50 text-red-900'
  return 'border-gray-200 bg-gray-100 text-gray-700'
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

export default function PackageBookings() {
  const { packageId } = useParams()
  const { toast } = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast

  const [loading, setLoading] = useState(true)
  const [pkg, setPkg] = useState(null)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 50

  const load = useCallback(async () => {
    if (!packageId) return
    setLoading(true)
    try {
      const { data } = await adminApi.listBookingsByPackage(packageId, { page, limit })
      if (data?.success && data.data) {
        setPkg(data.data.package || null)
        setRows(Array.isArray(data.data.bookings) ? data.data.bookings : [])
        setTotal(Number(data.data.total) || 0)
        setTotalPages(Math.max(1, Number(data.data.totalPages) || 1))
      } else {
        setPkg(null)
        setRows([])
        setTotal(0)
        setTotalPages(1)
      }
    } catch {
      toastRef.current.error('Could not load bookings')
      setPkg(null)
      setRows([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [packageId, page])

  useEffect(() => {
    load()
  }, [load])

  const coverUrl = pkg?.coverImage ? getFileUrl(pkg.coverImage) : null

  if (loading && !pkg) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" strokeWidth={2} />
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-4">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link to="/admin/packages" className="font-medium text-primary-700 transition-colors hover:text-primary-800">
          Packages Management
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
        <span className="max-w-[min(100vw-8rem,280px)] truncate font-medium text-gray-800" title={pkg?.title}>
          {pkg?.title || 'Package'}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
        <span className="font-semibold text-gray-900">Bookings</span>
      </nav>

      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Package bookings</h1>
        <p className="mt-1 text-sm text-gray-500">
          {pkg?.title ? (
            <>
              Reservations and payments for{' '}
              <span className="font-medium text-gray-800">{pkg.title}</span>
              {pkg.destination ? (
                <span className="text-gray-400"> · {pkg.destination}</span>
              ) : null}
              .
            </>
          ) : (
            'View every booking tied to this package inventory.'
          )}
        </p>
      </div>

      {/* Source package — matches inventory context (admin packages / whitelabels style) */}
      {pkg ? (
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-4 py-3">
            <Package className="h-3.5 w-3.5 text-primary-600" strokeWidth={2} />
            <h2 className="text-sm font-semibold text-gray-900">Package details</h2>
          </div>
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
            <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 sm:h-20 sm:w-36">
              <img
                src={coverUrl || PLACEHOLDER_IMG}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER_IMG
                }}
              />
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
                      {pkg.totalDays} days
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-0.5 font-medium tabular-nums text-gray-900">
                    <IndianRupee className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
                    {Number(pkg.basePrice || 0).toLocaleString('en-IN')} {pkg.currency || 'INR'}
                  </span>
                  {pkg.maxCapacity != null ? (
                    <span className="inline-flex items-center gap-0.5">
                      <User className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
                      Max {pkg.maxCapacity}
                    </span>
                  ) : null}
                </div>
              </div>
              {pkg.description ? (
                <p className="line-clamp-2 text-xs leading-relaxed text-gray-600">{pkg.description}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-2 py-1.5 text-xs">
                <span className="font-medium text-gray-500">Parent agency</span>
                <span className="font-semibold text-gray-900">{pkg.createdBy?.name || '—'}</span>
                <span className="text-gray-400">·</span>
                <span className="truncate text-gray-600">{pkg.createdBy?.email || '—'}</span>
                <span className="font-medium text-primary-700">{pkg.createdBy?.agentCode || '—'}</span>
                <span
                  className={`ml-auto inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                    pkg.isActive
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-gray-200 bg-gray-100 text-gray-700'
                  }`}
                >
                  {pkg.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Bookings table — matches Packages Management */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 shrink-0 text-primary-600" strokeWidth={2} />
                <h2 className="text-base font-semibold text-gray-900">Booking list</h2>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {pkg?.title ? (
                  <>
                    All booking records for this package
                    <span className="font-medium text-gray-700"> · {pkg.title}</span>
                  </>
                ) : (
                  'All booking records for this package.'
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Total</span>
              <span className="text-sm font-semibold tabular-nums text-gray-900">{total}</span>
            </div>
          </div>
        </div>

        {loading && rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" strokeWidth={2} />
            <p className="mt-4 text-xs text-gray-500">Loading bookings…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <Ticket className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-gray-900">No bookings yet</p>
            <p className="mt-1 text-sm text-gray-500">There are no bookings for this package.</p>
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            {loading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" strokeWidth={2} />
              </div>
            ) : null}
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Booked by</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Customer</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Booking ID</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Booked on</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Travel date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Travelers</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Amount</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Payment</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((b) => (
                  <tr key={String(b._id)} className="group transition-colors hover:bg-gray-50/80">
                    <td className="max-w-[220px] px-4 py-3">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-600">
                          {initials(b.bookedBy?.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-gray-900">{b.bookedBy?.name || '—'}</div>
                          <div className="truncate text-xs text-gray-500">{b.bookedBy?.email || '—'}</div>
                          <div className="truncate text-xs font-medium text-primary-700">{b.bookedBy?.agentCode || '—'}</div>
                        </div>
                      </div>
                    </td>
                     <td className="max-w-[200px] px-4 py-3">
                      <div className="truncate font-medium text-gray-900">{b.customer?.name || '—'}</div>
                      <div className="truncate text-xs text-gray-500">{b.customer?.phone || b.customer?.email || '—'}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-gray-900">
                      {b.bookingId || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
                        {b.createdAt ? new Date(b.createdAt).toLocaleString() : '—'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-800">
                      {b.travelDate ? new Date(b.travelDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-gray-800">{b.travelerCount ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums text-gray-900">
                      ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-semibold capitalize ${paymentBadgeClass(
                          b.paymentStatus
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                        {b.paymentStatus || '—'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-semibold capitalize ${bookingStatusBadgeClass(
                          b.bookingStatus
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                        {b.bookingStatus || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 ? (
          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-gray-500">
              {total > 0 ? (
                <>
                  Page <span className="font-medium text-gray-800">{page}</span> of{' '}
                  <span className="font-medium text-gray-800">{totalPages}</span>
                  <span className="text-gray-400"> · </span>
                  {total} booking{total === 1 ? '' : 's'}
                </>
              ) : (
                'No results'
              )}
            </span>
            {totalPages > 1 ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
