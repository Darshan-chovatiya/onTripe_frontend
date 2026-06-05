import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  ChevronRight,
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
  Package as PackageIcon,
  Search,
  ChevronLeft,
  Plane,
  Info,
} from 'lucide-react'
import axiosInstance from '@/shared/services/axiosInstance.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'

const BASE_IMG_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const getFullUrl = (path) => path ? `${BASE_IMG_URL}/${path.replace(/\\/g, '/')}` : null

const statusConfig = {
  confirmed: { label: 'Confirmed', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  pending:   { label: 'Pending',   cls: 'bg-amber-100 text-amber-700 border-amber-200',       dot: 'bg-amber-500' },
  completed: { label: 'Completed', cls: 'bg-blue-100 text-blue-700 border-blue-200',          dot: 'bg-blue-500'  },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700 border-red-200',             dot: 'bg-red-500'   },
}

export default function TripHistory() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  // Search & Pagination State
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 })

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 on search
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const { data } = await axiosInstance.get(`/customer/bookings`, {
          params: {
            page,
            search: debouncedSearch,
            limit: 10
          }
        })
        if (data?.success) {
          setBookings(data.data.bookings || [])
          setPagination(data.data.pagination || { totalPages: 1, total: 0 })
        }
      } catch (err) {
        toast.error('Failed to load trip history')
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [page, debouncedSearch])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader size="lg" text="Loading your journeys..." />
      </div>
    )
  }

  if (bookings.length === 0 && !debouncedSearch) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 animate-fade-in">
        <div className="w-full max-w-lg">

          {/* Main card */}
          <div className="overflow-hidden rounded-3xl bg-white shadow-xl border border-gray-100">
            {/* Gradient header */}
            <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 px-8 py-10 text-white text-center overflow-hidden">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
              <div className="absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-indigo-400/10 blur-2xl" />
              <div className="relative z-10">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <Plane className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-black tracking-tight">No Bookings Found</h2>
                <p className="mt-2 text-sm text-primary-200">Your journey log is empty right now</p>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-8 space-y-5">
              {/* Info box */}
              <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-4">
                <Info className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                <p className="text-sm text-amber-800 leading-relaxed">
                  You currently have no bookings assigned to your account. If you believe this is an error, please contact your travel administrator.
                </p>
              </div>

              {/* Steps */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">What you can expect here</p>
                <div className="space-y-4">
                  {[
                    { icon: Ticket,   color: 'bg-violet-50 text-violet-500', label: 'All your trip bookings in one place' },
                    { icon: Calendar, color: 'bg-sky-50 text-sky-500',       label: 'Travel dates and itinerary details' },
                    { icon: MapPin,   color: 'bg-emerald-50 text-emerald-500', label: 'Destinations and package information' },
                    { icon: Clock,    color: 'bg-amber-50 text-amber-500',   label: 'Booking status and trip history' },
                  ].map(({ icon: Icon, color, label }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
                        <Icon className="h-4 w-4" strokeWidth={2} />
                      </div>
                      <span className="text-sm text-gray-600">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status badge */}
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white py-3">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-semibold text-gray-500">Waiting for a booking to be assigned</span>
              </div>

              {/* CTA */}
              <button
                onClick={() => navigate('/customer/home')}
                className="w-full rounded-2xl bg-primary-600 py-3.5 text-sm font-bold text-white shadow-md shadow-primary-200 transition hover:bg-primary-700 active:scale-95"
              >
                Go to Home
              </button>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            This page updates automatically when a booking is assigned to you.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Your Journeys</h1>
          <p className="text-gray-500 font-medium font-inter">Relive your memories and plan for the next one.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-primary-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search by Booking ID, Destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 bg-white shadow-sm focus:ring-4 focus:ring-primary-50 focus:border-primary-200 outline-none transition-all font-inter text-sm"
            />
          </div>
          <div className="bg-primary-50 text-primary-700 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-primary-100 flex items-center h-[46px]">
            {pagination.total} Total Trips
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {bookings.map((booking) => {
          const pkg = booking.package || booking.whitelabelPackage?.originalPackage || {}
          const wlPkg = booking.whitelabelPackage || {}
          const status = booking.bookingStatus || 'confirmed'
          const statusCfg = statusConfig[status] || statusConfig.confirmed
          const totalDays = pkg.totalDays || pkg.itinerary?.length || 0
          const totalNights = totalDays > 1 ? totalDays - 1 : 0
          const coverImg = getFullUrl(pkg.coverImage)
          const travelDate = booking.travelDate
            ? new Date(booking.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—'

          return (
            <div key={booking._id}
              onClick={() => navigate(`/customer/booking/${booking.bookingId}`)}
              className="group cursor-pointer bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-gray-50 shrink-0">
                {coverImg ? (
                  <img src={coverImg} alt={pkg.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-50 to-indigo-50">
                    <Plane size={40} className="text-primary-200" strokeWidth={1.5} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Overlaid badges */}
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusCfg.cls}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>
                </div>
                {totalDays > 0 && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white">
                      {totalDays}D · {totalNights}N
                    </span>
                  </div>
                )}
                {pkg.destination && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white text-xs font-semibold">
                    <MapPin size={11} className="text-primary-300" />{pkg.destination}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-5">
                <h3 className="font-black text-gray-900 text-base leading-snug line-clamp-2 mb-3 group-hover:text-primary-600 transition-colors">
                  {wlPkg.customTitle || pkg.title || `Trip to ${pkg.destination}`}
                </h3>
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Calendar size={13} />
                  <span className="font-medium">{travelDate}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{booking.bookingId}</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-primary-600 group-hover:gap-2 transition-all">
                    View <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-3 rounded-xl bg-white border border-gray-100 text-gray-600 hover:text-primary-600 hover:border-primary-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-1">
            {[...Array(pagination.totalPages)].map((_, i) => {
              const p = i + 1;
              // Simple pagination - show 5 pages around current
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
                    className={`min-w-[40px] h-10 rounded-xl font-bold text-sm transition-all ${page === p
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                        : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    {p}
                  </button>
                );
              } else if (p === 2 || p === pagination.totalPages - 1) {
                return <span key={p} className="px-1 text-gray-400">...</span>;
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="p-3 rounded-xl bg-white border border-gray-100 text-gray-600 hover:text-primary-600 hover:border-primary-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {bookings.length === 0 && debouncedSearch && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
          <div className="mb-4 rounded-full bg-gray-50 p-4">
            <Search className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">No results found for "{debouncedSearch}"</p>
        </div>
      )}
    </div>
  )
}
