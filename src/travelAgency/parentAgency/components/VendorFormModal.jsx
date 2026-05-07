import { useState, useEffect, useRef } from 'react'
import { GetCountries, GetState, GetCity } from 'react-country-state-city'
import {
  FileText, File, Building2, User, Mail, Phone, MapPin,
  Upload, X, AlertCircle, CheckCircle2, ChevronDown, Search, Globe,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { filePublicUrl } from '@/travelAgency/shared/utils/bookingDetailHelpers.js'

const VENDOR_TYPES = ['hotel', 'transport', 'restaurant', 'activity_provider', 'guide', 'cruise', 'other']

const TYPE_COLORS = {
  hotel:             'bg-blue-50 text-blue-700 border-blue-200',
  transport:         'bg-purple-50 text-purple-700 border-purple-200',
  restaurant:        'bg-orange-50 text-orange-700 border-orange-200',
  activity_provider: 'bg-green-50 text-green-700 border-green-200',
  guide:             'bg-yellow-50 text-yellow-700 border-yellow-200',
  cruise:            'bg-cyan-50 text-cyan-700 border-cyan-200',
  other:             'bg-gray-50 text-gray-600 border-gray-200',
}

const EMPTY = {
  name: '', contactPerson: '', email: '', phone: '',
  type: 'hotel', address: '', city: '', state: '', country: '',
}

const ic = (hasErr) =>
  `w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition bg-white ${
    hasErr
      ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-200 focus:border-primary-400 focus:ring-primary-100'
  }`

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-red-500">
      <AlertCircle className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      {msg}
    </p>
  )
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3 mb-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">{title}</p>
        {subtitle && <p className="text-[11px] text-gray-400">{subtitle}</p>}
      </div>
    </div>
  )
}

