import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Building2,
  Package,
  Calendar,
  ClipboardList,
  IndianRupee,
  Ticket,
  ShieldCheck,
  Clock,
  ChevronRight,
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
  const v = Number(n) || 0
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function roleLabel(role) {
  if (!role) return '—'
  return String(role).replace(/_/g, ' ')
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.getAnalytics()
      if (res.data?.success && res.data?.data) {
        setData(res.data.data)
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
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const kycPending = countInAgg(data?.kycStatusCounts, 'pending')
  const kycApproved = countInAgg(data?.kycStatusCounts, 'approved')
  const kycRejected = countInAgg(data?.kycStatusCounts, 'rejected')
  const totalAgents = sumAgg(data?.agentsByRole)
  const parentAgents = countInAgg(data?.agentsByRole, 'parent_agent')
  const childAgents = countInAgg(data?.agentsByRole, 'child_agent')
  const subChildAgents = countInAgg(data?.agentsByRole, 'sub_child_agent')

  const stats = [
    {
      label: 'Bookings',
      value: data?.totalBookings ?? '—',
      hint: 'All time',
      icon: Ticket,
      iconClass: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Revenue',
      value: data != null ? formatInr(data.totalRevenue) : '—',
      hint: 'Excl. cancelled',
      icon: IndianRupee,
      iconClass: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Travelers',
      value: data?.totalCustomers ?? '—',
      hint: 'Customer records',
      icon: Users,
      iconClass: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Packages',
      value: data?.totalPackages ?? '—',
      hint: 'In directory',
      icon: Package,
      iconClass: 'bg-primary-50 text-primary-700',
    },
    {
      label: 'KYC approved',
      value: kycApproved,
      hint: 'Agents',
      icon: ShieldCheck,
      iconClass: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'KYC pending',
      value: kycPending,
      hint: 'Needs review',
      icon: Clock,
      iconClass: 'bg-amber-50 text-amber-800',
    },
  ]

  const quickLinks = [
    { to: '/admin/agencies', label: 'Agencies', desc: 'Manage agents & KYC', icon: Building2 },
    { to: '/admin/customers', label: 'Customers', desc: 'Platform travelers', icon: Users },
    { to: '/admin/packages', label: 'Packages', desc: 'Approve & review', icon: Package },
    { to: '/admin/notifications', label: 'Notifications', desc: 'Broadcast messages', icon: ClipboardList },
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
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Overview of bookings, revenue, agents, and compliance.</p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 sm:self-auto">
          <Calendar className="h-4 w-4 text-gray-400" strokeWidth={2} />
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50/80 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <section aria-label="Key metrics">
        <h2 className="sr-only">Key metrics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.label}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500">{s.label}</p>
                    <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">{s.value}</p>
                    <p className="mt-1 text-xs text-gray-400">{s.hint}</p>
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
        <section className="lg:col-span-2 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Recent agents</h2>
              <p className="text-xs text-gray-500">Latest registrations on the platform</p>
            </div>
            <Link
              to="/admin/agencies"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              View all
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
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
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">Agent mix</h2>
            <p className="mt-0.5 text-xs text-gray-500">By role</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-600">Total agents</span>
                <span className="font-semibold tabular-nums text-gray-900">{totalAgents}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Parent agents</span>
                <span className="font-medium tabular-nums text-gray-900">{parentAgents}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Child agents</span>
                <span className="font-medium tabular-nums text-gray-900">{childAgents}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Sub-child agents</span>
                <span className="font-medium tabular-nums text-gray-900">{subChildAgents}</span>
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">KYC snapshot</h2>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-emerald-50 py-3">
                <p className="text-lg font-semibold text-emerald-800">{kycApproved}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-700/80">Approved</p>
              </div>
              <div className="rounded-lg bg-amber-50 py-3">
                <p className="text-lg font-semibold text-amber-900">{kycPending}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-amber-800/90">Pending</p>
              </div>
              <div className="rounded-lg bg-red-50 py-3">
                <p className="text-lg font-semibold text-red-800">{kycRejected}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-red-700/80">Rejected</p>
              </div>
            </div>
            {kycPending > 0 ? (
              <Link
                to="/admin/agencies"
                className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Review pending KYC
              </Link>
            ) : null}
          </section>

          {/* <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">Shortcuts</h2>
            <ul className="mt-3 space-y-1">
              {quickLinks.map((q) => {
                const Icon = q.icon
                return (
                  <li key={q.to}>
                    <Link
                      to={q.to}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-gray-50"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                        <Icon className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="font-medium text-gray-900">{q.label}</span>
                        <span className="block text-xs text-gray-500">{q.desc}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section> */}
        </div>
      </div>
    </div>
  )
}
