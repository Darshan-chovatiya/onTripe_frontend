import { useState, useEffect } from 'react'
import { CountrySelect, StateSelect, CitySelect } from 'react-country-state-city'
import 'react-country-state-city/dist/react-country-state-city.css'
import Modal from '@/shared/components/Modal.jsx'
import Button from '@/shared/components/Button.jsx'

const VENDOR_TYPES = ['hotel', 'transport', 'restaurant', 'activity_provider', 'guide', 'cruise', 'other']

const EMPTY = {
  name: '', contactPerson: '', email: '', phone: '', password: '',
  type: 'hotel', address: '', city: '', state: '', country: '',
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
    } else {
      setForm(EMPTY)
    }
    setCountryObj(null)
    setStateObj(null)
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

  const selectClass = 'w-full'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Vendor' : 'Add Vendor'}
      size="md"
      footer={
        <div className="flex justify-end gap-3 p-4">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" form="vendor-form" disabled={loading}>
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Vendor'}
          </Button>
        </div>
      }
    >
      <form id="vendor-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label>
            <input required className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Business name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select required className="input-field" value={form.type} onChange={e => set('type', e.target.value)}>
              {VENDOR_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
            <input className="input-field" value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input required type="email" className="input-field" value={form.email} onChange={e => set('email', e.target.value)} placeholder="vendor@email.com" disabled={isEdit} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{isEdit ? 'New Password' : 'Password *'}</label>
            <input
              type="password"
              className="input-field"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder={isEdit ? 'Leave blank to keep current' : 'Set password'}
              required={!isEdit}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input className="input-field" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address" />
        </div>

        {/* Country → State → City */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <CountrySelect
              containerClassName={selectClass}
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
              containerClassName={selectClass}
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
              containerClassName={selectClass}
              inputClassName="input-field w-full"
              placeHolder={form.city || 'Select city'}
              countryid={countryObj?.id || 0}
              stateid={stateObj?.id || 0}
              onChange={c => set('city', c?.name || '')}
            />
          </div>
        </div>

        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Documents (PDF/Images)</label>
            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="input-field" onChange={e => setDocs(Array.from(e.target.files))} />
            {docs.length > 0 && <p className="text-xs text-gray-400 mt-1">{docs.length} file(s) selected</p>}
          </div>
        )}
      </form>
    </Modal>
  )
}
