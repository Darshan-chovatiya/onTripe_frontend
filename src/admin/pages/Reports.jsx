import { useState, useEffect } from 'react'
import {
  BarChart3, TrendingUp, DollarSign, Package, Users,
  ChevronRight, Calendar, Download, Filter,
  ArrowUpRight, ArrowDownRight, PieChart, Activity,
  Layers, Wallet, Briefcase, IndianRupee, Search,
  Share2, MousePointer2, Percent, MapPin
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer'
import Loader from '@/shared/components/Loader'
import { exportToExcel } from '@/admin/utils/exportExcel'

export default function Reports() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })
  const [searchQuery, setSearchQuery] = useState('')

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getReports(dateRange)
      if (res.data?.success) {
        setData(res.data.data)
      }
    } catch (err) {
      toast.error('Failed to load reporting data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [dateRange])

  const handleExport = async () => {
    if (!data) return
    try {
      const rows = data.packageActivity.flatMap(p => 
        p.whitelabelData.map(wl => ({
          'Package Title': p.title,
          'Creator': p.createdBy?.name || '—',
          'Creator Email': p.createdBy?.email || '—',
          'Whitelabel Agent': wl.createdBy?.name || '—',
          'Agent Code': wl.createdBy?.agentCode || '—',
          'Whitelabel Amount': wl.finalPrice,
          'Commission Type': wl.commissionType,
          'Commission Value': wl.commissionValue,
          'Bookings': wl.bookingCount,
          'Total Volume': wl.totalVolume,
          'Created At': new Date(wl.createdAt).toLocaleDateString()
        }))
      )

      await exportToExcel(rows, 'package_activity_report', 'Package Activity')
      toast.success('Report exported successfully')
    } catch (err) {
      toast.error('Export failed')
    }
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader size="lg" />
        <p className="text-sm text-gray-400 font-medium">Generating platform insights...</p>
      </div>
    )
  }

  const { financials, earningsAnalysis, packageActivity } = data || {}

  const filteredPackages = packageActivity?.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.createdBy?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      {/* ── Header ── */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 shadow-lg shadow-primary-900/20">
              <BarChart3 className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Advanced Reporting</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500 ml-13">Multidimensional analytics and financial auditing across your network</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 ml-13 lg:ml-0">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input 
              type="date" 
              className="border-none bg-transparent p-0 text-xs font-semibold text-gray-700 focus:ring-0" 
              value={dateRange.startDate}
              onChange={e => setDateRange(p => ({ ...p, startDate: e.target.value }))}
            />
            <span className="text-gray-300">/</span>
            <input 
              type="date" 
              className="border-none bg-transparent p-0 text-xs font-semibold text-gray-700 focus:ring-0" 
              value={dateRange.endDate}
              onChange={e => setDateRange(p => ({ ...p, endDate: e.target.value }))}
            />
          </div>
          <button 
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-gray-800 active:scale-95"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </header>

      {/* ── Financial Breakdown ── */}
      <section>
        <div className="mb-4 flex items-center gap-2 px-1">
          <TrendingUp className="h-4 w-4 text-primary-600" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Financial Breakdown</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FinancialCard 
            label="Total Gross Volume" 
            value={financials?.totalAmount} 
            icon={DollarSign} 
            color="bg-emerald-50 text-emerald-600"
            sub={`From ${financials?.totalBookings} bookings`}
          />
          <FinancialCard 
            label="Extra Income" 
            value={financials?.totalExtraIncome} 
            icon={ArrowUpRight} 
            color="bg-blue-50 text-blue-600"
            sub="Additional charges by agents"
          />
          <FinancialCard 
            label="Network Earnings" 
            value={financials?.networkEarnings} 
            icon={Wallet} 
            color="bg-primary-50 text-primary-600"
            sub="Total markup across levels"
          />
          <FinancialCard 
            label="Base Revenue" 
            value={financials?.baseRevenue} 
            icon={Layers} 
            color="bg-amber-50 text-amber-600"
            sub="Parent cost component"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* ── Package Distribution (Table Format) ── */}
        <div className="lg:col-span-12">
          <div className="mb-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary-600" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Package Distribution Activity</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search packages..."
                className="rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-[11px] font-semibold focus:ring-1 focus:ring-primary-100 shadow-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-50 bg-gray-50/50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-6 py-4">Package Details</th>
                    <th className="px-6 py-4">Creator</th>
                    <th className="px-6 py-4 text-center">Network Distribution</th>
                    <th className="px-6 py-4 text-right">Base Price</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredPackages?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <Package className="mx-auto h-10 w-10 text-gray-100" />
                        <p className="mt-2 text-sm text-gray-400 font-medium">No package activity found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPackages?.map(pkg => (
                      <PackageRow key={pkg._id} pkg={pkg} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PackageRow({ pkg }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <>
      <tr className={`transition-colors hover:bg-gray-50/50 ${expanded ? 'bg-primary-50/20' : ''}`}>
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <span className="font-bold text-gray-900">{pkg.title}</span>
            <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
               <MapPin size={10} /> {pkg.destination || 'N/A'}
            </span>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-700">{pkg.createdBy?.name || '—'}</span>
            <span className="text-[9px] font-bold text-primary-600 uppercase tracking-tighter">
              {pkg.createdBy?.role?.replace('_', ' ')}
            </span>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center justify-center gap-1.5">
            <div className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-primary-100 px-2 text-[11px] font-black text-primary-700">
              {pkg.whitelabelCount}
            </div>
            <span className="text-[10px] font-bold text-gray-400">Agents</span>
          </div>
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-1 text-xs font-black text-gray-900">
            <IndianRupee size={10} strokeWidth={3} />
            {pkg.basePrice.toLocaleString('en-IN')}
          </div>
        </td>
        <td className="px-6 py-4 text-right">
          <button 
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all ${
              expanded ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {expanded ? 'Hide Details' : 'View Distributions'}
            <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`} strokeWidth={3} />
          </button>
        </td>
      </tr>
      
      {expanded && (
        <tr>
          <td colSpan={5} className="bg-gray-50/50 p-4">
            <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-inner">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Agency Name</th>
                    <th className="px-4 py-3">Whitelabel Title</th>
                    <th className="px-4 py-3 text-center">Commission Model</th>
                    <th className="px-4 py-3 text-right">Whitelabel Price</th>
                    <th className="px-4 py-3 text-right">Extra Income</th>
                    <th className="px-4 py-3 text-right">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pkg.whitelabelData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-gray-400 italic">
                        No agencies have white-labeled this package yet.
                      </td>
                    </tr>
                  ) : (
                    pkg.whitelabelData.map(wl => (
                      <tr key={wl._id} className="text-xs">
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-900">{wl.createdBy?.name || '—'}</p>
                          <p className="text-[10px] font-mono text-gray-400">{wl.createdBy?.agentCode}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-600 truncate max-w-[150px]">{wl.customTitle || '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                            wl.commissionType === 'percentage' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {wl.commissionType === 'percentage' ? `${wl.commissionValue}%` : `₹${wl.commissionValue} Flat`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-black text-primary-600">₹{wl.finalPrice.toLocaleString('en-IN')}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-bold text-blue-600">₹{(wl.totalExtraIncome || 0).toLocaleString('en-IN')}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col">
                            <span className="font-black text-gray-900">{wl.bookingCount} Bookings</span>
                            <span className="text-[10px] text-emerald-600 font-bold">₹{wl.totalVolume.toLocaleString('en-IN')}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function FinancialCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md group">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</p>
          <div className="mt-1 flex items-center justify-end gap-1 text-xl font-black text-gray-900">
            <IndianRupee size={16} strokeWidth={3} className="text-gray-400" />
            {(value || 0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold text-gray-500">
        <MousePointer2 size={10} className="text-primary-400" />
        {sub}
      </div>
      <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-gray-50/50 group-hover:scale-110 transition-transform duration-500" />
    </div>
  )
}
