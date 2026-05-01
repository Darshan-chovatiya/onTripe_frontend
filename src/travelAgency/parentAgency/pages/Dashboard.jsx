import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Package, BookOpen, Store,
  Copy, Check, ArrowRight, TrendingUp,
  CalendarDays, Share2,
} from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { getAnalytics } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

function todayStr() { return new Date().toISOString().slice(0, 10) }
function daysAgoStr(n) { const d = new Date(); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10) }
function startOfMonthStr() {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}
function startOfYearStr() { return `${new Date().getUTCFullYear()}-01-01` }
function lastMonthRange() {
  const d = new Date()
  const y = d.getUTCFullYear(), m = d.getUTCMonth()
  const sy = m === 0 ? y - 1 : y, sm = m === 0 ? 12 : m
  return {
    start: `${sy}-${String(sm).padStart(2, '0')}-01`,
    end: new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10),
  }
}

const PRESETS = [
  { label: 'Today',        getRange: () => { const t = todayStr(); return { start: t, end: t } } },
  { label: 'Last 7 days',  getRange: () => ({ start: daysAgoStr(6), end: todayStr() }) },
  { label: 'Last 30 days', getRange: () => ({ start: daysAgoStr(29), end: todayStr() }) },
  { label: 'This month',   getRange: () => ({ start: startOfMonthStr(), end: todayStr() }) },
  { label: 'Last month',   getRange: () => lastMonthRange() },
  { label: 'This year',    getRange: () => ({ start: startOfYearStr(), end: todayStr() }) },
]

const DEFAULT_RANGE = { start: startOfMonthStr(), end: todayStr() }

const STATS_CONFIG = [
  { key: 'totalPackages',     label: 'Total packages',  icon: Package,  iconClass: 'bg-blue-50 text-blue-700' },
  { key: 'totalVendors',      label: 'Vendors',          icon: Store,    iconClass: 'bg-violet-50 text-violet-700' },
  { key: 'totalBookings',     label: 'Bookings',         icon: BookOpen, iconClass: 'bg-emerald-50 text-emerald-700' },
  { key: 'totalChildAgencies',label: 'Child agencies',   icon: Users,    iconClass: 'bg-amber-50 text-amber-800' },
]

const QUICK_LINKS = [
  { to: '/agency/packages',           label: 'Manage packages',  desc: 'Update packages and availability' },
  { to: '/agency/bookings',           label: 'View bookings',    desc: 'Track your network booking flow' },
  { to: '/agency/manage-downstream',  label: 'Manage children',  desc: 'Review linked agencies and KYC' },
  { to: '/agency/settings',           label: 'Account settings', desc: 'Profile and password controls' },
]

export default function ParentDashboard() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [dateRange, setDateRange] = useState(DEFAULT_RANGE)

  const handleCopy = async () => {
    if (!user?.agentCode) return
    try {
      await navigator.clipboard.writeText(user.agentCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* no-op */ }
  }

  const handleCopyLink = async () => {
    if (!user?.agentCode) return
    const link = `${window.location.origin}/#/travelAgency/child/register?parentCode=${user.agentCode}`
    try {
      await navigator.clipboard.writeText(link)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch { /* no-op */ }
  }

  const fetchAnalytics = async (range) => {
    setLoading(true)
    setErr('')
    try {
      const params = range?.start && range?.end
        ? { startDate: range.start, endDate: range.end }
        : {}
      const res = await getAnalytics(params)
      setAnalytics(res.data?.data || null)
    } catch (e) {
      setErr(getApiErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAnalytics(DEFAULT_RANGE) }, [])

  const rangeLabel = dateRange.start && dateRange.end
    ? `${dateRange.start} – ${dateRange.end}`
    : 'All time'

  return (
    <div className="animate-fade-in space-y-6">

      {/* ── Header + Date filter ── */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary-700">Parent panel</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Welcome, {user?.name || 'Partner'}</h1>
            <p className="mt-1 text-sm text-gray-500">Overview of your package network, bookings, and child agency activity.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700">
            <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
            {rangeLabel}
          </span>
        </div>

        {/* From / To inputs */}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[140px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-500">From</label>
            <input
              type="date"
              value={dateRange.start}
              max={dateRange.end || todayStr()}
              onChange={e => {
                const r = { ...dateRange, start: e.target.value }
                setDateRange(r)
                if (r.start && r.end) fetchAnalytics(r)
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-200"
            />
          </div>
          <div className="min-w-[140px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-500">To</label>
            <input
              type="date"
              value={dateRange.end}
              min={dateRange.start}
              max={todayStr()}
              onChange={e => {
                const r = { ...dateRange, end: e.target.value }
                setDateRange(r)
                if (r.start && r.end) fetchAnalytics(r)
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-200"
            />
          </div>
          <button
            type="button"
            onClick={() => { setDateRange(DEFAULT_RANGE); fetchAnalytics(DEFAULT_RANGE) }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-500 transition hover:bg-gray-50"
          >
            Reset
          </button>
        </div>

        {/* Quick presets */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PRESETS.map(p => {
            const r = p.getRange()
            const active = dateRange.start === r.start && dateRange.end === r.end
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => { setDateRange(r); fetchAnalytics(r) }}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                  active
                    ? 'border-primary-400 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </section>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>
      )}

      {/* ── Stat cards ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS_CONFIG.map(({ key, label, icon: Icon, iconClass }) => (
          <article key={key} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 tabular-nums">
                  {loading
                    ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-gray-200" />
                    : analytics?.[key] ?? 0}
                </p>
                <p className="mt-1 text-xs text-gray-400">{rangeLabel}</p>
              </div>
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${iconClass}`}>
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
            </div>
          </article>
        ))}
      </section>

      {/* ── Quick links + Agent code ── */}
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
          {user?.agentCode && (
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
                <p className="mt-1 text-[10px] leading-relaxed text-primary-600/80">Share this registration link. It automatically fills your agent code for new child agencies.</p>
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
          )}

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
