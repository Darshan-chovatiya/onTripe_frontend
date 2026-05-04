import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Eye,
  IndianRupee,
  Ticket,
  Search,
  Download,
  RefreshCw,
  User,
  MapPin,
  Tag
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Pagination from '@/admin/components/Pagination.jsx'
import { exportToExcel } from '@/admin/utils/exportExcel.js'

const PAGE_SIZE = 10

function statusClass(status) {
  switch (status) {
    case 'confirmed': return 'bg-emerald-100 text-emerald-800'
    case 'ongoing': return 'bg-blue-100 text-blue-800'
    case 'completed': return 'bg-gray-100 text-gray-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default: return 'bg-amber-100 text-amber-800'
  }
}

export default function Bookings() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [packageFilter, setPackageFilter] = useState('all')
  const [packages, setPackages] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })
  const [exportLoading, setExportLoading] = useState(false)

  // Fetch packages for filter
  useEffect(() => {
    adminApi.listPackages({ limit: 1000 })
      .then(res => setPackages(res.data?.data?.packages || []))
      .catch(err => console.error('Failed to fetch packages', err))
  }, [])

  const fetchBookings = async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.listAllBookings({
        page,
        limit: PAGE_SIZE,
        search: search.trim(),
        status: statusFilter === 'all' ? undefined : statusFilter,
        packageId: packageFilter === 'all' ? undefined : packageFilter
      })
      const { bookings, totalPages, totalCount, currentPage } = res.data?.data || {}
      setBookings(bookings || [])
      setPagination({ page: currentPage, totalPages, totalCount })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBookings(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search, statusFilter, packageFilter])

  const handlePageChange = (newPage) => {
    fetchBookings(newPage)
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const { data } = await adminApi.listAllBookings({
        page: 1,
        limit: 10000,
        search: search.trim(),
        status: statusFilter === 'all' ? undefined : statusFilter
      })
      const rows = data?.data?.bookings || []
      await exportToExcel(
        rows.map((b, idx) => ({
          '#': idx + 1,
          'Booking ID': b.bookingId || '',
          'Package': b.whitelabelPackage?.customTitle || b.package?.title || '—',
          'Customer': b.customer?.name || '—',
          'Customer Phone': b.customer?.phone || '',
          'Booked By': `${b.bookedBy?.name} (${b.bookedBy?.role})` || '—',
          'Travel Date': b.travelDate ? new Date(b.travelDate).toLocaleDateString() : '—',
          'Amount': b.totalAmount || 0,
          'Status': b.bookingStatus || '—',
          'Created At': new Date(b.createdAt).toLocaleString()
        })),
        'all_bookings',
        'All Bookings'
      )
    } catch (err) {
      toast.error('Export failed')
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Platform Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage every booking across the entire platform hierarchy.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={bookings.length === 0 || exportLoading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {exportLoading ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
            Export Excel
          </button>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Filters */}
        <div className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50/30 px-4 py-4 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10"
              placeholder="Search by Booking ID or Customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 sm:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 sm:w-64"
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
          >
            <option value="all">All Packages</option>
            {packages.map(pkg => (
              <option key={pkg._id} value={pkg._id}>
                {pkg.title}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="m-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm text-left">
            <thead className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              <tr>
                {/* <th className="px-6 py-4">Booking / ID</th> */}
                {/* <th className="px-6 py-4">Package</th> */}
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Booked By</th>
                <th className="px-6 py-4">Travel Date</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && bookings.length === 0 ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="px-6 py-4"><div className="h-4 w-full rounded bg-gray-100" /></td>
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Ticket className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                    No bookings found matching your filters.
                  </td>
                </tr>
              ) : (
                bookings.map(b => (
                  <tr key={b._id} className="transition-colors hover:bg-gray-50/50">
                    {/* <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-gray-900">{b.bookingId}</span>
                        <span className="mt-0.5 text-[10px] text-gray-400">Created {new Date(b.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td> */}
                    {/* <td className="px-6 py-4">
                      <div className="flex flex-col max-w-[200px]">
                        <span className="truncate font-medium text-gray-900" title={b.whitelabelPackage?.customTitle || b.package?.title}>
                          {b.whitelabelPackage?.customTitle || b.package?.title || '—'}
                        </span>
                        {b.whitelabelPackage && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-primary-600">
                            <Tag size={10} /> Whitelabel offer
                          </span>
                        )}
                        <span className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-400">
                          <MapPin size={10} /> {b.package?.destination || 'N/A'}
                        </span>
                      </div>
                    </td> */}
                    <td className="px-6 py-4 text-gray-700">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{b.customer?.name || '—'}</span>
                        <span className="text-xs text-gray-400">{b.customer?.phone || ''}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1.5 font-medium text-gray-900">
                          <User size={12} className="text-gray-400" />
                          {b.bookedBy?.name || '—'}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-primary-600 font-bold">
                          {b.bookedBy?.role?.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={14} className="text-gray-400" />
                        {b.travelDate ? new Date(b.travelDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      <div className="flex items-center justify-end gap-0.5">
                        <IndianRupee size={12} />
                        {(b.totalAmount || 0).toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${statusClass(b.bookingStatus)}`}>
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/admin/bookings/${b._id}`)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-primary-50 hover:text-primary-600 hover:border-primary-100"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {bookings.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.totalCount}
              limit={PAGE_SIZE}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}
