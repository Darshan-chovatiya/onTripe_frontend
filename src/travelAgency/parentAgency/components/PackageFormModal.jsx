import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, ImagePlus, X } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import Button from '@/shared/components/Button.jsx'
import { uploadEventImage, listVendors, createVendor } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { formItineraryToApi, apiItineraryToForm } from '@/travelAgency/parentAgency/utils/packageItineraryTransforms.js'
import VendorFormModal from './VendorFormModal.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { joinUploadUrl } from '@/shared/config/api.js'

const EVENT_TYPES = ['Activity', 'Hotel CheckIn', 'Hotel CheckOut', 'Transfer', 'Other']

const emptyEvent = () => ({
  title: '', description: '', startTime: '', endTime: '', duration: '',
  location: '', type: 'Activity', includedInPrice: true, extraCost: ''
})

const emptyDay = (day) => ({ day, dateSuffix: '', title: '', description: '', events: [] })

const EMPTY_FORM = {
  title: '', description: '', destination: '', totalDays: '', basePrice: '',
  currency: 'INR', maxCapacity: '50',
  inclusions: [''], exclusions: [''], importantNotes: [''],
  itinerary: [emptyDay(1)],
}

export default function PackageFormModal({ isOpen, onClose, onSubmit, initialData, loading, isClone }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [coverFile, setCoverFile] = useState(null)
  const [galleryFiles, setGalleryFiles] = useState([])
  const [expandedDays, setExpandedDays] = useState({ 0: true })
  const [uploadingEvent, setUploadingEvent] = useState(null) // "di-ei"
  const [vendors, setVendors] = useState([])
  const { toast } = useToast()
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false)
  const [creatingVendor, setCreatingVendor] = useState(false)

  // Fetch vendors once when modal opens
  useEffect(() => {
    if (isOpen) {
      listVendors().then(res => setVendors(res.data?.data?.vendors || [])).catch(() => { })
    }
  }, [isOpen])

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        destination: initialData.destination || '',
        totalDays: initialData.totalDays || '',
        basePrice: initialData.basePrice || '',
        currency: initialData.currency || 'INR',
        maxCapacity: initialData.maxCapacity || '50',
        inclusions: initialData.inclusions?.length ? initialData.inclusions : [''],
        exclusions: initialData.exclusions?.length ? initialData.exclusions : [''],
        importantNotes: initialData.importantNotes?.length ? initialData.importantNotes : [''],
        itinerary: apiItineraryToForm(initialData.itinerary || []),
      })
      setExpandedDays({ 0: true })
    } else {
      setForm(EMPTY_FORM)
      setExpandedDays({ 0: true })
    }
    setCoverFile(null)
    setGalleryFiles([])
  }, [initialData, isOpen])

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  // List helpers (inclusions / exclusions)
  const handleListChange = (field, idx, value) => {
    const arr = [...form[field]]; arr[idx] = value; set(field, arr)
  }
  const addListItem = (field) => set(field, [...form[field], ''])
  const removeListItem = (field, idx) => set(field, form[field].filter((_, i) => i !== idx))

  // Itinerary day helpers
  const updateDay = (di, key, value) => {
    setForm(f => {
      const arr = [...f.itinerary]
      arr[di] = { ...arr[di], [key]: value }
      return { ...f, itinerary: arr }
    })
  }
  const addDay = () => {
    setForm(f => {
      const next = f.itinerary.length + 1
      const arr = [...f.itinerary, emptyDay(next)]
      setExpandedDays(e => ({ ...e, [f.itinerary.length]: true }))
      return { ...f, itinerary: arr }
    })
  }
  const removeDay = (di) => {
    setForm(f => {
      const arr = f.itinerary.filter((_, i) => i !== di).map((d, i) => ({ ...d, day: i + 1 }))
      return { ...f, itinerary: arr }
    })
  }

  // Event helpers
  const addEvent = (di) => {
    setForm(f => {
      const arr = [...f.itinerary]
      arr[di] = { ...arr[di], events: [...(arr[di].events || []), emptyEvent()] }
      return { ...f, itinerary: arr }
    })
  }
  const updateEvent = (di, ei, key, value) => {
    setForm(f => {
      const arr = [...f.itinerary]
      const events = [...(arr[di].events || [])]
      events[ei] = { ...events[ei], [key]: value }
      arr[di] = { ...arr[di], events }
      return { ...f, itinerary: arr }
    })
  }
  const updateEventFields = (di, ei, chunk) => {
    setForm(f => {
      const arr = [...f.itinerary]
      const events = [...(arr[di].events || [])]
      events[ei] = { ...events[ei], ...chunk }
      arr[di] = { ...arr[di], events }
      return { ...f, itinerary: arr }
    })
  }
  const removeEvent = (di, ei) => {
    setForm(f => {
      const arr = [...f.itinerary]
      arr[di] = { ...arr[di], events: arr[di].events.filter((_, i) => i !== ei) }
      return { ...f, itinerary: arr }
    })
  }

  const handleEventImageUpload = async (di, ei, file) => {
    if (!file) return
    const key = `${di}-${ei}`
    setUploadingEvent(key)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await uploadEventImage(fd)
      const url = res.data?.data?.url || res.data?.data?.imageUrl || ''
      updateEvent(di, ei, 'image', url)
    } catch (err) {
      console.error(getApiErrorMessage(err))
    } finally {
      setUploadingEvent(null)
    }
  }

  const handleVendorSubmit = async (formData) => {
    setCreatingVendor(true)
    try {
      await createVendor(formData)
      const res = await listVendors()
      setVendors(res.data?.data?.vendors || [])
      setIsVendorModalOpen(false)
      toast?.success?.('Vendor created')
    } catch (err) {
      toast?.error?.(getApiErrorMessage(err))
    } finally {
      setCreatingVendor(false)
    }
  }

  const toggleDay = (di) => setExpandedDays(e => ({ ...e, [di]: !e[di] }))

  const buildPayload = () => {
    const notes = form.importantNotes.filter(Boolean)
    return {
      title: form.title,
      description: form.description,
      destination: form.destination,
      totalDays: Number(form.totalDays),
      basePrice: Number(form.basePrice),
      currency: form.currency,
      maxCapacity: Number(form.maxCapacity),
      inclusions: form.inclusions.filter(Boolean),
      exclusions: form.exclusions.filter(Boolean),
      importantNotes: notes,
      itinerary: formItineraryToApi(form.itinerary),
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const isEditMode = !!initialData && !isClone
    const payload = buildPayload()
    if (isEditMode) {
      onSubmit(null, payload)
    } else {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('destination', form.destination)
      fd.append('totalDays', form.totalDays)
      fd.append('basePrice', form.basePrice)
      fd.append('currency', form.currency)
      fd.append('maxCapacity', form.maxCapacity)
      fd.append('inclusions', JSON.stringify(form.inclusions.filter(Boolean)))
      fd.append('exclusions', JSON.stringify(form.exclusions.filter(Boolean)))
      fd.append('importantNotes', JSON.stringify(form.importantNotes.filter(Boolean)))
      fd.append('itinerary', JSON.stringify(payload.itinerary))
      if (coverFile) fd.append('coverImage', coverFile)
      galleryFiles.forEach(f => fd.append('images', f))
      onSubmit(fd, { ...form, ...payload })
    }
  }

  const isEditMode = !!initialData && !isClone

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Package' : isClone ? 'Clone Package' : 'Create Package'} size="lg"
      footer={
        <div className="flex justify-end gap-3 p-4">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" form="pkg-form" disabled={loading}>
            {loading ? 'Saving…' : isEditMode ? 'Save Changes' : isClone ? 'Clone Package' : 'Create Package'}
          </Button>
        </div>
      }
    >
      <form id="pkg-form" onSubmit={handleSubmit} className="space-y-6">

        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input required className="input-field" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Package title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
            <input required className="input-field" value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="e.g. Goa, India" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Days *</label>
            <input required type="number" min="1" className="input-field" value={form.totalDays} onChange={e => set('totalDays', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
            <input type="number" min="1" className="input-field" value={form.maxCapacity} onChange={e => set('maxCapacity', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Price Incl GST *</label>
            <div className="flex gap-2">
              <select className="input-field w-24" value={form.currency} onChange={e => set('currency', e.target.value)}>
                <option>INR</option><option>USD</option><option>EUR</option>
              </select>
              <input required type="number" min="0" className="input-field flex-1" value={form.basePrice} onChange={e => set('basePrice', e.target.value)} placeholder="0" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={3} className="input-field resize-none" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the package…" />
        </div>

        {/* Images — create only */}
        {(!isEditMode) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
              <input type="file" accept="image/*" className="input-field" onChange={e => setCoverFile(e.target.files[0])} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gallery (up to 10)</label>
              <input type="file" accept="image/*" multiple className="input-field" onChange={e => setGalleryFiles(Array.from(e.target.files))} />
            </div>
          </div>
        )}

        {/* Inclusions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Inclusions</label>
          <div className="space-y-2">
            {form.inclusions.map((inc, i) => (
              <div key={i} className="flex gap-2">
                <input className="input-field flex-1" value={inc} onChange={e => handleListChange('inclusions', i, e.target.value)} placeholder="e.g. Breakfast included" />
                {form.inclusions.length > 1 && (
                  <button type="button" onClick={() => removeListItem('inclusions', i)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addListItem('inclusions')} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
              <Plus size={14} /> Add inclusion
            </button>
          </div>
        </div>

        {/* Exclusions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Exclusions</label>
          <div className="space-y-2">
            {form.exclusions.map((exc, i) => (
              <div key={i} className="flex gap-2">
                <input className="input-field flex-1" value={exc} onChange={e => handleListChange('exclusions', i, e.target.value)} placeholder="e.g. Flights not included" />
                {form.exclusions.length > 1 && (
                  <button type="button" onClick={() => removeListItem('exclusions', i)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addListItem('exclusions')} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
              <Plus size={14} /> Add exclusion
            </button>
          </div>
        </div>

        {/* Important notes (customer-facing) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Important notes</label>
          <p className="text-xs text-gray-500 mb-2">Shown to travelers (e.g. visa requirements, health advisories).</p>
          <div className="space-y-2">
            {form.importantNotes.map((note, i) => (
              <div key={i} className="flex gap-2">
                <input className="input-field flex-1" value={note} onChange={e => handleListChange('importantNotes', i, e.target.value)} placeholder="e.g. Valid passport required" />
                {form.importantNotes.length > 1 && (
                  <button type="button" onClick={() => removeListItem('importantNotes', i)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addListItem('importantNotes')} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
              <Plus size={14} /> Add note
            </button>
          </div>
        </div>

        {/* Itinerary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Itinerary</label>
          <div className="space-y-3">
            {form.itinerary.map((day, di) => (
              <div key={di} className="rounded-xl border border-gray-200 overflow-hidden">
                {/* Day header */}
                <div
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none"
                  onClick={() => toggleDay(di)}
                >
                  <span className="text-sm font-semibold text-gray-700">
                    Day {day.day}{day.title ? ` — ${day.title}` : ''}
                    {day.events?.length > 0 && (
                      <span className="ml-2 text-xs font-normal text-gray-400">{day.events.length} event(s)</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {form.itinerary.length > 1 && (
                      <button type="button" onClick={e => { e.stopPropagation(); removeDay(di) }} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    )}
                    {expandedDays[di] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {expandedDays[di] && (
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Day Title</label>
                        <input className="input-field" value={day.title} onChange={e => updateDay(di, 'title', e.target.value)} placeholder="e.g. Arrival & City Tour" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                        <input
                          type="date"
                          className="input-field"
                          value={
                            day.dateSuffix
                              ? (() => {
                                const d = new Date(`${day.dateSuffix} ${new Date().getFullYear()}`)
                                return isNaN(d) ? '' : d.toISOString().split('T')[0]
                              })()
                              : ''
                          }
                          onChange={e => {
                            if (!e.target.value) { updateDay(di, 'dateSuffix', ''); return }
                            const d = new Date(e.target.value)
                            const formatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                            updateDay(di, 'dateSuffix', formatted)
                          }}
                        />
                        {day.dateSuffix && (
                          <p className="mt-1 text-xs text-gray-400">{day.dateSuffix}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Day Description</label>
                      <textarea rows={2} className="input-field resize-none" value={day.description} onChange={e => updateDay(di, 'description', e.target.value)} placeholder="Overview of the day…" />
                    </div>

                    {/* Events */}
                    {day.events?.length > 0 && (
                      <div className="space-y-3">
                        {day.events.map((ev, ei) => (
                          <div key={ei} className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-600">Event {ei + 1}</span>
                              <button type="button" onClick={() => removeEvent(di, ei)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-gray-500 mb-0.5">Title</label>
                                <input className="input-field" value={ev.title} onChange={e => updateEvent(di, ei, 'title', e.target.value)} placeholder="e.g. Visit Burj Al Arab" />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-0.5">
                                  <label className="block text-xs text-gray-500">Type</label>
                                  {ev.type === 'Activity' && (
                                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        className="h-3 w-3 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                                        checked={ev.includedInPrice === false}
                                        onChange={e => {
                                          updateEventFields(di, ei, {
                                            includedInPrice: !e.target.checked,
                                            ...(!e.target.checked ? { extraCost: '' } : {})
                                          })
                                        }}
                                      />
                                      <span className="text-[10px] font-semibold text-gray-600">Extra Chargeable</span>
                                    </label>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <select className="input-field flex-1 min-w-0" value={ev.type} onChange={e => {
                                    updateEventFields(di, ei, {
                                      type: e.target.value,
                                      ...(e.target.value !== 'Activity' ? { includedInPrice: true, extraCost: '' } : {})
                                    })
                                  }}>
                                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-0.5">Start Time</label>
                                <input type="time" className="input-field" value={ev.startTime} onChange={e => updateEvent(di, ei, 'startTime', e.target.value)} />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-0.5">End Time</label>
                                <input type="time" className="input-field" value={ev.endTime} onChange={e => updateEvent(di, ei, 'endTime', e.target.value)} />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-0.5">Duration</label>
                                <select className="input-field" value={ev.duration || ''} onChange={e => updateEvent(di, ei, 'duration', e.target.value)}>
                                  <option value="">— Select Duration —</option>
                                  <option value="15 min">15 Minutes</option>
                                  <option value="30 min">30 Minutes</option>
                                  <option value="45 min">45 Minutes</option>
                                  <option value="1 hr">1 Hour</option>
                                  <option value="1.5 hr">1.5 Hours</option>
                                  <option value="2 hr">2 Hours</option>
                                  <option value="2.5 hr">2.5 Hours</option>
                                  <option value="3 hr">3 Hours</option>
                                  <option value="4 hr">4 Hours</option>
                                  <option value="5 hr">5 Hours</option>
                                  <option value="6 hr">6 Hours</option>
                                  <option value="8 hr">8 hours</option>
                                  <option value="10 hr">10+ hours</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-0.5">Location</label>
                                <input className="input-field" value={ev.location} onChange={e => updateEvent(di, ei, 'location', e.target.value)} placeholder="Location" />
                              </div>
                              <div className="sm:col-span-2">
                                <div className="flex items-center justify-between mb-0.5">
                                  <label className="block text-xs text-gray-500">Vendor</label>
                                  <button type="button" onClick={() => setIsVendorModalOpen(true)} className="text-[10px] font-semibold text-primary-600 hover:text-primary-700">
                                    + Add Vendor
                                  </button>
                                </div>
                                <select
                                  className="input-field"
                                  value={ev.vendor || ''}
                                  onChange={e => updateEvent(di, ei, 'vendor', e.target.value || null)}
                                >
                                  <option value="">— No vendor —</option>
                                  {vendors.map(v => (
                                    <option key={v._id} value={v._id}>
                                      {v.name} ({v.type?.replace('_', ' ')})
                                    </option>
                                  ))}
                                </select>
                                {ev.vendor && (() => {
                                  const v = vendors.find(v => v._id === ev.vendor || v._id === ev.vendor?._id)
                                  return v ? (
                                    <p className="mt-1 text-xs text-gray-400">{v.contactPerson && `${v.contactPerson} · `}{v.phone}</p>
                                  ) : null
                                })()}
                              </div>
                            </div>

                            <div className="mt-2">
                              <label className="block text-xs text-gray-500 mb-0.5">Description</label>
                              <textarea rows={2} className="input-field resize-none" value={ev.description} onChange={e => updateEvent(di, ei, 'description', e.target.value)} placeholder="Event details…" />
                            </div>

                            {/* Event Image */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Event Image</label>
                              {ev.image ? (
                                <div className="relative inline-block">
                                  <img
                                    src={joinUploadUrl(ev.image)}
                                    alt="event"
                                    className="h-20 w-32 object-cover rounded-lg border border-gray-200"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateEvent(di, ei, 'image', '')}
                                    className="absolute -top-1.5 -right-1.5 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
                                  >
                                    <X size={11} />
                                  </button>
                                </div>
                              ) : (
                                <label className={`flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors w-fit ${uploadingEvent === `${di}-${ei}` ? 'opacity-50 pointer-events-none' : ''}`}>
                                  <ImagePlus size={14} />
                                  {uploadingEvent === `${di}-${ei}` ? 'Uploading…' : 'Upload image'}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => handleEventImageUpload(di, ei, e.target.files[0])}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button type="button" onClick={() => addEvent(di)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                      <Plus size={13} /> Add event
                    </button>
                  </div>
                )}
              </div>
            ))}

            <button type="button" onClick={addDay} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
              <Plus size={14} /> Add day
            </button>
          </div>
        </div>

      </form>

      <VendorFormModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        onSubmit={handleVendorSubmit}
        loading={creatingVendor}
      />
    </Modal>
  )
}
