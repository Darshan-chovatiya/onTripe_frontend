import { useState, useEffect } from 'react'
import { CountrySelect, StateSelect, CitySelect, GetCountries, GetState } from 'react-country-state-city'
import 'react-country-state-city/dist/react-country-state-city.css'
import { Building2, User, Lock, MapPin, FileText } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import Button from '@/shared/components/Button.jsx'

const VENDOR_TYPES = ['hotel', 'transport', 'restaurant', 'activity_provider', 'guide', 'cruise', 'other']

const EMPTY = {
  name: '', contactPerson: '', email: '', phone: '', password: '',
  type: 'hotel', address: '', city: '', state: '', country: '',
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        <Icon size={15} />
      </div>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    </div>
  )
}

export default function VendorFormModal({ isOpen, onClose, onSubmit, initialData, loading }) {
  const [form, setForm] = useState(EMPTY)
  const [docs, setDocs] = useState([])
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
        password: '',
        type: initialData.type || 'hotel',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        country: initialData.country || '',
      })

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
    }
    setDocs([])
  }, [initialData, isOpen])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isEdit) {
      const data = { ...form }
      if (!data.password) delete data.password
      onSubmit(data)
    } else {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
      docs.forEach(f => fd.append('docs', f))
      onSubmit(fd)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Vendor' : 'Add Vendor'}
      size="lg"
      footer={
        <div className="flex justify-end gap-3 p-4">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" form="vendor-form" disabled={loading}>
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Vendor'}
          </Button>
        </div>
      }
    >
      <form id="vendor-form" onSubmit={handleSubmit} className="space-y-7">

        {/* Business Info */}
        <div className="space-y-4">
          <SectionHeader icon={Building2} title="Business Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label>
              <input
                required
                className="input-field"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Business name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Type *</label>
              <select required className="input-field" value={form.type} onChange={e => set('type', e.target.value)}>
                {VENDOR_TYPES.map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <SectionHeader icon={User} title="Contact Details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input
                className="input-field"
                value={form.contactPerson}
                onChange={e => set('contactPerson', e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                className="input-field"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
          </div>
        </div>

        {/* Credentials */}
        <div className="space-y-4">
          <SectionHeader icon={Lock} title="Login Credentials" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isEdit ? 'New Password' : 'Password *'}
              </label>
              <input
                type="password"
                className="input-field"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder={isEdit ? 'Leave blank to keep current' : 'Set a password'}
                required={!isEdit}
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-4">
          <SectionHeader icon={MapPin} title="Location" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input
              className="input-field"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="Building, street, area"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
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

        {/* Documents — create only */}
        {!isEdit && (
          <div className="space-y-4">
            <SectionHeader icon={FileText} title="Documents" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Documents <span className="font-normal text-gray-400">(PDF / Images, optional)</span>
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="input-field"
                onChange={e => setDocs(Array.from(e.target.files))}
              />
              {docs.length > 0 && (
                <p className="mt-1.5 text-xs text-gray-400">{docs.length} file(s) selected</p>
              )}
            </div>
          </div>
        )}

      </form>
    </Modal>
  )
}
