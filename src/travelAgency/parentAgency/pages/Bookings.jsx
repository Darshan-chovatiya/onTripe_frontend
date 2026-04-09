import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Calendar, User, IndianRupee, Hash, Eye, Ticket, Download, RefreshCw, Search } from 'lucide-react'
import { listBookings } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import BookingDetailModal from '@/travelAgency/parentAgency/components/BookingDetailModal.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import BookingTicketsModal from '@/travelAgency/parentAgency/components/BookingTicketsModal.jsx'
import Pagination from '@/admin/components/Pagination.jsx'
import { exportToExcel } from '@/admin/utils/exportExcel.js'

const STATUS_STYLES = {
  confirmed: 'bg-blue-50 text-blue-700',
  ongoing:   'bg-yellow-50 text-yellow-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
}

const PAYMENT_STYLES = {
  pending:  'bg-gray-100 text-gray-600',
  partial:  'bg-orange-50 text-orange-700',
  paid:     'bg-green-50 text-green-700',
  refunded: 'bg-purple-50 text-purple-700',
}

const PAGE_SIZE = 10

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewId, setViewId] = useState(null)
  const { user } = useAuth()
  const [ticketsBooking, setTicketsBooking] = useState(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })
  const [exportLoading, setExportLoading] = useState(false)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listBookings({
        page,
        limit: PAGE_SIZE,
        search: search.trim(),
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
      const bookingsData = res.data?.data?.bookings || []
      const paginationData = res.data?.data?.pagination || { page: 1, totalPages: 1, totalCount: bookingsData.length }
      setBookings(bookingsData)
      setPagination({
        page: paginationData.page || 1,
        totalPages: paginationData.totalPages || Math.ceil(bookingsData.length / PAGE_SIZE),
        totalCount: paginationData.totalCount || bookingsData.length,
      })
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  useEffect(() => { setPage(1) }, [search, statusFilter])

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const res = await listBookings({ page: 1, limit: 10000, search: search.trim(), status: statusFilter === 'all' ? undefined : statusFilter })
      const rows = res.data?.data?.bookings || []
      await exportToExcel(
        rows.map((b, idx) => ({
          '#': idx + 1,
          'Booking ID': b.bookingId || '',
          'Package': b.package?.title || b.whitelabelPackage?.customTitle || '',
          'Customer': b.customer?.name || '',
          'Phone': b.customer?.phone || '',
          'Travel Date': b.travelDate ? new Date(b.travelDate).toLocaleDateString('en-IN') : '',
          'Amount': b.totalAmount || 0,
          'Payment Status': b.paymentStatus || '',
          'Booking Status': b.bookingStatus || '',
          'Booked By': b.bookedBy?.name || b.bookedBy?.email || '',
        })),
        'bookings',
        'Bookings'
      )
    } catch {
      setError('Export failed')
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">All bookings across your network.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exportLoading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {exportLoading ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
            Export Excel
          </button>

        </div>
      </div>

      {/* Card */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
            <input
              className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
              placeholder="Search by booking ID, customer name, phone or package…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 sm:w-44"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Error */}
        {error ? <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        {/* Loading skeleton */}
        {loading && bookings.length === 0 ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-100 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-gray-200" />
                    <div className="h-3 w-1/2 rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Empty */}
        {!loading && bookings.length === 0 && !error ? (
          <div className="px-4 py-14 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-gray-900">
              {search || statusFilter !== 'all' ? 'No bookings match your search' : 'No bookings yet'}
            </p>
            {!search && statusFilter === 'all' && (
              <p className="mt-1 text-sm text-gray-500">No bookings created in your network yet.</p>
            )}
          </div>
        ) : null}

        {/* Table */}
        {bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Booking ID</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Package</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Customer</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Travel Date</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Amount</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Payment</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Booked By</th>
                  <th className="px-4 py-2.5 text-right align-middle text-xs font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <tr key={b._id} className="transition-colors hover:bg-gray-50/80">
                    <td className="px-4 py-2.5 align-middle">
                      <span className="flex items-center gap-1 font-mono text-xs font-semibold text-gray-900">
                        <Hash size={11} />{b.bookingId}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {b.package?.title || b.whitelabelPackage?.customTitle || '—'}
                        </p>
                        {b.package?.destination && (
                          <p className="mt-0.5 truncate text-xs text-gray-500">{b.package.destination}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1 text-sm font-medium text-gray-900"><User size={12} />{b.customer?.name || '—'}</p>
                        {b.customer?.phone && <p className="mt-0.5 text-xs text-gray-500">{b.customer.phone}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 align-middle text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {b.travelDate ? new Date(b.travelDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <span className="flex items-center gap-0.5 text-sm font-semibold text-gray-900">
                        <IndianRupee size={12} />{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${PAYMENT_STYLES[b.paymentStatus] || PAYMENT_STYLES.pending}`}>
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[b.bookingStatus] || STATUS_STYLES.confirmed}`}>
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 align-middle text-xs text-gray-600">
                      {(() => {
                        const bookedBy = b.bookedBy
                        if (!bookedBy || typeof bookedBy === 'string') return '—'
                        if (bookedBy.role === 'sub_child_agent' && bookedBy.parentRef?.name) {
                          return (
                            <div className="flex flex-col gap-0.5">
                              <span>{bookedBy.parentRef.name}</span>
                              <span className="inline-flex w-fit rounded-full bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 ring-1 ring-inset ring-purple-100">via Sub-child</span>
                            </div>
                          )
                        }
                        return (
                          <div className="flex flex-col gap-0.5">
                            <span>{bookedBy.name || bookedBy.email || '—'}</span>
                            {bookedBy.role === 'child_agent' && (
                              <span className="inline-flex w-fit rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">Child</span>
                            )}
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-2.5 align-middle text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setViewId(b._id)}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                          title="View"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => setTicketsBooking(b)}
                          className="inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-md border border-gray-200 bg-white px-2 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                          title="Manage Tickets"
                        >
                          <Ticket size={13} />
                          {b.tickets?.length > 0 && (
                            <span className="text-xs font-semibold text-primary-700">{b.tickets.length}</span>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {bookings.length > 0 ? (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.totalCount}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        ) : null}
      </div>

      <BookingDetailModal isOpen={!!viewId} onClose={() => setViewId(null)} bookingId={viewId} />

      <BookingTicketsModal
        isOpen={!!ticketsBooking}
        onClose={() => setTicketsBooking(null)}
        booking={ticketsBooking}
        onUpdated={(updatedTickets) => {
          setBookings(prev => prev.map(b =>
            b._id === ticketsBooking?._id ? { ...b, tickets: updatedTickets } : b
          ))
          setTicketsBooking(prev => prev ? { ...prev, tickets: updatedTickets } : null)
        }}
      />
    </div>
  )
}
