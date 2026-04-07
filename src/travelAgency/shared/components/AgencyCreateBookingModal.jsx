import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Trash2, Users, UserPlus, Loader2, Search, X } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import Button from '@/shared/components/Button.jsx'

const emptyTraveler = () => ({ name: '', age: '', gender: 'male' })

function normalizePhone(p) {
  return String(p || '')
    .replace(/\s/g, '')
    .trim()
}

/** @param {Record<string, unknown>} c */
function agencyCustomerDisplayName(c) {
  const name =
    (c.name != null && String(c.name).trim()) ||
    (c.customer && typeof c.customer === 'object' && c.customer.name != null && String(c.customer.name).trim()) ||
    'Customer'
  return String(name)
}

/** @param {Record<string, unknown>} c */
function agencyCustomerPhone(c) {
  if (c.customer && typeof c.customer === 'object' && c.customer.phone != null) return String(c.customer.phone)
  return ''
}

/** @param {Record<string, unknown>} c */
function agencyCustomerEmail(c) {
  const e =
    (c.email != null && String(c.email).trim()) ||
    (c.customer && typeof c.customer === 'object' && c.customer.email != null && String(c.customer.email).trim()) ||
    ''
  return e
}

/** Lowercase haystack for filtering (this agency’s customers only). */
/** @param {Record<string, unknown>} c */
function agencyCustomerSearchHaystack(c) {
  return [agencyCustomerDisplayName(c), agencyCustomerPhone(c), agencyCustomerEmail(c)].join(' ').toLowerCase()
}

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {(fd: FormData) => Promise<void>} props.onSubmit
 * @param {boolean} props.loading
 * @param {unknown[]} [props.availablePackages]
 * @param {unknown[]} [props.whitelabels]
 * @param {() => Promise<import('axios').AxiosResponse>} props.listCustomers
 * @param {(phone: string) => Promise<import('axios').AxiosResponse>} props.getCustomerByPhone
 */
