import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Eye,
  Ticket,
  Search,
  Download,
  RefreshCw,
  MapPin,
  Tag,
  IndianRupee,
  Phone,
  X,
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import Pagination from '@/admin/components/Pagination.jsx'
import { exportToExcel } from '@/admin/utils/exportExcel.js'
import CustomDropdown from '@/shared/components/CustomDropdown.jsx'

const PAGE_SIZE = 10

const STATUS_BADGE = {
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  ongoing:   'border-blue-200 bg-blue-50 text-blue-700',
  completed: 'border-gray-200 bg-gray-100 text-gray-600',
  cancelled: 'border-red-200 bg-red-50 text-red-700',
}
const STATUS_DOT = {
  confirmed: 'bg-emerald-500 animate-pulse',
  ongoing:   'bg-blue-500 animate-pulse',
  completed: 'bg-gray-400',
  cancelled: 'bg-red-500',
}

function fmtINR(n) {
  return (n || 0).toLocaleString('en-IN')
}


export default function Bookings() {
  const navigate   = useNavigate()
  const { toast }  = useToast()
  const toastRef   = useRef(toast)
  toastRef.current = toast

  const [bookings, setBookings]             = useState([])
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState(null)
  const [searchInput, setSearchInput]       = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter]     = useState('all')
  const [packageFilter, setPackageFilter]   = useState('all')
  const [bookedByFilter, setBookedByFilter] = useState('all')
  const [packages, setPackages]             = useState([])
  const [agents, setAgents]                 = useState([])
  const [page, setPage]                     = useState(1)
  const [totalPages, setTotalPages]         = useState(1)
  const [total, setTotal]                   = useState(0)
  const [exportLoading, setExportLoading]   = useState(false)

  // Populate filter dropdowns once
  useEffect(() => {
    adminApi.listPackages({ limit: 1000 })
      .then((r) => setPackages(r.data?.data?.packages || []))
      .catch(() => {})
    adminApi.listAgents({ limit: 1000 })
      .then((r) => setAgents(r.data?.data?.agents || []))
      .catch(() => {})
  }, [])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchInput.trim()); setPage(1) }, 380)
    return () => clearTimeout(t)
  }, [searchInput])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [statusFilter, packageFilter, bookedByFilter])

  const fetchBookings = useCallback(async (pg = 1) => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.listAllBookings({
        page: pg,
        limit: PAGE_SIZE,
        search:    debouncedSearch || undefined,
        status:    statusFilter   === 'all' ? undefined : statusFilter,
        packageId: packageFilter  === 'all' ? undefined : packageFilter,
        bookedBy:  bookedByFilter === 'all' ? undefined : bookedByFilter,
      })
      const d = res.data?.data || {}
      setBookings(d.bookings || [])
      setTotalPages(d.totalPages  || 1)
      setTotal(d.totalCount || 0)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, packageFilter, bookedByFilter])

  useEffect(() => { fetchBookings(page) }, [fetchBookings, page])

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const { data } = await adminApi.listAllBookings({
        page: 1, limit: 10000,
        search:    debouncedSearch || undefined,
        status:    statusFilter   === 'all' ? undefined : statusFilter,
        packageId: packageFilter  === 'all' ? undefined : packageFilter,
        bookedBy:  bookedByFilter === 'all' ? undefined : bookedByFilter,
      })
      await exportToExcel(
        (data?.data?.bookings || []).map((b, i) => ({
          '#':               i + 1,
          'Booking ID':      b.bookingId || '',
          Package:           b.whitelabelPackage?.customTitle || b.package?.title || '—',
          Destination:       b.package?.destination || '—',
          Customer:          b.customer?.name || '—',
          'Customer Phone':  b.customer?.phone || '',
          'Booked By':       `${b.bookedBy?.name || ''} (${b.bookedBy?.role || ''})`,
          'Travel Date':     b.travelDate ? new Date(b.travelDate).toLocaleDateString() : '—',
          'Parent Price':    b.parentPriceAtBooking || 0,
          'WL Price':        b.bookedBy?.role === 'parent_agent' ? '—' : (b.whitelabelPriceAtBooking || 0),
          'Extra Income':    (b.totalAmount - b.whitelabelPriceAtBooking) || 0,
          'Total Amount':    b.totalAmount || 0,
          Status:            b.bookingStatus || '—',
          'Created At':      new Date(b.createdAt).toLocaleString(),
        })),
        'all_bookings',
        'All Bookings'
      )
    } catch {
      toastRef.current.error('Export failed')
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-4">

      {/* ── Page header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
            All Platform Bookings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor every booking across the entire platform hierarchy.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={total === 0 || exportLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
        >
          {exportLoading
            ? <RefreshCw size={15} className="animate-spin" />
            : <Download size={15} strokeWidth={2} />}
          Export Excel
        </button>
      </div>

      {/* ── Main card ── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

        {/* Filter bar */}
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">

          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
            <input
              type="search"
              placeholder="Search booking ID or customer name…"
              autoComplete="off"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-200"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-200 sm:w-44"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Package */}
          <div className="w-full sm:w-56">
            <CustomDropdown
              value={packageFilter}
              onChange={setPackageFilter}
              options={[
                { value: 'all', label: 'All Packages' },
                ...packages.map((p) => ({ value: p._id, label: p.title })),
              ]}
              searchable
              placeholder="All Packages"
              truncateLength={32}
            />
          </div>

          {/* Agent */}
          <div className="w-full sm:w-60">
            <CustomDropdown
              value={bookedByFilter}
              onChange={setBookedByFilter}
              options={[
                { value: 'all', label: 'All Agents' },
                ...agents.map((a) => ({ value: a._id, label: `${a.name} (${a.agentCode})` })),
              ]}
              searchable
              placeholder="All Agents"
              truncateLength={32}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader size="lg" />
            <p className="mt-4 text-xs text-gray-500">Loading bookings…</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <Ticket className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-gray-900">No bookings found</p>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1060px] text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/60">
                  <tr>
                    <th className="whitespace-nowrap px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Booking ID</th>
                    <th className="px-5 py-3 text-left   text-[10px] font-bold uppercase tracking-widest text-gray-400">Package</th>
                    <th className="px-5 py-3 text-left   text-[10px] font-bold uppercase tracking-widest text-gray-400">Customer</th>
                    <th className="px-5 py-3 text-left   text-[10px] font-bold uppercase tracking-widest text-gray-400">Booked By</th>
                    <th className="px-5 py-3 text-left   text-[10px] font-bold uppercase tracking-widest text-gray-400">Travel Date</th>
                    <th className="px-5 py-3 text-right  text-[10px] font-bold uppercase tracking-widest text-gray-400">Parent ₹</th>
                    <th className="px-5 py-3 text-right  text-[10px] font-bold uppercase tracking-widest text-gray-400">WL ₹</th>
                    <th className="px-5 py-3 text-right  text-[10px] font-bold uppercase tracking-widest text-gray-400">Extra ₹</th>
                    <th className="px-5 py-3 text-right  text-[10px] font-bold uppercase tracking-widest text-gray-400">Total ₹</th>
                    <th className="px-5 py-3 text-left   text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                    <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookings.map((b) => {
                    const extra    = (b.totalAmount || 0) - (b.whitelabelPriceAtBooking || 0)
                    const isParent = b.bookedBy?.role === 'parent_agent'
                    const status   = b.bookingStatus || 'confirmed'
                    const title    = b.whitelabelPackage?.customTitle || b.package?.title || '—'

                    return (
                      <tr key={b._id} className="group transition-colors hover:bg-gray-50/60">

                        {/* Booking ID */}
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <p className="font-mono text-xs font-bold tracking-tight text-gray-900">{b.bookingId}</p>
                          <p className="mt-0.5 text-[10px] text-gray-400">
                            {new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </p>
                        </td>

                        {/* Package */}
                        <td className="px-5 py-3.5">
                          <p className="max-w-[200px] truncate text-sm font-semibold text-gray-900" title={title}>
                            {title}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            {b.whitelabelPackage && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold text-primary-600">
                                <Tag size={8} strokeWidth={2.5} /> WL
                              </span>
                            )}
                            {b.package?.destination && (
                              <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                                <MapPin size={9} /> {b.package.destination}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-semibold text-gray-900">{b.customer?.name || '—'}</p>
                          {b.customer?.phone && (
                            <p className="flex items-center gap-1 text-[10px] text-gray-500">
                              <Phone className="h-2.5 w-2.5" /> {b.customer.phone}
                            </p>
                          )}
                        </td>

                        {/* Booked By */}
                        <td className="px-5 py-3.5">
                          <p className="truncate text-sm font-semibold text-gray-900">{b.bookedBy?.name || '—'}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-primary-500">
                            {(b.bookedBy?.role || '').replace(/_/g, ' ')}
                          </p>
                        </td>

                        {/* Travel date */}
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
                            {b.travelDate
                              ? new Date(b.travelDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '—'}
                          </div>
                        </td>

                        {/* Parent price */}
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-sm tabular-nums text-gray-500">{fmtINR(b.parentPriceAtBooking)}</span>
                        </td>

                        {/* WL price */}
                        <td className="px-5 py-3.5 text-right">
                          {isParent
                            ? <span className="select-none text-gray-300">—</span>
                            : <span className="text-sm tabular-nums text-gray-600">{fmtINR(b.whitelabelPriceAtBooking)}</span>
                          }
                        </td>

                        {/* Extra income */}
                        <td className="px-5 py-3.5 text-right">
                          {extra > 0
                            ? (
                              <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold tabular-nums text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                +{fmtINR(extra)}
                              </span>
                            )
                            : <span className="select-none text-gray-300">—</span>
                          }
                        </td>

                        {/* Total */}
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-sm font-bold tabular-nums text-gray-900">{fmtINR(b.totalAmount)}</span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_BADGE[status] || 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[status] || 'bg-gray-400'}`} />
                            {b.bookingStatus}
                          </span>
                        </td>

                        {/* View */}
                        <td className="px-5 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/bookings/${b._id}`)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                          >
                            <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={PAGE_SIZE}
              onPageChange={(p) => { setPage(p); fetchBookings(p) }}
            />
          </>
        )}
      </div>
    </div>
  )
}
