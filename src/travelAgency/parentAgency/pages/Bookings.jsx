import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Calendar, User, IndianRupee, Hash, Eye, Ticket, Download, RefreshCw } from 'lucide-react'
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
      
      console.log('[Bookings] Pagination data:', paginationData)
      
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

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const res = await listBookings({
        page: 1,
        limit: 10000,
        search: search.trim(),
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
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
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-0.5 text-sm text-gray-500">All bookings across your network</p>
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
          <button onClick={fetchBookings} className="p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" aria-label="Refresh">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          className="input-field flex-1"
          placeholder="Search by booking ID, customer name, phone or package…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input-field sm:w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Stats */}
      {pagination.totalCount > 0 && (
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-gray-500">Total: <span className="font-semibold text-gray-800">{pagination.totalCount}</span></span>
        </div>
      )}

      {/* Error */}
      {error && <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

      {/* Loading skeleton */}
      {loading && bookings.length === 0 && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 animate-pulse flex gap-4">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && bookings.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-14 w-14 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">
            {pagination.totalCount === 0 ? 'No bookings yet' : 'No bookings match your search'}
          </h3>
          {pagination.totalCount === 0 && <p className="text-sm text-gray-400 mt-1">No bookings created in your network yet.</p>}
        </div>
      )}

      {/* Table */}
      {bookings.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                  <th className="px-5 py-3 text-left">Booking ID</th>
                  <th className="px-5 py-3 text-left">Package</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Travel Date</th>
                  <th className="px-5 py-3 text-left">Amount</th>
                  <th className="px-5 py-3 text-left">Payment</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Booked By</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => {
                  return (
                  <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1 font-mono text-xs text-gray-700">
                        <Hash size={11} />{b.bookingId}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900 truncate max-w-[140px]">
                        {b.package?.title || b.whitelabelPackage?.customTitle || '—'}
                      </p>
                      {b.package?.destination && (
                        <p className="text-xs text-gray-400">{b.package.destination}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="flex items-center gap-1 text-gray-700"><User size={12} />{b.customer?.name || '—'}</p>
                      {b.customer?.phone && <p className="text-xs text-gray-400 ml-4">{b.customer.phone}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Calendar size={12} />
                        {b.travelDate ? new Date(b.travelDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-0.5 font-semibold text-gray-900">
                        <IndianRupee size={12} />{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${PAYMENT_STYLES[b.paymentStatus] || PAYMENT_STYLES.pending}`}>
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[b.bookingStatus] || STATUS_STYLES.confirmed}`}>
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {(() => {
                        const bookedBy = b.bookedBy
                        if (!bookedBy || typeof bookedBy === 'string') return '—'
                        if (bookedBy.role === 'sub_child_agent' && bookedBy.parentRef?.name) {
                          return (
                            <>
                              {bookedBy.parentRef.name}
                              <span className="ml-1.5 rounded-full bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 ring-1 ring-inset ring-purple-100">via Sub-child</span>
                            </>
                          )
                        }
                        return (
                          <>
                            {bookedBy.name || bookedBy.email || '—'}
                            {bookedBy.role === 'child_agent' && (
                              <span className="ml-1.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">Child</span>
                            )}
                          </>
                        )
                      })()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-3">
                        <button onClick={() => setViewId(b._id)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors">
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => setTicketsBooking(b)}
                          className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-800 transition-colors"
                          title="Manage Tickets"
                        >
                          <Ticket size={13} /> Tickets
                          {b.tickets?.length > 0 && (
                            <span className="ml-0.5 rounded-full bg-primary-100 px-1.5 py-0.5 text-xs font-semibold text-primary-700">
                              {b.tickets.length}
                            </span>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {bookings.length > 0 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.totalCount}
          limit={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}

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
