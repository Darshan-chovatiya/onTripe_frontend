import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Users, Package2, ListChecks, ChevronRight, Sparkles } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { getVendorSchedule } from '@/vendor/services/vendorApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import VendorAgentChatModal from '@/vendor/components/VendorAgentChatModal.jsx'
import VendorAllCustomerChatsModal from '@/vendor/components/VendorAllCustomerChatsModal.jsx'
import { MessageSquare, MessageCircle } from 'lucide-react'

export default function VendorDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const toastRef = useRef(toast)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [showAgentChat, setShowAgentChat] = useState(false)
  const [showCustomerChats, setShowCustomerChats] = useState(false)
  const [dateFilter, setDateFilter] = useState(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  })

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
    return () => {
      cancelled = true
    }
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
      const customerKey = `${item.customer?.phone || ''}-${item.customer?.email || ''}-${item.customer?.name || ''}`
      if (!grouped[key].customerMap.has(customerKey)) {
        grouped[key].customerMap.set(customerKey, item.customer || {})
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

  const totals = useMemo(() => {
    const totalCustomers = packageGroups.reduce((acc, pkg) => acc + pkg.customers.length, 0)
    return {
      packages: packageGroups.length,
      customers: totalCustomers,
      scheduleItems: items.length,
    }
  }, [items.length, packageGroups])

  const handleLogout = () => {
    logout()
    navigate('/vendor/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-6 overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm">
          <div className="h-1.5 bg-linear-to-r from-primary-500 via-indigo-500 to-violet-500" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="px-5 pt-5 pb-4 sm:py-5">
              <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                <Sparkles className="h-3.5 w-3.5" />
                Vendor Workspace
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Vendor Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                {user?.name || 'Vendor'} · manage trip arrivals, services and customer handoffs
              </p>
            </div>
             <div className="flex flex-wrap items-center gap-2 px-5 pb-5 sm:py-5">
              <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                <CalendarDays className="h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="border-none bg-transparent p-0 text-sm font-medium outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowCustomerChats(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <MessageSquare className="h-4 w-4" /> Customer Chats
              </button>
              <button
                type="button"
                onClick={() => setShowAgentChat(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <MessageCircle className="h-4 w-4" /> Chat with Agent
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm ring-1 ring-inset ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary-100">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Package2 className="h-4 w-4" /> Packages
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{totals.packages}</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm ring-1 ring-inset ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary-100">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Users className="h-4 w-4" /> Customers
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{totals.customers}</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm ring-1 ring-inset ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary-100">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <ListChecks className="h-4 w-4" /> Schedule Items
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{totals.scheduleItems}</div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
            Loading schedule...
          </div>
        ) : packageGroups.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
            No assigned trips found for selected date.
          </div>
        ) : (
          <div className="space-y-4">
            {packageGroups.map((pkg) => {
              return (
                <div key={pkg.packageKey} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
                  <div className="border-b border-gray-100 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-base font-semibold text-gray-900">
                          {pkg.packageTitle} {pkg.destination ? `- ${pkg.destination}` : ''}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-700">
                            {pkg.customers.length} customer{pkg.customers.length === 1 ? '' : 's'}
                          </span>
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-700">
                            {pkg.rows.length} schedule item{pkg.rows.length === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/vendor/package/${pkg.packageKey}`, { state: { pkg } })}
                        className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                        Open details
                      </button>
                    </div>
                    <div className="mt-3 text-xs text-gray-600">
                      <span className="font-semibold text-gray-700">Activities/Services:</span>{' '}
                      {pkg.activities.length ? (
                        <span className="inline-flex flex-wrap gap-1.5 align-middle">
                          {pkg.activities.map((a) => (
                            <span key={`${pkg.packageKey}-${a}`} className="rounded-full bg-primary-50 px-2.5 py-1 font-semibold text-primary-700 ring-1 ring-inset ring-primary-100">
                              {a}
                            </span>
                          ))}
                        </span>
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <VendorAgentChatModal
        isOpen={showAgentChat}
        onClose={() => setShowAgentChat(false)}
      />
      <VendorAllCustomerChatsModal
        isOpen={showCustomerChats}
        onClose={() => setShowCustomerChats(false)}
      />
    </div>
  )
}

