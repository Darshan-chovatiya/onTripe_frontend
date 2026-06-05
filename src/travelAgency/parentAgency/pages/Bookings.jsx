import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BookOpen, Calendar, User, IndianRupee, Hash, Eye, Ticket, Download, RefreshCw, Search, Plus, Pencil } from 'lucide-react'
import { listBookings, listMyPackages } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import BookingDetailModal from '@/travelAgency/parentAgency/components/BookingDetailModal.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import BookingTicketsModal from '@/travelAgency/parentAgency/components/BookingTicketsModal.jsx'
import Pagination from '@/admin/components/Pagination.jsx'
import { exportToExcel } from '@/admin/utils/exportExcel.js'
import CustomDropdown from '@/shared/components/CustomDropdown.jsx'

const STATUS_STYLES = {
  confirmed: 'bg-blue-50 text-blue-700',
  ongoing: 'bg-yellow-50 text-yellow-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
}

const PAYMENT_STYLES = {
  pending: 'bg-gray-100 text-gray-600',
  partial: 'bg-orange-50 text-orange-700',
  paid: 'bg-green-50 text-green-700',
  refunded: 'bg-purple-50 text-purple-700',
}

const PAGE_SIZE = 10

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [searchParams] = useSearchParams()
  const [statusFilter, setStatusFilter] = useState('all')
  const [packageFilter, setPackageFilter] = useState(searchParams.get('packageId') || 'all')
  const [packages, setPackages] = useState([])
  const [viewId, setViewId] = useState(null)
  const { user } = useAuth()
  const [ticketsBooking, setTicketsBooking] = useState(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })
  const [exportLoading, setExportLoading] = useState(false)
  const [agentType, setAgentType] = useState('all') // 'all', 'self', 'agency'

  // Debounce search input — wait 400ms after user stops typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400)
    return () => clearTimeout(t)
  }, [search])

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listBookings({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        status: statusFilter === 'all' ? undefined : statusFilter,
        packageId: packageFilter === 'all' ? undefined : packageFilter,
        agentType: agentType === 'all' ? undefined : agentType,
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
  }, [page, debouncedSearch, statusFilter, packageFilter, agentType])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter, packageFilter, agentType])

  useEffect(() => {
    listBookings({ page: 1, limit: 5000, agentType: agentType === 'all' ? undefined : agentType })
      .then(res => {
        const allB = res.data?.data?.bookings || []
        const pkgMap = new Map()
        allB.forEach(b => {
          const id = b.whitelabelPackage?._id || b.package?._id
          const title = b.whitelabelPackage?.customTitle || b.package?.title
          if (id && title && !pkgMap.has(id)) {
            pkgMap.set(id, { _id: id, title })
          }
        })
        setPackages(Array.from(pkgMap.values()))
      })
      .catch(console.error)
  }, [agentType])

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const res = await listBookings({ page: 1, limit: 10000, search: search.trim(), status: statusFilter === 'all' ? undefined : statusFilter, packageId: packageFilter === 'all' ? undefined : packageFilter })
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
          <Link
            to="/agency/bookings/create"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
          >
            <Plus size={16} />
            Create Booking
          </Link>
          <button
            type="button"
            onClick={handleExport}
            disabled={bookings.length === 0 || exportLoading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {exportLoading ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
            Export Excel
          </button>
        </div>
      </div>

      {/* Booking Source Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button
          onClick={() => { setAgentType('all'); setPackageFilter('all'); }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            agentType === 'all'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Bookings
        </button>
        <button
          onClick={() => { setAgentType('self'); setPackageFilter('all'); }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            agentType === 'self'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Bookings
        </button>
        <button
          onClick={() => { setAgentType('agency'); setPackageFilter('all'); }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            agentType === 'agency'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Agency Bookings
        </button>
      </div>

      {/* Card */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
            <input
              type="search"
              placeholder="Search by booking ID, customer name, phone or package…"
              autoComplete="off"
              className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex w-full gap-3 sm:w-auto">
            <div className="min-w-0 flex-1 lg:min-w-[200px] lg:max-w-xs">
              <CustomDropdown
                value={packageFilter}
                onChange={e => { setPackageFilter(e); setPage(1); }}
                options={[
                  { value: 'all', label: 'All Packages' },
                  ...packages.map(p => ({
                    value: p._id,
                    label: p.title || 'Untitled Package'
                  }))
                ]}
                searchable
                truncateLength={42}
                maxHeight="280px"
                className="w-full"
                buttonClassName="!border-gray-200 !py-2"
              />
            </div>
            <div className="min-w-0 sm:min-w-[140px] lg:w-40">
              <CustomDropdown
                value={statusFilter}
                onChange={e => { setStatusFilter(e); setPage(1); }}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'ongoing', label: 'Ongoing' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                className="w-full"
                buttonClassName="!border-gray-200 !py-2"
              />
            </div>
          </div>
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
              {search || statusFilter !== 'all' || packageFilter !== 'all' ? 'No bookings match your search' : 'No bookings yet'}
            </p>
            {!search && statusFilter === 'all' && packageFilter === 'all' && (
              <p className="mt-1 text-sm text-gray-500">No bookings created in your network yet.</p>
            )}
          </div>
        ) : null}
        {/* Table */}
        {bookings.length > 0 ? (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase _tracking-wide text-gray-400">Customer</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase _tracking-wide text-gray-400">Package</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase _tracking-wide text-gray-400">Travel Date</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase _tracking-wide text-gray-400">Total Amount</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase _tracking-wide text-gray-400">Parent Price</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase _tracking-wide text-gray-400">WL Price</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase _tracking-wide text-gray-400">Extra Income</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase _tracking-wide text-gray-400">Booked By</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase _tracking-wide text-gray-400">Status</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase _tracking-wide text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookings.map((b) => {
                    const customerName = b.customer?.name || '—'
                    const pkgTitle = b.whitelabelPackage?.customTitle || b.package?.title || '—'
                    const isWl = !!b.whitelabelPackage
                    return (
                      <tr key={b._id} className="group transition-colors hover:bg-primary-50/30">
                        <td className="px-4 py-3.5 align-middle">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">{customerName}</p>
                            {b.customer?.phone && <p className="text-[11px] text-gray-400">{b.customer.phone}</p>}
                            {b.travelers?.length > 0 && (
                              <span className="ml-1 inline-flex items-center rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-bold text-primary-600">
                                +{b.travelers.length}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-800">{pkgTitle}</p>
                            {isWl && <span className="text-[10px] font-semibold text-violet-500">Whitelabel</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <span className="text-sm text-gray-600">
                            {b.travelDate ? new Date(b.travelDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <div>
                            <p className="text-sm font-bold text-gray-900">₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}</p>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${PAYMENT_STYLES[b.paymentStatus] || PAYMENT_STYLES.pending}`}>
                              {b.paymentStatus || 'pending'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <span className="text-sm font-medium text-gray-600">₹{Number(b.parentPriceAtBooking || 0).toLocaleString('en-IN')}</span>
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <span className="text-sm font-medium text-gray-600">
                            {b.bookedBy?.role === 'parent_agent' ? '—' : `₹${Number(b.whitelabelPriceAtBooking || 0).toLocaleString('en-IN')}`}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          {(() => {
                            const income = b.whitelabelPackage
                              ? (b.whitelabelPriceAtBooking || 0) - (b.parentPriceAtBooking || 0)
                              : (b.totalAmount || 0) - (b.parentPriceAtBooking || 0)
                            return (
                              <span className={`text-sm font-bold ${income > 0 ? 'text-blue-600' : income < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                ₹{Number(income).toLocaleString('en-IN')}
                              </span>
                            )
                          })()}
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex flex-col">
                            <p className="text-sm font-medium text-gray-900">{b.bookedBy?.name || '—'}</p>
                            <span className={`inline-flex w-fit rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-tighter ${b.bookedBy?.role === 'parent_agent' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                              {b.bookedBy?.role?.replace('_', ' ') || 'agent'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_STYLES[b.bookingStatus] || STATUS_STYLES.confirmed}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                            {b.bookingStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-right">
                          <div className="inline-flex items-center gap-1">
                            {b.bookedBy?._id === user.id && (
                              <Link to={`/agency/bookings/${b._id}/edit`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600"
                                title="Edit">
                                <Pencil size={13} />
                              </Link>
                            )}
                            <button onClick={() => setViewId(b._id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600"
                              title="View">
                              <Eye size={13} />
                            </button>
                            <button onClick={() => setTicketsBooking(b)}
                              className="flex h-8 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2 text-gray-500 shadow-sm transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                              title="Tickets">
                              <Ticket size={13} />
                              {b.tickets?.length > 0 && <span className="text-[10px] font-bold text-amber-600">{b.tickets.length}</span>}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden divide-y divide-gray-100">
              {bookings.map((b) => {
                const customerName = b.customer?.name || '—'
                const pkgTitle = b.whitelabelPackage?.customTitle || b.package?.title || '—'
                const isWl = !!b.whitelabelPackage
                const extraIncome = b.whitelabelPackage
                  ? (b.whitelabelPriceAtBooking || 0) - (b.parentPriceAtBooking || 0)
                  : (b.totalAmount || 0) - (b.parentPriceAtBooking || 0)
                return (
                  <div key={b._id} className="p-4 space-y-3 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-mono text-[10px] font-semibold text-gray-400 truncate">ID: {b.bookingId || '—'}</p>
                        <h4 className="font-semibold text-gray-900 mt-1 truncate">{customerName}</h4>
                        {b.customer?.phone && <p className="text-[11px] text-gray-500">{b.customer.phone}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${STATUS_STYLES[b.bookingStatus] || STATUS_STYLES.confirmed}`}>
                          <span className="h-1 w-1 rounded-full bg-current opacity-70" />
                          {b.bookingStatus}
                        </span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold capitalize ${PAYMENT_STYLES[b.paymentStatus] || PAYMENT_STYLES.pending}`}>
                          {b.paymentStatus || 'pending'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-100 pt-2.5">
                      <p className="text-[9px] text-gray-400 uppercase tracking-wide font-medium">Package</p>
                      <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{pkgTitle}</p>
                      {isWl && <span className="inline-block text-[9px] font-bold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded mt-1">Whitelabel</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <div>
                        <span className="text-[10px] text-gray-400 font-medium block">Travel Date</span>
                        <span className="text-xs font-semibold text-gray-700">
                          {b.travelDate ? new Date(b.travelDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-gray-400 font-medium block">Booked By</span>
                        <span className="text-xs font-semibold text-gray-700 truncate block">
                          {b.bookedBy?.name || '—'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center border-t border-gray-100 pt-2.5">
                      <div className="min-w-0">
                        <span className="text-[9px] text-gray-400 uppercase block truncate">Total</span>
                        <span className="text-xs font-bold text-gray-900 truncate block">₹{(b.totalAmount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-gray-400 uppercase block truncate">Parent</span>
                        <span className="text-xs font-semibold text-gray-600 truncate block">₹{(b.parentPriceAtBooking || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-gray-400 uppercase block truncate">WL Price</span>
                        <span className="text-xs font-semibold text-gray-600 truncate block">
                          {b.bookedBy?.role === 'parent_agent' ? '—' : `₹${(b.whitelabelPriceAtBooking || 0).toLocaleString('en-IN')}`}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-blue-500 uppercase block truncate">Extra</span>
                        <span className="text-xs font-bold text-blue-600 truncate block">₹{extraIncome.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 _flex-wrap">
                      {b.bookedBy?._id === user.id && (
                        <Link to={`/agency/bookings/${b._id}/edit`}
                          className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 shadow-sm hover:bg-gray-50"
                          title="Edit">
                          <Pencil size={12} />
                        </Link>
                      )}
                      <button onClick={() => setViewId(b._id)}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 shadow-sm hover:bg-gray-50"
                        title="View">
                        <Eye size={12} />
                      </button>
                      <button onClick={() => setTicketsBooking(b)}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 shadow-sm hover:bg-gray-50"
                        title="Tickets">
                        <Ticket size={12} /> ({b.tickets?.length || 0})
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
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
