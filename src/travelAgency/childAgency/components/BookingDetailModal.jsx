import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import Button from '@/shared/components/Button.jsx'

function formatDt(v) {
  if (!v) return '—'
  try {
    return new Date(v).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

function toDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function offerTitle(b) {
  if (b.whitelabelPackage) {
    const wl = b.whitelabelPackage
    return wl.customTitle || (typeof wl.originalPackage === 'object' && wl.originalPackage?.title) || 'White-label'
  }
  return b.package?.title || '—'
}

function DetailRow({ label, children }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-2.5 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-sm text-gray-900">{children}</div>
    </div>
  )
}

const emptyTraveler = () => ({ name: '', age: '', idProof: '' })

const PAYMENT = ['pending', 'partial', 'paid', 'refunded']
const BOOKING = ['confirmed', 'ongoing', 'completed', 'cancelled']

export default function BookingDetailModal({ isOpen, onClose, bookingId, fetchBooking, updateBooking }) {
  const [booking, setBooking] = useState(null)
  const [loadErr, setLoadErr] = useState(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [bookingStatus, setBookingStatus] = useState('confirmed')
  const [travelers, setTravelers] = useState([])

  useEffect(() => {
    if (!isOpen || !bookingId) {
      setBooking(null)
      setLoadErr(null)
      setEditing(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setLoadErr(null)
      try {
        const data = await fetchBooking(bookingId)
        if (!cancelled) {
          setBooking(data)
          setEditing(false)
        }
      } catch {
        if (!cancelled) {
          setBooking(null)
          setLoadErr('Could not load booking.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, bookingId, fetchBooking])

  const syncFormFromBooking = (b) => {
    if (!b) return
    setCustomerName(b.customer?.name || '')
    setCustomerPhone(b.customer?.phone || '')
    setCustomerEmail(b.customer?.email || '')
    setTravelDate(toDatetimeLocal(b.travelDate))
    setTotalAmount(b.totalAmount != null ? String(b.totalAmount) : '')
    setPaymentStatus(b.paymentStatus || 'pending')
    setBookingStatus(b.bookingStatus || 'confirmed')
    setTravelers(
      (b.travelers || []).map((t) => ({
        name: t.name || '',
        age: t.age != null ? String(t.age) : '',
        idProof: t.idProof || '',
      }))
    )
  }

  const startEdit = () => {
    syncFormFromBooking(booking)
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    syncFormFromBooking(booking)
  }

  const addTraveler = () => setTravelers((t) => [...t, emptyTraveler()])
  const removeTraveler = (i) => setTravelers((t) => t.filter((_, idx) => idx !== i))
  const setT = (i, field, value) => {
    setTravelers((rows) => rows.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)))
  }

  const handleSave = async () => {
    if (!booking) return
    if (!customerName.trim() || !customerPhone.trim()) return
    const amount = Number(totalAmount)
    if (Number.isNaN(amount) || amount <= 0) return
    const validTravelers = travelers
      .filter((r) => r.name.trim() && r.age !== '' && !Number.isNaN(Number(r.age)))
      .map((r) => ({
        name: r.name.trim(),
        age: Number(r.age),
        ...(r.idProof.trim() ? { idProof: r.idProof.trim() } : {}),
      }))

    setSaving(true)
    try {
      const updated = await updateBooking(booking._id, {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || '',
        travelDate: new Date(travelDate).toISOString(),
        totalAmount: amount,
        paymentStatus,
        bookingStatus,
        travelers: validTravelers,
      })
      if (updated) setBooking(updated)
      setEditing(false)
    } catch {
      /* toast handled by parent */
    } finally {
      setSaving(false)
    }
  }

  const viewFooter = (
    <div className="flex flex-wrap justify-end gap-3 p-4">
      <Button type="button" variant="secondary" onClick={onClose}>
        Close
      </Button>
      {booking ? (
        <Button type="button" onClick={startEdit} disabled={loading}>
          Edit
        </Button>
      ) : null}
    </div>
  )

  const editFooter = (
    <div className="flex flex-wrap justify-end gap-3 p-4">
      <Button type="button" variant="secondary" onClick={cancelEdit} disabled={saving}>
        Cancel
      </Button>
      <Button type="button" onClick={handleSave} disabled={saving || !travelDate}>
        {saving ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  )

  const b = booking
  const pkg = b?.package
  const wl = b?.whitelabelPackage
  const orig = typeof wl?.originalPackage === 'object' ? wl.originalPackage : null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Edit booking' : 'Booking details'}
      footer={editing ? editFooter : viewFooter}
      size="xl"
    >
      <div className="max-h-[70vh] overflow-y-auto px-1">
        {loadErr ? <p className="text-sm text-red-600">{loadErr}</p> : null}
        {loading && !b ? <p className="text-sm text-gray-500">Loading…</p> : null}

        {b && !editing ? (
          <div className="space-y-6">
            <div>
              <DetailRow label="Booking ID">
                <span className="font-mono font-semibold">{b.bookingId}</span>
              </DetailRow>
              <DetailRow label="Booking status">
                <span className="capitalize">{b.bookingStatus || '—'}</span>
              </DetailRow>
              <DetailRow label="Payment status">
                <span className="capitalize">{b.paymentStatus || '—'}</span>
              </DetailRow>
              <DetailRow label="Travel date">{formatDt(b.travelDate)}</DetailRow>
              <DetailRow label="Total amount">
                ₹{b.totalAmount != null ? Number(b.totalAmount).toLocaleString('en-IN') : '—'}
              </DetailRow>
              <DetailRow label="Travelers (incl. customer)">{b.travelerCount ?? '—'}</DetailRow>
              <DetailRow label="Created">{formatDt(b.createdAt)}</DetailRow>
              <DetailRow label="Last updated">{formatDt(b.updatedAt)}</DetailRow>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Customer</h3>
              <div className="rounded-xl border border-gray-100 bg-gray-50/80">
                <DetailRow label="Name">{b.customer?.name || '—'}</DetailRow>
                <DetailRow label="Phone">{b.customer?.phone || '—'}</DetailRow>
                <DetailRow label="Email">{b.customer?.email || '—'}</DetailRow>
                <DetailRow label="Other documents">
                  {b.customer?.otherDocs?.length ? `${b.customer.otherDocs.length} file(s)` : 'None'}
                </DetailRow>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Additional travelers</h3>
              {b.travelers?.length ? (
                <ul className="space-y-2">
                  {b.travelers.map((t, i) => (
                    <li key={i} className="rounded-lg border border-gray-100 px-3 py-2 text-sm">
                      <span className="font-medium">{t.name}</span>
                      {t.age != null ? <span className="text-gray-500"> · Age {t.age}</span> : null}
                      {t.idProof ? <span className="block text-xs text-gray-400">ID: {t.idProof}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">None listed</p>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Package / offer</h3>
              <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 text-sm">
                <p className="font-semibold text-gray-900">{offerTitle(b)}</p>
                {wl && orig ? (
                  <p className="mt-1 text-xs text-gray-500">Base package: {orig.title}</p>
                ) : null}
                {orig?.destination ? <p className="text-gray-600">Destination: {orig.destination}</p> : null}
                {!wl && pkg?.destination ? <p className="text-gray-600">Destination: {pkg.destination}</p> : null}
                {(orig?.totalDays || pkg?.totalDays) ? (
                  <p className="text-gray-600">Duration: {orig?.totalDays || pkg?.totalDays} days</p>
                ) : null}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Booked by</h3>
              <p className="text-sm text-gray-800">
                {typeof b.bookedBy === 'object' && b.bookedBy?.name ? b.bookedBy.name : '—'}
              </p>
              {typeof b.bookedBy === 'object' && b.bookedBy?.email ? (
                <p className="text-xs text-gray-500">{b.bookedBy.email}</p>
              ) : null}
              {typeof b.bookedBy === 'object' && b.bookedBy?.phone ? (
                <p className="text-xs text-gray-500">{b.bookedBy.phone}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {b && editing ? (
          <div className="space-y-5">
            <p className="font-mono text-xs text-gray-500">Ref: {b.bookingId}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Customer name</label>
                <input className="input-field w-full" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                <input className="input-field w-full" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  className="input-field w-full"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Travel date</label>
                <input
                  type="datetime-local"
                  className="input-field w-full"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Total amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field w-full"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Payment status</label>
                <select className="input-field w-full" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                  {PAYMENT.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Booking status</label>
                <select className="input-field w-full" value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)}>
                  {BOOKING.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Additional travelers</span>
                <Button type="button" variant="secondary" className="py-1.5 text-xs" onClick={addTraveler}>
                  <Plus className="mr-1 inline h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
              {travelers.length === 0 ? (
                <p className="text-xs text-gray-400">Primary customer is separate; list extra travelers here.</p>
              ) : (
                <ul className="space-y-2">
                  {travelers.map((row, i) => (
                    <li key={i} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-100 p-3">
                      <input
                        className="input-field min-w-[6rem] flex-1"
                        placeholder="Name"
                        value={row.name}
                        onChange={(e) => setT(i, 'name', e.target.value)}
                      />
                      <input
                        type="number"
                        min={1}
                        className="input-field w-20"
                        placeholder="Age"
                        value={row.age}
                        onChange={(e) => setT(i, 'age', e.target.value)}
                      />
                      <input
                        className="input-field min-w-[6rem] flex-1"
                        placeholder="ID proof note (optional)"
                        value={row.idProof}
                        onChange={(e) => setT(i, 'idProof', e.target.value)}
                      />
                      <button
                        type="button"
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() => removeTraveler(i)}
                        aria-label="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
