import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users, Package, BookOpen, Store,
  Copy, Check, ArrowRight, Share2,
  ChevronRight, Wallet, Layers, RefreshCw,
  ShieldCheck, Clock, XCircle, CalendarDays,
  Building2, TrendingUp, IndianRupee,
} from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { getAnalytics } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

/* ── date helpers ── */
function todayStr() { return new Date().toISOString().slice(0, 10) }
function daysAgoStr(n) { const d = new Date(); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10) }
function startOfMonthStr() {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}
function startOfYearStr() { return `${new Date().getUTCFullYear()}-01-01` }
function lastMonthRange() {
  const d = new Date(); const y = d.getUTCFullYear(), m = d.getUTCMonth()
  const sy = m === 0 ? y - 1 : y, sm = m === 0 ? 12 : m
  return { start: `${sy}-${String(sm).padStart(2, '0')}-01`, end: new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10) }
}
function fmtDate(s) {
  if (!s) return ''
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const PRESETS = [
  { label: 'Today',      getRange: () => { const t = todayStr(); return { start: t, end: t } } },
  { label: '7 days',     getRange: () => ({ start: daysAgoStr(6), end: todayStr() }) },
  { label: '30 days',    getRange: () => ({ start: daysAgoStr(29), end: todayStr() }) },
  { label: 'This month', getRange: () => ({ start: startOfMonthStr(), end: todayStr() }) },
  { label: 'Last month', getRange: () => lastMonthRange() },
  { label: 'This year',  getRange: () => ({ start: startOfYearStr(), end: todayStr() }) },
]
const DEFAULT_RANGE = { start: startOfMonthStr(), end: todayStr() }

function fmt(n) {
  if (n == null || n === 0) return '₹0'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toLocaleString('en-IN')}`
}

function Skeleton({ w = 'w-14', h = 'h-8' }) {
  return <span className={`inline-block ${h} ${w} animate-pulse rounded-lg bg-gray-100`} />
}

/* Period stat card — changes with date filter */
function PeriodCard({ label, value, sub, icon: Icon, accent, loading, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="group w-full rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
            <span className="inline-flex items-center rounded-full bg-primary-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-500">period</span>
          </div>
          <p className="mt-2 text-3xl font-black tabular-nums text-gray-900">
            {loading ? <Skeleton /> : value}
          </p>
          {sub && <p className="mt-1 text-[10px] text-gray-400 truncate">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
    </button>
  )
}

/* Total stat card — always all-time, never affected by date filter */
function TotalCard({ label, value, icon: Icon, accent, loading, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="group w-full rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gray-400">total</span>
          </div>
          <p className="mt-2 text-3xl font-black tabular-nums text-gray-900">
            {loading ? <Skeleton /> : value}
          </p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
    </button>
  )
}

const QUICK_LINKS = [
  { to: '/agency/packages',          label: 'Packages',       desc: 'Manage your package catalog',      icon: Package },
  { to: '/agency/bookings',          label: 'Bookings',       desc: 'Track sales and traveler requests', icon: BookOpen },
  { to: '/agency/manage-downstream', label: 'Child agencies', desc: 'Review linked agencies and KYC',   icon: Users },
  { to: '/agency/earnings',          label: 'Earnings',       desc: 'View revenue and commission data',  icon: Wallet },
]

export default function ParentDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [err, setErr]             = useState('')
  const [copied, setCopied]       = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [dateRange, setDateRange] = useState(DEFAULT_RANGE)

  const handleCopy = async () => {
    if (!user?.agentCode) return
    try { await navigator.clipboard.writeText(user.agentCode); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* */ }
  }
  const handleCopyLink = async () => {
    if (!user?.agentCode) return
    const link = `${window.location.origin}/#/travelAgency/child/register?parentCode=${user.agentCode}`
    try { await navigator.clipboard.writeText(link); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000) } catch { /* */ }
  }

  const fetchAll = async (range) => {
    setLoading(true); setErr('')
    try {
      const params = range?.start && range?.end ? { startDate: range.start, endDate: range.end } : {}
      const res = await getAnalytics(params)
      setAnalytics(res.data?.data || null)
    } catch (e) {
      setErr(getApiErrorMessage(e))
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll(DEFAULT_RANGE) }, [])

  const totalRevenue     = analytics?.totalRevenue  ?? 0
  const totalEarnings    = analytics?.totalEarnings ?? 0
  const totalBookings    = analytics?.totalBookings ?? 0
  const bookingsByStatus = analytics?.bookingsByStatus || []
  const getStatus        = (s) => bookingsByStatus.find(b => b._id === s)?.count ?? 0
  const periodLabel      = `${fmtDate(dateRange.start)} – ${fmtDate(dateRange.end)}`

  return (
    <div className="animate-fade-in space-y-6 pb-8">

      {/* ── Header ── */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-600">Parent Agency</p>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Welcome back, {user?.name?.split(' ')[0] || 'Partner'} 👋
        </h1>
        <p className="text-sm text-gray-500">Here's what's happening across your network.</p>
      </div>

      {/* ── Date filter bar ── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => {
              const r = p.getRange()
              const active = dateRange.start === r.start && dateRange.end === r.end
              return (
                <button key={p.label} type="button"
                  onClick={() => { setDateRange(r); fetchAll(r) }}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                    active
                      ? 'border-primary-600 bg-primary-600 text-white'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-700'
                  }`}>
                  {p.label}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gray-400 hidden sm:block" strokeWidth={2} />
              <input type="date" value={dateRange.start} max={dateRange.end || todayStr()}
                onChange={e => { const r = { ...dateRange, start: e.target.value }; setDateRange(r); if (r.start && r.end) fetchAll(r) }}
                className="w-[110px] bg-transparent text-xs font-medium text-gray-700 focus:outline-none" />
              <span className="text-gray-300">–</span>
              <input type="date" value={dateRange.end} min={dateRange.start} max={todayStr()}
                onChange={e => { const r = { ...dateRange, end: e.target.value }; setDateRange(r); if (r.start && r.end) fetchAll(r) }}
                className="w-[110px] bg-transparent text-xs font-medium text-gray-700 focus:outline-none" />
            </div>
            <button type="button" onClick={() => fetchAll(dateRange)} disabled={loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 transition hover:border-gray-400 hover:text-gray-700 disabled:opacity-40">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {err && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{err}</div>}

      {/* ── Period stat cards (change with date filter) ── */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
          <CalendarDays className="h-3 w-3" />
          Period summary · {periodLabel}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PeriodCard
            label="Bookings"
            value={loading ? null : totalBookings}
            sub={periodLabel}
            icon={BookOpen}
            accent="bg-sky-50 text-sky-600"
            loading={loading}
            onClick={() => navigate('/agency/bookings')}
          />
          <PeriodCard
            label="Revenue"
            value={loading ? null : fmt(totalRevenue)}
            sub={periodLabel}
            icon={IndianRupee}
            accent="bg-emerald-50 text-emerald-600"
            loading={loading}
            onClick={() => navigate('/agency/earnings')}
          />
          <PeriodCard
            label="Net Earnings"
            value={loading ? null : fmt(totalEarnings)}
            sub={periodLabel}
            icon={Wallet}
            accent="bg-primary-50 text-primary-600"
            loading={loading}
            onClick={() => navigate('/agency/earnings')}
          />
        </div>
      </div>

      {/* ── All-time inventory cards (never change with date) ── */}
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">Platform totals · All time</p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <TotalCard label="Packages"       value={loading ? null : analytics?.totalPackages ?? 0}       icon={Package}   accent="bg-violet-50 text-violet-600"  loading={loading} onClick={() => navigate('/agency/packages')} />
          <TotalCard label="Child Agencies" value={loading ? null : analytics?.totalChildAgencies ?? 0}  icon={Users}     accent="bg-amber-50 text-amber-600"    loading={loading} onClick={() => navigate('/agency/manage-downstream')} />
          <TotalCard label="Vendors"        value={loading ? null : analytics?.totalVendors ?? 0}        icon={Store}     accent="bg-rose-50 text-rose-500"      loading={loading} onClick={() => navigate('/agency/vendors')} />
          <TotalCard label="Whitelabels"    value={loading ? null : analytics?.totalWhitelabels ?? 0}    icon={Layers}    accent="bg-indigo-50 text-indigo-600"  loading={loading} onClick={() => navigate('/agency/packages')} />
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Left col */}
        <div className="space-y-6 lg:col-span-2">

          {/* Booking breakdown */}
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-50 px-6 py-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Booking Breakdown</h2>
                <p className="mt-0.5 text-xs text-gray-400">{periodLabel} · {totalBookings} bookings</p>
              </div>
              <Link to="/agency/bookings"
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50">
                View all <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-px bg-gray-100 sm:grid-cols-4">
              {[
                { label: 'Confirmed', status: 'confirmed', num: 'text-sky-700',     badge: 'bg-sky-100 text-sky-700' },
                { label: 'Ongoing',   status: 'ongoing',   num: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700' },
                { label: 'Completed', status: 'completed', num: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
                { label: 'Cancelled', status: 'cancelled', num: 'text-red-600',     badge: 'bg-red-100 text-red-600' },
              ].map(({ label, status, num, badge }) => (
                <div key={status} className="bg-white p-5">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge}`}>{label}</span>
                  <p className={`mt-3 text-3xl font-black tabular-nums ${num}`}>
                    {loading ? <Skeleton w="w-10" /> : getStatus(status)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Earnings summary */}
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-50 px-6 py-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Earnings Summary</h2>
                <p className="mt-0.5 text-xs text-gray-400">{periodLabel}</p>
              </div>
              <Link to="/agency/earnings"
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50">
                Details <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              </Link>
            </div>
            <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0 divide-gray-100">
              {[
                { label: 'Total Revenue', value: fmt(totalRevenue),  color: 'text-emerald-700' },
                { label: 'Net Earnings',  value: fmt(totalEarnings), color: 'text-sky-700' },
                { label: 'Bookings',      value: loading ? null : totalBookings, color: 'text-gray-900' },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
                  <p className={`mt-2 text-2xl font-black tabular-nums ${color}`}>
                    {loading ? <Skeleton h="h-7" /> : value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Quick links */}
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-50 px-6 py-4">
              <h2 className="text-sm font-bold text-gray-900">Quick Access</h2>
              <p className="text-xs text-gray-400">Jump into your most-used areas</p>
            </div>
            <div className="grid grid-cols-1 divide-y divide-gray-50 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {QUICK_LINKS.map(({ to, label, desc, icon: Icon }) => (
                <Link key={to} to={to}
                  className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-gray-500 transition group-hover:border-gray-300 group-hover:bg-white group-hover:text-gray-900">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-600" strokeWidth={2} />
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Right col */}
        <div className="space-y-6">

          {/* Agent code */}
          {user?.agentCode && (
            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-50 px-5 py-4">
                <h2 className="text-sm font-bold text-gray-900">Agent Code</h2>
                <p className="text-xs text-gray-400">Share to onboard child agencies</p>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <span className="font-mono text-base font-black tracking-widest text-gray-900">{user.agentCode}</span>
                  <button type="button" onClick={handleCopy}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                      copied ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                    {copied ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Copy className="h-3.5 w-3.5" strokeWidth={2} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-700">Registration link</p>
                  <p className="mt-1 text-[11px] text-gray-400">Auto-fills your code for new child agencies signing up.</p>
                  <button type="button" onClick={handleCopyLink}
                    className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition-all ${
                      linkCopied
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-gray-900 bg-gray-900 text-white hover:bg-gray-800'
                    }`}>
                    {linkCopied
                      ? <><Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Copied!</>
                      : <><Share2 className="h-3.5 w-3.5" strokeWidth={2} /> Copy Registration Link</>}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Network */}
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-50 px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900">Network</h2>
              <p className="text-xs text-gray-400">All-time distribution hierarchy</p>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { label: 'Child Agencies', value: analytics?.totalChildAgencies ?? 0, icon: Building2 },
                { label: 'Packages',       value: analytics?.totalPackages ?? 0,       icon: Package },
                { label: 'Vendors',        value: analytics?.totalVendors ?? 0,        icon: Store },
                { label: 'Whitelabels',    value: analytics?.totalWhitelabels ?? 0,    icon: Layers },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-500">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
                  <span className="text-sm font-bold tabular-nums text-gray-900">
                    {loading ? <Skeleton w="w-6" h="h-4" /> : value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* KYC */}
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-50 px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900">KYC Status</h2>
            </div>
            <div className="p-5">
              {(() => {
                const status = user?.kyc?.status || 'pending'
                const cfg = {
                  approved: { label: 'Verified',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ShieldCheck },
                  pending:  { label: 'Under Review',    cls: 'bg-amber-50 text-amber-700 border-amber-200',       icon: Clock },
                  rejected: { label: 'Action Required', cls: 'bg-red-50 text-red-700 border-red-200',             icon: XCircle },
                }
                const { label, cls, icon: Icon } = cfg[status] || cfg.pending
                return (
                  <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${cls}`}>
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                    <div>
                      <p className="text-sm font-bold">{label}</p>
                      <p className="text-[11px] opacity-70 capitalize">KYC {status}</p>
                    </div>
                  </div>
                )
              })()}
              <Link to="/agency/settings"
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50">
                Manage KYC <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
