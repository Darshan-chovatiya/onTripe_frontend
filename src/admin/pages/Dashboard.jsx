import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Package, IndianRupee, Ticket,
  ShieldCheck, Clock, ChevronRight, RefreshCw, CalendarDays,
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
function formatInr(n) {
  return `₹${(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
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
  { label: 'Last 7 days',  getRange: () => ({ start: daysAgoStr(6), end: todayStr() }) },
  { label: 'Last 30 days', getRange: () => ({ start: daysAgoStr(29), end: todayStr() }) },
  { label: 'This month',   getRange: () => ({ start: startOfMonthStr(), end: todayStr() }) },
  { label: 'Last month',   getRange: () => lastMonthRange() },
  { label: 'This year',    getRange: () => ({ start: startOfYearStr(), end: todayStr() }) },
]

const DEFAULT_RANGE = { start: startOfMonthStr(), end: todayStr() }

// Normalize API response (handles both flat and nested {summary,details} shapes)
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
  // flat structure — derive KYC counts from kycStatusCounts array
  return {
    ...raw,
    totalKycApproved: countInAgg(raw.kycStatusCounts, 'approved'),
    totalKycPending:  countInAgg(raw.kycStatusCounts, 'pending'),
  }
}

export default function Dashboard() {
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

  // All values read from normalized flat data
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
    { label: 'Bookings',     value: data?.totalBookings  ?? '—', icon: Ticket,     iconClass: 'bg-sky-50 text-sky-700' },
    { label: 'Revenue',      value: data ? formatInr(data.totalRevenue) : '—', icon: IndianRupee, iconClass: 'bg-emerald-50 text-emerald-700' },
    { label: 'Travelers',    value: data?.totalCustomers ?? '—', icon: Users,      iconClass: 'bg-blue-50 text-blue-700' },
    { label: 'Packages',     value: data?.totalPackages  ?? '—', icon: Package,    iconClass: 'bg-primary-50 text-primary-700' },
    { label: 'KYC approved', value: data?.totalKycApproved ?? '—', icon: ShieldCheck, iconClass: 'bg-emerald-50 text-emerald-700' },
    { label: 'KYC pending',  value: data?.totalKycPending  ?? '—', icon: Clock,      iconClass: 'bg-amber-50 text-amber-800' },
  ]

  if (loading && !data) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border border-gray-200 bg-white">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
        <p className="text-sm text-gray-500">Loading dashboard…</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">

      {/* ── Header + Date filter ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Welcome back</h1>
            <p className="mt-1 text-sm text-gray-500">Overview of bookings, revenue, agents, and compliance.</p>
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
                if (r.start && r.end) load(r)
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
                if (r.start && r.end) load(r)
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-200"
            />
          </div>
          <button
            type="button"
            onClick={() => { setDateRange(DEFAULT_RANGE); load(DEFAULT_RANGE) }}
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
                onClick={() => { setDateRange(r); load(r) }}
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
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50/80 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {/* ── Stat cards ── */}
      <section aria-label="Key metrics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500">{s.label}</p>
                    <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">{s.value}</p>
                    <p className="mt-1 text-xs text-gray-400">{rangeLabel}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.iconClass}`}>
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Recent agents */}
        <section className="lg:col-span-2 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Recent agents</h2>
              <p className="text-xs text-gray-500">Latest registrations on the platform</p>
            </div>
            <Link to="/admin/agencies" className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800">
              View all <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            {data?.recentAgents?.length ? (
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3 text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.recentAgents.map((agent) => (
                    <tr key={agent._id} className="hover:bg-gray-50/80">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{agent.name || '—'}</p>
                        <p className="text-xs text-gray-500">{agent.email || '—'}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-800">
                          {roleLabel(agent.role)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-600">
                        {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-gray-500">No recent agent activity.</p>
            )}
          </div>
        </section>

        <div className="space-y-6">

          {/* Agent mix */}
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">Agent mix</h2>
            <p className="mt-0.5 text-xs text-gray-500">By role</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex justify-between"><span className="text-gray-600">Total agents</span><span className="font-semibold tabular-nums text-gray-900">{totalAgents}</span></li>
              <li className="flex justify-between"><span className="text-gray-600">Parent agents</span><span className="font-medium tabular-nums text-gray-900">{parentAgents}</span></li>
              <li className="flex justify-between"><span className="text-gray-600">Child agents</span><span className="font-medium tabular-nums text-gray-900">{childAgents}</span></li>
              <li className="flex justify-between"><span className="text-gray-600">Sub-child agents</span><span className="font-medium tabular-nums text-gray-900">{subChildAgents}</span></li>
            </ul>
          </section>

          {/* Booking status */}
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Booking status</h2>
                <p className="mt-0.5 text-xs text-gray-400">{rangeLabel}</p>
              </div>
              <button type="button" onClick={handleSyncStatus} disabled={syncing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800 disabled:opacity-50">
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} strokeWidth={2} />
                {syncing ? 'Syncing…' : 'Sync now'}
              </button>
            </div>
            {syncMsg && (
              <p className={`mt-2 rounded-lg px-3 py-2 text-xs font-medium ${syncMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                {syncMsg.text}
              </p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-sky-50 py-3"><p className="text-lg font-semibold text-sky-800">{bookingConfirmed}</p><p className="text-[10px] font-medium uppercase tracking-wide text-sky-700/80">Confirmed</p></div>
              <div className="rounded-lg bg-amber-50 py-3"><p className="text-lg font-semibold text-amber-900">{bookingOngoing}</p><p className="text-[10px] font-medium uppercase tracking-wide text-amber-800/90">Ongoing</p></div>
              <div className="rounded-lg bg-emerald-50 py-3"><p className="text-lg font-semibold text-emerald-800">{bookingCompleted}</p><p className="text-[10px] font-medium uppercase tracking-wide text-emerald-700/80">Completed</p></div>
              <div className="rounded-lg bg-red-50 py-3"><p className="text-lg font-semibold text-red-800">{bookingCancelled}</p><p className="text-[10px] font-medium uppercase tracking-wide text-red-700/80">Cancelled</p></div>
            </div>
          </section>

          {/* KYC pending */}
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  KYC pending
                  {pendingKycAgents.length > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      {pendingKycAgents.length}
                    </span>
                  )}
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">Agents awaiting review</p>
              </div>
              <Link to="/admin/agencies" className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:text-primary-800">
                View all <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
            </div>
            {pendingKycAgents.length > 0 ? (
              <ul className="mt-3 divide-y divide-gray-100">
                {pendingKycAgents.map((agent) => (
                  <li key={agent._id}>
                    <Link to="/admin/agencies" className="flex items-center gap-3 py-2.5 transition-colors hover:opacity-80">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-800">
                        {(agent.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{agent.name || '—'}</p>
                        <p className="truncate text-xs text-gray-500">{agent.email || '—'}</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">Pending</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-5 text-center">
                <ShieldCheck className="mx-auto h-5 w-5 text-emerald-600" strokeWidth={2} />
                <p className="mt-1.5 text-sm font-medium text-emerald-800">All KYC up to date</p>
                <p className="mt-0.5 text-xs text-emerald-700">No pending reviews</p>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  )
}
