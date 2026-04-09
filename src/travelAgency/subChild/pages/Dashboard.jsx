import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Package, ContactRound, ArrowRight, Calendar, Sparkles } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { getAnalytics } from '@/travelAgency/subChild/services/subChildApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

const STATS_CONFIG = [
  { key: 'totalPackages', label: 'Whitelabel packages', icon: Package, iconClass: 'bg-blue-50 text-blue-700' },
  { key: 'totalBookings', label: 'Bookings', icon: BookOpen, iconClass: 'bg-emerald-50 text-emerald-700' },
  { key: 'totalCustomers', label: 'Customers', icon: ContactRound, iconClass: 'bg-amber-50 text-amber-800' },
]

const QUICK_LINKS = [
  { to: '/agency/my-bookings', label: 'My bookings', desc: 'Track your confirmed and pending trips' },
  { to: '/agency/packages', label: 'My package catalog', desc: 'Browse and select whitelabel packages' },
  { to: '/agency/customers', label: 'Customer list', desc: 'Review traveler details and contacts' },
  { to: '/agency/settings', label: 'Account settings', desc: 'Update profile and password' },
]

export default function SubChildDashboard() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const fetchAnalytics = async () => {
    setLoading(true)
    setErr('')
    try {
      const res = await getAnalytics()
      setAnalytics(res.data?.data || null)
    } catch (e) {
      setErr(getApiErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  return (
    <div className="animate-fade-in space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary-700">Sub-child panel</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
              Welcome back, {user?.name?.split(' ')[0] || 'Partner'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">Your booking and customer performance snapshot.</p>
          </div>
          <div className="hidden items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 sm:inline-flex">
            <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </section>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATS_CONFIG.map(({ key, label, icon: Icon, iconClass }) => (
          <article key={key} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 tabular-nums">
                  {loading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-gray-200" /> : analytics?.[key] ?? '?'}
                </p>
              </div>
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${iconClass}`}>
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Quick links</h2>
            <p className="mt-0.5 text-xs text-gray-500">Everything you use most, in one place.</p>
          </div>
          <ul className="divide-y divide-gray-100">
            {QUICK_LINKS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                </Link>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Insights</h2>
          <div className="mt-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-gray-300" strokeWidth={2} />
            <p className="mt-2 text-sm text-gray-600">Detailed booking analytics will appear as your activity increases.</p>
          </div>
        </article>
      </section>
    </div>
  )
}
