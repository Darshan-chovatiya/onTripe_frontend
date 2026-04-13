import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  ChevronRight,
  Ticket,
  Package as PackageIcon,
  Search,
  ChevronLeft,
} from 'lucide-react'
import axios from 'axios'
import axiosInstance from '@/shared/services/axiosInstance.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import { joinUploadUrl } from '@/shared/config/api.js'

const getFullUrl = (path) => (path ? joinUploadUrl(path) : null)

function getStatusBadgeClass(status) {
  const s = (status || 'confirmed').toLowerCase()
  if (s === 'completed') return 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50'
  if (s === 'cancelled') return 'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900/50'
  return 'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900/50'
}

export default function TripHistory() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 })
  const isFirstFetch = useRef(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage((p) => (p === 1 ? p : 1))
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const controller = new AbortController()

    const fetchHistory = async () => {
      if (isFirstFetch.current) {
        setLoading(true)
      }
      try {
        const { data } = await axiosInstance.get('/customer/bookings', {
          params: { page, search: debouncedSearch, limit: 10 },
          signal: controller.signal,
        })
        if (data?.success) {
          setBookings(data.data.bookings || [])
          setPagination(data.data.pagination || { totalPages: 1, total: 0 })
        }
      } catch (err) {
        if (axios.isCancel(err) || err.code === 'ERR_CANCELED' || err.name === 'CanceledError') {
          return
        }
        toast.error('Failed to load trip history')
      } finally {
        setLoading(false)
        isFirstFetch.current = false
      }
    }

    fetchHistory()
    return () => controller.abort()
  }, [page, debouncedSearch])

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader size="lg" text="Loading your journeys..." />
      </div>
    )
  }

  if (bookings.length === 0 && !debouncedSearch) {
    return (
      <div className="animate-fade-in flex min-h-[55vh] flex-col items-center justify-center rounded-2xl border border-gray-200/80 bg-white px-6 py-14 text-center shadow-sm dark:border-white/10 dark:bg-gray-950">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300">
          <PackageIcon className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">No trips yet</h2>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          Your booking history will appear here once you start traveling.
        </p>
        <button
          onClick={() => navigate('/customer/home')}
          className="mt-7 inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
        >
          Explore destinations
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Trips</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Your Journeys
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Relive past trips and jump back to any itinerary.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <div className="relative w-full sm:w-[300px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search booking or destination"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-4 focus:ring-primary-100/70 dark:border-white/10 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-primary-700 dark:focus:ring-primary-900/30"
            />
          </div>
          <div className="inline-flex h-[42px] items-center rounded-xl border border-primary-100 bg-primary-50 px-3 text-xs font-semibold uppercase tracking-wider text-primary-700 dark:border-primary-900/50 dark:bg-primary-950/40 dark:text-primary-300">
            {pagination.total} total trips
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {bookings.map((booking) => {
          const pkg = booking.package || booking.whitelabelPackage?.originalPackage || {}
          const status = booking.bookingStatus || 'confirmed'
          const travelDate = new Date(booking.travelDate).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })

          return (
            <article
              key={booking._id}
              className="group rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow-md dark:border-white/10 dark:bg-gray-950 dark:hover:border-white/20 sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-32 sm:w-44 dark:bg-white/5">
                  {pkg.coverImage ? (
                    <img
                      src={getFullUrl(pkg.coverImage)}
                      alt={pkg.title || 'Trip cover'}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-gray-600">
                      <MapPin className="h-8 w-8" />
                    </div>
                  )}
                  <span
                    className={`absolute left-2.5 top-2.5 inline-flex rounded-md px-2 py-1 text-[11px] font-medium capitalize ring-1 ring-inset ${getStatusBadgeClass(status)}`}
                  >
                    {status}
                  </span>
                </div>

                <div className="min-w-0 flex-1 space-y-2.5">
                  <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                    <Ticket className="h-3.5 w-3.5" />
                    {booking.bookingId}
                  </p>

                  <h3 className="truncate text-lg font-semibold tracking-tight text-gray-900 dark:text-white sm:text-xl">
                    {pkg.title || `Trip to ${pkg.destination || 'Destination'}`}
                  </h3>

                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <p className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {travelDate}
                    </p>
                    {pkg.destination ? (
                      <p className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {pkg.destination}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="sm:ps-2">
                  <button
                    onClick={() => navigate(`/customer/booking/${booking.bookingId}`)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 sm:w-auto dark:border-white/10 dark:bg-transparent dark:text-gray-200 dark:hover:border-primary-800 dark:hover:bg-primary-950/30 dark:hover:text-primary-300"
                  >
                    View trip
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-primary-200 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-gray-950 dark:text-gray-300 dark:hover:border-primary-800 dark:hover:text-primary-300"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1">
            {[...Array(pagination.totalPages)].map((_, i) => {
              const p = i + 1
              if (
                pagination.totalPages <= 7 ||
                p === 1 ||
                p === pagination.totalPages ||
                (p >= page - 1 && p <= page + 1)
              ) {
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-xl border px-2 text-sm font-medium transition ${
                      page === p
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5'
                    }`}
                  >
                    {p}
                  </button>
                )
              }
              if (p === 2 || p === pagination.totalPages - 1) {
                return (
                  <span key={p} className="px-1 text-gray-400">
                    ...
                  </span>
                )
              }
              return null
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-primary-200 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-gray-950 dark:text-gray-300 dark:hover:border-primary-800 dark:hover:text-primary-300"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {bookings.length === 0 && debouncedSearch && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-16 text-center dark:border-white/10 dark:bg-gray-950">
          <div className="mb-3 rounded-xl bg-gray-100 p-3 dark:bg-white/5">
            <Search className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No results found for <span className="font-medium text-gray-700 dark:text-gray-200">"{debouncedSearch}"</span>
          </p>
        </div>
      )}
    </div>
  )
}
