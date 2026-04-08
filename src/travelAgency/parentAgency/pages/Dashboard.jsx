import { useEffect, useState } from 'react'
import { Users, Package, BookOpen, Store, RefreshCw, Copy, Check } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { getAnalytics } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'

const STATS_CONFIG = [
  { key: 'totalPackages',      label: 'Total Packages',      icon: Package,  color: 'bg-blue-50 text-blue-600' },
  { key: 'totalVendors',       label: 'Total Vendors',       icon: Store,    color: 'bg-purple-50 text-purple-600' },
  { key: 'totalBookings',      label: 'Total Bookings',      icon: BookOpen, color: 'bg-green-50 text-green-600' },
  { key: 'totalChildAgencies', label: 'Child Agencies',      icon: Users,    color: 'bg-orange-50 text-orange-600' },
]

export default function ParentDashboard() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!user?.agentCode) return
    navigator.clipboard.writeText(user.agentCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fetchAnalytics = async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await getAnalytics()
      setAnalytics(res.data?.data || null)
    } catch (e) {
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
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name || 'Partner'}</h1>
          <p className="text-gray-500 text-sm">Parent Agent Control Panel</p>
        </div>
        <button onClick={fetchAnalytics} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" aria-label="Refresh">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {err && <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{err}</div>}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {STATS_CONFIG.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <div className={`mb-4 inline-flex p-3 rounded-xl ${color}`}>
              <Icon size={24} />
            </div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {loading ? (
                <span className="inline-block h-7 w-12 animate-pulse rounded bg-gray-200" />
              ) : (
                analytics?.[key] ?? '—'
              )}
            </h3>
          </div>
        ))}
      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Partner Performance Overview</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 italic text-sm text-center px-6">Performance analytics for your child agencies will appear here once booking data is synchronized.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">

            {/* Agent Code */}
            {user?.agentCode && (
              <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
                <p className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-2">Your Agent Code</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-lg font-bold text-primary-700 tracking-widest">
                    {user.agentCode}
                  </span>
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all flex-shrink-0 ${
                      copied
                        ? 'border-green-200 bg-green-50 text-green-600'
                        : 'border-primary-200 bg-white text-primary-600 hover:bg-primary-100'
                    }`}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-primary-400 mt-2">Share this code with child agencies to register under you.</p>
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  )
}
