import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users, Package, Ticket,
  ShieldCheck, Clock, ChevronRight, RefreshCw, CalendarDays,
  TrendingUp, ArrowUpRight,
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

function countInAgg(arr, id) {
  if (!Array.isArray(arr)) return 0
  const row = arr.find((x) => x._id === id)
  return row?.count ?? 0
}
function sumAgg(arr) {
  if (!Array.isArray(arr)) return 0
  return arr.reduce((s, x) => s + (x.count || 0), 0)
}
function roleLabel(role) {
  return role ? String(role).replace(/_/g, ' ') : '—'
}

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
  { label: '7 days',       getRange: () => ({ start: daysAgoStr(6), end: todayStr() }) },
  { label: '30 days',      getRange: () => ({ start: daysAgoStr(29), end: todayStr() }) },
  { label: 'This month',   getRange: () => ({ start: startOfMonthStr(), end: todayStr() }) },
  { label: 'Last month',   getRange: () => lastMonthRange() },
  { label: 'This year',    getRange: () => ({ start: startOfYearStr(), end: todayStr() }) },
]

const DEFAULT_RANGE = { start: startOfMonthStr(), end: todayStr() }

function normalizeData(raw) {
  if (!raw) return null
  if (raw.summary) {
    return {
      totalBookings:     raw.summary.totalBookings  ?? 0,
      totalRevenue:      raw.summary.totalRevenue   ?? 0,
      totalCustomers:    raw.summary.totalCustomers ?? 0,
      totalPackages:     raw.summary.totalPackages  ?? 0,
      totalKycApproved:  raw.summary.totalKycApproved ?? 0,
      totalKycPending:   raw.summary.totalKycPending  ?? 0,
      bookingsByStatus:  raw.details?.bookingsByStatus  || [],
      agentsByRole:      raw.details?.agentsByRole      || [],
      recentAgents:      raw.details?.recentAgents      || [],
      pendingKycAgents:  raw.details?.kycPendingAgents  || [],
    }
  }
  return {
    ...raw,
    totalKycApproved: countInAgg(raw.kycStatusCounts, 'approved'),
    totalKycPending:  countInAgg(raw.kycStatusCounts, 'pending'),
  }
}

