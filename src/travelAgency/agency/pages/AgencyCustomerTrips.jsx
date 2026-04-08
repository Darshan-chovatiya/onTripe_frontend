import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Eye } from 'lucide-react'
import { ROLES } from '@/shared/utils/constants.js'
import { useAgencyPermissions } from '@/travelAgency/agency/hooks/useAgencyPermissions.js'
import {
  listCustomers as listChildCustomers,
  listBookings as listChildBookings,
} from '@/travelAgency/childAgency/services/childAgencyApi.js'
import {
  listCustomers as listSubCustomers,
  listMyBookings as listSubChildBookings,
} from '@/travelAgency/subChild/services/subChildApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Modal from '@/shared/components/Modal.jsx'

export default function AgencyCustomerTrips() {
  const { agencyCustomerId } = useParams()
  const navigate = useNavigate()
  const { role } = useAgencyPermissions()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [customer, setCustomer] = useState(null)
  const [trips, setTrips] = useState([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailTrip, setDetailTrip] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!agencyCustomerId) return
      setLoading(true)
      try {
        const [customersRes, bookingsRes] = await Promise.all([
          role === ROLES.CHILD_AGENCY ? listChildCustomers() : listSubCustomers(),
          role === ROLES.CHILD_AGENCY ? listChildBookings() : listSubChildBookings(),
        ])
        if (cancelled) return
        const customers = customersRes.data?.data?.customers ?? []
        const current = customers.find((c) => String(c._id) === String(agencyCustomerId))
        setCustomer(current || null)

        const agencyCustomerKey = current?._id ? String(current._id) : ''
        const bookings = bookingsRes.data?.data?.bookings ?? []
        const matched = bookings
          .filter((b) => {
            const bid = b?.agencyCustomer?._id
              ? String(b.agencyCustomer._id)
              : b?.agencyCustomer
                ? String(b.agencyCustomer)
                : ''
            return agencyCustomerKey && bid === agencyCustomerKey
          })
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        setTrips(matched)
      } catch (err) {
        if (!cancelled) toast.error(getApiErrorMessage(err) || 'Failed to load customer trips')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [agencyCustomerId, role, toast])

  const title = useMemo(() => {
    if (!customer) return 'Customer trips'
    return `${customer.name || customer.customer?.name || 'Customer'} trips`
  }, [customer])

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {customer?.phone || customer?.customer?.phone || '—'} {customer?.email || customer?.customer?.email || ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/agency/customers')}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Back to customers
        </button>
      </header>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/80 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Booking ID</th>
                <th className="px-4 py-3 font-medium">Package</th>
                <th className="px-4 py-3 font-medium">Travel date</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {trips.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{t.bookingId || '—'}</td>
                  <td className="px-4 py-3 text-gray-900">{t.package?.title || t.whitelabelPackage?.customTitle || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                      {t.travelDate ? new Date(t.travelDate).toLocaleDateString('en-IN') : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-800">₹{Number(t.totalAmount || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-700">
                      {t.bookingStatus || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setDetailTrip(t)
                        setDetailOpen(true)
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && trips.length === 0 ? <p className="px-4 py-8 text-center text-sm text-gray-500">Loading trips…</p> : null}
        {!loading && trips.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">No trips found for this customer.</p>
        ) : null}
      </div>

      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Trip details" size="xl">
        {!detailTrip ? (
          <div className="p-6 text-sm text-gray-500">No trip selected.</div>
        ) : (
          <div className="space-y-4 text-sm">
            {(() => {
              const itinerary = Array.isArray(detailTrip.package?.itinerary)
                ? detailTrip.package.itinerary
                : Array.isArray(detailTrip.whitelabelPackage?.originalPackage?.itinerary)
                  ? detailTrip.whitelabelPackage.originalPackage.itinerary
                  : []
              const inclusions = Array.isArray(detailTrip.package?.inclusions) ? detailTrip.package.inclusions : []
              const exclusions = Array.isArray(detailTrip.package?.exclusions) ? detailTrip.package.exclusions : []

              return (
                <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                <span className="font-semibold text-gray-700">Booking ID:</span> {detailTrip.bookingId || '—'}
              </div>
              <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                <span className="font-semibold text-gray-700">Status:</span> {detailTrip.bookingStatus || '—'}
              </div>
              <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                <span className="font-semibold text-gray-700">Package:</span>{' '}
                {detailTrip.package?.title || detailTrip.whitelabelPackage?.customTitle || '—'}
              </div>
              <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                <span className="font-semibold text-gray-700">Amount:</span> ₹
                {Number(detailTrip.totalAmount || 0).toLocaleString('en-IN')}
              </div>
              <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                <span className="font-semibold text-gray-700">Travel date:</span>{' '}
                {detailTrip.travelDate ? new Date(detailTrip.travelDate).toLocaleString() : '—'}
              </div>
              <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                <span className="font-semibold text-gray-700">Traveler count:</span>{' '}
                {detailTrip.travelerCount ?? (Array.isArray(detailTrip.travelers) ? detailTrip.travelers.length : 0)}
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
              <div className="mb-2 font-semibold text-gray-700">Travelers</div>
              {Array.isArray(detailTrip.travelers) && detailTrip.travelers.length > 0 ? (
                <div className="space-y-2">
                  {detailTrip.travelers.map((traveler, idx) => (
                    <div key={`${traveler.name || 'traveler'}-${idx}`} className="rounded-md border border-gray-100 bg-gray-50 px-2.5 py-2">
                      <div className="text-xs font-semibold text-gray-800">
                        {traveler.name || `Traveler ${idx + 1}`} {traveler.age ? `• Age ${traveler.age}` : ''}
                      </div>
                      <div className="mt-1 text-[11px] text-gray-600">
                        {traveler.gender || '—'} {traveler.phone ? `• ${traveler.phone}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500">No traveler details available.</div>
              )}
            </div>

            <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
              <div className="mb-2 font-semibold text-gray-700">Itinerary plan</div>
              {itinerary.length > 0 ? (
                <div className="space-y-3">
                  {itinerary
                    .slice()
                    .sort((a, b) => Number(a?.day || 0) - Number(b?.day || 0))
                    .map((dayItem, idx) => (
                      <div key={`${dayItem?.day || idx}`} className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                        <div className="text-xs font-semibold text-gray-800">
                          Day {dayItem?.day ?? idx + 1}
                          {dayItem?.title ? ` - ${dayItem.title}` : ''}
                        </div>
                        {dayItem?.description ? (
                          <div className="mt-1 text-[11px] leading-relaxed text-gray-600">{dayItem.description}</div>
                        ) : null}

                        {Array.isArray(dayItem?.experiences) && dayItem.experiences.length > 0 ? (
                          <div className="mt-2">
                            <div className="text-[11px] font-semibold text-gray-700">Experiences</div>
                            <ul className="mt-1 list-disc pl-4 text-[11px] text-gray-600">
                              {dayItem.experiences.map((exp, expIdx) => (
                                <li key={`${exp?.name || 'exp'}-${expIdx}`}>
                                  {exp?.name || 'Experience'}
                                  {exp?.location ? ` - ${exp.location}` : ''}
                                  {exp?.startTime || exp?.endTime
                                    ? ` (${[exp?.startTime, exp?.endTime].filter(Boolean).join(' to ')})`
                                    : ''}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500">No itinerary available in this booking.</div>
              )}
            </div>

            {(inclusions.length > 0 || exclusions.length > 0) && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                  <div className="mb-2 font-semibold text-gray-700">Inclusions</div>
                  {inclusions.length > 0 ? (
                    <ul className="list-disc pl-4 text-xs text-gray-600">
                      {inclusions.map((item, idx) => (
                        <li key={`${item}-${idx}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-gray-500">None</div>
                  )}
                </div>
                <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                  <div className="mb-2 font-semibold text-gray-700">Exclusions</div>
                  {exclusions.length > 0 ? (
                    <ul className="list-disc pl-4 text-xs text-gray-600">
                      {exclusions.map((item, idx) => (
                        <li key={`${item}-${idx}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-gray-500">None</div>
                  )}
                </div>
              </div>
            )}
                </>
              )
            })()}
          </div>
        )}
      </Modal>
    </div>
  )
}
