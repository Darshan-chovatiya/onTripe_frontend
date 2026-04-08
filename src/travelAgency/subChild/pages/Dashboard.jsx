import { useEffect, useState } from 'react'
import { BookOpen, Package, ContactRound, RefreshCw } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { getAnalytics } from '@/travelAgency/subChild/services/subChildApi.js'

const STATS_CONFIG = [
  { key: 'totalPackages',  label: 'White Label Packages', icon: Package,      color: 'bg-blue-50 text-blue-600' },
  { key: 'totalBookings',  label: 'Total Bookings', icon: BookOpen,     color: 'bg-green-50 text-green-600' },
  { key: 'totalCustomers', label: 'Total Customers', icon: ContactRound, color: 'bg-orange-50 text-orange-600' },
]

export default function SubChildDashboard() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await getAnalytics()
      setAnalytics(res.data?.data || null)
    } catch {
      setErr('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAnalytics() }, [])

  return (
    <div className="animate-fade-in">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0] || 'Partner'}</h1>
          <p className="text-gray-500 text-sm">Sub-Agent Personal Operations Hub</p>
        </div>
        <button onClick={fetchAnalytics} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" aria-label="Refresh">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {err && <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{err}</div>}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {STATS_CONFIG.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <div className={`mb-4 inline-flex p-3 rounded-xl ${color}`}>
              <Icon size={24} />
            </div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {loading
                ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-gray-200" />
                : analytics?.[key] ?? '—'}
            </h3>
          </div>
        ))}
      </div>

      {/* Main Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Trip Schedule</h2>
          <div className="flex items-center justify-center h-40 bg-gray-50 rounded-xl border border-gray-100 italic text-gray-400 text-sm">
            No upcoming trips scheduled.
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center min-h-[200px]">
          <BookOpen className="h-12 w-12 text-gray-200 mb-2" />
          <h2 className="text-gray-400 font-medium italic text-sm">Booking analytics coming soon.</h2>
          <p className="text-xs text-gray-400 text-center mt-2 px-8">Transactions through your Child Agency partner will synchronize here in real-time.</p>
        </div>
      </div>
    </div>
  )
}
