import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Eye, IndianRupee, Pencil, Plus, Ticket, Search, Download, RefreshCw } from 'lucide-react'
import { useSubChildBookings } from '@/travelAgency/subChild/hooks/useSubChildBookings.js'
import { listMyBookings } from '@/travelAgency/subChild/services/subChildApi.js'
import Button from '@/shared/components/Button.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
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
    case 'confirmed': return 'bg-emerald-100 text-emerald-800'
    case 'ongoing':   return 'bg-blue-100 text-blue-800'
    case 'completed': return 'bg-gray-200 text-gray-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default:          return 'bg-gray-100 text-gray-700'
  }
}

export default function MyBookings() {
  const navigate = useNavigate()
  const { bookings, loading, error, fetchBookings, pagination } = useSubChildBookings()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => { setPage(1) }, [search, statusFilter])

  useEffect(() => {
    fetchBookings({ page, limit: PAGE_SIZE, search: search.trim(), status: statusFilter === 'all' ? undefined : statusFilter })
  }, [fetchBookings, page, search, statusFilter])

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const { data } = await listMyBookings({ page: 1, limit: 10000, search: search.trim(), status: statusFilter === 'all' ? undefined : statusFilter })
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
          'Status': b.bookingStatus || '—',
        })),
        'my-bookings', 'My Bookings'
      )
    } catch { toast.error('Export failed') }
    finally { setExportLoading(false) }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My bookings</h1>
          <p className="mt-1 text-sm text-gray-500">Bookings created by your sub-child agency account.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleExport} disabled={bookings.length === 0 || exportLoading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50">
            {exportLoading ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
            Export Excel
          </button>
          <Button type="button" onClick={() => navigate('/agency/my-bookings/create')}>
            <Plus className="mr-1.5 inline h-4 w-4" /> New booking
          </Button>
        </div>
      </header>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
            <input className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
              placeholder="Search by booking ID, customer, or package..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 sm:w-48"
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {error && <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {loading && bookings.length === 0 && (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-100 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2"><div className="h-4 w-1/3 rounded bg-gray-200" /><div className="h-3 w-1/2 rounded bg-gray-200" /></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && bookings.length === 0 && !error && (
          <div className="px-4 py-14 text-center">
            <Ticket className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-gray-900">{search || statusFilter !== 'all' ? 'No bookings match your search' : 'No bookings yet'}</p>
            {!search && statusFilter === 'all' && (
              <Button type="button" className="mt-4" onClick={() => navigate('/agency/my-bookings/create')}>
                <Plus className="mr-1.5 inline h-4 w-4" /> New booking
              </Button>
            )}
          </div>
        )}

        {bookings.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Booking</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Package / Offer</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Customer</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Travel Date</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Amount</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const customerName = b.customer?.name || '—'
                  const initials = customerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <tr key={b._id} className="group border-b border-gray-50 transition-all last:border-0 hover:bg-gray-50/80">
                      <td className="px-4 py-3.5 align-middle">
                        <span className="font-mono text-[11px] font-semibold text-gray-400">#{b.bookingId?.slice(-8) || '—'}</span>
                      </td>
                      <td className="max-w-[12rem] px-4 py-3.5 align-middle">
                        <button type="button" onClick={() => { const tab = b.whitelabelPackage ? 'whitelabels' : 'available'; navigate(`/agency/packages?tab=${tab}&search=${encodeURIComponent(bookingOfferLabel(b))}`) }}
                          className="line-clamp-2 text-left text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline">
                          {bookingOfferLabel(b)}
                        </button>
                        {b.whitelabelPackage && <span className="text-[10px] font-semibold text-violet-500">Whitelabel</span>}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-[10px] font-bold text-white shadow-sm">
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{customerName}</p>
                            {b.customer?.phone && <p className="text-[11px] text-gray-400">{b.customer.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-[12px] text-gray-500">
                        {b.travelDate ? new Date(b.travelDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span className="text-sm font-bold text-gray-900">₹{b.totalAmount != null ? Number(b.totalAmount).toLocaleString('en-IN') : '—'}</span>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${statusClass(b.bookingStatus)}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                          {b.bookingStatus || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-right">
                        <div className="inline-flex items-center gap-1">
                          <button type="button" onClick={() => navigate(`/agency/my-bookings/${b._id}`)} title="View"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 shadow-sm transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600">
                            <Eye size={13} />
                          </button>
                          <button type="button" onClick={() => navigate(`/agency/my-bookings/edit/${b._id}`)} title="Edit"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 shadow-sm transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600">
                            <Pencil size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {bookings.length > 0 && (
          <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.totalCount} limit={PAGE_SIZE} onPageChange={setPage} />
        )}
      </div>
    </div>
  )
}
