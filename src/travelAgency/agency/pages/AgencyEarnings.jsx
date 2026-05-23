import { useState, useEffect, useCallback } from 'react'
import { IndianRupee, TrendingUp, Package, Calendar, Filter, Download, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useAgencyPermissions } from '@/travelAgency/agency/hooks/useAgencyPermissions.js'
import { ROLES } from '@/shared/utils/constants.js'
import { getEarnings as parentGetEarnings, listMyPackages } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getEarnings as childGetEarnings, listMyWhitelabels } from '@/travelAgency/childAgency/services/childAgencyApi.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import CustomDropdown from '@/shared/components/CustomDropdown.jsx'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const STATUS_COLORS = {
  confirmed: 'bg-blue-100 text-blue-700',
  ongoing: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function AgencyEarnings() {
  const { role } = useAgencyPermissions()
  const { toast } = useToast()
  const isParent = role === ROLES.PARENT_AGENCY

  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState({ totalEarnings: 0, totalRevenue: 0, totalBookings: 0 })
  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState([])
  const [whitelabels, setWhitelabels] = useState([])

  // Filters
  const [packageFilter, setPackageFilter] = useState('all')
  const [wlFilter, setWlFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [agentTypeFilter, setAgentTypeFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Load filter options
  useEffect(() => {
    if (isParent) {
      listMyPackages().then(r => setPackages(r.data?.data?.packages || [])).catch(() => { })
    } else {
      listMyWhitelabels().then(r => setWhitelabels(r.data?.data?.whitelabels || [])).catch(() => { })
    }
  }, [isParent])

  const fetchEarnings = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        status: statusFilter === 'all' ? undefined : statusFilter,
        agentType: agentTypeFilter === 'all' ? undefined : agentTypeFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }
      if (isParent && packageFilter !== 'all') params.packageId = packageFilter
      if (!isParent && wlFilter !== 'all') params.whitelabelId = wlFilter

      const fn = isParent ? parentGetEarnings : childGetEarnings
      const res = await fn(params)
      setRows(res.data?.data?.rows || [])
      setSummary(res.data?.data?.summary || { totalEarnings: 0, totalRevenue: 0, totalBookings: 0 })
    } catch {
      toast.error('Failed to load earnings')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isParent, packageFilter, wlFilter, statusFilter, agentTypeFilter, dateFrom, dateTo])

  useEffect(() => { fetchEarnings() }, [fetchEarnings])

  const handleExport = () => {
    if (!rows.length) return
    const headers = isParent
      ? ['Booking ID', 'Date', 'Travel Date', 'Package', 'Customer', 'Booked By', 'Role', 'Travelers', 'My Earning (Base)', 'Child Markup', 'Extra Income', 'Total Sold', 'Status']
      : ['Booking ID', 'Date', 'Travel Date', 'Offer', 'Customer', 'Booked By', 'Role', 'Travelers', 'Provider Cost', 'My Selling Price', 'WL Commission', 'Extra Income', 'Total Sold', 'Status']

    const csvRows = rows.map(r => isParent
      ? [r.bookingId, fmtDate(r.date), fmtDate(r.travelDate), r.packageTitle, r.customerName, r.bookedByName, r.bookedByRole, r.travelerCount, r.myEarning, r.bookedByRole === 'parent_agent' ? 0 : r.childMarkup, r.extraIncome, r.totalSold, r.status]
      : [r.bookingId, fmtDate(r.date), fmtDate(r.travelDate), r.offerTitle, r.customerName, r.bookedByName, r.bookedByRole, r.travelerCount, r.providerCost, r.mySellingPrice, r.myEarning, r.extraIncome, r.totalSold, r.status]
    )

    const csv = [headers, ...csvRows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'earnings.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<IndianRupee className="h-5 w-5" />}
          label={isParent ? 'My Earnings (Base Price)' : 'My Earnings (Markup)'}
          value={fmt(summary.totalEarnings)}
          color="text-emerald-600 bg-emerald-50"
        />
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total Revenue (All Sales)"
          value={fmt(summary.totalRevenue)}
          color="text-blue-600 bg-blue-50"
        />
        <SummaryCard
          icon={<Package className="h-5 w-5" />}
          label="Total Bookings"
          value={summary.totalBookings}
          color="text-violet-600 bg-violet-50"
        />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter className="h-4 w-4" /> Filters
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {isParent && packages.length > 0 && (
            <div className="w-56">
              <CustomDropdown
                value={packageFilter}
                onChange={e => setPackageFilter(e)}
                options={[
                  { value: 'all', label: 'All packages' },
                  ...packages.map(p => ({
                    value: p._id,
                    label: p.title || 'Untitled Package'
                  }))
                ]}
                searchable
                truncateLength={30}
                maxHeight="280px"
                className="w-full"
                buttonClassName="!border-gray-200 !py-2"
              />
            </div>
          )}
          {!isParent && whitelabels.length > 0 && (
            <div className="w-56">
              <CustomDropdown
                value={wlFilter}
                onChange={e => setWlFilter(e)}
                options={[
                  { value: 'all', label: 'All offers' },
                  ...whitelabels.map(w => ({
                    value: w._id,
                    label: w.customTitle || 'Whitelabel'
                  }))
                ]}
                searchable
                truncateLength={30}
                maxHeight="280px"
                className="w-full"
                buttonClassName="!border-gray-200 !py-2"
              />
            </div>
          )}
          <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All status</option>
            <option value="confirmed">Confirmed</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {isParent ? (
            <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              value={agentTypeFilter} onChange={e => setAgentTypeFilter(e.target.value)}>
              <option value="all">All bookings</option>
              <option value="parent">Created by Me</option>
              <option value="child">Created by Agents</option>
            </select>
          ) : (
            <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              value={agentTypeFilter} onChange={e => setAgentTypeFilter(e.target.value)}>
              <option value="all">All bookings</option>
              <option value="child">Created by Me</option>
              <option value="subChild">Created by Agents</option>
            </select>
          )}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
              <input type="date" className="w-full sm:w-auto rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From" />
            </div>
            <span className="hidden sm:block text-gray-400 text-center">—</span>
            <input type="date" className="w-full sm:w-auto rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 ml-1 sm:ml-0"
              value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To" />
          </div>
          <button onClick={() => { setPackageFilter('all'); setWlFilter('all'); setStatusFilter('all'); setAgentTypeFilter('all'); setDateFrom(''); setDateTo('') }}
            className="w-full sm:w-auto rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50">
            Clear
          </button>
          {/* x */}
          <button onClick={handleExport} disabled={!rows.length}
            className="w-full sm:w-auto sm:ml-auto flex justify-center items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader size="lg" /></div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No earnings found for selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-[11px] font-bold uppercase _tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3">Travel Date</th>
                  <th className="px-4 py-3">{isParent ? 'Package' : 'Offer'}</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Booked By</th>
                  <th className="px-4 py-3 text-right">{isParent ? 'Base Price (My Earning)' : 'Provider Cost'}</th>
                  <th className="px-4 py-3 text-right">{isParent ? 'Child Markup' : 'My Selling Price'}</th>
                  <th className="px-4 py-3 text-right">{isParent ? 'Extra Income' : 'WL Commission'}</th>
                  {!isParent && <th className="px-4 py-3 text-right">Extra Income</th>}
                  <th className="px-4 py-3 text-right">Total Sold</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r, i) => (
                  <tr key={r.bookingId || i} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{r.bookingId || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(r.date)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(r.travelDate)}</td>
                    <td className="max-w-[160px] px-4 py-3">
                      <div className="truncate font-medium text-gray-900">{isParent ? r.packageTitle : r.offerTitle}</div>
                      {r.isWhitelabel && <div className="text-[10px] text-violet-600">Whitelabel</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{r.customerName}</div>
                      <div className="text-[10px] text-gray-400">{r.travelerCount} traveler{r.travelerCount !== 1 ? 's' : ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{r.bookedByName}</div>
                      <div className="text-[10px] text-gray-400 capitalize">{r.bookedByRole?.replace(/_/g, ' ')}</div>
                    </td>
                    {isParent ? (
                      <>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-emerald-700">{fmt(r.myEarning)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="flex items-center justify-end gap-1 text-violet-600">
                            {r.bookedByRole === 'parent_agent' ? '—' : <><ArrowUpRight className="h-3.5 w-3.5" />{fmt(r.childMarkup)}</>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-blue-600">{fmt(r.extraIncome)}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(r.totalSold)}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-right">
                          <span className="flex items-center justify-end gap-1 text-red-500">
                            <ArrowDownRight className="h-3.5 w-3.5" />{fmt(r.providerCost)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">{fmt(r.mySellingPrice)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-emerald-700">{fmt(r.myEarning)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-blue-600">{fmt(r.extraIncome)}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(r.totalSold)}</td>
                      </>
                    )}
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ icon, label, value, color }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-xs font-medium text-gray-500">{label}</div>
        <div className="text-xl font-black tabular-nums text-gray-900">{value}</div>
      </div>
    </div>
  )
}
