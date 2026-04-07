import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import Button from '@/shared/components/Button.jsx'

const emptyTraveler = () => ({ name: '', age: '', gender: 'male' })

export default function CreateBookingModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  availablePackages,
  whitelabels,
}) {
  const [offerType, setOfferType] = useState('whitelabel')
  const [packageId, setPackageId] = useState('')
  const [whitelabelId, setWhitelabelId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [travelers, setTravelers] = useState([])
  const [docFiles, setDocFiles] = useState([])

  const activeWhitelabels = (whitelabels ?? []).filter((w) => w.isActive !== false)

  useEffect(() => {
    if (!isOpen) return
    const hasWl = activeWhitelabels.length > 0
    const hasPkg = (availablePackages ?? []).length > 0
    setOfferType(hasWl ? 'whitelabel' : hasPkg ? 'package' : 'whitelabel')
    setPackageId('')
    setWhitelabelId('')
    setCustomerName('')
    setCustomerPhone('')
    setCustomerEmail('')
    setTravelDate('')
    setTotalAmount('')
    setTravelers([])
    setDocFiles([])
  }, [isOpen, activeWhitelabels.length, availablePackages])

  useEffect(() => {
    if (!isOpen) return
    if (offerType === 'whitelabel' && activeWhitelabels.length && !whitelabelId) {
      setWhitelabelId(String(activeWhitelabels[0]._id))
    }
    if (offerType === 'package' && availablePackages?.length && !packageId) {
      setPackageId(String(availablePackages[0]._id))
    }
  }, [isOpen, offerType, activeWhitelabels, availablePackages, whitelabelId, packageId])

  const addTraveler = () => setTravelers((t) => [...t, emptyTraveler()])
  const removeTraveler = (i) => setTravelers((t) => t.filter((_, idx) => idx !== i))
  const setTravelerField = (i, field, value) => {
    setTravelers((t) => t.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = Number(totalAmount)
    if (Number.isNaN(amount) || amount <= 0) return

    const fd = new FormData()
    fd.append('customerName', customerName.trim())
    fd.append('customerPhone', customerPhone.trim())
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
      customerPhone.trim() &&
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
      <Button type="submit" form="create-booking-form" disabled={loading || !canSubmit}>
        {loading ? 'Creating…' : 'Create booking'}
      </Button>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New booking" footer={footer} size="lg">
      <form id="create-booking-form" onSubmit={handleSubmit} className="space-y-5">
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
            <input
              id="bk-phone"
              className="input-field w-full"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
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
