import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Package,
  BookOpen,
  Store,
  Copy,
  Check,
  ArrowRight,
  Calendar,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { getAnalytics } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

const STATS_CONFIG = [
  { key: 'totalPackages', label: 'Total packages', icon: Package, iconClass: 'bg-blue-50 text-blue-700' },
  { key: 'totalVendors', label: 'Vendors', icon: Store, iconClass: 'bg-violet-50 text-violet-700' },
  { key: 'totalBookings', label: 'Bookings', icon: BookOpen, iconClass: 'bg-emerald-50 text-emerald-700' },
  { key: 'totalChildAgencies', label: 'Child agencies', icon: Users, iconClass: 'bg-amber-50 text-amber-800' },
]

const QUICK_LINKS = [
  { to: '/agency/packages', label: 'Manage packages', desc: 'Update packages and availability' },
  { to: '/agency/bookings', label: 'View bookings', desc: 'Track your network booking flow' },
  { to: '/agency/manage-downstream', label: 'Manage children', desc: 'Review linked agencies and KYC' },
  { to: '/agency/settings', label: 'Account settings', desc: 'Profile and password controls' },
]

export default function ParentDashboard() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!user?.agentCode) return
    try {
      await navigator.clipboard.writeText(user.agentCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // no-op
    }
  }

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
            <p className="text-xs font-medium uppercase tracking-wider text-primary-700">Parent panel</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Welcome, {user?.name || 'Partner'}</h1>
            <p className="mt-1 text-sm text-gray-500">Overview of your package network, bookings, and child agency activity.</p>
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <article className="rounded-xl border border-gray-200 bg-white lg:col-span-2">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Quick links</h2>
            <p className="mt-0.5 text-xs text-gray-500">Open high-frequency areas faster.</p>
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

        <div className="space-y-6">
          {user?.agentCode ? (
            <article className="rounded-xl border border-primary-100 bg-primary-50/70 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-700">Agent code</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="truncate font-mono text-base font-semibold tracking-wider text-primary-900">{user.agentCode}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    copied
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-primary-200 bg-white text-primary-700 hover:bg-primary-100'
                  }`}
                >
                  {copied ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : <Copy className="h-3.5 w-3.5" strokeWidth={2} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="mt-2 text-xs text-primary-700/80">Share this with child agencies to onboard under your account.</p>
            </article>
          ) : null}

          <article className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">Performance</h2>
            <div className="mt-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
              <TrendingUp className="mx-auto h-6 w-6 text-gray-300" strokeWidth={2} />
              <p className="mt-2 text-sm text-gray-600">Performance insights will appear as booking history grows.</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
