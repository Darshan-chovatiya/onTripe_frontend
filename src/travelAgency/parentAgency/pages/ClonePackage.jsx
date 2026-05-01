import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, ChevronDown, ChevronUp, ArrowLeft, X } from 'lucide-react'
import {
  getPackageById,
  createPackage,
  uploadEventImage,
  listVendors,
  createVendor,
} from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import {
  formItineraryToApi,
  apiItineraryToForm,
} from '@/travelAgency/parentAgency/utils/packageItineraryTransforms.js'
import VendorFormModal from '@/travelAgency/parentAgency/components/VendorFormModal.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import Loader from '@/shared/components/Loader.jsx'

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const EVENT_TYPES = ['Activity', 'Hotel CheckIn', 'Hotel CheckOut', 'Transfer', 'Other']

const emptyEvent = () => ({
  title: '', description: '', startTime: '', endTime: '',
  location: '', type: 'Activity', extraChargeable: false,
})
const emptyDay = (day) => ({ day, dateSuffix: '', title: '', description: '', events: [] })

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-200'

const fullImgUrl = (p) => {
  if (!p) return null
  if (p.startsWith('http') || p.startsWith('blob:')) return p
  return `${BASE_URL}/${String(p).replace(/^\//, '')}`
}

export default function ClonePackage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [form, setForm] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [galleryFiles, setGalleryFiles] = useState([])
  const [galleryPreviews, setGalleryPreviews] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [expandedDays, setExpandedDays] = useState({ 0: true })
  const [uploadingEvent, setUploadingEvent] = useState(null)
  const [vendors, setVendors] = useState([])
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false)
  const [creatingVendor, setCreatingVendor] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [pkgRes, vendorRes] = await Promise.all([getPackageById(id), listVendors()])
        const pkg = pkgRes.data?.data?.package || pkgRes.data?.data
        setVendors(vendorRes.data?.data?.vendors || [])
        setForm({
          title: `${pkg.title || ''} (Copy)`,
          description: pkg.description || '',
          destination: pkg.destination || '',
          totalDays: pkg.totalDays || '',
          basePrice: pkg.basePrice || '',
          currency: pkg.currency || 'INR',
          maxCapacity: pkg.maxCapacity || '50',
          inclusions: pkg.inclusions?.length ? pkg.inclusions : [''],
          exclusions: pkg.exclusions?.length ? pkg.exclusions : [''],
          importantNotes: pkg.importantNotes?.length ? pkg.importantNotes : [''],
          itinerary: apiItineraryToForm(pkg.itinerary || []).map(day => ({
            ...day,
            events: (day.events || []).map(ev => ({
              ...ev,
              extraChargeable: ev.includedInPrice === false,
            })),
          })),
        })
      } catch (err) {
        toast.error(getApiErrorMessage(err))
        navigate('/agency/packages')
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [id])

  useEffect(() => () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    galleryPreviews.forEach(p => URL.revokeObjectURL(p))
  }, [])

  const handleCoverChange = (e) => {
    const file = e.target.files[0]; if (!file) return
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(file); setCoverPreview(URL.createObjectURL(file))
  }
  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files)
    galleryPreviews.forEach(p => URL.revokeObjectURL(p))
    setGalleryFiles(files); setGalleryPreviews(files.map(f => URL.createObjectURL(f)))
  }
  const removeGalleryItem = (idx) => {
    URL.revokeObjectURL(galleryPreviews[idx])
    setGalleryFiles(f => f.filter((_, i) => i !== idx))
    setGalleryPreviews(p => p.filter((_, i) => i !== idx))
  }

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))
  const handleListChange = (field, idx, value) => { const arr = [...form[field]]; arr[idx] = value; set(field, arr) }
  const addListItem = (field) => set(field, [...form[field], ''])
  const removeListItem = (field, idx) => set(field, form[field].filter((_, i) => i !== idx))

  const updateDay = (di, key, value) => setForm(f => { const arr = [...f.itinerary]; arr[di] = { ...arr[di], [key]: value }; return { ...f, itinerary: arr } })
  const addDay = () => setForm(f => { const arr = [...f.itinerary, emptyDay(f.itinerary.length + 1)]; setExpandedDays(e => ({ ...e, [f.itinerary.length]: true })); return { ...f, itinerary: arr } })
  const removeDay = (di) => setForm(f => { const arr = f.itinerary.filter((_, i) => i !== di).map((d, i) => ({ ...d, day: i + 1 })); return { ...f, itinerary: arr } })

  const addEvent = (di) => setForm(f => { const arr = [...f.itinerary]; arr[di] = { ...arr[di], events: [...(arr[di].events || []), emptyEvent()] }; return { ...f, itinerary: arr } })
  const updateEvent = (di, ei, key, value) => setForm(f => { const arr = [...f.itinerary]; const evs = [...(arr[di].events || [])]; evs[ei] = { ...evs[ei], [key]: value }; arr[di] = { ...arr[di], events: evs }; return { ...f, itinerary: arr } })
  const removeEvent = (di, ei) => setForm(f => { const arr = [...f.itinerary]; arr[di] = { ...arr[di], events: arr[di].events.filter((_, i) => i !== ei) }; return { ...f, itinerary: arr } })

  const handleEventImageUpload = async (di, ei, file) => {
    if (!file) return
    const key = `${di}-${ei}`
    const localUrl = URL.createObjectURL(file)
    updateEvent(di, ei, 'image', localUrl)
    setUploadingEvent(key)
    try {
      const fd = new FormData(); fd.append('image', file)
      const res = await uploadEventImage(fd)
      const serverUrl = res.data?.data?.url || res.data?.data?.imageUrl || ''
      if (serverUrl) {
        URL.revokeObjectURL(localUrl)
        updateEvent(di, ei, 'image', serverUrl)
      }
    } catch (err) { toast.error(getApiErrorMessage(err)) }
    finally { setUploadingEvent(null) }
  }

  const handleVendorSubmit = async (formData) => {
    setCreatingVendor(true)
    try {
      await createVendor(formData)
      const res = await listVendors(); setVendors(res.data?.data?.vendors || [])
      setIsVendorModalOpen(false); toast.success('Vendor created')
    } catch (err) { toast.error(getApiErrorMessage(err)) }
    finally { setCreatingVendor(false) }
  }

  const toggleDay = (di) => setExpandedDays(e => ({ ...e, [di]: !e[di] }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      const payload = {
        title: form.title, description: form.description, destination: form.destination,
        totalDays: Number(form.totalDays), basePrice: Number(form.basePrice),
        currency: form.currency, maxCapacity: Number(form.maxCapacity),
        inclusions: form.inclusions.filter(Boolean), exclusions: form.exclusions.filter(Boolean),
        importantNotes: form.importantNotes.filter(Boolean),
        itinerary: formItineraryToApi(form.itinerary),
      }
      const fd = new FormData()
      Object.entries(payload).forEach(([k, v]) => fd.append(k, typeof v === 'object' ? JSON.stringify(v) : v))
      if (coverFile) fd.append('coverImage', coverFile)
      galleryFiles.forEach(f => fd.append('images', f))
      await createPackage(fd)
      toast.success('Package cloned')
      navigate('/agency/packages')
    } catch (err) { toast.error(getApiErrorMessage(err)) }
    finally { setSubmitting(false) }
  }

  if (loadingData) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in mx-auto _max-w-3xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/agency/packages')}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">Clone package</h1>
          <p className="text-sm text-gray-500">Review and adjust the cloned package before saving.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basic info */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-4 text-sm font-semibold text-gray-900">Basic info</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Title *</label>
              <input required className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Package title" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Destination *</label>
              <input required className={inputCls} value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="e.g. Goa, India" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Total days *</label>
              <input required type="number" min="1" className={inputCls} value={form.totalDays} onChange={e => set('totalDays', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Max capacity</label>
              <input type="number" min="1" className={inputCls} value={form.maxCapacity} onChange={e => set('maxCapacity', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Base price incl. GST *</label>
              <div className="flex gap-2">
                <select className={`${inputCls} w-24`} value={form.currency} onChange={e => set('currency', e.target.value)}>
                  <option>INR</option><option>USD</option><option>EUR</option>
                </select>
                <input required type="number" min="0" className={`${inputCls} flex-1`} value={form.basePrice} onChange={e => set('basePrice', e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
              <textarea rows={3} className={`${inputCls} resize-none`} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the package…" />
            </div>
          </div>
        </section>

        {/* Images */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-4 text-sm font-semibold text-gray-900">Images</p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Cover image</label>
              <input type="file" accept="image/*" className={inputCls} onChange={handleCoverChange} />
              {coverPreview && (
                <div className="relative mt-2 overflow-hidden rounded-lg border border-gray-200">
                  <img src={coverPreview} alt="Cover preview" className="h-36 w-full object-cover" />
                  <button type="button" onClick={() => { URL.revokeObjectURL(coverPreview); setCoverFile(null); setCoverPreview(null) }}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Gallery (up to 10)</label>
              <input type="file" accept="image/*" multiple className={inputCls} onChange={handleGalleryChange} />
              {galleryPreviews.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {galleryPreviews.map((src, idx) => (
                    <div key={idx} className="relative overflow-hidden rounded-lg border border-gray-200">
                      <img src={src} alt="" className="h-20 w-full object-cover" />
                      <button type="button" onClick={() => removeGalleryItem(idx)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Inclusions */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-gray-900">Inclusions</p>
          <div className="space-y-2">
            {form.inclusions.map((inc, i) => (
              <div key={i} className="flex gap-2">
                <input className={`${inputCls} flex-1`} value={inc} onChange={e => handleListChange('inclusions', i, e.target.value)} placeholder="e.g. Breakfast included" />
                {form.inclusions.length > 1 && <button type="button" onClick={() => removeListItem('inclusions', i)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={15} /></button>}
              </div>
            ))}
            <button type="button" onClick={() => addListItem('inclusions')} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"><Plus size={14} /> Add inclusion</button>
          </div>
        </section>

        {/* Exclusions */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-gray-900">Exclusions</p>
          <div className="space-y-2">
            {form.exclusions.map((exc, i) => (
              <div key={i} className="flex gap-2">
                <input className={`${inputCls} flex-1`} value={exc} onChange={e => handleListChange('exclusions', i, e.target.value)} placeholder="e.g. Flights not included" />
                {form.exclusions.length > 1 && <button type="button" onClick={() => removeListItem('exclusions', i)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={15} /></button>}
              </div>
            ))}
            <button type="button" onClick={() => addListItem('exclusions')} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"><Plus size={14} /> Add exclusion</button>
          </div>
        </section>

        {/* Important notes */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-1 text-sm font-semibold text-gray-900">Important notes</p>
          <p className="mb-3 text-xs text-gray-500">Shown to travelers (e.g. visa requirements, health advisories).</p>
          <div className="space-y-2">
            {form.importantNotes.map((note, i) => (
              <div key={i} className="flex gap-2">
                <input className={`${inputCls} flex-1`} value={note} onChange={e => handleListChange('importantNotes', i, e.target.value)} placeholder="e.g. Valid passport required" />
                {form.importantNotes.length > 1 && <button type="button" onClick={() => removeListItem('importantNotes', i)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={15} /></button>}
              </div>
            ))}
            <button type="button" onClick={() => addListItem('importantNotes')} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"><Plus size={14} /> Add note</button>
          </div>
        </section>

        {/* Itinerary */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-gray-900">Itinerary</p>
          <div className="space-y-3">
            {form.itinerary.map((day, di) => (
              <div key={di} className="overflow-hidden rounded-xl border border-gray-200">
                <div className="flex cursor-pointer select-none items-center justify-between bg-gray-50 px-4 py-3" onClick={() => toggleDay(di)}>
                  <span className="text-sm font-semibold text-gray-700">
                    Day {day.day}{day.title ? ` — ${day.title}` : ''}
                    {day.events?.length > 0 && <span className="ml-2 text-xs font-normal text-gray-400">{day.events.length} event(s)</span>}
                  </span>
                  <div className="flex items-center gap-2">
                    {form.itinerary.length > 1 && (
                      <button type="button" onClick={e => { e.stopPropagation(); removeDay(di) }} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    )}
                    {expandedDays[di] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {expandedDays[di] && (
                  <div className="space-y-3 p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Day title</label>
                        <input className={inputCls} value={day.title} onChange={e => updateDay(di, 'title', e.target.value)} placeholder="e.g. Arrival & City Tour" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Date</label>
                        <input type="date" className={inputCls}
                          value={day.dateSuffix ? (() => { const d = new Date(`${day.dateSuffix} ${new Date().getFullYear()}`); return isNaN(d) ? '' : d.toISOString().split('T')[0] })() : ''}
                          onChange={e => {
                            if (!e.target.value) { updateDay(di, 'dateSuffix', ''); return }
                            updateDay(di, 'dateSuffix', new Date(e.target.value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }))
                          }}
                        />
                        {day.dateSuffix && <p className="mt-1 text-xs text-gray-400">{day.dateSuffix}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Day description</label>
                      <textarea rows={2} className={`${inputCls} resize-none`} value={day.description} onChange={e => updateDay(di, 'description', e.target.value)} placeholder="Overview of the day…" />
                    </div>

                    {day.events?.map((ev, ei) => (
                      <div key={ei} className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-600">Event {ei + 1}</span>
                          <button type="button" onClick={() => removeEvent(di, ei)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Title</label>
                            <input className={inputCls} value={ev.title} onChange={e => updateEvent(di, ei, 'title', e.target.value)} placeholder="Event title" />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Type</label>
                            <select className={inputCls} value={ev.type} onChange={e => updateEvent(di, ei, 'type', e.target.value)}>
                              {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Start time</label>
                            <input type="time" className={inputCls} value={ev.startTime} onChange={e => updateEvent(di, ei, 'startTime', e.target.value)} />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">End time</label>
                            <input type="time" className={inputCls} value={ev.endTime} onChange={e => updateEvent(di, ei, 'endTime', e.target.value)} />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Location</label>
                            <input className={inputCls} value={ev.location} onChange={e => updateEvent(di, ei, 'location', e.target.value)} placeholder="Location" />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Vendor</label>
                            <div className="flex gap-1">
                              <select className={`${inputCls} flex-1`} value={ev.vendor?._id || ev.vendor || ''} onChange={e => updateEvent(di, ei, 'vendor', e.target.value)}>
                                <option value="">None</option>
                                {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                              </select>
                              <button type="button" onClick={() => setIsVendorModalOpen(true)} className="rounded-lg border border-gray-200 bg-white px-2 text-xs text-primary-600 hover:bg-primary-50">+</button>
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs text-gray-500">Description</label>
                            <textarea rows={2} className={`${inputCls} resize-none`} value={ev.description} onChange={e => updateEvent(di, ei, 'description', e.target.value)} placeholder="Event details…" />
                          </div>

                          {ev.type === 'Activity' && (
                            <div className="flex items-center gap-2">
                              <input type="checkbox" id={`chargeable-${di}-${ei}`} checked={ev.extraChargeable || false}
                                onChange={e => updateEvent(di, ei, 'extraChargeable', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                              <label htmlFor={`chargeable-${di}-${ei}`} className="text-xs text-gray-600">Extra chargeable</label>
                            </div>
                          )}

                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs text-gray-500">Event image</label>
                            <input type="file" accept="image/*" className={inputCls}
                              onChange={e => handleEventImageUpload(di, ei, e.target.files[0])} />
                            {uploadingEvent === `${di}-${ei}` && <p className="mt-1 text-xs text-gray-400">Uploading…</p>}
                            {ev.image && (
                              <div className="relative mt-2 overflow-hidden rounded-lg border border-gray-200">
                                <img src={fullImgUrl(ev.image)} alt="Event" className="h-28 w-full object-cover" />
                                <button type="button" onClick={() => updateEvent(di, ei, 'image', '')}
                                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
                                  <X size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    <button type="button" onClick={() => addEvent(di)} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
                      <Plus size={14} /> Add event
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={addDay} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
              <Plus size={14} /> Add day
            </button>
          </div>
        </section>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/agency/packages')}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50">
            {submitting && <Loader size="sm" color="white" />}
            {submitting ? 'Cloning…' : 'Clone package'}
          </button>
        </div>
      </form>

      <VendorFormModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        onSubmit={handleVendorSubmit}
        loading={creatingVendor}
      />
    </div>
  )
}
