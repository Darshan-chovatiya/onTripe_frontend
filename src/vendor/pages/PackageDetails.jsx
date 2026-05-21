import { useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Home, Route, CalendarDays, Users, ClipboardList, Phone, Mail, User, MessageSquare } from 'lucide-react'
import { useVendorChat } from '@/vendor/context/VendorChatContext.jsx'

export default function VendorPackageDetails() {
  const navigate = useNavigate()
  const location = useLocation()
  const { packageId } = useParams()
  const pkg = location.state?.pkg || null
  const { openCustomerChat } = useVendorChat()

  const rows = useMemo(() => {
    const r = Array.isArray(pkg?.rows) ? pkg.rows : []
    return [...r].sort((a, b) => {
      if (a.date !== b.date) return new Date(a.date) - new Date(b.date)
      return Number(a.tripDay || 0) - Number(b.tripDay || 0)
    })
  }, [pkg])

  const customers = useMemo(() => (Array.isArray(pkg?.customers) ? pkg.customers : []), [pkg])

  if (!pkg) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
          <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-600 shadow-sm">
            Package details are unavailable for this view. Please open from vendor dashboard card.
            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate('/vendor/dashboard', { replace: true })}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Back to dashboard
              </button>
            </div>
          </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:py-10 pb-16">
        <div className="mb-5 overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm">
          <div className="h-1.5 bg-linear-to-r from-primary-500 via-indigo-500 to-violet-500" />
          <div className="p-5">
            <div className="mb-3 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Home className="h-3.5 w-3.5" />
              <span>Vendor</span>
              <span>/</span>
              <span>Package Details</span>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">{pkg.packageTitle}</h1>
                <p className="mt-1 text-sm text-gray-600">{pkg.destination || '—'}</p>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                  <Route className="h-3.5 w-3.5" />
                  Package ID: {packageId}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/vendor/community?pkg=${packageId}`)}
                  className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-100"
                >
                  <MessageSquare className="h-4 w-4" />
                  Package community
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/vendor/dashboard')}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <ClipboardList className="h-4 w-4" /> Schedule Entries
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{rows.length}</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Users className="h-4 w-4" /> Customers
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{customers.length}</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <CalendarDays className="h-4 w-4" /> Date Range
            </div>
            <div className="mt-2 text-sm font-semibold text-gray-900">
              {rows.length ? `${new Date(rows[0].date).toLocaleDateString('en-IN')} - ${new Date(rows[rows.length - 1].date).toLocaleDateString('en-IN')}` : '—'}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Trip details
          </div>
          <div className="divide-y divide-gray-100">
            {rows.map((r) => (
              <div key={`${r.bookingId}-${r.date}-${r.tripDay}-${r.roles?.join('-')}`} className="p-4 text-sm text-gray-700">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div><span className="font-semibold">Date:</span> {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  <div><span className="font-semibold">Trip day:</span> Day {r.tripDay}</div>
                  <div><span className="font-semibold">Booking ID:</span> {r.bookingId}</div>
                  <div><span className="font-semibold">Status:</span> {r.status || 'confirmed'}</div>
                  <div className="sm:col-span-2">
                    <span className="font-semibold">Activities/Services:</span>{' '}
                    {(r.roles || []).length ? (
                      <span className="inline-flex flex-wrap gap-1.5 align-middle">
                        {(r.roles || []).map((role) => (
                          <span key={`${r.bookingId}-${r.tripDay}-${role}`} className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-100">
                            {role}
                          </span>
                        ))}
                      </span>
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-semibold">Travelers:</span> {(r.travelers || []).length ? r.travelers.join(', ') : `${r.travelerCount || 0} traveler(s)`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Customer details
          </div>
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
            {customers.map((c, idx) => (
              <div key={`${c.phone || c.email || c.name || 'c'}-${idx}`} className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-700">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <User className="h-4 w-4 text-gray-500" />
                  {c.name || '—'}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-gray-500" />
                  <span>{c.phone || '—'}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-gray-500" />
                  <span>{c.email || '—'}</span>
                </div>
                {(c.id || c._id) && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        const cid = c.id || c._id
                        const row = rows.find((r) => r.customer?.id === cid)
                        if (row?._id) {
                          openCustomerChat({
                            bookingId: row._id,
                            customer: { ...c, id: cid },
                          })
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Chat with Customer
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

    </div>
  )
}

