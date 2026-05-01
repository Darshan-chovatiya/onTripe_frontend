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
  ChevronLeft
} from 'lucide-react'
import axiosInstance from '@/shared/services/axiosInstance.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'

const BASE_IMG_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const getFullUrl = (path) => path ? `${BASE_IMG_URL}/${path.replace(/\\/g, '/')}` : null

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
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm animate-fade-in">
        <div className="mb-6 rounded-full bg-primary-50 p-6">
          <PackageIcon className="h-12 w-12 text-primary-600" />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-gray-900">No Trips Yet</h2>
        <p className="max-w-xs text-gray-500 mb-8">Your travel story hasn't started yet. Book your first trip to see it here!</p>
        <button
          onClick={() => navigate('/customer/home')}
          className="btn-primary px-8 py-3 rounded-2xl shadow-lg shadow-primary-200 active:scale-95 transition-transform"
        >
          Explore Destinations
        </button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
        {bookings.map((booking) => {
          const pkg = booking.package || booking.whitelabelPackage?.originalPackage || {}
          const status = booking.bookingStatus || 'confirmed'
          const travelDate = new Date(booking.travelDate).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })

          return (
            <div
              key={booking._id}
              className="group flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Package Image Header */}
              <div className="relative h-48 w-full overflow-hidden bg-gray-100 shrink-0">
                {pkg.coverImage ? (
                  <img
                    src={getFullUrl(pkg.coverImage)}
                    alt={pkg.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary-50 text-primary-300">
                    <MapPin size={40} />
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="flex flex-col flex-1 p-5">
                <h3 className="text-xl font-black text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-4">
                  {pkg.title || 'Trip to ' + pkg.destination}
                </h3>

                <div className="space-y-2 mt-auto">
                  <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                    <Calendar size={16} className="text-gray-400 shrink-0" />
                    <span className="truncate">{travelDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                    <MapPin size={16} className="text-gray-400 shrink-0" />
                    <span className="truncate">{pkg.destination}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/customer/booking/${booking.bookingId}`)}
                  className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-primary-50 text-primary-700 hover:bg-primary-600 hover:text-white transition-colors border border-primary-100 hover:border-primary-600"
                >
                  View Trip <ChevronRight size={18} />
                </button>
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
