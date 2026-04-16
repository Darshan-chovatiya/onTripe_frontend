import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, FileUp } from 'lucide-react'
import { useSubChildBookings } from '@/travelAgency/subChild/hooks/useSubChildBookings.js'
import Button from '@/shared/components/Button.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300'

const PAYMENT = ['pending', 'partial', 'paid', 'refunded']
const BOOKING = ['confirmed', 'ongoing', 'completed', 'cancelled']

function toDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const emptyTraveler = (id = 0) => ({
  _key: id, name: '', age: '', gender: 'male',
  aadharFront: null, aadharBack: null, panCard: null,
  passport: null, visaDoc: null, otherDocs: [],
})

function FileField({ label, name, value, onChange, multiple = false }) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600">
        <FileUp className="h-3 w-3" /> {label}
      </label>
      <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 hover:border-primary-300 hover:bg-primary-50/20 transition-colors">
        <input type="file" name={name} className="hidden" accept="image/*,.pdf" multiple={multiple} onChange={onChange} />
        {multiple ? (value?.length ? `${value.length} file(s)` : 'Select files') : (value?.name || 'Select file')}
      </label>
    </div>
  )
}

export default function EditBooking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchBooking, updateBooking } = useSubChildBookings()
  const { toast } = useToast()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [bookingStatus, setBookingStatus] = useState('confirmed')
  const [travelers, setTravelers] = useState([])
  const travelerIdRef = useRef(0)
  const [custDocs, setCustDocs] = useState({
    aadharFront: null, aadharBack: null, panCard: null,
    passport: null, visaDoc: null, otherDocs: [],
  })

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchBooking(id)
      .then((data) => {
        if (!cancelled && data) {
          setBooking(data)
          setCustomerName(data.customer?.name || '')
          setCustomerPhone(data.customer?.phone || '')
          setCustomerEmail(data.customer?.email || '')
          setTravelDate(toDatetimeLocal(data.travelDate))
          setTotalAmount(data.totalAmount != null ? String(data.totalAmount) : '')
          setPaymentStatus(data.paymentStatus || 'pending')
          setBookingStatus(data.bookingStatus || 'confirmed')
          setTravelers(
            (data.travelers || []).map((t) => {
              travelerIdRef.current += 1
              return {
                _key: travelerIdRef.current,
                name: t.name || '',
                age: t.age != null ? String(t.age) : '',
                gender: t.gender || 'male',
                aadharFront: null, aadharBack: null, panCard: null,
                passport: null, visaDoc: null, otherDocs: [],
              }
            })
          )
          setCustDocs({ aadharFront: null, aadharBack: null, panCard: null, passport: null, visaDoc: null, otherDocs: [] })
          setLoading(false)
        } else if (!cancelled) {
          setError('Could not load booking.')
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) { setError('Could not load booking.'); setLoading(false) }
      })
    return () => { cancelled = true }
  }, [id, fetchBooking])

  const addTraveler = () => {
    travelerIdRef.current += 1
    setTravelers((t) => [...t, emptyTraveler(travelerIdRef.current)])
  }
  const removeTraveler = (i) => setTravelers((t) => t.filter((_, idx) => idx !== i))
  const setT = (i, field, value) =>
    setTravelers((rows) => rows.map((row, idx) => idx === i ? { ...row, [field]: value } : row))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!booking) return
    if (!customerName.trim() || !customerPhone.trim()) return
    const amount = Number(totalAmount)
    if (Number.isNaN(amount) || amount <= 0) return

    const originalTravelers = booking.travelers || []
    const validTravelers = travelers
      .filter((r) => r.name.trim() || r.age !== '')
      .map((r, i) => ({
        name: r.name.trim(),
        age: Number(r.age) || 0,
        gender: r.gender,
        docs: originalTravelers[i]?.docs ? { ...originalTravelers[i].docs } : undefined,
      }))

    const fd = new FormData()
    fd.append('customerName', customerName.trim())
    fd.append('customerPhone', customerPhone.trim())
    fd.append('customerEmail', customerEmail.trim() || '')
    fd.append('travelDate', new Date(travelDate).toISOString())
    fd.append('totalAmount', String(amount))
    fd.append('paymentStatus', paymentStatus)
    fd.append('bookingStatus', bookingStatus)
    fd.append('travelers', JSON.stringify(validTravelers))

    if (custDocs.aadharFront) fd.append('aadharFront', custDocs.aadharFront)
    if (custDocs.aadharBack) fd.append('aadharBack', custDocs.aadharBack)
    if (custDocs.panCard) fd.append('panCard', custDocs.panCard)
    if (custDocs.passport) fd.append('passport', custDocs.passport)
    if (custDocs.visaDoc) fd.append('visaDoc', custDocs.visaDoc)
    custDocs.otherDocs.forEach((f) => fd.append('otherDocs', f))

    travelers.forEach((r, i) => {
      if (r.aadharFront) fd.append(`traveler_${i}_aadharFront`, r.aadharFront)
      if (r.aadharBack) fd.append(`traveler_${i}_aadharBack`, r.aadharBack)
      if (r.panCard) fd.append(`traveler_${i}_panCard`, r.panCard)
      if (r.passport) fd.append(`traveler_${i}_passport`, r.passport)
      if (r.visaDoc) fd.append(`traveler_${i}_visaDoc`, r.visaDoc)
      r.otherDocs?.forEach((f) => fd.append(`traveler_${i}_otherDocs`, f))
    })

    setSaving(true)
    try {
      await updateBooking(booking._id, fd)
      toast.success('Booking updated')
      navigate('/agency/my-bookings')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-fade-in mx-auto _max-w-2xl space-y-6 pb-12">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/agency/my-bookings')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Edit booking</h1>
      </header>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-100 bg-white p-4">
              <div className="h-4 w-1/3 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {booking && !loading && (
        <form onSubmit={handleSave} className="space-y-5">
          <p className="font-mono text-xs text-gray-500">Ref: {booking.bookingId}</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Customer name</label>
              <input className={inputCls} value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
              <input className={inputCls} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input type="email" className={inputCls} value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Travel date</label>
              <input type="datetime-local" className={inputCls} value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Total amount (₹)</label>
              <input type="number" min="0" step="0.01" className={inputCls} value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Payment status</label>
              <select className={inputCls} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                {PAYMENT.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Booking status</label>
              <select className={inputCls} value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)}>
                {BOOKING.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Customer documents */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-3">
            <p className="text-sm font-medium text-gray-800">
              Customer documents <span className="text-xs font-normal text-gray-400">(optional — replaces existing)</span>
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <FileField label="Aadhar Front" name="aadharFront" value={custDocs.aadharFront}
                onChange={(e) => setCustDocs(d => ({ ...d, aadharFront: e.target.files[0] || null }))} />
              <FileField label="Aadhar Back" name="aadharBack" value={custDocs.aadharBack}
                onChange={(e) => setCustDocs(d => ({ ...d, aadharBack: e.target.files[0] || null }))} />
              <FileField label="PAN Card" name="panCard" value={custDocs.panCard}
                onChange={(e) => setCustDocs(d => ({ ...d, panCard: e.target.files[0] || null }))} />
              <FileField label="Passport" name="passport" value={custDocs.passport}
                onChange={(e) => setCustDocs(d => ({ ...d, passport: e.target.files[0] || null }))} />
              <FileField label="Visa Doc" name="visaDoc" value={custDocs.visaDoc}
                onChange={(e) => setCustDocs(d => ({ ...d, visaDoc: e.target.files[0] || null }))} />
              <FileField label="Other Docs" name="otherDocs" value={custDocs.otherDocs} multiple
                onChange={(e) => setCustDocs(d => ({ ...d, otherDocs: Array.from(e.target.files || []) }))} />
            </div>
          </div>

          {/* Additional travelers */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Additional travelers</span>
              <Button type="button" variant="secondary" className="py-1.5 text-xs" onClick={addTraveler}>
                <Plus className="mr-1 inline h-3.5 w-3.5" /> Add traveler
              </Button>
            </div>
            {travelers.length === 0 ? (
              <p className="text-xs text-gray-400">Optional. Primary customer counts toward capacity.</p>
            ) : (
              <ul className="space-y-3">
                {travelers.map((row, i) => (
                  <li key={row._key} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 space-y-3">
                    <div className="flex flex-wrap items-end gap-2">
                      <input className={`${inputCls} min-w-[8rem] flex-1`} placeholder="Name"
                        value={row.name} onChange={(e) => setT(i, 'name', e.target.value)} />
                      <input type="number" min={1} className={`${inputCls} w-20`} placeholder="Age"
                        value={row.age} onChange={(e) => setT(i, 'age', e.target.value)} />
                      <select className={`${inputCls} w-28`} value={row.gender}
                        onChange={(e) => setT(i, 'gender', e.target.value)}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      <button type="button" className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() => removeTraveler(i)} aria-label="Remove">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Documents <span className="font-normal normal-case">(optional)</span></p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <FileField label="Aadhar Front" name={`t${i}_aadharFront`} value={row.aadharFront}
                          onChange={(e) => setT(i, 'aadharFront', e.target.files[0] || null)} />
                        <FileField label="Aadhar Back" name={`t${i}_aadharBack`} value={row.aadharBack}
                          onChange={(e) => setT(i, 'aadharBack', e.target.files[0] || null)} />
                        <FileField label="PAN Card" name={`t${i}_panCard`} value={row.panCard}
                          onChange={(e) => setT(i, 'panCard', e.target.files[0] || null)} />
                        <FileField label="Passport" name={`t${i}_passport`} value={row.passport}
                          onChange={(e) => setT(i, 'passport', e.target.files[0] || null)} />
                        <FileField label="Visa Doc" name={`t${i}_visaDoc`} value={row.visaDoc}
                          onChange={(e) => setT(i, 'visaDoc', e.target.files[0] || null)} />
                        <FileField label="Other Docs" name={`t${i}_otherDocs`} value={row.otherDocs} multiple
                          onChange={(e) => setT(i, 'otherDocs', Array.from(e.target.files || []))} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/agency/bookings')} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !travelDate}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
