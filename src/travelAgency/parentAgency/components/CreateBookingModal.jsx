import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import Button from '@/shared/components/Button.jsx'
import { listMyPackages } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'

const EMPTY = {
  packageId: '', customerName: '', customerPhone: '', customerEmail: '',
  travelDate: '', totalAmount: '', travelers: [],
}

const emptyTraveler = () => ({ name: '', age: '', gender: 'male' })

export default function CreateBookingModal({ isOpen, onClose, onSubmit, loading }) {
  const [form, setForm] = useState(EMPTY)
  const [packages, setPackages] = useState([])

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY)
      listMyPackages()
        .then(res => setPackages((res.data?.data?.packages || []).filter(p => p.isActive)))
        .catch(() => {})
    }
  }, [isOpen])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addTraveler = () => setForm(f => ({ ...f, travelers: [...f.travelers, emptyTraveler()] }))
  const removeTraveler = (i) => setForm(f => ({ ...f, travelers: f.travelers.filter((_, idx) => idx !== i) }))
  const updateTraveler = (i, k, v) => {
    const arr = [...form.travelers]
    arr[i] = { ...arr[i], [k]: v }
    setForm(f => ({ ...f, travelers: arr }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      packageId: form.packageId,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      customerEmail: form.customerEmail,
      travelDate: form.travelDate,
      totalAmount: Number(form.totalAmount),
      travelers: form.travelers.map(t => ({ ...t, age: Number(t.age) })),
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Booking" size="md"
      footer={
        <div className="flex justify-end gap-3 p-4">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" form="booking-form" disabled={loading}>
            {loading ? 'Creating…' : 'Create Booking'}
          </Button>
        </div>
      }
    >
      <form id="booking-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Package *</label>
          <select required className="input-field" value={form.packageId} onChange={e => set('packageId', e.target.value)}>
            <option value="">Select a package</option>
            {packages.map(p => (
              <option key={p._id} value={p._id}>{p.title} — {p.destination}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
            <input required className="input-field" value={form.customerName} onChange={e => set('customerName', e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input required className="input-field" value={form.customerPhone} onChange={e => set('customerPhone', e.target.value)} placeholder="Phone number" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="input-field" value={form.customerEmail} onChange={e => set('customerEmail', e.target.value)} placeholder="Email address" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Travel Date *</label>
            <input required type="date" className="input-field" value={form.travelDate} onChange={e => set('travelDate', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount *</label>
            <input required type="number" min="0" className="input-field" value={form.totalAmount} onChange={e => set('totalAmount', e.target.value)} placeholder="0" />
          </div>
        </div>

        {/* Travelers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Travelers</label>
          <div className="space-y-2">
            {form.travelers.map((t, i) => (
              <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Traveler {i + 1}</span>
                  <button type="button" onClick={() => removeTraveler(i)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-3 sm:col-span-1">
                    <input className="input-field" placeholder="Name" value={t.name} onChange={e => updateTraveler(i, 'name', e.target.value)} required />
                  </div>
                  <div>
                    <input type="number" min="1" className="input-field" placeholder="Age" value={t.age} onChange={e => updateTraveler(i, 'age', e.target.value)} required />
                  </div>
                  <div>
                    <select className="input-field" value={t.gender} onChange={e => updateTraveler(i, 'gender', e.target.value)}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addTraveler} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
              <Plus size={14} /> Add traveler
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
