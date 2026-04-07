import { useEffect, useState } from 'react'
import { Hash, User, Phone, Mail, Calendar, IndianRupee, Users, MapPin, Package } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import { getBooking } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

const STATUS_STYLES = {
  confirmed: 'bg-blue-50 text-blue-700',
  ongoing:   'bg-yellow-50 text-yellow-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
}
const PAYMENT_STYLES = {
  pending:  'bg-gray-100 text-gray-600',
  partial:  'bg-orange-50 text-orange-700',
  paid:     'bg-green-50 text-green-700',
  refunded: 'bg-purple-50 text-purple-700',
}

export default function BookingDetailModal({ isOpen, onClose, bookingId }) {
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen || !bookingId) return
    setLoading(true); setError(null); setBooking(null)
    getBooking(bookingId)
      .then(res => setBooking(res.data?.data?.booking || null))
      .catch(err => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [isOpen, bookingId])

  const b = booking

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Booking Details" size="md">
      {loading && (
        <div className="space-y-4 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {b && (
        <div className="space-y-4">
          {/* Booking ID + status */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-1.5 font-mono text-sm font-semibold text-gray-700">
              <Hash size={14} />{b.bookingId}
            </span>
            <div className="flex gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[b.bookingStatus]}`}>{b.bookingStatus}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${PAYMENT_STYLES[b.paymentStatus]}`}>{b.paymentStatus}</span>
            </div>
          </div>

          {/* Package */}
          <div className="rounded-xl border border-gray-100 p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Package</p>
            <p className="flex items-center gap-2 font-semibold text-gray-900"><Package size={14} className="text-gray-400" />{b.package?.title || b.whitelabelPackage?.customTitle || '—'}</p>
            {b.package?.destination && <p className="flex items-center gap-2 text-sm text-gray-500 ml-5"><MapPin size={12} />{b.package.destination}</p>}
            {b.package?.totalDays && <p className="text-xs text-gray-400 ml-5">{b.package.totalDays} days</p>}
          </div>

          {/* Customer */}
          <div className="rounded-xl border border-gray-100 p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer</p>
            <p className="flex items-center gap-2 text-sm text-gray-700"><User size={13} className="text-gray-400" />{b.customer?.name || '—'}</p>
            {b.customer?.phone && <p className="flex items-center gap-2 text-sm text-gray-700"><Phone size={13} className="text-gray-400" />{b.customer.phone}</p>}
            {b.customer?.email && <p className="flex items-center gap-2 text-sm text-gray-700"><Mail size={13} className="text-gray-400" />{b.customer.email}</p>}
          </div>

          {/* Trip info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-100 p-3 text-center">
              <Calendar size={16} className="mx-auto text-blue-500 mb-1" />
              <p className="text-xs text-gray-500">Travel Date</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {b.travelDate ? new Date(b.travelDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 p-3 text-center">
              <IndianRupee size={16} className="mx-auto text-green-500 mb-1" />
              <p className="text-xs text-gray-500">Total Amount</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Travelers */}
          {b.travelers?.length > 0 && (
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5"><Users size={12} /> Travelers ({b.travelerCount})</p>
              <div className="space-y-2">
                {b.travelers.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-800">{t.name}</span>
                    <span className="text-xs text-gray-400">{t.age} yrs · {t.gender}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Booked by */}
          {b.bookedBy && (
            <p className="text-xs text-gray-400">
              Booked by: <span className="font-medium text-gray-600">{b.bookedBy.name || b.bookedBy.email}</span>
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
