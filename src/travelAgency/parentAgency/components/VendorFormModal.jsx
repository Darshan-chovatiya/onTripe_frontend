import { useState, useEffect } from 'react'
import { CountrySelect, StateSelect, CitySelect, GetCountries, GetState } from 'react-country-state-city'
import 'react-country-state-city/dist/react-country-state-city.css'
import { FileText, File, Building2, User, Mail, Phone, MapPin, Upload, X } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import { filePublicUrl } from '@/travelAgency/shared/utils/bookingDetailHelpers.js'

const VENDOR_TYPES = ['hotel', 'transport', 'restaurant', 'activity_provider', 'guide', 'cruise', 'other']

const TYPE_META = {
  hotel:             'bg-blue-50 text-blue-700 ring-blue-100',
  transport:         'bg-purple-50 text-purple-700 ring-purple-100',
  restaurant:        'bg-orange-50 text-orange-700 ring-orange-100',
  activity_provider: 'bg-green-50 text-green-700 ring-green-100',
  guide:             'bg-yellow-50 text-yellow-700 ring-yellow-100',
  cruise:            'bg-cyan-50 text-cyan-700 ring-cyan-100',
  other:             'bg-gray-100 text-gray-600 ring-gray-200',
}

const EMPTY = {
  name: '', contactPerson: '', email: '', phone: '',
  type: 'hotel', address: '', city: '', state: '', country: '',
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
      {Icon && <Icon className="h-4 w-4 text-primary-500" strokeWidth={2} />}
      {children}
    </h3>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10 disabled:bg-gray-50 disabled:text-gray-400'

export default function VendorFormModal({ isOpen, onClose, onSubmit, initialData, loading }) {
  const [form, setForm] = useState(EMPTY)
  const [docs, setDocs] = useState([])
  const [docPreviews, setDocPreviews] = useState([])
  const [existingDocs, setExistingDocs] = useState([])
  const [countryObj, setCountryObj] = useState(null)
  const [stateObj, setStateObj] = useState(null)
  const isEdit = !!initialData

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
        GetCountries().then(countries => {
          const found = countries.find(c => c.name === initialData.country)
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

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
    docs.forEach(f => fd.append('docs', f))
    onSubmit(fd)
  }

  const initials = form.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  const typeCls = TYPE_META[form.type] || TYPE_META.other
  const typeLabel = form.type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit vendor' : 'Add vendor'} size="xl">
      <form id="vendor-form" onSubmit={handleSubmit} className="space-y-6 pr-1">

        {/* Hero preview */}
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 font-bold text-xl select-none">
                {initials}
              </div>
              <div>
                <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <Building2 size={14} className="text-primary-500" />
                  {isEdit ? 'Editing vendor' : 'New vendor'}
                </p>
                <p className="text-lg font-bold text-gray-900 leading-tight">
                  {form.name || <span className="text-gray-400 font-normal">Vendor name</span>}
                </p>
                {form.contactPerson && (
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                    <User size={12} /> {form.contactPerson}
                  </p>
                )}
              </div>
            </div>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${typeCls}`}>
              {typeLabel}
            </span>
          </div>

          {(form.email || form.phone) && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {form.email && (
                <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 break-all">{form.email}</p>
                </div>
              )}
              {form.phone && (
                <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                    <Phone className="h-3.5 w-3.5" /> Phone
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{form.phone}</p>
                </div>
              )}
              {[form.city, form.state, form.country].filter(Boolean).length > 0 && (
                <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                    <MapPin className="h-3.5 w-3.5" /> Location
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {[form.city, form.state, form.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Basic info */}
        <div>
          <SectionTitle icon={Building2}>Vendor info</SectionTitle>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Vendor name" required>
                <input
                  required
                  className={inputCls}
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Business name"
                />
              </Field>
              <Field label="Vendor type" required>
                <select
                  required
                  className={inputCls}
                  value={form.type}
                  onChange={e => set('type', e.target.value)}
                >
                  {VENDOR_TYPES.map(t => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <SectionTitle icon={User}>Contact</SectionTitle>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Contact person">
                <input
                  className={inputCls}
                  value={form.contactPerson}
                  onChange={e => set('contactPerson', e.target.value)}
                  placeholder="Full name"
                />
              </Field>
              <Field label="Phone">
                <input
                  className={inputCls}
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                />
              </Field>
              <Field
                label="Email"
                required={!isEdit}
                hint={isEdit ? 'Email cannot be changed after creation' : undefined}
              >
                <input
                  required={!isEdit}
                  type="email"
                  className={inputCls}
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="vendor@email.com"
                  disabled={isEdit}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <SectionTitle icon={MapPin}>Location</SectionTitle>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
            <Field label="Address">
              <input
                className={inputCls}
                value={form.address}
                onChange={e => set('address', e.target.value)}
                placeholder="Building, street, area"
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Country">
                <CountrySelect
                  containerClassName="w-full"
                  inputClassName={inputCls}
                  placeHolder={form.country || 'Select country'}
                  onChange={c => {
                    setCountryObj(c)
                    setStateObj(null)
                    set('country', c?.name || '')
                    set('state', '')
                    set('city', '')
                  }}
                  showFlag
                />
              </Field>
              <Field label="State">
                <StateSelect
                  containerClassName="w-full"
                  inputClassName={inputCls}
                  placeHolder={form.state || 'Select state'}
                  countryid={countryObj?.id || 0}
                  onChange={s => {
                    setStateObj(s)
                    set('state', s?.name || '')
                    set('city', '')
                  }}
                />
              </Field>
              <Field label="City">
                <CitySelect
                  containerClassName="w-full"
                  inputClassName={inputCls}
                  placeHolder={form.city || 'Select city'}
                  countryid={countryObj?.id || 0}
                  stateid={stateObj?.id || 0}
                  onChange={c => set('city', c?.name || '')}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div>
          <SectionTitle icon={FileText}>Documents</SectionTitle>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">

            {/* Existing docs */}
            {isEdit && existingDocs.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-500">Current documents</p>
                <div className="flex flex-wrap gap-2">
                  {existingDocs.map((doc, i) => {
                    const href = filePublicUrl(doc)
                    const isImg = /\.(png|jpe?g|webp|gif)$/i.test(String(doc))
                    return href ? (
                      <a
                        key={i}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-100 hover:bg-violet-100 transition-colors"
                      >
                        {isImg ? <File className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                        {String(doc).split('/').pop() || `Document ${i + 1}`}
                      </a>
                    ) : (
                      <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500 ring-1 ring-inset ring-gray-200">
                        <FileText className="h-3 w-3" /> Document {i + 1}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Upload new */}
            <div>
              <p className="mb-2 text-xs font-semibold text-gray-500">
                {isEdit ? 'Upload new documents' : 'Upload documents'}
                <span className="ml-1 font-normal text-gray-400">(PDF / Images, optional)</span>
              </p>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600 transition-colors hover:border-primary-400 hover:bg-primary-50/30">
                <Upload size={16} className="shrink-0 text-gray-400" />
                <span>{docs.length > 0 ? `${docs.length} file${docs.length > 1 ? 's' : ''} selected` : 'Click to select files'}</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="sr-only"
                  onChange={e => setDocs(Array.from(e.target.files || []))}
                />
              </label>

              {docs.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {docPreviews.map((file, i) => (
                    <div
                      key={`${file.name}-${i}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200"
                    >
                      {file.isImage
                        ? <img src={file.src} alt="" className="h-4 w-4 rounded-full object-cover" />
                        : <FileText className="h-3 w-3 text-gray-500" />
                      }
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setDocs(prev => prev.filter((_, idx) => idx !== i))}
                        className="ml-0.5 text-gray-400 hover:text-gray-700"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add vendor'}
          </button>
        </div>

      </form>
    </Modal>
  )
}
