import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, Eye, IndianRupee, Plus, Ticket, MessageSquare, Pencil, Search, Download, RefreshCw } from 'lucide-react'
import { useChildBookings } from '@/travelAgency/childAgency/hooks/useChildBookings.js'
import { listBookings, listMyWhitelabels } from '@/travelAgency/childAgency/services/childAgencyApi.js'
import Button from '@/shared/components/Button.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { basePackageFromBooking } from '@/travelAgency/shared/utils/bookingDetailHelpers.js'
import Pagination from '@/admin/components/Pagination.jsx'
import { exportToExcel } from '@/admin/utils/exportExcel.js'
import CustomDropdown from '@/shared/components/CustomDropdown.jsx'

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
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  const packageId = searchParams.get('packageId')
  const whitelabelId = searchParams.get('whitelabelId')

  const { bookings, loading, error, currentUserId, fetchBookings, pagination } = useChildBookings()
  const { toast } = useToast()
  const [search, setSearch] = useState(initialSearch)
  const [statusFilter, setStatusFilter] = useState('all')
  const [whitelabelFilter, setWhitelabelFilter] = useState(whitelabelId || 'all')
  const [whitelabels, setWhitelabels] = useState([])
  const [page, setPage] = useState(1)
  const [exportLoading, setExportLoading] = useState(false)
  const [agentType, setAgentType] = useState('all') // 'all', 'self', 'agency'

  // Fetch whitelabels for filter
  useEffect(() => {
    listMyWhitelabels()
      .then(res => setWhitelabels(res.data?.data?.whitelabels || []))
      .catch(err => console.error('Failed to fetch whitelabels', err))
  }, [])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, whitelabelFilter, agentType])

  // Fetch bookings with pagination
  useEffect(() => {
    fetchBookings({
      page,
      limit: PAGE_SIZE,
      search: search.trim(),
      status: statusFilter === 'all' ? undefined : statusFilter,
      packageId,
      whitelabelId: whitelabelFilter === 'all' ? undefined : whitelabelFilter,
      agentType: agentType === 'all' ? undefined : agentType
    })
  }, [fetchBookings, page, search, statusFilter, packageId, whitelabelFilter, agentType])

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
          'Commission': b.whitelabelPackage ? `${b.whitelabelPackage.commissionType} (${b.whitelabelPackage.commissionValue})` : 'Base Price',
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
          <Button type="button" onClick={() => navigate('/agency/bookings/create')}>
            <Plus className="mr-1.5 inline h-4 w-4" />
            New booking
          </Button>
        </div>
      </header>

      {/* Booking Source Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <button
          onClick={() => setAgentType('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            agentType === 'all'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Bookings
        </button>
        <button
          onClick={() => setAgentType('self')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            agentType === 'self'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Bookings
        </button>
        <button
          onClick={() => setAgentType('agency')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            agentType === 'agency'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Sub-Agency Bookings
        </button>
      </div>

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
            <option value="all">All status</option>
            <option value="confirmed">Confirmed</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="w-full sm:w-64">
            <CustomDropdown
              value={whitelabelFilter}
              onChange={(e) => setWhitelabelFilter(e)}
              options={[
                { value: 'all', label: 'All Packages' },
                ...whitelabels.map(wl => ({
                  value: wl._id,
                  label: wl.customTitle || wl.originalPackage?.title || 'Unnamed Package'
                }))
              ]}
              searchable
              truncateLength={30}
              maxHeight="280px"
              className="w-full"
              buttonClassName="!border-gray-200 !py-2"
            />
          </div>
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
                <Button type="button" className="mt-4" onClick={() => navigate('/agency/bookings/create')}>
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
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Package</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Customer</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Travel date</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Total Amount</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Parent Price</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">WL Price</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Commission</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Extra Income</th>
                  <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Total Income</th>
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
                      <td className="max-w-[14rem] px-4 py-2.5 align-middle">
                        <div className="font-medium text-gray-900 truncate" title={bookingOfferLabel(b)}>
                          {bookingOfferLabel(b)}
                        </div>
                        {b.whitelabelPackage && (
                          <div className="text-[10px] text-violet-600 font-semibold">Whitelabel</div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 font-medium text-gray-900">
                            {b.customer?.name || '—'}
                            {b.travelers?.length > 0 && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-bold text-primary-700 ring-1 ring-inset ring-primary-100">
                                +{b.travelers.length} travelers
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{b.customer?.phone || ''}</div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 align-middle text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          {/* <CalendarDays className="h-3.5 w-3.5 text-gray-400" /> */}
                          {b.travelDate
                            ? new Date(b.travelDate).toLocaleString(undefined, {
                                dateStyle: 'medium',
                                // timeStyle: 'short',
                              })
                            : '—'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 align-middle text-gray-800">
                        <span className="inline-flex items-center gap-0.5">
                          <IndianRupee className="h-3 w-3" />
                          {b.totalAmount != null ? Number(b.totalAmount).toLocaleString('en-IN') : '—'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 align-middle text-gray-600">
                        <span className="inline-flex items-center gap-0.5">
                          <IndianRupee className="h-3 w-3" />
                          {(b.financials?.parentPrice ?? b.providerPriceAtBooking ?? 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 align-middle text-gray-600 font-medium">
                        <span className="inline-flex items-center gap-0.5">
                          <IndianRupee className="h-3 w-3" />
                          {(b.whitelabelPackage?.commissionValue ?? b.whitelabelPackage?.commissionValue ?? 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold">
                            <IndianRupee className="h-3 w-3" />
                            {(b.whitelabelPackage?.commissionValue || 0).toLocaleString('en-IN')}
                          </span>
                          {b.whitelabelPackage && (
                            <span className="text-[10px] text-gray-400">
                              {b.whitelabelPackage.commissionType === 'flat' 
                                ? `Flat ₹${b.whitelabelPackage.commissionValue}` 
                                : `${b.whitelabelPackage.commissionValue}%`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 align-middle text-blue-600 font-medium">
                        <span className="inline-flex items-center gap-0.5">
                          <IndianRupee className="h-3 w-3" />
                          {(b.financials?.extraIncome || 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 align-middle text-slate-900 font-black">
                        <span className="inline-flex items-center gap-0.5">
                          <IndianRupee className="h-3 w-3" />
                          {(b.financials?.totalIncome || 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle text-gray-600">
                        {typeof bookedBy === 'object' && bookedBy?.name ? (
                          <>
                            {bookedBy.name}
                            {/* {isSelf ? <span className="text-xs text-gray-400"> (you)</span> : null} */}
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
                            onClick={() => navigate('/agency/bookings/' + b._id)}
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                            title="View"
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate('/agency/bookings/' + b._id + '/edit')}
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
    </div>
  )
}
