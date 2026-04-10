import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Eye, IndianRupee, Plus, Ticket, MessageSquare, Pencil, Search, Download, RefreshCw } from 'lucide-react'
import { useChildBookings } from '@/travelAgency/childAgency/hooks/useChildBookings.js'
import { useChildPackages } from '@/travelAgency/childAgency/hooks/useChildPackages.js'
import { listBookings } from '@/travelAgency/childAgency/services/childAgencyApi.js'
import CreateBookingModal from '@/travelAgency/childAgency/components/CreateBookingModal.jsx'
import BookingDetailModal from '@/travelAgency/childAgency/components/BookingDetailModal.jsx'
import Button from '@/shared/components/Button.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { basePackageFromBooking } from '@/travelAgency/shared/utils/bookingDetailHelpers.js'
import Pagination from '@/admin/components/Pagination.jsx'
import { exportToExcel } from '@/admin/utils/exportExcel.js'

const PAGE_SIZE = 10

function bookingOfferLabel(b) {
  if (b.whitelabelPackage) {
    const wl = b.whitelabelPackage
    const base = typeof wl.originalPackage === 'object' && wl.originalPackage?.title
    return wl.customTitle || base || 'White-label'
  }
  return b.package?.title || '—'
}

function statusClass(status) {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-800'
    case 'ongoing':
      return 'bg-blue-100 text-blue-800'
    case 'completed':
      return 'bg-gray-200 text-gray-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export default function Bookings() {
  const navigate = useNavigate()
  const { bookings, loading, error, create, fetchBooking, updateBooking, currentUserId, fetchBookings, pagination } = useChildBookings()
  const { availablePackages, whitelabels } = useChildPackages()
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [detailOpenEdit, setDetailOpenEdit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [exportLoading, setExportLoading] = useState(false)

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  // Fetch bookings with pagination
  useEffect(() => {
    fetchBookings({
      page,
      limit: PAGE_SIZE,
      search: search.trim(),
      status: statusFilter === 'all' ? undefined : statusFilter
    })
  }, [fetchBookings, page, search, statusFilter])

  const handleCreate = async (formData) => {
    setSubmitting(true)
    try {
      await create(formData)
      toast.success('Booking created successfully')
      setModalOpen(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateBooking = async (id, body) => {
    try {
      const updated = await updateBooking(id, body)
      toast.success('Booking updated')
      return updated
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      throw err
    }
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const { data } = await listBookings({
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
          'Phone': b.customer?.phone || '',
          'Travel Date': b.travelDate ? new Date(b.travelDate).toLocaleString() : '—',
          'Amount': b.totalAmount != null ? Number(b.totalAmount).toLocaleString('en-IN') : '—',
          'Booked By': b.bookedBy?.name || '—',
          'Status': b.bookingStatus || '—'
        })),
        'bookings',
        'Bookings'
      )
    } catch {
      toast.error('Export failed')
    } finally {
      setExportLoading(false)
    }
  }

  console.log('Bookings pagination:', pagination)

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            All bookings you and your sub-child agencies have created.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={bookings.length === 0 || exportLoading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {exportLoading ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
            Export Excel
          </button>
          <Button type="button" onClick={() => setModalOpen(true)}>
            <Plus className="mr-1.5 inline h-4 w-4" />
            New booking
          </Button>
        </div>
      </header>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
            <input
              className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
              placeholder="Search by booking ID, customer, or package..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 sm:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {error ? <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        {loading && bookings.length === 0 ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
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

        {!loading && bookings.length === 0 && !error ? (
          <div className="px-4 py-14 text-center">
            <Ticket className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-gray-900">
              {search || statusFilter !== 'all' ? 'No bookings match your search' : 'No bookings yet'}
            </p>
            {search || statusFilter !== 'all' ? null : (
              <>
                <p className="mt-1 text-sm text-gray-500">
                  When you or a sub-child agent confirms a trip, it will show up here.
                </p>
                <Button type="button" className="mt-4" onClick={() => setModalOpen(true)}>
                  <Plus className="mr-1.5 inline h-4 w-4" />
                  New booking
                </Button>
              </>
            )}
          </div>
        ) : null}

        {bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Booking ID</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Package / offer</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Customer</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Travel date</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Amount</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Booked by</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2.5 text-right align-middle text-xs font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => {
                  const communityPackageId = basePackageFromBooking(b)?._id || b?.package?._id || null
                  const bookedBy = b.bookedBy
                  const isSelf = currentUserId && bookedBy && String(bookedBy._id || bookedBy) === String(currentUserId)
                  return (
                    <tr key={b._id} className="transition-colors hover:bg-gray-50/80">
                      <td className="px-4 py-2.5 align-middle font-mono text-xs font-semibold text-gray-900">{b.bookingId}</td>
                      <td className="max-w-[12rem] px-4 py-2.5 align-middle">
                        <button
                          type="button"
                          onClick={() => {
                            const tab = b.whitelabelPackage ? 'whitelabels' : 'available'
                            const name = bookingOfferLabel(b)
                            navigate(`/agency/packages?tab=${tab}&search=${encodeURIComponent(name)}`)
                          }}
                          className="line-clamp-2 cursor-pointer text-left text-primary-600 transition-colors hover:text-primary-700 hover:underline active:text-primary-800"
                        >
                          {bookingOfferLabel(b)}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 align-middle text-gray-600">
                        <div className="font-medium text-gray-900">{b.customer?.name || '—'}</div>
                        <div className="text-xs">{b.customer?.phone || ''}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 align-middle text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                          {b.travelDate
                            ? new Date(b.travelDate).toLocaleString(undefined, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })
                            : '—'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 align-middle text-gray-800">
                        <span className="inline-flex items-center gap-0.5">
                          <IndianRupee className="h-3.5 w-3.5" />
                          {b.totalAmount != null ? Number(b.totalAmount).toLocaleString('en-IN') : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle text-gray-600">
                        {typeof bookedBy === 'object' && bookedBy?.name ? (
                          <>
                            {bookedBy.name}
                            {isSelf ? <span className="text-xs text-gray-400"> (you)</span> : null}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusClass(
                            b.bookingStatus
                          )}`}
                        >
                          {b.bookingStatus || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => { setDetailId(b._id); setDetailOpenEdit(false) }}
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                            title="View"
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDetailId(b._id); setDetailOpenEdit(true) }}
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!communityPackageId) return
                              const title = encodeURIComponent(bookingOfferLabel(b))
                              navigate(`/agency/packages/${communityPackageId}/community?title=${title}`)
                            }}
                            disabled={!communityPackageId}
                            title={communityPackageId ? 'Open community chat' : 'Community chat not available'}
                            className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white transition-colors ${
                              communityPackageId
                                ? 'text-primary-600 hover:text-primary-700 hover:bg-primary-50'
                                : 'opacity-50 cursor-not-allowed text-gray-300'
                            }`}
                          >
                            <MessageSquare size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
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

      <CreateBookingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        loading={submitting}
        availablePackages={availablePackages}
        whitelabels={whitelabels}
      />

      <BookingDetailModal
        isOpen={Boolean(detailId)}
        onClose={() => { setDetailId(null); setDetailOpenEdit(false) }}
        bookingId={detailId}
        fetchBooking={fetchBooking}
        updateBooking={handleUpdateBooking}
        openInEdit={detailOpenEdit}
      />
    </div>
  )
}
