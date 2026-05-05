import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, ChevronDown, ChevronUp, ArrowLeft, X, AlertCircle } from 'lucide-react'
import {
  getPackageById,
  updatePackage,
  updatePackageCover,
  updatePackageGallery,
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

const inputCls = (hasErr) =>
  `w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 bg-white transition ${
    hasErr
      ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-200 focus:border-primary-400 focus:ring-primary-200'
  }`

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-500">
      <AlertCircle className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      {msg}
    </p>
  )
}

const fullImgUrl = (p) => {
  if (!p) return null
  if (p.startsWith('http') || p.startsWith('blob:')) return p
  return `${BASE_URL}/${String(p).replace(/^\//, '')}`
}

export default function EditPackage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [form, setForm] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [expandedDays, setExpandedDays] = useState({ 0: true })
  const [uploadingEvent, setUploadingEvent] = useState(null)
  const [vendors, setVendors] = useState([])
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false)
  const [creatingVendor, setCreatingVendor] = useState(false)
  const [errors, setErrors] = useState({})

  // ── Image state ────────────────────────────────────────────────────────────
  const coverInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const [existingCover, setExistingCover] = useState(null)
  const [existingGallery, setExistingGallery] = useState([])
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [galleryFiles, setGalleryFiles] = useState([])
  const [galleryPreviews, setGalleryPreviews] = useState([])
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)

  const clearErr = (key) => setErrors(e => { const n = { ...e }; delete n[key]; return n })

  const validate = (f) => {
    const e = {}
    if (!f.title.trim()) e.title = 'Package title is required'
    if (!f.destination.trim()) e.destination = 'Destination is required'
    if (!f.startDate) e.startDate = 'Start date is required'
    if (!f.endDate) e.endDate = 'End date is required'
    else if (f.startDate && f.endDate <= f.startDate) e.endDate = 'End date must be after start date'
    if (!f.basePrice || Number(f.basePrice) <= 0) e.basePrice = 'Price must be greater than ₹0'
    if (!existingCover && !coverFile) e.coverImage = 'Cover image is required'
    if (!existingGallery.length && galleryFiles.length < 1) e.gallery = 'At least 1 gallery photo is required'
    const totalImages = existingGallery.length + galleryFiles.length
    if (totalImages > 10) e.gallery = 'Maximum 10 gallery photos allowed'
    f.itinerary.forEach((day, i) => {
      if (!day.title?.trim()) e[`day_${i}_title`] = `Day ${day.day} title is required`
      if (!day.description?.trim()) e[`day_${i}_desc`] = `Day ${day.day} description is required`
      ;(day.events || []).forEach((ev, ei) => {
        if (!ev.title?.trim()) e[`ev_${i}_${ei}_title`] = 'Event title is required'
        if (!ev.startTime) e[`ev_${i}_${ei}_startTime`] = 'Start time is required'
        if (!ev.endTime) e[`ev_${i}_${ei}_endTime`] = 'End time is required'
        else if (ev.startTime && ev.endTime && ev.endTime <= ev.startTime) e[`ev_${i}_${ei}_endTime`] = 'End time must be after start time'
        if (!ev.description?.trim()) e[`ev_${i}_${ei}_desc`] = 'Event description is required'
        if (!ev.image) e[`ev_${i}_${ei}_image`] = 'Event image is required'
      })
    })
    return e
  }

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
    clearErr('coverImage')
  }

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files)
    const totalImages = existingGallery.length + files.length
    if (totalImages > 10) {
      toast.error(`Maximum 10 images allowed. You have ${existingGallery.length} existing images.`)
      return
    }
    galleryPreviews.forEach(p => URL.revokeObjectURL(p))
    setGalleryFiles(files)
    setGalleryPreviews(files.map(f => URL.createObjectURL(f)))
    clearErr('gallery')
  }

  const removeNewGalleryItem = (idx) => {
    URL.revokeObjectURL(galleryPreviews[idx])
    setGalleryFiles(f => f.filter((_, i) => i !== idx))
    setGalleryPreviews(p => p.filter((_, i) => i !== idx))
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [pkgRes, vendorRes] = await Promise.all([getPackageById(id), listVendors()])
        const pkg = pkgRes.data?.data?.package || pkgRes.data?.data
        setVendors(vendorRes.data?.data?.vendors || [])
        setExistingCover(pkg.coverImage || null)
        setExistingGallery(pkg.images || [])
        setForm({
          title: pkg.title || '',
          description: pkg.description || '',
          destination: pkg.destination || '',
          totalDays: pkg.totalDays || '',
          basePrice: pkg.basePrice || '',
          currency: pkg.currency || 'INR',
          maxCapacity: pkg.maxCapacity || '50',
          startDate: pkg.startDate ? new Date(pkg.startDate).toISOString().split('T')[0] : '',
          endDate: pkg.endDate ? new Date(pkg.endDate).toISOString().split('T')[0] : '',
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

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const todayStr = new Date().toISOString().split('T')[0]

  const rebuildItinerary = (startDate, endDate, existingItinerary) => {
    if (!startDate || !endDate) return existingItinerary
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end < start) return existingItinerary
    const days = Math.round((end - start) / 86400000) + 1
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(start)
      date.setDate(date.getDate() + i)
      const dateSuffix = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      const existing = existingItinerary[i]
      return existing
        ? { ...existing, day: i + 1, dateSuffix }
        : { ...emptyDay(i + 1), dateSuffix }
    })
  }

  const handleStartDateChange = (dateStr) => {
    setForm(f => {
      // If new start date is after end date, update end date to be same as start date
      let newEndDate = f.endDate
      if (dateStr && f.endDate && new Date(dateStr) > new Date(f.endDate)) {
        newEndDate = dateStr
      }
      const newItinerary = rebuildItinerary(dateStr, newEndDate, f.itinerary)
      const totalDays = newItinerary.length > 0 ? String(newItinerary.length) : f.totalDays
      return { ...f, startDate: dateStr, endDate: newEndDate, itinerary: newItinerary, totalDays }
    })
  }

  const handleEndDateChange = (dateStr) => {
    setForm(f => {
      const newItinerary = rebuildItinerary(f.startDate, dateStr, f.itinerary)
      const totalDays = newItinerary.length > 0 ? String(newItinerary.length) : f.totalDays
      return { ...f, endDate: dateStr, itinerary: newItinerary, totalDays }
    })
  }
  const handleListChange = (field, idx, value) => { const arr = [...form[field]]; arr[idx] = value; set(field, arr) }
  const addListItem = (field) => set(field, [...form[field], ''])
  const removeListItem = (field, idx) => set(field, form[field].filter((_, i) => i !== idx))

  const handleListKeyDown = (e, field, idx) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    e.stopPropagation()
    if (idx === form[field].length - 1) {
      set(field, [...form[field], ''])
      setTimeout(() => {
        const inputs = document.querySelectorAll(`[data-list="${field}"]`)
        if (inputs[idx + 1]) inputs[idx + 1].focus()
      }, 0)
    } else {
      const inputs = document.querySelectorAll(`[data-list="${field}"]`)
      if (inputs[idx + 1]) inputs[idx + 1].focus()
    }
  }

  const updateDay = (di, key, value) => setForm(f => { const arr = [...f.itinerary]; arr[di] = { ...arr[di], [key]: value }; return { ...f, itinerary: arr } })
  const addDay = () => setForm(f => {
    const newDayIndex = f.itinerary.length
    let dateSuffix = ''
    if (f.startDate) {
      const date = new Date(f.startDate)
      date.setDate(date.getDate() + newDayIndex)
      dateSuffix = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    }
    const arr = [...f.itinerary, { ...emptyDay(f.itinerary.length + 1), dateSuffix }]
    setExpandedDays(e => ({ ...e, [f.itinerary.length]: true }))
    return { ...f, itinerary: arr }
  })
  const removeDay = (di) => setForm(f => { const arr = f.itinerary.filter((_, i) => i !== di).map((d, i) => ({ ...d, day: i + 1 })); return { ...f, itinerary: arr } })

  const addEvent = (di) => setForm(f => { const arr = [...f.itinerary]; arr[di] = { ...arr[di], events: [...(arr[di].events || []), emptyEvent()] }; return { ...f, itinerary: arr } })
  const updateEvent = (di, ei, key, value) => setForm(f => { const arr = [...f.itinerary]; const evs = [...(arr[di].events || [])]; evs[ei] = { ...evs[ei], [key]: value }; arr[di] = { ...arr[di], events: evs }; return { ...f, itinerary: arr } })
  const removeEvent = (di, ei) => setForm(f => { const arr = [...f.itinerary]; arr[di] = { ...arr[di], events: arr[di].events.filter((_, i) => i !== ei) }; return { ...f, itinerary: arr } })

  const handleEventImageSelect = (di, ei, file) => {
    if (!file) return
    const localUrl = URL.createObjectURL(file)
    updateEvent(di, ei, 'imageFile', file)
    updateEvent(di, ei, 'image', localUrl)
    clearErr(`ev_${di}_${ei}_image`)
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
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      // Auto-expand days with errors
      const newExpanded = { ...expandedDays }
      form.itinerary.forEach((_, i) => {
        if (errs[`day_${i}_title`] || errs[`day_${i}_desc`] ||
            Object.keys(errs).some(k => k.startsWith(`ev_${i}_`))) {
          newExpanded[i] = true
        }
      })
      setExpandedDays(newExpanded)
      toast.error('Please fix the errors before saving')
      setTimeout(() => {
        const el = document.querySelector('[data-error="true"]')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      // Upload any pending event images first
      const itinerary = form.itinerary.map(d => ({ ...d, events: [...(d.events || [])] }))
      for (let di = 0; di < itinerary.length; di++) {
        for (let ei = 0; ei < itinerary[di].events.length; ei++) {
          const ev = itinerary[di].events[ei]
          if (ev.imageFile) {
            setUploadingEvent(`${di}-${ei}`)
            try {
              const fd = new FormData(); fd.append('eventImage', ev.imageFile)
              const res = await uploadEventImage(fd)
              const serverUrl = res.data?.data?.url || res.data?.data?.imageUrl || ''
              if (serverUrl) {
                itinerary[di].events[ei] = { ...ev, image: serverUrl, imageFile: undefined }
              }
            } catch (err) {
              toast.error(`Event ${ei + 1} image upload failed: ${getApiErrorMessage(err)}`)
              setSubmitting(false); setUploadingEvent(null); return
            }
          }
        }
      }
      setUploadingEvent(null)
      const payload = {
        title: form.title, description: form.description, destination: form.destination,
        totalDays: Number(form.totalDays), basePrice: Number(form.basePrice),
        currency: form.currency, maxCapacity: Number(form.maxCapacity),
        inclusions: form.inclusions.filter(Boolean), exclusions: form.exclusions.filter(Boolean),
        importantNotes: form.importantNotes.filter(Boolean),
        itinerary: formItineraryToApi(itinerary),
        ...(form.startDate && { startDate: form.startDate }),
        ...(form.endDate && { endDate: form.endDate }),
      }
      await updatePackage(id, payload)

      // Upload cover if changed
      if (coverFile) {
        setUploadingCover(true)
        try {
          const fd = new FormData(); fd.append('coverImage', coverFile)
          const res = await updatePackageCover(id, fd)
          const newCover = res.data?.data?.package?.coverImage || res.data?.data?.coverImage
          if (newCover) setExistingCover(newCover)
          setCoverFile(null); if (coverPreview) { URL.revokeObjectURL(coverPreview); setCoverPreview(null) }
        } finally { setUploadingCover(false) }
      }

      // Upload gallery if new files selected
      if (galleryFiles.length > 0) {
        setUploadingGallery(true)
        try {
          const fd = new FormData(); galleryFiles.forEach(f => fd.append('gallery', f))
          const res = await updatePackageGallery(id, fd)
          const newGallery = res.data?.data?.package?.images || res.data?.data?.images
          if (newGallery) setExistingGallery(newGallery)
          galleryPreviews.forEach(p => URL.revokeObjectURL(p))
          setGalleryFiles([]); setGalleryPreviews([])
        } finally { setUploadingGallery(false) }
      }

      toast.success('Package updated')
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
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">Edit package</h1>
          <p className="text-sm text-gray-500">Update the details of your travel package.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basic info */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-4 text-sm font-semibold text-gray-900">Basic info</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Title <span className="text-red-500">*</span></label>
              <input
                className={inputCls(!!errors.title)} value={form.title}
                onChange={e => { set('title', e.target.value); clearErr('title') }}
                placeholder="Package title" data-error={!!errors.title}
              />
              <FieldError msg={errors.title} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Destination <span className="text-red-500">*</span></label>
              <input
                className={inputCls(!!errors.destination)} value={form.destination}
                onChange={e => { set('destination', e.target.value); clearErr('destination') }}
                placeholder="e.g. Goa, India" data-error={!!errors.destination}
              />
              <FieldError msg={errors.destination} />
            </div>

            {/* Start date */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Start date <span className="text-red-500">*</span></label>
              <input
                type="date"
                className={inputCls(!!errors.startDate)}
                value={form.startDate}
                onChange={e => { handleStartDateChange(e.target.value); clearErr('startDate'); clearErr('endDate') }}
                data-error={!!errors.startDate}
              />
              <FieldError msg={errors.startDate} />
            </div>

            {/* End date */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">End date <span className="text-red-500">*</span></label>
              <input
                type="date"
                className={inputCls(!!errors.endDate)}
                value={form.endDate}
                min={form.startDate ? (() => { const d = new Date(form.startDate); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })() : todayStr}
                onChange={e => { handleEndDateChange(e.target.value); clearErr('endDate') }}
                data-error={!!errors.endDate}
              />
              <FieldError msg={errors.endDate} />
              {form.startDate && form.endDate && !errors.endDate && form.totalDays && (
                <p className="mt-1 text-xs text-primary-600 font-medium">
                  {form.totalDays} day{Number(form.totalDays) > 1 ? 's' : ''} · {new Date(form.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – {new Date(form.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Max capacity</label>
              <input type="number" min="1" className={inputCls(false)} value={form.maxCapacity} onChange={e => set('maxCapacity', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Base price incl. GST <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <select className={`${inputCls(false)} !w-24`} value={form.currency} onChange={e => set('currency', e.target.value)}>
                  <option>INR</option><option>USD</option><option>EUR</option>
                </select>
                <input
                  type="number" min="0"
                  className={`${inputCls(!!errors.basePrice)} flex-1`}
                  value={form.basePrice}
                  onChange={e => { set('basePrice', e.target.value); clearErr('basePrice') }}
                  placeholder="0" data-error={!!errors.basePrice}
                />
              </div>
              <FieldError msg={errors.basePrice} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
              <textarea rows={3} className={`${inputCls(false)} resize-none`} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the package…" />
            </div>
          </div>
        </section>

        {/* Images */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-4 text-sm font-semibold text-gray-900">Images</p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

            {/* Cover image */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Cover image <span className="text-red-500">*</span>
              </label>
              <label
                data-error={!!errors.coverImage}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  errors.coverImage
                    ? 'border-red-400 bg-red-50 text-red-500'
                    : coverFile
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-gray-400 hover:bg-white'
                }`}
              >
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
                  onChange={handleCoverChange} />
                {coverFile ? `✓ ${coverFile.name}` : existingCover ? 'Click to replace cover' : 'Click to upload cover image'}
              </label>
              <FieldError msg={errors.coverImage} />
              {/* Preview — new file takes priority over existing */}
              {(coverPreview || existingCover) && (
                <div className="relative mt-2 overflow-hidden rounded-lg border border-gray-200">
                  <img
                    src={coverPreview || fullImgUrl(existingCover)}
                    alt="Cover"
                    className="h-36 w-full object-cover"
                  />
                  {coverFile && (
                    <button type="button"
                      onClick={() => { URL.revokeObjectURL(coverPreview); setCoverFile(null); setCoverPreview(null) }}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
                      <X size={12} />
                    </button>
                  )}
                  {coverFile && <span className="absolute bottom-1.5 left-1.5 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">New</span>}
                </div>
              )}
            </div>

            {/* Gallery */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Gallery <span className="text-red-500">*</span> <span className="text-gray-400 font-normal">(min 1)</span>
              </label>
              <label
                data-error={!!errors.gallery}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  errors.gallery
                    ? 'border-red-400 bg-red-50 text-red-500'
                    : galleryFiles.length > 0
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-gray-400 hover:bg-white'
                }`}
              >
                <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={handleGalleryChange} />
                {galleryFiles.length > 0
                  ? `✓ ${galleryFiles.length} new photo${galleryFiles.length > 1 ? 's' : ''} selected`
                  : existingGallery.length > 0
                  ? `${existingGallery.length} photo${existingGallery.length > 1 ? 's' : ''} — click to replace all`
                  : 'Click to upload gallery photos'}
              </label>
              <FieldError msg={errors.gallery} />

              {/* New gallery previews */}
              {galleryPreviews.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">New photos (will replace existing)</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {galleryPreviews.map((src, idx) => (
                      <div key={idx} className="relative overflow-hidden rounded-lg border border-gray-200">
                        <img src={src} alt="" className="h-20 w-full object-cover" />
                        <button type="button" onClick={() => removeNewGalleryItem(idx)}
                          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing gallery (shown when no new files selected) */}
              {galleryFiles.length === 0 && existingGallery.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {existingGallery.map((src, idx) => (
                    <div key={idx} className="relative overflow-hidden rounded-lg border border-gray-200">
                      <img src={fullImgUrl(src)} alt="" className="h-20 w-full object-cover" />
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
                <input className={`${inputCls(false)} flex-1`} value={inc} data-list="inclusions" onChange={e => handleListChange('inclusions', i, e.target.value)} onKeyDown={e => handleListKeyDown(e, 'inclusions', i)} placeholder="e.g. Breakfast included" />
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
                <input className={`${inputCls(false)} flex-1`} value={exc} data-list="exclusions" onChange={e => handleListChange('exclusions', i, e.target.value)} onKeyDown={e => handleListKeyDown(e, 'exclusions', i)} placeholder="e.g. Flights not included" />
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
                <input className={`${inputCls(false)} flex-1`} value={note} data-list="importantNotes" onChange={e => handleListChange('importantNotes', i, e.target.value)} onKeyDown={e => handleListKeyDown(e, 'importantNotes', i)} placeholder="e.g. Valid passport required" />
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
                    {(!day.title?.trim() || !day.description?.trim()) && (
                      <span className="ml-2 text-[10px] font-semibold text-red-400">· missing info</span>
                    )}
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
                        <label className="mb-1 block text-xs font-medium text-gray-600">Day title <span className="text-red-500">*</span></label>
                        <input
                          className={inputCls(!!errors[`day_${di}_title`])}
                          value={day.title}
                          onChange={e => { updateDay(di, 'title', e.target.value); clearErr(`day_${di}_title`) }}
                          placeholder="e.g. Arrival & City Tour"
                          data-error={!!errors[`day_${di}_title`]}
                        />
                        <FieldError msg={errors[`day_${di}_title`]} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Date {form.startDate ? <span className="text-primary-500">(auto)</span> : ''}
                        </label>
                        {form.startDate ? (
                          <div className={`${inputCls(false)} bg-gray-50 text-gray-600 cursor-default`}>
                            {day.dateSuffix || '—'}
                          </div>
                        ) : (
                          <input
                            type="date" className={inputCls(false)}
                            value={day.dateSuffix ? (() => { const d = new Date(`${day.dateSuffix} ${new Date().getFullYear()}`); return isNaN(d) ? '' : d.toISOString().split('T')[0] })() : ''}
                            onChange={e => {
                              if (!e.target.value) { updateDay(di, 'dateSuffix', ''); return }
                              updateDay(di, 'dateSuffix', new Date(e.target.value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }))
                            }}
                          />
                        )}
                        {day.dateSuffix && !form.startDate && <p className="mt-1 text-xs text-gray-400">{day.dateSuffix}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Day description <span className="text-red-500">*</span></label>
                      <textarea
                        rows={2}
                        className={`${inputCls(!!errors[`day_${di}_desc`])} resize-none`}
                        value={day.description}
                        onChange={e => { updateDay(di, 'description', e.target.value); clearErr(`day_${di}_desc`) }}
                        placeholder="Overview of the day…"
                        data-error={!!errors[`day_${di}_desc`]}
                      />
                      <FieldError msg={errors[`day_${di}_desc`]} />
                    </div>

                    {day.events?.map((ev, ei) => (
                      <div key={ei} className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-600">Event {ei + 1}</span>
                          <button type="button" onClick={() => removeEvent(di, ei)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Title <span className="text-red-500">*</span></label>
                            <input
                              className={inputCls(!!errors[`ev_${di}_${ei}_title`])}
                              value={ev.title}
                              onChange={e => { updateEvent(di, ei, 'title', e.target.value); clearErr(`ev_${di}_${ei}_title`) }}
                              placeholder="Event title"
                              data-error={!!errors[`ev_${di}_${ei}_title`]}
                            />
                            <FieldError msg={errors[`ev_${di}_${ei}_title`]} />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Type</label>
                            <select className={inputCls(false)} value={ev.type} onChange={e => updateEvent(di, ei, 'type', e.target.value)}>
                              {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Start time <span className="text-red-500">*</span></label>
                            <input
                              type="time"
                              className={inputCls(!!errors[`ev_${di}_${ei}_startTime`])}
                              value={ev.startTime}
                              onChange={e => { updateEvent(di, ei, 'startTime', e.target.value); clearErr(`ev_${di}_${ei}_startTime`); clearErr(`ev_${di}_${ei}_endTime`) }}
                              data-error={!!errors[`ev_${di}_${ei}_startTime`]}
                            />
                            <FieldError msg={errors[`ev_${di}_${ei}_startTime`]} />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">End time <span className="text-red-500">*</span></label>
                            <input
                              type="time"
                              className={inputCls(!!errors[`ev_${di}_${ei}_endTime`])}
                              value={ev.endTime}
                              onChange={e => { updateEvent(di, ei, 'endTime', e.target.value); clearErr(`ev_${di}_${ei}_endTime`) }}
                              data-error={!!errors[`ev_${di}_${ei}_endTime`]}
                            />
                            <FieldError msg={errors[`ev_${di}_${ei}_endTime`]} />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Location</label>
                            <input className={inputCls(false)} value={ev.location} onChange={e => updateEvent(di, ei, 'location', e.target.value)} placeholder="Location" />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Vendor</label>
                            <div className="flex gap-1">
                              <select className={`${inputCls(false)} flex-1`} value={ev.vendor?._id || ev.vendor || ''} onChange={e => updateEvent(di, ei, 'vendor', e.target.value)}>
                                <option value="">None</option>
                                {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                              </select>
                              <button type="button" onClick={() => setIsVendorModalOpen(true)} className="rounded-lg border border-gray-200 bg-white px-2 text-xs text-primary-600 hover:bg-primary-50">+</button>
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs text-gray-500">Description <span className="text-red-500">*</span></label>
                            <textarea
                              rows={2}
                              className={`${inputCls(!!errors[`ev_${di}_${ei}_desc`])} resize-none`}
                              value={ev.description}
                              onChange={e => { updateEvent(di, ei, 'description', e.target.value); clearErr(`ev_${di}_${ei}_desc`) }}
                              placeholder="Event details…"
                              data-error={!!errors[`ev_${di}_${ei}_desc`]}
                            />
                            <FieldError msg={errors[`ev_${di}_${ei}_desc`]} />
                          </div>

                          {/* Extra chargeable — Activity only */}
                          {ev.type === 'Activity' && (
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`chargeable-${di}-${ei}`}
                                checked={ev.extraChargeable || false}
                                onChange={e => updateEvent(di, ei, 'extraChargeable', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary-600"
                              />
                              <label htmlFor={`chargeable-${di}-${ei}`} className="text-xs text-gray-600">Extra chargeable</label>
                            </div>
                          )}

                          {/* Event image with preview */}
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs text-gray-500">
                              Event image <span className="text-red-500">*</span>
                            </label>
                            <label
                              data-error={!!errors[`ev_${di}_${ei}_image`]}
                              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                                errors[`ev_${di}_${ei}_image`]
                                  ? 'border-red-400 bg-red-50 text-red-500'
                                  : ev.image
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                  : 'border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-gray-400 hover:bg-white'
                              }`}
                            >
                              <input
                                type="file" accept="image/*" className="hidden"
                                onChange={e => handleEventImageSelect(di, ei, e.target.files[0])}
                              />
                              {ev.image ? 'Image selected — click to change' : 'Click to upload event image'}
                            </label>
                            <FieldError msg={errors[`ev_${di}_${ei}_image`]} />
                            {submitting && uploadingEvent === `${di}-${ei}` && <p className="mt-1 text-xs text-primary-500">Uploading image…</p>}
                            {ev.image && (
                              <div className="relative mt-2 overflow-hidden rounded-lg border border-gray-200">
                                <img src={fullImgUrl(ev.image)} alt="Event" className="h-28 _w-full object-contain" />
                                <button
                                  type="button"
                                  onClick={() => { updateEvent(di, ei, 'image', ''); updateEvent(di, ei, 'imageFile', null); clearErr(`ev_${di}_${ei}_image`) }}
                                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                                >
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
            {submitting ? 'Saving…' : 'Save changes'}
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
