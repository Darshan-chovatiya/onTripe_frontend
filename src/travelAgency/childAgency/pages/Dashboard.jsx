import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  BookOpen,
  Package,
  ContactRound,
  Copy,
  Check,
  ArrowRight,
  Calendar,
  Activity,
  Share2,
} from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { getAnalytics } from '@/travelAgency/childAgency/services/childAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

const STATS_CONFIG = [
  { key: 'totalPackages', label: 'Whitelabel packages', icon: Package, iconClass: 'bg-blue-50 text-blue-700' },
  { key: 'totalBookings', label: 'Bookings', icon: BookOpen, iconClass: 'bg-emerald-50 text-emerald-700' },
  { key: 'totalSubChildAgencies', label: 'Agents', icon: Users, iconClass: 'bg-indigo-50 text-indigo-700' },
  { key: 'totalCustomers', label: 'Customers', icon: ContactRound, iconClass: 'bg-amber-50 text-amber-800' },
]

const QUICK_LINKS = [
  { to: '/agency/packages', label: 'Whitelabels', desc: 'Manage package catalog and pricing' },
  { to: '/agency/bookings', label: 'Bookings', desc: 'Track sales and traveler requests' },
  { to: '/agency/manage-downstream', label: 'Agent network', desc: 'Manage downstream agents' },
  { to: '/agency/customers', label: 'Customers', desc: 'View and update traveler profiles' },
]

export default function ChildDashboard() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

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

  const handleCopyLink = async () => {
    if (!user?.agentCode) return
    const link = `${window.location.origin}/#/travelAgency/child/register?parentCode=${user.agentCode}`
    try {
      await navigator.clipboard.writeText(link)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
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
            <p className="text-xs font-medium uppercase tracking-wider text-primary-700">Child panel</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Hello, {user?.name || 'Agent'}</h1>
            <p className="mt-1 text-sm text-gray-500">Monitor your bookings, agent network, and customer growth.</p>
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
            <p className="mt-0.5 text-xs text-gray-500">Jump directly into daily tasks.</p>
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
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-700">Agent code</p>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="truncate font-mono text-base font-semibold tracking-wider text-primary-900">{user.agentCode}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy Agent Code"
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                    copied
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-primary-200 bg-white text-primary-700 hover:bg-primary-100'
                  }`}
                >
                  {copied ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : <Copy className="h-3.5 w-3.5" strokeWidth={2} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="mt-4 border-t border-primary-200 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-700">Quick Share</p>
                <p className="mt-1 text-[10px] leading-relaxed text-primary-600/80">Share this registration link. It automatically fills your agent code for new agencies.</p>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg border py-2 text-xs font-semibold transition-all ${
                    linkCopied
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-primary-300 bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-200'
                  }`}
                >
                  {linkCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Copy Registration Link
                    </>
                  )}
                </button>
              </div>
            </article>
          ) : null}

          <article className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">Network status</h2>
            <div className="mt-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
              <Activity className="mx-auto h-6 w-6 text-gray-300" strokeWidth={2} />
              <p className="mt-2 text-sm text-gray-600">Agent activity details will appear here as they start booking.</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
