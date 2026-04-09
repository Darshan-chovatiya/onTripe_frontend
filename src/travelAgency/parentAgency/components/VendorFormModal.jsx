import { useState, useEffect } from 'react'
import { CountrySelect, StateSelect, CitySelect, GetCountries, GetState } from 'react-country-state-city'
import 'react-country-state-city/dist/react-country-state-city.css'
import { FileText, File } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import Button from '@/shared/components/Button.jsx'

const VENDOR_TYPES = ['hotel', 'transport', 'restaurant', 'activity_provider', 'guide', 'cruise', 'other']

const EMPTY = {
  name: '', contactPerson: '', email: '', phone: '',
  type: 'hotel', address: '', city: '', state: '', country: '',
}

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

      // Resolve country → state objects so dropdowns are populated
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
    const previews = docs.map((file) => ({
      name: file.name,
      isImage: file.type.startsWith('image/'),
      src: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
    }))
    setDocPreviews(previews)
    return () => {
      previews.forEach((p) => {
        if (p.src) URL.revokeObjectURL(p.src)
      })
    }
  }, [docs])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
    docs.forEach(f => fd.append('docs', f))
    onSubmit(fd)
  }

  const toDocUrl = (path) => {
    if (!path) return ''
    if (String(path).startsWith('http')) return String(path)
    const base = (import.meta.env.VITE_API_BASE_URL || '').replace('/api', '').replace(/\/$/, '')
    return `${base}/${String(path).replace(/^\//, '')}`
  }
  const isImageDoc = (name = '') => /\.(png|jpe?g|webp|gif)$/i.test(String(name))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Vendor' : 'Add Vendor'}
      size="md"
      footer={
        <div className="flex justify-end gap-2 p-4">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" form="vendor-form" disabled={loading}>
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Vendor'}
          </Button>
        </div>
      }
    >
      <form id="vendor-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Vendor Name *</label>
            <input
              required
              className="input-field"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Business name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Vendor Type *</label>
            <select required className="input-field" value={form.type} onChange={e => set('type', e.target.value)}>
              {VENDOR_TYPES.map(t => (
                <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Contact Person</label>
            <input
              className="input-field"
              value={form.contactPerson}
              onChange={e => set('contactPerson', e.target.value)}
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
            <input
              className="input-field"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="+91 XXXXX XXXXX"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
            <input
              required
              type="email"
              className="input-field"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="vendor@email.com"
              disabled={isEdit}
            />
            {isEdit && <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>}
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50/60 p-4">
          <p className="text-sm font-medium text-gray-800">Location</p>
          <input
            className="input-field"
            value={form.address}
            onChange={e => set('address', e.target.value)}
            placeholder="Building, street, area"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Country</label>
              <CountrySelect
                containerClassName="w-full"
                inputClassName="input-field w-full"
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
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">State</label>
              <StateSelect
                containerClassName="w-full"
                inputClassName="input-field w-full"
                placeHolder={form.state || 'Select state'}
                countryid={countryObj?.id || 0}
                onChange={s => {
                  setStateObj(s)
                  set('state', s?.name || '')
                  set('city', '')
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
              <CitySelect
                containerClassName="w-full"
                inputClassName="input-field w-full"
                placeHolder={form.city || 'Select city'}
                countryid={countryObj?.id || 0}
                stateid={stateObj?.id || 0}
                onChange={c => set('city', c?.name || '')}
              />
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="space-y-3 rounded-lg border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <FileText className="h-4 w-4 text-gray-500" />
            Documents
          </div>

          {isEdit && existingDocs.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {existingDocs.map((doc, idx) => {
                const url = toDocUrl(doc)
                const isImg = isImageDoc(doc)
                return (
                  <a
                    key={`${doc}-${idx}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-2 rounded-md border border-gray-200 p-2 transition-colors hover:bg-gray-50"
                  >
                    {isImg ? (
                      <img src={url} alt="" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-gray-500">
                        <File className="h-4 w-4" />
                      </div>
                    )}
                    <span className="truncate text-xs text-gray-700 group-hover:text-gray-900">{String(doc).split('/').pop()}</span>
                  </a>
                )
              })}
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Upload Documents <span className="font-normal text-gray-400">(PDF / Images)</span>
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="input-field cursor-pointer"
              onChange={e => setDocs(Array.from(e.target.files))}
            />
            {docs.length > 0 ? (
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {docPreviews.map((file, idx) => {
                  return (
                    <div key={`${file.name}-${idx}`} className="flex items-center gap-2 rounded-md border border-gray-200 p-2">
                      {file.isImage ? (
                        <img src={file.src} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-gray-500">
                          <FileText className="h-4 w-4" />
                        </div>
                      )}
                      <span className="truncate text-xs text-gray-700">{file.name}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-gray-400">No new files selected.</p>
            )}
          </div>
        </div>

      </form>
    </Modal>
  )
}
