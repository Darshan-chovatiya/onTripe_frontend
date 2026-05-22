import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, Users, Package2, ListChecks, ChevronRight, Sparkles, MessageSquare } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { getVendorSchedule } from '@/vendor/services/vendorApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { useVendorChat } from '@/vendor/context/VendorChatContext.jsx'

export default function VendorDashboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const toastRef = useRef(toast)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const { openCustomerChat } = useVendorChat()
  const [dateFilter, setDateFilter] = useState(() => {
    const fromUrl = searchParams.get('date')
    if (fromUrl && /^\d{4}-\d{2}-\d{2}$/.test(fromUrl)) return fromUrl
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  })

  useEffect(() => {
    const fromUrl = searchParams.get('date')
    if (fromUrl && /^\d{4}-\d{2}-\d{2}$/.test(fromUrl) && fromUrl !== dateFilter) {
      setDateFilter(fromUrl)
      const next = new URLSearchParams(searchParams)
      next.delete('date')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams])

  useEffect(() => {
    toastRef.current = toast
  }, [toast])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await getVendorSchedule(dateFilter ? { date: dateFilter } : {})
        if (!cancelled) setItems(res.data?.data?.items || [])
      } catch (err) {
        if (!cancelled) toastRef.current.error(getApiErrorMessage(err) || 'Failed to load schedule')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [dateFilter])

  const packageGroups = useMemo(() => {
    const grouped = {}
    items.forEach((item) => {
      const key = item.packageId || `${item.packageTitle}-${item.destination || ''}`
      if (!grouped[key]) {
        grouped[key] = {
          packageKey: key,
          packageTitle: item.packageTitle,
          destination: item.destination || '',
          rows: [],
          customerMap: new Map(),
          activitySet: new Set(),
        }
      }
      grouped[key].rows.push(item)
      const customerKey = `${item.customer?.id || ''}-${item.customer?.phone || ''}`
      if (item.customer?.id && !grouped[key].customerMap.has(customerKey)) {
        grouped[key].customerMap.set(customerKey, item.customer)
      }
      ;(item.roles || []).forEach((r) => grouped[key].activitySet.add(r))
    })

    return Object.values(grouped)
      .map((g) => ({
        ...g,
        customers: Array.from(g.customerMap.values()),
        activities: Array.from(g.activitySet.values()),
        rows: [...g.rows].sort((a, b) => {
          if (a.date !== b.date) return new Date(a.date) - new Date(b.date)
          return Number(a.tripDay || 0) - Number(b.tripDay || 0)
        }),
      }))
      .sort((a, b) => a.packageTitle.localeCompare(b.packageTitle))
  }, [items])

  const totals = useMemo(() => ({
    packages: packageGroups.length,
    customers: packageGroups.reduce((acc, pkg) => acc + pkg.customers.length, 0),
    scheduleItems: items.length,
  }), [items.length, packageGroups])

  const openChat = (customer, bookingMongoId) => {
    if (!customer?.id || !bookingMongoId) return
    openCustomerChat({
      bookingId: bookingMongoId,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      },
    })
  }

  return (
    <div className="min-h-screen">
      {/* Hero — matches customer booking immersive header */}
      <div className="relative flex min-h-[220px] items-end overflow-hidden sm:min-h-[280px] lg:min-h-[320px]">
        <img
          src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-gray-900/90 via-gray-900/50 to-gray-900/20" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-3 pb-8 pt-20 sm:px-6 sm:pb-10 sm:pt-24 lg:px-8 lg:pt-28">
          <div className="mb-3 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            Vendor Workspace
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
            Hello, {user?.name || 'Vendor'}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/80 sm:text-base">
            View today&apos;s schedule, coordinate with travelers, and manage your assigned trips.
          </p>
          <div className="mt-4 flex w-full max-w-full flex-col gap-2 sm:mt-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <div className="inline-flex w-full min-w-0 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white backdrop-blur-md sm:w-auto">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="min-w-0 flex-1 border-none bg-transparent p-0 text-sm font-medium text-white outline-none [color-scheme:dark] sm:flex-none"
              />
            </div>
            <button
              type="button"
              onClick={() => navigate('/vendor/community')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 sm:w-auto"
            >
              <Users className="h-4 w-4" /> Communities
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-20 mx-auto -mt-4 max-w-7xl px-3 pb-20 sm:-mt-6 sm:px-4 sm:pb-16 lg:px-8">
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            [Package2, 'Packages', totals.packages],
            [Users, 'Customers', totals.customers],
            [ListChecks, 'Schedule Items', totals.scheduleItems],
          ].map(([Icon, label, val]) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <Icon className="h-4 w-4" /> {label}
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{val}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
            Loading schedule...
          </div>
        ) : packageGroups.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
            No assigned trips for this date.
          </div>
        ) : (
          <div className="space-y-4">
            {packageGroups.map((pkg) => (
              <div key={pkg.packageKey} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-gray-900 sm:text-base">
                        {pkg.packageTitle} {pkg.destination ? `— ${pkg.destination}` : ''}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-700">
                          {pkg.customers.length} customer{pkg.customers.length === 1 ? '' : 's'}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-700">
                          {pkg.rows.length} item{pkg.rows.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/vendor/package/${pkg.packageKey}`, { state: { pkg } })}
                      className="inline-flex w-full shrink-0 items-center justify-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100 sm:w-auto sm:py-1.5"
                    >
                      Details <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {pkg.activities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {pkg.activities.map((a) => (
                        <span key={a} className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-100">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="divide-y divide-gray-100">
                  {pkg.rows.map((r) => (
                    <div
                      key={`${r._id}-${r.tripDay}-${r.roles?.join('-')}`}
                      className="flex flex-col gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
                    >
                      <div className="min-w-0 text-gray-700">
                        <span className="font-semibold text-gray-900">Day {r.tripDay}</span>
                        {' · '}
                        {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {' · '}
                        Booking {r.bookingId}
                        {r.customer?.name && (
                          <span className="text-gray-500"> · {r.customer.name}</span>
                        )}
                      </div>
                      {r.customer?.id && r._id && (
                        <button
                          type="button"
                          onClick={() => openChat(r.customer, r._id)}
                          className="inline-flex w-full shrink-0 items-center justify-center gap-1 rounded-lg bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100 sm:w-auto sm:py-1.5"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Chat
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