// Mini sparkline bar chart (decorative)
function SparkBars({ color = 'bg-primary-400' }) {
  const heights = [30, 55, 40, 70, 50, 80, 60]
  return (
    <div className="flex items-end gap-0.5 h-8">
      {heights.map((h, i) => (
        <div key={i} className={`w-1.5 rounded-sm opacity-60 ${color}`} style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)
  const [dateRange, setDateRange] = useState(DEFAULT_RANGE)

  const load = async (range) => {
    setLoading(true)
    setError(null)
    try {
      const params = range?.start && range?.end
        ? { startDate: range.start, endDate: range.end }
        : {}
      const res = await adminApi.getAnalytics(params)
      if (res.data?.success && res.data?.data) {
        setData(normalizeData(res.data.data))
      } else {
        setData(null)
        setError('Could not load dashboard data.')
      }
    } catch (err) {
      setData(null)
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(DEFAULT_RANGE) }, [])

  const totalAgents    = sumAgg(data?.agentsByRole)
  const parentAgents   = countInAgg(data?.agentsByRole, 'parent_agent')
  const childAgents    = countInAgg(data?.agentsByRole, 'child_agent')
  const subChildAgents = countInAgg(data?.agentsByRole, 'sub_child_agent')
  const bookingConfirmed = countInAgg(data?.bookingsByStatus, 'confirmed')
  const bookingOngoing   = countInAgg(data?.bookingsByStatus, 'ongoing')
  const bookingCompleted = countInAgg(data?.bookingsByStatus, 'completed')
  const bookingCancelled = countInAgg(data?.bookingsByStatus, 'cancelled')
  const pendingKycAgents = data?.pendingKycAgents || []

  const rangeLabel = dateRange.start && dateRange.end
    ? `${dateRange.start} – ${dateRange.end}`
    : 'All time'

  const handleSyncStatus = async () => {
    setSyncing(true); setSyncMsg(null)
    try {
      await adminApi.syncBookingStatus()
      setSyncMsg({ type: 'ok', text: 'Booking statuses synced.' })
      load(dateRange)
    } catch (e) {
      setSyncMsg({ type: 'err', text: getApiErrorMessage(e) || 'Sync failed.' })
    } finally { setSyncing(false) }
  }

  const stats = [
    {
      label: 'Total Bookings',
      value: data?.totalBookings ?? '—',
      icon: Ticket,
      accent: 'from-sky-500 to-sky-600',
      text: 'text-sky-700',
      bar: 'bg-sky-400',
      link: '/admin/bookings',
    },
    {
      label: 'Travelers',
      value: data?.totalCustomers ?? '—',
      icon: Users,
      accent: 'from-violet-500 to-violet-600',
      text: 'text-violet-700',
      bar: 'bg-violet-400',
      link: '/admin/customers',
    },
    {
      label: 'Packages',
      value: data?.totalPackages ?? '—',
      icon: Package,
      accent: 'from-primary-500 to-primary-700',
      text: 'text-primary-700',
      bar: 'bg-primary-400',
      link: '/admin/packages',
    },
    {
      label: 'KYC Approved',
      value: data?.totalKycApproved ?? '—',
      icon: ShieldCheck,
      accent: 'from-teal-500 to-teal-600',
      text: 'text-teal-700',
      bar: 'bg-teal-400',
      link: '/admin/agencies',
    },
    {
      label: 'KYC Pending',
      value: data?.totalKycPending ?? '—',
      icon: Clock,
      accent: 'from-amber-500 to-orange-500',
      text: 'text-amber-700',
      bar: 'bg-amber-400',
      link: '/admin/agencies',
    },
  ]

  if (loading && !data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary-100 border-t-primary-600" />
        <p className="text-sm font-medium text-gray-400">Loading dashboard…</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6 pb-8">

      {/* ── Top bar: greeting + date filter ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">Platform overview and key metrics</p>
        </div>

        {/* Date range pill */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 w-full lg:w-auto">
          {/* Scrollable preset buttons on small screens */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 pr-2 snap-x">
            {PRESETS.map(p => {
              const r = p.getRange()
              const active = dateRange.start === r.start && dateRange.end === r.end
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => { setDateRange(r); load(r) }}
                  className={`shrink-0 snap-start rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                    active
                      ? 'border-primary-500 bg-primary-500 text-white shadow-sm shadow-primary-200'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-primary-300 hover:text-primary-600'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
          
          <div className="flex items-center justify-between sm:justify-start gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 w-full sm:w-auto shrink-0">
            <CalendarDays className="h-3.5 w-3.5 text-gray-400 shrink-0" strokeWidth={2} />
            <input
              type="date"
              value={dateRange.start}
              max={dateRange.end || todayStr()}
              onChange={e => { const r = { ...dateRange, start: e.target.value }; setDateRange(r); if (r.start && r.end) load(r) }}
              className="w-full sm:w-[110px] bg-transparent text-xs font-medium text-gray-600 focus:outline-none"
            />
            <span className="text-gray-300 shrink-0">–</span>
            <input
              type="date"
              value={dateRange.end}
              min={dateRange.start}
              max={todayStr()}
              onChange={e => { const r = { ...dateRange, end: e.target.value }; setDateRange(r); if (r.start && r.end) load(r) }}
              className="w-full sm:w-[110px] bg-transparent text-xs font-medium text-gray-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
      )}

      {/* ── Stat cards ── */}
      <section aria-label="Key metrics">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} onClick={() => navigate(s.link)}
                className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer">
                <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${s.accent} shadow-sm`}>
                  <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
                <p className="mt-1 text-2xl font-black tabular-nums text-gray-900">{s.value}</p>
                <div className="mt-3 flex items-end justify-between">
                  <SparkBars color={s.bar} />
                  <ArrowUpRight className={`h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 ${s.text}`} strokeWidth={2.5} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Recent agents table */}
        <section className="lg:col-span-2 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between border-b border-gray-50 px-6 py-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Recent Agents</h2>
              <p className="text-xs text-gray-400">Latest registrations on the platform</p>
            </div>
            <Link to="/admin/agencies"
              className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 transition hover:bg-primary-100">
              View all <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </Link>
          </div>
          <div className="overflow-x-auto w-full">
            {data?.recentAgents?.length ? (
              <table className="w-full min-w-[500px] text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/60">
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Agent</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Role</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.recentAgents.map((agent) => {
                    const initials = (agent.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                    const agentPath = agent.role === 'parent_agent'
                      ? `/admin/agencies`
                      : `/admin/child-agencies`
                    return (
                      <tr key={agent._id} onClick={() => navigate(agentPath)}
                        className="cursor-pointer transition hover:bg-gray-50/80">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-[10px] font-bold text-white">
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{agent.name || '—'}</p>
                              <p className="text-[11px] text-gray-400">{agent.email || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-primary-700">
                            {roleLabel(agent.role)}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right text-[12px] text-gray-400">
                          {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <p className="px-6 py-12 text-center text-sm text-gray-400">No recent agent activity.</p>
            )}
          </div>
        </section>

        {/* Right column */}
        <div className="space-y-6">

          {/* Agent mix */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Agent Mix</h2>
                <p className="text-xs text-gray-400">Breakdown by role</p>
              </div>
              <button type="button" onClick={() => navigate('/admin/agencies')}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 transition hover:bg-primary-100">
                <TrendingUp className="h-4 w-4 text-primary-600" strokeWidth={2} />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { label: 'Total', value: totalAgents, pct: 100, color: 'bg-primary-500', link: '/admin/agencies' },
                { label: 'Parent', value: parentAgents, pct: totalAgents ? Math.round((parentAgents / totalAgents) * 100) : 0, color: 'bg-sky-400', link: '/admin/agencies' },
                { label: 'Child', value: childAgents, pct: totalAgents ? Math.round((childAgents / totalAgents) * 100) : 0, color: 'bg-violet-400', link: '/admin/child-agencies' },
              ].map(({ label, value, pct, color, link }) => (
                <div key={label} onClick={() => navigate(link)} className="cursor-pointer rounded-lg p-1 transition hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500">{label}</span>
                    <span className="text-xs font-bold text-gray-800">{value}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100">
                    <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Booking status */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Booking Status</h2>
                <p className="text-[11px] text-gray-400">{rangeLabel}</p>
              </div>
              <button type="button" onClick={handleSyncStatus} disabled={syncing}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 disabled:opacity-50">
                <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} strokeWidth={2.5} />
                {syncing ? 'Syncing…' : 'Sync'}
              </button>
            </div>
            {syncMsg && (
              <p className={`mt-2 rounded-lg px-3 py-2 text-xs font-semibold ${syncMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                {syncMsg.text}
              </p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { label: 'Confirmed', value: bookingConfirmed, bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-400' },
                { label: 'Ongoing',   value: bookingOngoing,   bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
                { label: 'Completed', value: bookingCompleted, bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
                { label: 'Cancelled', value: bookingCancelled, bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' },
              ].map(({ label, value, bg, text, dot }) => (
                <div key={label} onClick={() => navigate('/admin/packages')}
                  className={`cursor-pointer rounded-xl p-3 transition hover:opacity-80 ${bg}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${text} opacity-70`}>{label}</span>
                  </div>
                  <p className={`text-2xl font-black tabular-nums ${text}`}>{value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* KYC pending */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  KYC Pending
                  {pendingKycAgents.length > 0 && (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-black text-white">
                      {pendingKycAgents.length}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-400">Agents awaiting review</p>
              </div>
              <Link to="/admin/agencies"
                className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100">
                View all <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              </Link>
            </div>
            {pendingKycAgents.length > 0 ? (
              <ul className="mt-3 space-y-1">
                {pendingKycAgents.map((agent) => {
                  const initials = (agent.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <li key={agent._id}>
                      <Link to="/admin/agencies" className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-amber-50">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">{agent.name || '—'}</p>
                          <p className="truncate text-[11px] text-gray-400">{agent.email || '—'}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Pending</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="mt-4 flex flex-col items-center rounded-xl bg-emerald-50 py-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" strokeWidth={2} />
                </div>
                <p className="mt-2 text-sm font-bold text-emerald-800">All clear</p>
                <p className="text-xs text-emerald-600">No pending KYC reviews</p>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  )
}
