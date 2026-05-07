import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, FileUp, Loader2 } from 'lucide-react'
import { useChildBookings } from '@/travelAgency/childAgency/hooks/useChildBookings.js'
import { listCustomers } from '@/travelAgency/childAgency/services/childAgencyApi.js'
import { Search, UserPlus, Users, X } from 'lucide-react'
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
  _key: id, name: '', phone: '', email: '',
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

function agencyCustomerDisplayName(c) {
  return String(
    (c.name != null && String(c.name).trim()) ||
    (c.customer?.name != null && String(c.customer.name).trim()) ||
    'Customer'
  )
}
function agencyCustomerPhone(c) {
  return c.customer?.phone != null ? String(c.customer.phone) : ''
}
function agencyCustomerEmail(c) {
  return String(
    (c.email != null && String(c.email).trim()) ||
    (c.customer?.email != null && String(c.customer.email).trim()) ||
    ''
  )
}
function agencyCustomerSearchHaystack(c) {
  return [agencyCustomerDisplayName(c), agencyCustomerPhone(c), agencyCustomerEmail(c)].join(' ').toLowerCase()
}

export default function EditBooking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchBooking, updateBooking } = useChildBookings()
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
  const [basePackagePrice, setBasePackagePrice] = useState(0)
  const [maxCapacity, setMaxCapacity] = useState(null)
  const [remainingCapacity, setRemainingCapacity] = useState(null)
  const [minTotalAmount, setMinTotalAmount] = useState(0)
  const isFirstRender = useRef(true)

  const [customerMode, setCustomerMode] = useState('new')
  const [agencyCustomers, setAgencyCustomers] = useState([])
  const [selectedExistingId, setSelectedExistingId] = useState('')
  const [existingSearchQuery, setExistingSearchQuery] = useState('')

  const [customersPage, setCustomersPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const isFetchingCustomersRef = useRef(false)

  const loadCustomers = useCallback(async (p, q, append = false) => {
    if (isFetchingCustomersRef.current) return
    isFetchingCustomersRef.current = true
    setLoadingCustomers(true)
    try {
      const res = await listCustomers({ page: p, limit: 10, search: q })
      const data = res.data?.data
      const newCustomers = data?.customers ?? []
      setAgencyCustomers((prev) => (append ? [...prev, ...newCustomers] : newCustomers))
      setTotalPages(data?.pagination?.totalPages ?? 1)
      setCustomersPage(p)
    } catch (err) {
      console.error('Failed to load customers:', err)
    } finally {
      isFetchingCustomersRef.current = false
      setLoadingCustomers(false)
    }
  }, [])

  useEffect(() => {
    loadCustomers(1, '')
  }, []) // Initial load

  useEffect(() => {
    if (customerMode !== 'existing') return
    const t = setTimeout(() => {
      loadCustomers(1, existingSearchQuery)
    }, 400)
    return () => clearTimeout(t)
  }, [existingSearchQuery, customerMode, loadCustomers])

  const selectedExistingRow = useMemo(
    () => selectedExistingId ? agencyCustomers.find((c) => String(c._id) === selectedExistingId) ?? null : null,
    [agencyCustomers, selectedExistingId]
  )

  const applyExistingCustomer = (row) => {
    if (!row) return
    const phone = row.customer?.phone != null ? String(row.customer.phone) : ''
    const name = (row.name != null && String(row.name).trim()) || (row.customer?.name != null ? String(row.customer.name) : '')
    const email = (row.email != null && String(row.email).trim()) || (row.customer?.email != null ? String(row.customer.email) : '')
    setCustomerPhone(phone.replace(/\D/g, '').slice(0, 10)); setCustomerName(name); setCustomerEmail(email)
  }

  const clearExistingCustomerSelection = () => {
    setSelectedExistingId(''); setCustomerName(''); setCustomerPhone(''); setCustomerEmail('')
  }

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
          setBasePackagePrice(data.whitelabelPriceAtBooking || data.parentPriceAtBooking || 0)
          setPaymentStatus(data.paymentStatus || 'pending')
          setBookingStatus(data.bookingStatus || 'confirmed')
          setMaxCapacity(data.package?.maxCapacity ?? null)
          setRemainingCapacity(data.package?.remainingCapacity ?? null)
          setTravelers(
            (data.travelers || []).map((t) => {
              travelerIdRef.current += 1
              return {
                _key: travelerIdRef.current,
                name: t.name || '',
                phone: t.phone || '',
                email: t.email || '',
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

  useEffect(() => {
    if (isFirstRender.current) {
      if (basePackagePrice > 0) isFirstRender.current = false
      return
    }
    const total = basePackagePrice * (travelers.length + 1)
    setMinTotalAmount(total)
    setTotalAmount(String(total))
  }, [basePackagePrice, travelers.length])

  const addTraveler = () => {
    if (maxCapacity != null) {
      const available = (remainingCapacity ?? 0) + (booking?.travelerCount || 0)
      if (travelers.length + 2 > available) {
        toast.error(`Package capacity is ${maxCapacity}. You can have at most ${available} people in this booking.`)
        return
      }
    }
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

    if (maxCapacity != null) {
      const available = (remainingCapacity ?? 0) + (booking?.travelerCount || 0)
      if (travelers.length + 1 > available) {
        toast.error(`Package capacity is ${maxCapacity}. You can have at most ${available} people in this booking.`)
        return
      }
    }

    const originalTravelers = booking.travelers || []
    const validTravelers = travelers
      .filter((r) => r.name.trim())
      .map((r, i) => ({
        name: r.name.trim(),
        email: r.email?.trim(),
        phone: r.phone.replace(/\D/g, '') || undefined,
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
      navigate('/agency/bookings')
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
          onClick={() => navigate('/agency/bookings')}
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
          {/* Customer section */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-4">
            <span className="block text-sm font-medium text-gray-800">Customer</span>

            <div className="flex flex-wrap gap-2">
              <button type="button"
                onClick={() => { setCustomerMode('new'); setSelectedExistingId(''); setExistingSearchQuery('') }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${customerMode === 'new' ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'}`}>
                <UserPlus className="h-3.5 w-3.5" /> New / enter details
              </button>
              {agencyCustomers.length > 0 && (
                <button type="button"
                  onClick={() => { setCustomerMode('existing'); setSelectedExistingId(''); setExistingSearchQuery('') }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${customerMode === 'existing' ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'}`}>
                  <Users className="h-3.5 w-3.5" /> Choose existing
                </button>
              )}
            </div>

            {customerMode === 'existing' && (
              <div className="space-y-3">
                {selectedExistingId && selectedExistingRow ? (
                  <div className="flex items-start justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-xs text-emerald-950">
                    <div className="min-w-0">
                      <span className="font-semibold">Selected: </span>
                      {agencyCustomerDisplayName(selectedExistingRow)}
                      {agencyCustomerPhone(selectedExistingRow) ? ` · ${agencyCustomerPhone(selectedExistingRow)}` : ''}
                    </div>
                    <button type="button" onClick={clearExistingCustomerSelection}
                      className="shrink-0 rounded-md p-1 text-emerald-800 hover:bg-emerald-100">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input type="search" autoComplete="off" placeholder="Type name, phone, or email…"
                        className={`${inputCls} pl-9`} value={existingSearchQuery}
                        onChange={(e) => setExistingSearchQuery(e.target.value)}
                        disabled={agencyCustomers.length === 0} />
                    </div>
                    <ul className="max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm" role="listbox">
                      {agencyCustomers.length === 0 && !loadingCustomers && (
                        <li className="px-3 py-4 text-center text-sm text-gray-500">No customers found.</li>
                      )}
                      {agencyCustomers.map((c) => {
                        const id = String(c._id)
                        const selected = selectedExistingId === id
                        return (
                          <li key={id} role="option" aria-selected={selected}>
                            <button type="button"
                              onClick={() => { setSelectedExistingId(id); applyExistingCustomer(c) }}
                              className={`flex w-full flex-col items-start gap-0.5 border-b border-gray-50 px-3 py-2.5 text-left text-sm transition last:border-b-0 ${selected ? 'bg-primary-50 text-primary-950' : 'hover:bg-gray-50'}`}>
                              <span className="font-medium text-gray-900">{agencyCustomerDisplayName(c)}</span>
                              <span className="text-xs text-gray-600">{agencyCustomerPhone(c) || '—'}{agencyCustomerEmail(c) ? ` · ${agencyCustomerEmail(c)}` : ''}</span>
                            </button>
                          </li>
                        )
                      })}
                      {totalPages > 1 && (
                        <li className="sticky bottom-0 border-t border-gray-100 bg-gray-50/95 p-2 backdrop-blur-sm">
                          <div className="flex items-center justify-between gap-2">
                            <button type="button"
                              onClick={() => loadCustomers(customersPage - 1, existingSearchQuery)}
                              disabled={customersPage <= 1 || loadingCustomers}
                              className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-30">
                              Previous
                            </button>
                            <span className="text-[10px] font-medium text-gray-500">
                              Page {customersPage} of {totalPages}
                            </span>
                            <button type="button"
                              onClick={() => loadCustomers(customersPage + 1, existingSearchQuery)}
                              disabled={customersPage >= totalPages || loadingCustomers}
                              className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-30">
                              Next
                            </button>
                          </div>
                        </li>
                      )}
                    </ul>
                  </>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Customer name <span className="text-red-500">*</span></label>
                <input className={inputCls} value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Phone <span className="text-red-500">*</span></label>
                <input className={inputCls} value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required inputMode="numeric" maxLength={10} placeholder="10-digit mobile number" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input type="email" className={inputCls} value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Travel date <span className="text-red-500">*</span></label>
              <input type="datetime-local" className={`${inputCls} bg-gray-50 text-gray-500 cursor-default`} value={travelDate} readOnly required />
              <p className="mt-1 text-xs text-primary-600">Fixed by package schedule.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Total amount (₹) <span className="text-red-500">*</span></label>
              <input type="number" min={minTotalAmount} className={`${inputCls} ${Number(totalAmount) < minTotalAmount ? 'border-red-300 bg-red-50' : ''}`}
                value={totalAmount} 
                onChange={(e) => setTotalAmount(e.target.value)}
                onWheel={(e) => e.target.blur()}
                required />
              <p className={`mt-1 text-xs ${Number(totalAmount) < minTotalAmount ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                Minimum: ₹{minTotalAmount.toLocaleString('en-IN')} (₹{basePackagePrice.toLocaleString('en-IN')} × {travelers.length + 1} traveler{travelers.length + 1 !== 1 ? 's' : ''})
              </p>
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
              {maxCapacity != null && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  travelers.length + 1 >= (remainingCapacity ?? 0) + (booking?.travelerCount || 0)
                    ? 'bg-red-100 text-red-700'
                    : travelers.length + 1 >= (remainingCapacity ?? 0) + (booking?.travelerCount || 0) - 1
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {travelers.length + 1}/{(remainingCapacity ?? 0) + (booking?.travelerCount || 0)} available
                </span>
              )}
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
                      <input className={`${inputCls} min-w-[10rem] flex-1`} placeholder="Name *"
                        value={row.name} onChange={(e) => setT(i, 'name', e.target.value)} />
                      <input className={`${inputCls} w-40`} placeholder="Phone (10 digits)"
                        inputMode="numeric" maxLength={10}
                        value={row.phone} onChange={(e) => setT(i, 'phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
                      <input type="email" className={`${inputCls} flex-1`} placeholder="Email (optional)"
                        value={row.email} onChange={(e) => setT(i, 'email', e.target.value)} />
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
            <Button type="submit" disabled={
              saving || 
              !customerName.trim() || 
              customerPhone.replace(/\D/g, '').length !== 10 ||
              !/^[6-9]/.test(customerPhone.replace(/\D/g, '')) ||
              !travelDate || 
              !totalAmount || 
              Number(totalAmount) < minTotalAmount ||
              !travelers.every(t => t.name.trim() && t.age !== '' && !Number.isNaN(Number(t.age))) ||
              Number(totalAmount) <= 0 ||
              !travelers.every(t => t.name.trim() && (!t.phone || t.phone.replace(/\D/g, '').length === 10))
            }>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
