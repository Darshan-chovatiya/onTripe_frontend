import { useState, useEffect } from 'react'
import Modal from '@/shared/components/Modal.jsx'
import Button from '@/shared/components/Button.jsx'

const BOOKING_STATUSES = ['confirmed', 'ongoing', 'completed', 'cancelled']
const PAYMENT_STATUSES = ['pending', 'partial', 'paid', 'refunded']

export default function EditBookingModal({ isOpen, onClose, onSubmit, booking, loading }) {
  const [form, setForm] = useState({ bookingStatus: '', paymentStatus: '', travelDate: '', totalAmount: '' })

  useEffect(() => {
    if (booking) {
      setForm({
        bookingStatus: booking.bookingStatus || 'confirmed',
        paymentStatus: booking.paymentStatus || 'pending',
        travelDate: booking.travelDate ? new Date(booking.travelDate).toISOString().split('T')[0] : '',
        totalAmount: booking.totalAmount || '',
      })
    }
  }, [booking, isOpen])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      bookingStatus: form.bookingStatus,
      paymentStatus: form.paymentStatus,
      travelDate: form.travelDate,
      totalAmount: Number(form.totalAmount),
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Booking" size="sm"
      footer={
        <div className="flex justify-end gap-3 p-4">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" form="edit-booking-form" disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      }
    >
      <form id="edit-booking-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Booking Status</label>
          <select className="input-field" value={form.bookingStatus} onChange={e => set('bookingStatus', e.target.value)}>
            {BOOKING_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
          <select className="input-field" value={form.paymentStatus} onChange={e => set('paymentStatus', e.target.value)}>
            {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Travel Date</label>
          <input type="date" className="input-field" value={form.travelDate} onChange={e => set('travelDate', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
          <input type="number" min="0" className="input-field" value={form.totalAmount} onChange={e => set('totalAmount', e.target.value)} />
        </div>
      </form>
    </Modal>
  )
}