export default function AgencyCreateBookingModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  availablePackages,
  whitelabels,
  listCustomers,
  getCustomerByPhone,
}) {
  const [offerType, setOfferType] = useState('whitelabel')
  const [packageId, setPackageId] = useState('')
  const [whitelabelId, setWhitelabelId] = useState('')
  const [customerMode, setCustomerMode] = useState(/** @type {'new' | 'existing'} */ ('new'))
  const [agencyCustomers, setAgencyCustomers] = useState([])
  const [selectedExistingId, setSelectedExistingId] = useState('')
  const [existingSearchQuery, setExistingSearchQuery] = useState('')

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [travelers, setTravelers] = useState([])
  const [docFiles, setDocFiles] = useState([])

  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupMeta, setLookupMeta] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const skipNextLookupRef = useRef(false)

  const activeWhitelabels = (whitelabels ?? []).filter((w) => w.isActive !== false)

  useEffect(() => {
    if (!isOpen) return
    const hasWl = activeWhitelabels.length > 0
    const hasPkg = (availablePackages ?? []).length > 0
    setOfferType(hasWl ? 'whitelabel' : hasPkg ? 'package' : 'whitelabel')
    setPackageId('')
    setWhitelabelId('')
    setCustomerMode('new')
    setSelectedExistingId('')
    setCustomerName('')
    setCustomerPhone('')
    setCustomerEmail('')
    setTravelDate('')
    setTotalAmount('')
    setTravelers([])
    setDocFiles([])
    setLookupMeta(null)
    setLookupLoading(false)
    setExistingSearchQuery('')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !listCustomers) return
    let cancelled = false
    listCustomers()
      .then((res) => {
        if (!cancelled) setAgencyCustomers(res.data?.data?.customers ?? [])
      })
      .catch(() => {
        if (!cancelled) setAgencyCustomers([])
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, listCustomers])

  const filteredAgencyCustomers = useMemo(() => {
    const q = existingSearchQuery.trim().toLowerCase()
    if (!q) return agencyCustomers
    return agencyCustomers.filter((c) => agencyCustomerSearchHaystack(c).includes(q))
  }, [agencyCustomers, existingSearchQuery])

  const selectedExistingRow = useMemo(
    () =>
      selectedExistingId
        ? agencyCustomers.find((c) => String(c._id) === selectedExistingId) ?? null
        : null,
    [agencyCustomers, selectedExistingId]
  )

  useEffect(() => {
    if (!isOpen) return
    if (offerType === 'whitelabel' && activeWhitelabels.length && !whitelabelId) {
      setWhitelabelId(String(activeWhitelabels[0]._id))
    }
    if (offerType === 'package' && availablePackages?.length && !packageId) {
      setPackageId(String(availablePackages[0]._id))
    }
  }, [isOpen, offerType, activeWhitelabels, availablePackages, whitelabelId, packageId])

  const runPhoneLookup = useCallback(async () => {
    if (customerMode !== 'new') return
    const p = normalizePhone(customerPhone)
    if (p.length < 8) {
      setLookupMeta(null)
      return
    }
    setLookupLoading(true)
    try {
      const res = await getCustomerByPhone(p)
      const d = res.data?.data
      setLookupMeta(d && typeof d === 'object' ? d : null)

      if (d?.suggestFromRegistry && d.registryProfile) {
        setCustomerName((n) => (n.trim() ? n : String(d.registryProfile.name || '')))
        setCustomerEmail((e) => (e.trim() ? e : String(d.registryProfile.email || '')))
      } else if (d?.found && d.linkedToAgency && d.customer) {
        setCustomerName(String(d.customer.name || ''))
        setCustomerEmail(String(d.customer.email || ''))
      } else if (!d?.found && d?.suggestFromUserAccount && d.userAccount) {
        setCustomerName((n) => (n.trim() ? n : String(d.userAccount.name || '')))
        setCustomerEmail((e) => (e.trim() ? e : String(d.userAccount.email || '')))
      }
    } catch {
      setLookupMeta(null)
    } finally {
      setLookupLoading(false)
    }
  }, [customerMode, customerPhone, getCustomerByPhone])

  useEffect(() => {
    if (!isOpen || customerMode !== 'new') return
    if (skipNextLookupRef.current) {
      skipNextLookupRef.current = false
      return
    }
    const t = setTimeout(() => {
      runPhoneLookup()
    }, 480)
    return () => clearTimeout(t)
  }, [customerPhone, isOpen, customerMode, runPhoneLookup])

  const addTraveler = () => setTravelers((t) => [...t, emptyTraveler()])
  const removeTraveler = (i) => setTravelers((t) => t.filter((_, idx) => idx !== i))
  const setTravelerField = (i, field, value) => {
    setTravelers((t) => t.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)))
  }

  const applyExistingCustomer = (row) => {
    if (!row) return
    const phone = row.customer?.phone != null ? String(row.customer.phone) : ''
    const name = row.name != null && String(row.name).trim() ? String(row.name) : row.customer?.name != null ? String(row.customer.name) : ''
    const email =
      row.email != null && String(row.email).trim()
        ? String(row.email)
        : row.customer?.email != null
          ? String(row.customer.email)
          : ''
    skipNextLookupRef.current = true
    setCustomerPhone(phone)
    setCustomerName(name)
    setCustomerEmail(email)
    setLookupMeta({
      found: true,
      linkedToAgency: true,
      suggestFromRegistry: false,
      customer: {
        name,
        email,
        phone,
      },
    })
  }

  const clearExistingCustomerSelection = () => {
    setSelectedExistingId('')
    setCustomerName('')
    setCustomerPhone('')
    setCustomerEmail('')
    setLookupMeta(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = Number(totalAmount)
    if (Number.isNaN(amount) || amount <= 0) return

    const fd = new FormData()
    fd.append('customerName', customerName.trim())
    fd.append('customerPhone', normalizePhone(customerPhone))
    if (customerEmail.trim()) fd.append('customerEmail', customerEmail.trim())
    fd.append('travelDate', new Date(travelDate).toISOString())
    fd.append('totalAmount', String(amount))

    if (offerType === 'package') {
      if (!packageId) return
      fd.append('packageId', packageId)
    } else {
      if (!whitelabelId) return
      fd.append('whitelabelPackageId', whitelabelId)
    }

    const validTravelers = travelers
      .filter((r) => r.name.trim() && r.age !== '' && !Number.isNaN(Number(r.age)))
      .map((r) => ({
        name: r.name.trim(),
        age: Number(r.age),
        gender: r.gender,
      }))
    if (validTravelers.length) {
      fd.append('travelers', JSON.stringify(validTravelers))
    }

    docFiles.forEach((file) => fd.append('otherDocs', file))

    await onSubmit(fd)
  }

  const canSubmit = Boolean(
    customerName.trim() &&
      normalizePhone(customerPhone) &&
      travelDate &&
      totalAmount &&
      (offerType === 'package'
        ? packageId && availablePackages?.length
        : whitelabelId && activeWhitelabels.length)
  )

  const footer = (
    <div className="flex justify-end gap-3 p-4">
      <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button type="submit" form="agency-create-booking-form" disabled={loading || !canSubmit}>
        {loading ? 'Creating…' : 'Create booking'}
      </Button>
    </div>
  )

  const lookupBanner = () => {
    if (!lookupMeta || customerMode !== 'new') return null
    if (lookupLoading) return null

    if (lookupMeta.suggestFromRegistry) {
      return (
        <div className="rounded-lg border border-sky-200 bg-sky-50/90 px-3 py-2 text-xs text-sky-950">
          This number matches an existing traveler in the network who is <strong>not yet on your agency list</strong>.
          Name and email were suggested from that record — adjust if needed.
        </div>
      )
    }
    if (lookupMeta.found && lookupMeta.linkedToAgency) {
      return (
        <div className="rounded-lg border border-violet-200 bg-violet-50/90 px-3 py-2 text-xs text-violet-950">
          This number is already a <strong>saved customer</strong> for your agency. Details were loaded from your
          profile.
        </div>
      )
    }
    if (!lookupMeta.found && lookupMeta.suggestFromUserAccount) {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
          A <strong>registered app account</strong> uses this number. Name and email were suggested from that account.
        </div>
      )
    }
    return null
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New booking" footer={footer} size="lg">
      <form id="agency-create-booking-form" onSubmit={handleSubmit} className="space-y-5">
        <div>
          <span className="mb-2 block text-sm font-medium text-gray-700">What are you selling?</span>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="offerType"
                checked={offerType === 'whitelabel'}
                onChange={() => setOfferType('whitelabel')}
                disabled={!activeWhitelabels.length}
              />
              My white-label package
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="offerType"
                checked={offerType === 'package'}
                onChange={() => setOfferType('package')}
                disabled={!availablePackages?.length}
              />
              Parent package (direct)
            </label>
          </div>
          {!activeWhitelabels.length && offerType === 'whitelabel' ? (
            <p className="mt-2 text-xs text-amber-700">Create an active white-label under Packages first.</p>
          ) : null}
          {!availablePackages?.length && offerType === 'package' ? (
            <p className="mt-2 text-xs text-amber-700">No parent packages available.</p>
          ) : null}
        </div>

        {offerType === 'whitelabel' && activeWhitelabels.length > 0 ? (
          <div>
            <label htmlFor="bk-wl" className="mb-1 block text-sm font-medium text-gray-700">
              White-label offer
            </label>
            <select
              id="bk-wl"
              className="input-field w-full"
              value={whitelabelId}
              onChange={(e) => setWhitelabelId(e.target.value)}
              required
            >
              {activeWhitelabels.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.customTitle || w.originalPackage?.title || 'Offer'}
                  {w.finalPrice != null ? ` · ₹${Number(w.finalPrice).toLocaleString('en-IN')}` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {offerType === 'package' && availablePackages?.length > 0 ? (
          <div>
            <label htmlFor="bk-pkg" className="mb-1 block text-sm font-medium text-gray-700">
              Package
            </label>
            <select
              id="bk-pkg"
              className="input-field w-full"
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              required
            >
              {availablePackages.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                  {p.destination ? ` — ${p.destination}` : ''} · ₹{Number(p.basePrice).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
          <span className="mb-3 block text-sm font-medium text-gray-800">Customer</span>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setCustomerMode('new')
                setSelectedExistingId('')
                setExistingSearchQuery('')
                setLookupMeta(null)
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                customerMode === 'new'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              New / enter details
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomerMode('existing')
                setLookupMeta(null)
                setSelectedExistingId('')
                setExistingSearchQuery('')
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                customerMode === 'existing'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Choose existing
            </button>
          </div>

          {customerMode === 'existing' ? (
            <div className="mb-4 space-y-3">
              <div>
                <label htmlFor="bk-existing-search" className="mb-1 block text-xs font-medium text-gray-600">
                  Search your agency’s customers
                </label>
                <p className="mb-2 text-[11px] text-gray-500">
                  Only customers linked to your agency are listed (from your past bookings).
                </p>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="bk-existing-search"
                    type="search"
                    autoComplete="off"
                    placeholder="Type name, phone, or email…"
                    className="input-field w-full pl-9"
                    value={existingSearchQuery}
                    onChange={(e) => setExistingSearchQuery(e.target.value)}
                    disabled={agencyCustomers.length === 0}
                  />
                </div>
              </div>

              {selectedExistingId && selectedExistingRow ? (
                <div className="flex items-start justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-xs text-emerald-950">
                  <div className="min-w-0">
                    <span className="font-semibold">Selected</span>
                    <p className="mt-0.5 truncate">
                      {agencyCustomerDisplayName(selectedExistingRow)}
                      {agencyCustomerPhone(selectedExistingRow)
                        ? ` · ${agencyCustomerPhone(selectedExistingRow)}`
                        : ''}
                    </p>
                    <p className="mt-1 text-[11px] text-emerald-900/85">
                      You can still edit the fields below before submitting.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clearExistingCustomerSelection()
                    }}
                    className="shrink-0 rounded-md p-1 text-emerald-800 hover:bg-emerald-100"
                    aria-label="Clear selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}

              {agencyCustomers.length === 0 ? (
                <p className="text-xs text-gray-500">No saved customers yet — use “New / enter details” and a phone number.</p>
              ) : (
                <>
                  <ul
                    className="max-h-52 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm"
                    role="listbox"
                    aria-label="Agency customers"
                  >
                    {filteredAgencyCustomers.map((c) => {
                      const id = String(c._id)
                      const selected = selectedExistingId === id
                      const name = agencyCustomerDisplayName(c)
                      const phone = agencyCustomerPhone(c)
                      const email = agencyCustomerEmail(c)
                      return (
                        <li key={id} role="option" aria-selected={selected}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedExistingId(id)
                              applyExistingCustomer(c)
                            }}
                            className={`flex w-full flex-col items-start gap-0.5 border-b border-gray-50 px-3 py-2.5 text-left text-sm transition last:border-b-0 ${
                              selected ? 'bg-primary-50 text-primary-950' : 'hover:bg-gray-50'
                            }`}
                          >
                            <span className="font-medium text-gray-900">{name}</span>
                            <span className="text-xs text-gray-600">
                              {phone ? phone : '—'}
                              {email ? ` · ${email}` : ''}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                  {filteredAgencyCustomers.length === 0 ? (
                    <p className="text-xs text-gray-500">No customers match “{existingSearchQuery.trim()}”. Try another search.</p>
                  ) : (
                    <p className="text-[11px] text-gray-400">
                      Showing {filteredAgencyCustomers.length} of {agencyCustomers.length} customer
                      {agencyCustomers.length === 1 ? '' : 's'}
                    </p>
                  )}
                </>
              )}
            </div>
          ) : null}

          {lookupBanner()}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="bk-cname" className="mb-1 block text-sm font-medium text-gray-700">
                Customer name
              </label>
              <input
                id="bk-cname"
                className="input-field w-full"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="bk-phone" className="mb-1 block text-sm font-medium text-gray-700">
                Customer phone
              </label>
              <div className="relative">
                <input
                  id="bk-phone"
                  className="input-field w-full pr-9"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  onBlur={() => customerMode === 'new' && runPhoneLookup()}
                  required
                  autoComplete="tel"
                />
                {lookupLoading && customerMode === 'new' ? (
                  <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary-500" />
                ) : null}
              </div>
              {customerMode === 'new' ? (
                <p className="mt-1 text-[11px] text-gray-500">
                  Enter a mobile number to match travelers already in the system (suggestions follow backend rules for your
                  agency).
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="bk-email" className="mb-1 block text-sm font-medium text-gray-700">
                Customer email <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="bk-email"
                type="email"
                className="input-field w-full"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="bk-date" className="mb-1 block text-sm font-medium text-gray-700">
                Travel date
              </label>
              <input
                id="bk-date"
                type="datetime-local"
                className="input-field w-full"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="bk-amount" className="mb-1 block text-sm font-medium text-gray-700">
                Total amount (₹)
              </label>
              <input
                id="bk-amount"
                type="number"
                min="0"
                step="0.01"
                className="input-field w-full"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
              />
            </div>
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
            <ul className="space-y-2">
              {travelers.map((row, i) => (
                <li key={i} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-100 p-3">
                  <input
                    className="input-field min-w-[8rem] flex-1"
                    placeholder="Name"
                    value={row.name}
                    onChange={(e) => setTravelerField(i, 'name', e.target.value)}
                  />
                  <input
                    type="number"
                    min={1}
                    className="input-field w-20"
                    placeholder="Age"
                    value={row.age}
                    onChange={(e) => setTravelerField(i, 'age', e.target.value)}
                  />
                  <select
                    className="input-field w-28"
                    value={row.gender}
                    onChange={(e) => setTravelerField(i, 'gender', e.target.value)}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeTraveler(i)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label htmlFor="bk-docs" className="mb-1 block text-sm font-medium text-gray-700">
            Customer documents <span className="font-normal text-gray-400">(optional, PDF/JPEG/PNG)</span>
          </label>
          <input
            id="bk-docs"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-700"
            onChange={(e) => setDocFiles(Array.from(e.target.files || []))}
          />
        </div>
      </form>
    </Modal>
  )
}
