import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Users, UserPlus, Loader2, Search, X, FileUp } from 'lucide-react'
import { useChildBookings } from '@/travelAgency/childAgency/hooks/useChildBookings.js'
import { useChildPackages } from '@/travelAgency/childAgency/hooks/useChildPackages.js'
import { listCustomers, getCustomerByPhone } from '@/travelAgency/childAgency/services/childAgencyApi.js'
import Button from '@/shared/components/Button.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300'

const emptyTraveler = () => ({
  name: '', phone: '', email: '',
  aadharFront: null, aadharBack: null, panCard: null,
  passport: null, visaDoc: null, otherDocs: [],
})

function normalizePhone(p) {
  return String(p || '').replace(/\s/g, '').trim()
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

export default function CreateBooking() {
  const navigate = useNavigate()
  const { create } = useChildBookings()
  const { availablePackages, whitelabels } = useChildPackages()
  const { toast } = useToast()

  const [submitting, setSubmitting] = useState(false)
  const [offerType, setOfferType] = useState('whitelabel')
  const [packageId, setPackageId] = useState('')
  const [whitelabelId, setWhitelabelId] = useState('')
  const [customerMode, setCustomerMode] = useState('new')
  const [agencyCustomers, setAgencyCustomers] = useState([])
  const [selectedExistingId, setSelectedExistingId] = useState('')
  const [existingSearchQuery, setExistingSearchQuery] = useState('')

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [travelers, setTravelers] = useState([])

  const [custDocs, setCustDocs] = useState({
    aadharFront: null, aadharBack: null, panCard: null,
    passport: null, visaDoc: null, otherDocs: [],
  })

  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupMeta, setLookupMeta] = useState(null)
  const skipNextLookupRef = useRef(false)
  const [basePackagePrice, setBasePackagePrice] = useState(0)
  const [maxCapacity, setMaxCapacity] = useState(null)
  const [minTotalAmount, setMinTotalAmount] = useState(0)

  const activeWhitelabels = (whitelabels ?? []).filter((w) => w.isActive !== false)

  useEffect(() => {
    const hasWl = activeWhitelabels.length > 0
    const hasPkg = (availablePackages ?? []).length > 0
    setOfferType(hasWl ? 'whitelabel' : hasPkg ? 'package' : 'whitelabel')
  }, [activeWhitelabels.length, availablePackages?.length])

  const toDateOnly = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d)) return ''
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }

  useEffect(() => {
    if (offerType === 'whitelabel' && activeWhitelabels.length && !whitelabelId) {
      const first = activeWhitelabels[0]
      setWhitelabelId(String(first._id))
      setBasePackagePrice(first.finalPrice || 0)
      setMaxCapacity(first.originalPackage?.maxCapacity ?? first.maxCapacity ?? null)
      setTravelDate(toDateOnly(first.originalPackage?.startDate))
    }
    if (offerType === 'package' && availablePackages?.length && !packageId) {
      const first = availablePackages[0]
      setPackageId(String(first._id))
      setBasePackagePrice(first.basePrice || 0)
      setMaxCapacity(first.maxCapacity ?? null)
      setTravelDate(toDateOnly(first.startDate))
    }
  }, [offerType, activeWhitelabels, availablePackages, whitelabelId, packageId])

  useEffect(() => {
    const total = basePackagePrice * (travelers.length + 1)
    setMinTotalAmount(total)
    setTotalAmount(String(total))
  }, [basePackagePrice, travelers.length])

  const handleWhitelabelChange = (id) => {
    setWhitelabelId(id)
    setOfferType('whitelabel')
    const wl = activeWhitelabels.find(w => String(w._id) === id)
    setBasePackagePrice(wl?.finalPrice || 0)
    const cap = wl?.originalPackage?.maxCapacity ?? wl?.maxCapacity ?? null
    setMaxCapacity(cap)
    if (cap) setTravelers(t => t.slice(0, Math.max(0, cap - 1)))
    setTravelDate(toDateOnly(wl?.originalPackage?.startDate))
  }

  const handlePackageChange = (id) => {
    setPackageId(id)
    setOfferType('package')
    const pkg = availablePackages.find(p => String(p._id) === id)
    setBasePackagePrice(pkg?.basePrice || 0)
    const cap = pkg?.maxCapacity ?? null
    setMaxCapacity(cap)
    if (cap) setTravelers(t => t.slice(0, Math.max(0, cap - 1)))
    setTravelDate(toDateOnly(pkg?.startDate))
  }

  useEffect(() => {
    let cancelled = false
    listCustomers()
      .then((res) => { if (!cancelled) setAgencyCustomers(res.data?.data?.customers ?? []) })
      .catch(() => { if (!cancelled) setAgencyCustomers([]) })
    return () => { cancelled = true }
  }, [])

  const filteredAgencyCustomers = useMemo(() => {
    const q = existingSearchQuery.trim().toLowerCase()
    if (!q) return agencyCustomers
    return agencyCustomers.filter((c) => agencyCustomerSearchHaystack(c).includes(q))
  }, [agencyCustomers, existingSearchQuery])

  const selectedExistingRow = useMemo(
    () => selectedExistingId ? agencyCustomers.find((c) => String(c._id) === selectedExistingId) ?? null : null,
    [agencyCustomers, selectedExistingId]
  )

  const runPhoneLookup = useCallback(async () => {
    if (customerMode !== 'new') return
    const p = normalizePhone(customerPhone)
    if (p.length < 8) { setLookupMeta(null); return }
    setLookupLoading(true)
    try {
      const res = await getCustomerByPhone(p)
      const d = res.data?.data
      setLookupMeta(d && typeof d === 'object' ? d : null)
      if (d?.suggestFromRegistry && d.registryProfile) {
        setCustomerName((n) => n.trim() ? n : String(d.registryProfile.name || ''))
        setCustomerEmail((e) => e.trim() ? e : String(d.registryProfile.email || ''))
      } else if (d?.found && d.linkedToAgency && d.customer) {
        setCustomerName(String(d.customer.name || ''))
        setCustomerEmail(String(d.customer.email || ''))
      } else if (!d?.found && d?.suggestFromUserAccount && d.userAccount) {
        setCustomerName((n) => n.trim() ? n : String(d.userAccount.name || ''))
        setCustomerEmail((e) => e.trim() ? e : String(d.userAccount.email || ''))
      }
    } catch { setLookupMeta(null) }
    finally { setLookupLoading(false) }
  }, [customerMode, customerPhone])

  useEffect(() => {
    if (customerMode !== 'new') return
    if (skipNextLookupRef.current) { skipNextLookupRef.current = false; return }
    const t = setTimeout(() => runPhoneLookup(), 480)
    return () => clearTimeout(t)
  }, [customerPhone, customerMode, runPhoneLookup])

  const addTraveler = () => {
    const maxAdditional = maxCapacity != null ? maxCapacity - 1 : Infinity
    if (travelers.length >= maxAdditional) {
      toast.error(`Max capacity is ${maxCapacity}. Primary customer + ${maxCapacity - 1} additional traveler(s) allowed.`)
      return
    }
    setTravelers((t) => [...t, emptyTraveler()])
  }
  const removeTraveler = (i) => setTravelers((t) => t.filter((_, idx) => idx !== i))
  const setTravelerField = (i, field, value) =>
    setTravelers((t) => t.map((row, idx) => idx === i ? { ...row, [field]: value } : row))

  const applyExistingCustomer = (row) => {
    if (!row) return
    const phone = row.customer?.phone != null ? String(row.customer.phone) : ''
    const name = (row.name != null && String(row.name).trim()) || (row.customer?.name != null ? String(row.customer.name) : '')
    const email = (row.email != null && String(row.email).trim()) || (row.customer?.email != null ? String(row.customer.email) : '')
    skipNextLookupRef.current = true
    setCustomerPhone(phone); setCustomerName(name); setCustomerEmail(email)
    setLookupMeta({ found: true, linkedToAgency: true, suggestFromRegistry: false, customer: { name, email, phone } })
  }

  const clearExistingCustomerSelection = () => {
    setSelectedExistingId(''); setCustomerName(''); setCustomerPhone(''); setCustomerEmail(''); setLookupMeta(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = Number(totalAmount)
    if (Number.isNaN(amount) || amount <= 0) return

    if (maxCapacity != null && travelers.length + 1 > maxCapacity) {
      toast.error(`Max capacity is ${maxCapacity}. Remove some travelers.`)
      return
    }

    const fd = new FormData()
    fd.append('customerName', customerName.trim())
    fd.append('customerPhone', normalizePhone(customerPhone))
    if (customerEmail.trim()) fd.append('customerEmail', customerEmail.trim())
    fd.append('travelDate', new Date(travelDate).toISOString())
    fd.append('totalAmount', String(amount))

    if (offerType === 'package') { if (!packageId) return; fd.append('packageId', packageId) }
    else { if (!whitelabelId) return; fd.append('whitelabelPackageId', whitelabelId) }

    const validTravelers = travelers
      .filter((r) => r.name.trim())
      .map((r) => ({ name: r.name.trim(), email: r.email?.trim(), phone: r.phone.replace(/\D/g, '') }))
    if (validTravelers.length) fd.append('travelers', JSON.stringify(validTravelers))

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

    setSubmitting(true)
    try {
      await create(fd)
      toast.success('Booking created successfully')
      navigate('/agency/bookings')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = Boolean(
    customerName.trim() && 
    normalizePhone(customerPhone) && 
    travelDate && 
    totalAmount && 
    Number(totalAmount) >= minTotalAmount &&
    (whitelabelId || packageId) &&
    normalizePhone(customerPhone).length === 10 &&
    /^[6-9]/.test(normalizePhone(customerPhone)) &&
    travelers.every(t => t.name.trim() && /^\d{10}$/.test(t.phone.replace(/\D/g, '')))
  )

  const lookupBanner = () => {
    if (!lookupMeta || customerMode !== 'new' || lookupLoading) return null
    if (lookupMeta.suggestFromRegistry) return (
      <div className="rounded-lg border border-sky-200 bg-sky-50/90 px-3 py-2 text-xs text-sky-950">
        This number matches an existing traveler in the network who is <strong>not yet on your agency list</strong>. Name and email were suggested.
      </div>
    )
    if (lookupMeta.found && lookupMeta.linkedToAgency) return (
      <div className="rounded-lg border border-violet-200 bg-violet-50/90 px-3 py-2 text-xs text-violet-950">
        This number is already a <strong>saved customer</strong> for your agency. Details were loaded from your profile.
      </div>
    )
    if (!lookupMeta.found && lookupMeta.suggestFromUserAccount) return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
        A <strong>registered app account</strong> uses this number. Name and email were suggested.
      </div>
    )
    return null
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
        <h1 className="text-xl font-bold text-gray-900">New booking</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Package / Whitelabel */}
        {activeWhitelabels.length > 0 && (
          <div>
            <label htmlFor="bk-wl" className="mb-1 block text-sm font-medium text-gray-700">White-label offer <span className="text-red-500">*</span></label>
            <select id="bk-wl" className={inputCls} value={whitelabelId}
              onChange={(e) => handleWhitelabelChange(e.target.value)}>
              {activeWhitelabels.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.customTitle || w.originalPackage?.title || 'Offer'}
                  {w.finalPrice != null ? ` · ₹${Number(w.finalPrice).toLocaleString('en-IN')}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {!activeWhitelabels.length && !availablePackages?.length && (
          <p className="text-xs text-amber-700">No packages available. Create a white-label under Packages first.</p>
        )}

        {/* Customer section */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-4">
          <span className="block text-sm font-medium text-gray-800">Customer</span>

          <div className="flex flex-wrap gap-2">
            <button type="button"
              onClick={() => { setCustomerMode('new'); setSelectedExistingId(''); setExistingSearchQuery(''); setLookupMeta(null) }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${customerMode === 'new' ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'}`}>
              <UserPlus className="h-3.5 w-3.5" /> New / enter details
            </button>
            {agencyCustomers.length > 0 && (
              <button type="button"
                onClick={() => { setCustomerMode('existing'); setLookupMeta(null); setSelectedExistingId(''); setExistingSearchQuery('') }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${customerMode === 'existing' ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'}`}>
                <Users className="h-3.5 w-3.5" /> Choose existing
              </button>
            )}
          </div>

          {customerMode === 'existing' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="search" autoComplete="off" placeholder="Type name, phone, or email…"
                  className={`${inputCls} pl-9`} value={existingSearchQuery}
                  onChange={(e) => setExistingSearchQuery(e.target.value)}
                  disabled={agencyCustomers.length === 0} />
              </div>
              {selectedExistingId && selectedExistingRow && (
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
              )}
              <ul className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm" role="listbox">
                {filteredAgencyCustomers.map((c) => {
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
              </ul>
            </div>
          )}

          {lookupBanner()}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="bk-cname" className="mb-1 block text-sm font-medium text-gray-700">Customer name <span className="text-red-500">*</span></label>
              <input id="bk-cname" className={inputCls} value={customerName}
                onChange={(e) => setCustomerName(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="bk-phone" className="mb-1 block text-sm font-medium text-gray-700">Customer phone <span className="text-red-500">*</span></label>
              <div className="relative">
                <input id="bk-phone" className={`${inputCls} pr-9`} value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onBlur={() => customerMode === 'new' && runPhoneLookup()} required autoComplete="tel"
                  inputMode="numeric" maxLength={10} placeholder="10-digit mobile number" />
                {lookupLoading && customerMode === 'new' && (
                  <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary-500" />
                )}
              </div>
            </div>
            <div>
              <label htmlFor="bk-email" className="mb-1 block text-sm font-medium text-gray-700">
                Customer email <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input id="bk-email" type="email" className={inputCls} value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)} />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Customer Documents <span className="font-normal normal-case text-gray-400">(optional)</span></p>
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
        </div>

        {/* Additional travelers */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Additional travelers</span>
              {maxCapacity != null && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  travelers.length + 1 >= maxCapacity
                    ? 'bg-red-100 text-red-700'
                    : travelers.length + 1 >= maxCapacity - 1
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {travelers.length + 1}/{maxCapacity} seats used
                </span>
              )}
            </div>
            <Button
              type="button" variant="secondary" className="py-1.5 text-xs"
              onClick={addTraveler}
              disabled={maxCapacity != null && travelers.length >= maxCapacity - 1}
            >
              <Plus className="mr-1 inline h-3.5 w-3.5" /> Add traveler
            </Button>
          </div>
          {travelers.length === 0 ? (
            <p className="text-xs text-gray-400">Optional. Primary customer counts toward capacity.</p>
          ) : (
            <ul className="space-y-3">
              {travelers.map((row, i) => (
                <li key={i} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 space-y-3">
                  <div className="flex flex-wrap items-end gap-2">
                    <input className={`${inputCls} min-w-[10rem] flex-1`} placeholder="Name *"
                      value={row.name} onChange={(e) => setTravelerField(i, 'name', e.target.value)} />
                    <input className={`${inputCls} w-40`} placeholder="Phone * (10 digits)"
                      inputMode="numeric" maxLength={10}
                      value={row.phone} onChange={(e) => setTravelerField(i, 'phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
                    <input type="email" className={`${inputCls} flex-1`} placeholder="Email (optional)"
                      value={row.email} onChange={(e) => setTravelerField(i, 'email', e.target.value)} />
                    <button type="button" onClick={() => removeTraveler(i)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Documents <span className="font-normal normal-case">(optional)</span></p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <FileField label="Aadhar Front" name={`t${i}_aadharFront`} value={row.aadharFront}
                        onChange={(e) => setTravelerField(i, 'aadharFront', e.target.files[0] || null)} />
                      <FileField label="Aadhar Back" name={`t${i}_aadharBack`} value={row.aadharBack}
                        onChange={(e) => setTravelerField(i, 'aadharBack', e.target.files[0] || null)} />
                      <FileField label="PAN Card" name={`t${i}_panCard`} value={row.panCard}
                        onChange={(e) => setTravelerField(i, 'panCard', e.target.files[0] || null)} />
                      <FileField label="Passport" name={`t${i}_passport`} value={row.passport}
                        onChange={(e) => setTravelerField(i, 'passport', e.target.files[0] || null)} />
                      <FileField label="Visa Doc" name={`t${i}_visaDoc`} value={row.visaDoc}
                        onChange={(e) => setTravelerField(i, 'visaDoc', e.target.files[0] || null)} />
                      <FileField label="Other Docs" name={`t${i}_otherDocs`} value={row.otherDocs} multiple
                        onChange={(e) => setTravelerField(i, 'otherDocs', Array.from(e.target.files || []))} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Travel date & amount */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bk-date" className="mb-1 block text-sm font-medium text-gray-700">Travel date <span className="text-red-500">*</span></label>
            <input id="bk-date" type="date" className={`${inputCls} bg-gray-50 text-gray-500 cursor-default`} value={travelDate}
              readOnly required />
            <p className="mt-1 text-xs text-primary-600">Fixed by package schedule.</p>
          </div>
          <div>
            <label htmlFor="bk-amount" className="mb-1 block text-sm font-medium text-gray-700">Total amount (₹) <span className="text-red-500">*</span></label>
            <input id="bk-amount" type="number" min={minTotalAmount} className={`${inputCls} ${Number(totalAmount) < minTotalAmount ? 'border-red-300 bg-red-50' : ''}`}
              value={totalAmount} 
              onChange={(e) => setTotalAmount(e.target.value)}
              required />
            <p className={`mt-1 text-xs ${Number(totalAmount) < minTotalAmount ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
              Minimum: ₹{minTotalAmount.toLocaleString('en-IN')} (₹{basePackagePrice.toLocaleString('en-IN')} × {travelers.length + 1} traveler{travelers.length + 1 !== 1 ? 's' : ''})
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/agency/bookings')} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !canSubmit}>
            {submitting ? 'Creating…' : 'Create booking'}
          </Button>
        </div>
      </form>
    </div>
  )
}