// Custom searchable location dropdown
function LocationSelect({ placeholder, options, value, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
      setQuery('')
    }
  }, [open])

  const filtered = query.trim()
    ? options.filter(o => o.name.toLowerCase().includes(query.toLowerCase()))
    : options

  const selected = options.find(o => o.name === value)

  const handleToggle = (e) => {
    e.stopPropagation()
    if (!disabled) setOpen(v => !v)
  }

  const handleSelect = (e, opt) => {
    e.stopPropagation()
    onChange(opt)
    setOpen(false)
    setQuery('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange(null)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`flex h-10 w-full items-center gap-2 rounded-lg border px-3 text-sm transition ${
          disabled
            ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400'
            : open
            ? 'border-primary-400 bg-white ring-2 ring-primary-100'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
        }`}
      >
        {selected?.emoji && <span className="shrink-0 text-base">{selected.emoji}</span>}
        <span className={`flex-1 truncate text-left ${!value ? 'text-gray-400' : 'text-gray-900'}`}>
          {value || placeholder}
        </span>
        <div className="flex shrink-0 items-center gap-0.5">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={e => e.key === 'Enter' && handleClear(e)}
              className="rounded p-0.5 text-gray-300 hover:text-red-400"
            >
              <X className="h-3 w-3" strokeWidth={2.5} />
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={2} />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[200] mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          {/* Search */}
          <div className="border-b border-gray-100 p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" strokeWidth={2} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onClick={e => e.stopPropagation()}
                placeholder="Search…"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none"
              />
            </div>
          </div>
          {/* Options */}
          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400">No results</p>
            ) : filtered.slice(0, 100).map(opt => (
              <button
                key={opt.id ?? opt.name}
                type="button"
                onClick={e => handleSelect(e, opt)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-gray-50 ${opt.name === value ? 'bg-primary-50 font-semibold text-primary-800' : 'text-gray-800'}`}
              >
                {opt.emoji && <span className="shrink-0 text-base">{opt.emoji}</span>}
                <span className="truncate">{opt.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function VendorFormModal({ isOpen, onClose, onSubmit, initialData, loading }) {
  const [form, setForm] = useState(EMPTY)
  const [docs, setDocs] = useState([])
  const [docPreviews, setDocPreviews] = useState([])
  const [existingDocs, setExistingDocs] = useState([])
  const [countryObj, setCountryObj] = useState(null)
  const [stateObj, setStateObj] = useState(null)
  const [errors, setErrors] = useState({})
  const modalRef = useRef(null)
  const isEdit = !!initialData

  // Location data
  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])

  useEffect(() => {
    GetCountries().then(list => setCountries(list || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (countryObj?.id) {
      GetState(countryObj.id).then(list => setStates(list || [])).catch(() => setStates([]))
      setCities([])
    } else {
      setStates([]); setCities([])
    }
  }, [countryObj])

  useEffect(() => {
    if (countryObj?.id && stateObj?.id) {
      GetCity(countryObj.id, stateObj.id).then(list => setCities(list || [])).catch(() => setCities([]))
    } else {
      setCities([])
    }
  }, [stateObj])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        contactPerson: initialData.contactPerson || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        type: initialData.type || 'hotel',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        country: initialData.country || '',
      })
      setExistingDocs(Array.isArray(initialData.docs) ? initialData.docs : [])
      if (initialData.country) {
        GetCountries().then(list => {
          const found = (list || []).find(c => c.name === initialData.country)
          if (found) {
            setCountryObj(found)
            if (initialData.state) {
              GetState(found.id).then(states => {
                const foundState = states.find(s => s.name === initialData.state)
                if (foundState) setStateObj(foundState)
              }).catch(() => {})
            }
          }
        }).catch(() => {})
      }
    } else {
      setForm(EMPTY)
      setCountryObj(null)
      setStateObj(null)
      setExistingDocs([])
    }
    setDocs([])
    setErrors({})
  }, [initialData, isOpen])

  useEffect(() => {
    const previews = docs.map(file => ({
      name: file.name,
      isImage: file.type.startsWith('image/'),
      src: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
    }))
    setDocPreviews(previews)
    return () => previews.forEach(p => { if (p.src) URL.revokeObjectURL(p.src) })
  }, [docs])

  const set = (k, v) => {
    let finalValue = v
    if (k === 'phone') {
      finalValue = v.replace(/\D/g, '').slice(0, 10)
    }
    setForm(f => ({ ...f, [k]: finalValue }))
    setErrors(e => { const n = { ...e }; delete n[k]; return n })
  }

  const validate = () => {
    const e = {}
    // Vendor info
    if (!form.name.trim()) e.name = 'Vendor name is required'
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters'

    // Contact
    if (!form.contactPerson.trim()) e.contactPerson = 'Contact person name is required'
    if (!form.phone.trim()) {
      e.phone = 'Phone number is required'
    } else if (form.phone.replace(/\D/g, '').length !== 10) {
      e.phone = 'Please provide a valid 10-digit phone number'
    }

    // Email
    if (!isEdit) {
      if (!form.email.trim()) e.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address'
    }

    // Documents — at least 1 required (new or existing)
    const hasExisting = existingDocs.length > 0
    if (!hasExisting && docs.length === 0) e.docs = 'At least 1 document is required'

    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      setTimeout(() => {
        const el = modalRef.current?.querySelector('[data-verr="true"]')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      return
    }
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
    docs.forEach(f => fd.append('docs', f))
    onSubmit(fd)
  }

  // Backdrop click — only close if click is directly on backdrop (not modal content)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const typeLabel = form.type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—'
  const typeCls = TYPE_COLORS[form.type] || TYPE_COLORS.other

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-scale-in max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <Building2 className="h-4 w-4 text-gray-600" strokeWidth={2} />
            </div>
            <h2 className="text-base font-bold text-gray-900">{isEdit ? 'Edit vendor' : 'Add vendor'}</h2>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <form id="vendor-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="space-y-5 p-6">

            {/* ── Vendor info ── */}
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <SectionHeader icon={Building2} title="Vendor info" subtitle="Business name and category" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                    Vendor name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={ic(!!errors.name)}
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Business or service name"
                    data-verr={!!errors.name}
                  />
                  <FieldError msg={errors.name} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                    Vendor type <span className="text-red-500">*</span>
                  </label>
                  <select className={ic(false)} value={form.type} onChange={e => set('type', e.target.value)}>
                    {VENDOR_TYPES.map(t => (
                      <option key={t} value={t}>
                        {t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                  {form.type && (
                    <span className={`mt-1.5 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${typeCls}`}>
                      {typeLabel}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* ── Contact ── */}
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <SectionHeader icon={User} title="Contact details" subtitle="Person, phone and email" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                    Contact person <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={ic(!!errors.contactPerson)}
                    value={form.contactPerson}
                    onChange={e => set('contactPerson', e.target.value)}
                    placeholder="Full name"
                    data-verr={!!errors.contactPerson}
                  />
                  <FieldError msg={errors.contactPerson} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
                    <input
                      type="tel"
                      maxLength={10}
                      className={`${ic(!!errors.phone)} pl-9`}
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      placeholder="10-digit mobile number"
                      data-verr={!!errors.phone}
                    />
                  </div>
                  <FieldError msg={errors.phone} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                    Email {!isEdit && <span className="text-red-500">*</span>}
                    {isEdit && <span className="ml-1 font-normal normal-case text-gray-400">(cannot be changed)</span>}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
                    <input
                      type="email"
                      className={`${ic(!!errors.email)} pl-9 ${isEdit ? 'cursor-not-allowed opacity-60' : ''}`}
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="vendor@email.com"
                      disabled={isEdit}
                      data-verr={!!errors.email}
                    />
                  </div>
                  <FieldError msg={errors.email} />
                </div>
              </div>
            </section>

            {/* ── Location ── */}
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <SectionHeader icon={Globe} title="Location" subtitle="Address and region (optional)" />
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
                    <input className={`${ic(false)} pl-9`} value={form.address}
                      onChange={e => set('address', e.target.value)} placeholder="Building, street, area" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Country</label>
                    <LocationSelect
                      placeholder="Select country"
                      options={countries}
                      value={form.country}
                      onChange={c => {
                        setCountryObj(c)
                        setStateObj(null)
                        set('country', c?.name || '')
                        set('state', '')
                        set('city', '')
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">State</label>
                    <LocationSelect
                      placeholder={countryObj ? 'Select state' : 'Select country first'}
                      options={states}
                      value={form.state}
                      disabled={!countryObj}
                      onChange={s => {
                        setStateObj(s)
                        set('state', s?.name || '')
                        set('city', '')
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">City</label>
                    <LocationSelect
                      placeholder={stateObj ? 'Select city' : 'Select state first'}
                      options={cities}
                      value={form.city}
                      disabled={!stateObj}
                      onChange={c => set('city', c?.name || '')}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ── Documents ── */}
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <SectionHeader icon={FileText} title="Documents" subtitle="At least 1 document required (PDF or image)" />

              {/* Existing docs */}
              {isEdit && existingDocs.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold text-gray-500">Current documents</p>
                  <div className="flex flex-wrap gap-2">
                    {existingDocs.map((doc, i) => {
                      const href = filePublicUrl(doc)
                      const isImg = /\.(png|jpe?g|webp|gif)$/i.test(String(doc))
                      return href ? (
                        <a key={i} href={href} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100">
                          {isImg ? <File className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                          {String(doc).split('/').pop() || `Document ${i + 1}`}
                        </a>
                      ) : (
                        <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500">
                          <FileText className="h-3 w-3" /> Document {i + 1}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Upload area */}
              <label
                data-verr={!!errors.docs}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-4 text-sm transition ${
                  errors.docs
                    ? 'border-red-400 bg-red-50 text-red-500'
                    : docs.length > 0
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-gray-300 bg-gray-50 text-gray-500 hover:border-gray-400 hover:bg-white'
                }`}
              >
                {docs.length > 0
                  ? <CheckCircle2 size={16} className="shrink-0" />
                  : errors.docs
                  ? <AlertCircle size={16} className="shrink-0" />
                  : <Upload size={16} className="shrink-0 text-gray-400" />
                }
                <span>
                  {docs.length > 0
                    ? `${docs.length} file${docs.length > 1 ? 's' : ''} selected`
                    : 'Click to upload documents (PDF / images)'}
                </span>
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" className="sr-only"
                  onChange={e => { setDocs(Array.from(e.target.files || [])); setErrors(er => { const n = { ...er }; delete n.docs; return n }) }} />
              </label>
              <FieldError msg={errors.docs} />

              {docs.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {docPreviews.map((file, i) => (
                    <div key={`${file.name}-${i}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                      {file.isImage
                        ? <img src={file.src} alt="" className="h-4 w-4 rounded-full object-cover" />
                        : <FileText className="h-3 w-3 text-gray-500" />
                      }
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <button type="button" onClick={() => setDocs(prev => prev.filter((_, idx) => idx !== i))}
                        className="ml-0.5 text-gray-400 transition hover:text-red-500">
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </form>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-4">
          <button type="button" onClick={onClose} disabled={loading}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60">
            Cancel
          </button>
          <button type="submit" form="vendor-form" disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60">
            {loading
              ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Saving…</>
              : isEdit ? 'Save changes' : 'Add vendor'
            }
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
