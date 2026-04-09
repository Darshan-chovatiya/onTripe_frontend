import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, Hash, User, Phone, Mail, Calendar, IndianRupee, Users, MapPin, Package, Clock, Ticket, Building2, Navigation, Layers, FileUp } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import Button from '@/shared/components/Button.jsx'
import {
  filePublicUrl,
  formatDateTime,
  formatDateOnly,
  bookingOfferTitle,
  basePackageFromBooking,
  flattenDocPaths,
} from '@/travelAgency/shared/utils/bookingDetailHelpers.js'

function toDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function DetailRow({ label, children }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-2.5 last:border-0 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className="min-w-0 text-sm text-gray-900 [overflow-wrap:anywhere]">{children}</div>
    </div>
  )
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
      {Icon && <Icon className="h-4 w-4 text-primary-500" strokeWidth={2} />}
      {children}
    </h3>
  )
}

function DocLinks({ docs }) {
  const paths = flattenDocPaths(docs)
  if (!paths.length) return <span className="text-gray-400">None uploaded</span>
  return (
    <ul className="space-y-1">
      {paths.map((d) => {
        const href = filePublicUrl(d.path)
        return (
          <li key={d.key}>
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-700 hover:underline">
                {d.label}
              </a>
            ) : (
              <span className="text-sm text-gray-600">{d.label}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

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

const STATUS_BADGE = {
  confirmed: 'bg-blue-50 text-blue-800 ring-blue-100',
  ongoing: 'bg-amber-50 text-amber-900 ring-amber-100',
  completed: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
  cancelled: 'bg-red-50 text-red-800 ring-red-100',
}
const PAYMENT_BADGE = {
  pending: 'bg-slate-100 text-slate-700 ring-slate-200',
  partial: 'bg-orange-50 text-orange-900 ring-orange-100',
  paid: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
  refunded: 'bg-violet-50 text-violet-900 ring-violet-100',
}

const emptyTraveler = (id = 0) => ({ _key: id, name: '', age: '', gender: 'male', aadharFront: null, aadharBack: null, panCard: null, passport: null, visaDoc: null, otherDocs: [] })

const PAYMENT = ['pending', 'partial', 'paid', 'refunded']
const BOOKING = ['confirmed', 'ongoing', 'completed', 'cancelled']

export default function BookingDetailModal({ isOpen, onClose, bookingId, fetchBooking, updateBooking, openInEdit = false }) {
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
  const travelerIdRef = useRef(0)
  const [custDocs, setCustDocs] = useState({ aadharFront: null, aadharBack: null, panCard: null, passport: null, visaDoc: null, otherDocs: [] })

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
          setEditing(openInEdit)
          if (openInEdit) syncFormFromBooking(data)
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
      (b.travelers || []).map((t) => {
        travelerIdRef.current += 1
        return {
          _key: travelerIdRef.current,
          name: t.name || '',
          age: t.age != null ? String(t.age) : '',
          gender: t.gender || 'male',
          aadharFront: null, aadharBack: null, panCard: null, passport: null, visaDoc: null, otherDocs: [],
        }
      })
    )
    setCustDocs({ aadharFront: null, aadharBack: null, panCard: null, passport: null, visaDoc: null, otherDocs: [] })
  }

  const startEdit = () => {
    syncFormFromBooking(booking)
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    syncFormFromBooking(booking)
  }

  const addTraveler = () => {
    travelerIdRef.current += 1
    const id = travelerIdRef.current
    setTravelers((t) => [...t, emptyTraveler(id)])
  }
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
      .filter((r) => r.name.trim() || r.age !== '')
      .map((r) => ({ name: r.name.trim(), age: Number(r.age) || 0, gender: r.gender }))

    const fd = new FormData()
    fd.append('customerName', customerName.trim())
    fd.append('customerPhone', customerPhone.trim())
    fd.append('customerEmail', customerEmail.trim() || '')
    fd.append('travelDate', new Date(travelDate).toISOString())
    fd.append('totalAmount', String(amount))
    fd.append('paymentStatus', paymentStatus)
    fd.append('bookingStatus', bookingStatus)
    fd.append('travelers', JSON.stringify(validTravelers))

    // Customer docs
    if (custDocs.aadharFront) fd.append('aadharFront', custDocs.aadharFront)
    if (custDocs.aadharBack) fd.append('aadharBack', custDocs.aadharBack)
    if (custDocs.panCard) fd.append('panCard', custDocs.panCard)
    if (custDocs.passport) fd.append('passport', custDocs.passport)
    if (custDocs.visaDoc) fd.append('visaDoc', custDocs.visaDoc)
    custDocs.otherDocs.forEach((f) => fd.append('otherDocs', f))

    // Traveler docs
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
      const updated = await updateBooking(booking._id, fd)
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
  const basePkg = b ? basePackageFromBooking(b) : null
  const wl = b?.whitelabelPackage && typeof b.whitelabelPackage === 'object' ? b.whitelabelPackage : null
  const ac = b?.agencyCustomer && typeof b.agencyCustomer === 'object' ? b.agencyCustomer : null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Edit booking' : 'Booking details'}
      footer={editing ? editFooter : viewFooter}
      size="xl"
    >
      <div className="px-1">
        {loadErr ? <p className="text-sm text-red-600">{loadErr}</p> : null}
        {loading && !b ? <p className="text-sm text-gray-500">Loading…</p> : null}

        {b && !editing ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    <Hash size={14} className="text-primary-500" />
                    Booking reference
                  </p>
                  <p className="font-mono text-lg font-bold text-gray-900">{b.bookingId}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${
                      STATUS_BADGE[b.bookingStatus] || STATUS_BADGE.confirmed
                    }`}
                  >
                    {b.bookingStatus || '—'}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${
                      PAYMENT_BADGE[b.paymentStatus] || PAYMENT_BADGE.pending
                    }`}
                  >
                    Payment: {b.paymentStatus || '—'}
                  </span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    Travel date
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{formatDateTime(b.travelDate)}</p>
                </div>
                <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                    <IndianRupee className="h-3.5 w-3.5" />
                    Total amount
                  </p>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900">
                    ₹{Number(b.totalAmount ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                    <Users className="h-3.5 w-3.5" />
                    Travelers
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{b.travelerCount ?? (b.travelers?.length ?? 0)}</p>
                </div>
                <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                    <Navigation className="h-3.5 w-3.5" />
                    Current day
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{b.currentDay != null ? String(b.currentDay) : '—'}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-gray-100/80 pt-3 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Created {formatDateTime(b.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Updated {formatDateTime(b.updatedAt)}
                </span>
              </div>
            </div>

            <div>
              <SectionTitle icon={Package}>Package & offer</SectionTitle>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-base font-semibold text-gray-900">{bookingOfferTitle(b)}</p>
                {wl ? (
                  <div className="mt-3 space-y-2 rounded-xl bg-violet-50/60 px-3 py-2 text-sm text-violet-950">
                    <p>
                      <span className="font-medium">Offer type: </span>
                      White-label
                    </p>
                    {wl.finalPrice != null && (
                      <p>
                        <span className="font-medium">Offer price: </span>₹{Number(wl.finalPrice).toLocaleString('en-IN')}
                      </p>
                    )}
                    {(wl.commissionType || wl.commissionValue != null) && (
                      <p className="text-xs text-violet-900/90">
                        Commission: {String(wl.commissionType || '—')}
                        {wl.commissionValue != null ? ` · ${wl.commissionValue}` : ''}
                      </p>
                    )}
                    {wl.customDescription && String(wl.customDescription).trim() ? (
                      <p className="border-t border-violet-100 pt-2 text-xs leading-relaxed text-violet-900/85">
                        {String(wl.customDescription).trim()}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {basePkg ? (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Base package</p>
                    <DetailRow label="Title">{String(basePkg.title || '—')}</DetailRow>
                    {basePkg.destination != null && String(basePkg.destination).trim() ? (
                      <DetailRow label="Destination">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                          {String(basePkg.destination)}
                        </span>
                      </DetailRow>
                    ) : null}
                    {basePkg.totalDays != null ? <DetailRow label="Duration">{String(basePkg.totalDays)} days</DetailRow> : null}
                    {basePkg.basePrice != null ? (
                      <DetailRow label="Base price">
                        ₹{Number(basePkg.basePrice).toLocaleString('en-IN')}
                        {basePkg.currency ? ` ${basePkg.currency}` : ''}
                      </DetailRow>
                    ) : null}
                    {basePkg.maxCapacity != null ? (
                      <DetailRow label="Max capacity">{String(basePkg.maxCapacity)} guests</DetailRow>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <SectionTitle icon={User}>Customer</SectionTitle>
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="p-4">
                  <p className="mb-2 text-xs font-semibold text-gray-500">Primary traveler (record)</p>
                  <DetailRow label="Name">{b.customer?.name || '—'}</DetailRow>
                  <DetailRow label="Phone">
                    {b.customer?.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        {b.customer.phone}
                      </span>
                    ) : (
                      '—'
                    )}
                  </DetailRow>
                  <DetailRow label="Email">
                    {b.customer?.email ? (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        {b.customer.email}
                      </span>
                    ) : (
                      '—'
                    )}
                  </DetailRow>
                </div>
                {ac ? (
                  <div className="border-t border-gray-100 bg-gray-50/80 p-4">
                    <p className="mb-2 text-xs font-semibold text-gray-500">Agency profile</p>
                    <DetailRow label="Agency name on file">{ac.name != null && String(ac.name).trim() ? ac.name : '—'}</DetailRow>
                    <DetailRow label="Agency email on file">{ac.email != null && String(ac.email).trim() ? ac.email : '—'}</DetailRow>
                    {ac.notes != null && String(ac.notes).trim() ? (
                      <DetailRow label="Notes">{String(ac.notes).trim()}</DetailRow>
                    ) : null}
                    {ac.dob ? <DetailRow label="Date of birth">{formatDateOnly(ac.dob)}</DetailRow> : null}
                    {ac.gender ? (
                      <DetailRow label="Gender">
                        <span className="capitalize">{String(ac.gender)}</span>
                      </DetailRow>
                    ) : null}
                    {ac.nationality != null && String(ac.nationality).trim() ? (
                      <DetailRow label="Nationality">{String(ac.nationality)}</DetailRow>
                    ) : null}
                    {ac.address != null && String(ac.address).trim() ? (
                      <DetailRow label="Address">{String(ac.address)}</DetailRow>
                    ) : null}
                    {ac.aadharNumber != null && String(ac.aadharNumber).trim() ? (
                      <DetailRow label="Aadhar">{String(ac.aadharNumber)}</DetailRow>
                    ) : null}
                    {ac.passportNumber != null && String(ac.passportNumber).trim() ? (
                      <DetailRow label="Passport">{String(ac.passportNumber)}</DetailRow>
                    ) : null}
                    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-2.5 last:border-0 sm:grid-cols-[11rem_1fr] sm:gap-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Documents</div>
                      <div>
                        <DocLinks docs={ac.docs} />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <SectionTitle icon={Layers}>Additional travelers</SectionTitle>
              {b.travelers?.length ? (
                <ul className="space-y-3">
                  {b.travelers.map((t, i) => (
                    <li key={i} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                      <p className="font-semibold text-gray-900">
                        {t.name}
                        {t.age != null ? <span className="ml-2 font-normal text-gray-500">· Age {t.age}</span> : null}
                      </p>
                      {t.gender != null && String(t.gender).trim() ? (
                        <p className="mt-1 text-xs capitalize text-gray-500">{String(t.gender)}</p>
                      ) : null}
                      {t.idProof != null && String(t.idProof).trim() ? (
                        <p className="mt-1 text-xs text-gray-500">ID note: {String(t.idProof)}</p>
                      ) : null}
                      <div className="mt-2 border-t border-gray-100 pt-2">
                        <p className="mb-1 text-[11px] font-semibold uppercase text-gray-400">Documents</p>
                        <DocLinks docs={t.docs} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No additional travelers listed.</p>
              )}
            </div>

            <div>
              <SectionTitle icon={Ticket}>Tickets & vouchers</SectionTitle>
              {b.tickets?.length ? (
                <ul className="space-y-2">
                  {b.tickets.map((tk, i) => {
                    const href = filePublicUrl(tk.fileUrl)
                    return (
                      <li
                        key={i}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
                      >
                        <span className="font-medium text-gray-900">{tk.name || 'Ticket'}</span>
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-primary-700 hover:underline"
                          >
                            Open file
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">No file</span>
                        )}
                        {tk.uploadedAt ? (
                          <span className="w-full text-xs text-gray-400 sm:w-auto">{formatDateTime(tk.uploadedAt)}</span>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No tickets uploaded for this booking yet.</p>
              )}
            </div>

            <div>
              <SectionTitle icon={Building2}>Booked by</SectionTitle>
              <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
                {typeof b.bookedBy === 'object' && b.bookedBy ? (
                  <>
                    <p className="font-semibold text-gray-900">{b.bookedBy.name || '—'}</p>
                    <p className="mt-1 text-sm text-gray-600">{b.bookedBy.email || ''}</p>
                    {b.bookedBy.phone ? <p className="text-sm text-gray-600">{b.bookedBy.phone}</p> : null}
                    {b.bookedBy.role ? (
                      <p className="mt-2 text-xs uppercase tracking-wide text-gray-400">{String(b.bookedBy.role).replace(/_/g, ' ')}</p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">—</p>
                )}
              </div>
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

            {/* Customer documents */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-3">
              <p className="text-sm font-medium text-gray-800">Customer documents <span className="text-xs font-normal text-gray-400">(optional — replaces existing)</span></p>
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

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Additional travelers</span>
                <Button type="button" variant="secondary" className="py-1.5 text-xs" onClick={addTraveler}>
                  <Plus className="mr-1 inline h-3.5 w-3.5" />
                  Add traveler
                </Button>
              </div>
              {travelers.length === 0 ? (
                <p className="text-xs text-gray-400">Optional. Primary customer counts toward capacity.</p>
              ) : (
                <ul className="space-y-3">
                  {travelers.map((row, i) => (
                    <li key={row._key} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 space-y-3">
                      <div className="flex flex-wrap items-end gap-2">
                        <input
                          className="input-field min-w-[8rem] flex-1"
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
                        <select
                          className="input-field w-28"
                          value={row.gender}
                          onChange={(e) => setT(i, 'gender', e.target.value)}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          onClick={() => removeTraveler(i)}
                          aria-label="Remove"
                        >
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
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
