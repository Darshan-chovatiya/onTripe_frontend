import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Clock, Users, IndianRupee, Image,
  CheckCircle2, XCircle, CalendarDays, Clock3, MapPinned,
  Layers, Edit2, ImagePlus, Store
} from 'lucide-react'
import { listMyPackages } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

const BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const imgUrl = (path) => path ? `${BASE}/${path.replace(/\\/g, '/')}` : null

const EVENT_TYPE_COLORS = {
  activity: 'bg-blue-50 text-blue-700',
  hotel_checkin: 'bg-green-50 text-green-700',
  hotel_checkout: 'bg-orange-50 text-orange-700',
  transfer: 'bg-purple-50 text-purple-700',
  meal: 'bg-yellow-50 text-yellow-700',
  other: 'bg-gray-100 text-gray-600',
}

export default function PackageDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pkg, setPkg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeDay, setActiveDay] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(null)

  useEffect(() => {
    listMyPackages()
      .then(res => {
        const found = (res.data?.data?.packages || []).find(p => p._id === id)
        if (!found) setError('Package not found')
        else setPkg(found)
      })
      .catch(err => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-64 bg-gray-200 rounded-2xl" />
      <div className="h-6 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  )

  if (error) return (
    <div className="p-6 text-center text-red-500">{error}</div>
  )

  const cover = imgUrl(pkg.coverImage)
  const itinerary = pkg.itinerary || []
  const currentDay = itinerary[activeDay]

  return (
    <div className="animate-fade-in space-y-6 pb-10">

      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={16} /> Back to Packages
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/agency/parent/packages', { state: { editId: pkg._id } })}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Edit2 size={13} /> Edit
          </button>
        </div>
      </div>

      {/* Hero cover */}
      <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
        {cover
          ? <img src={cover} alt={pkg.title} className="h-full _w-full object-contain" />
          : <Image className="h-16 w-16 text-gray-300" />
        }
        {!pkg.isActive && (
          <span className="absolute top-3 right-3 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">Inactive</span>
        )}
      </div>

      {/* Title + meta */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-gray-900">{pkg.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          {pkg.destination && <span className="flex items-center gap-1.5"><MapPin size={14} />{pkg.destination}</span>}
          {pkg.totalDays && <span className="flex items-center gap-1.5"><Clock size={14} />{pkg.totalDays} days</span>}
          {pkg.maxCapacity && <span className="flex items-center gap-1.5"><Users size={14} />Max {pkg.maxCapacity} pax</span>}
          <span className="flex items-center gap-1.5 font-semibold text-gray-800">
            <IndianRupee size={14} />{Number(pkg.basePrice).toLocaleString('en-IN')} {pkg.currency}
          </span>
        </div>
        {pkg.description && <p className="text-gray-600 text-sm leading-relaxed">{pkg.description}</p>}
      </div>

      {/* Gallery */}
      {pkg.images?.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2"><ImagePlus size={16} /> Gallery</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {pkg.images.map((img, i) => (
              <button key={i} onClick={() => setGalleryOpen(i)} className="flex-shrink-0">
                <img src={imgUrl(img)} alt={`gallery-${i}`} className="h-24 w-36 object-cover rounded-xl border border-gray-100 hover:opacity-90 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inclusions / Exclusions */}
      {(pkg.inclusions?.length > 0 || pkg.exclusions?.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pkg.inclusions?.length > 0 && (
            <div className="rounded-xl border border-green-100 bg-green-50 p-4">
              <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-1.5"><CheckCircle2 size={14} /> Inclusions</h3>
              <ul className="space-y-1">
                {pkg.inclusions.map((inc, i) => (
                  <li key={i} className="text-sm text-green-700 flex items-start gap-1.5">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0" />{inc}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {pkg.exclusions?.length > 0 && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-1.5"><XCircle size={14} /> Exclusions</h3>
              <ul className="space-y-1">
                {pkg.exclusions.map((exc, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-start gap-1.5">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />{exc}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Itinerary */}
      {itinerary.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2"><CalendarDays size={16} /> Itinerary</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {itinerary.map((day, i) => (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
                className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  activeDay === i
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Day {day.day}
                {day.dateSuffix && <span className="block text-xs opacity-75">{day.dateSuffix}</span>}
              </button>
            ))}
          </div>

          {currentDay && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Day {currentDay.day}{currentDay.dateSuffix ? ` · ${currentDay.dateSuffix}` : ''}
                  {currentDay.title ? ` — ${currentDay.title}` : ''}
                </h3>
                {currentDay.description && (
                  <p className="text-sm text-gray-500 mt-1">{currentDay.description}</p>
                )}
              </div>

              {/* Events */}
              {currentDay.events?.length > 0 ? (
                <div className="space-y-3">
                  {currentDay.events.map((ev, ei) => (
                    <div key={ei} className="rounded-xl border border-gray-100 overflow-hidden">
                      {/* Event image */}
                      {ev.image && (
                        <img src={imgUrl(ev.image)} alt={ev.title} className="h-40 _w-full object-contain" />
                      )}
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-gray-900 text-sm">{ev.title}</h4>
                          {ev.type && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0 ${EVENT_TYPE_COLORS[ev.type] || EVENT_TYPE_COLORS.other}`}>
                              {ev.type.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        {ev.description && <p className="text-xs text-gray-500">{ev.description}</p>}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                          {ev.startTime && <span className="flex items-center gap-1"><Clock3 size={11} />{ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}</span>}
                          {ev.duration && <span className="flex items-center gap-1"><Layers size={11} />{ev.duration}</span>}
                          {ev.location && <span className="flex items-center gap-1"><MapPinned size={11} />{ev.location}</span>}
                          {ev.vendor && (
                            <span className="flex items-center gap-1 text-indigo-500">
                              <Store size={11} />
                              {ev.vendor?.name || 'Vendor assigned'}
                              {ev.vendor?.type && ` · ${ev.vendor.type.replace('_', ' ')}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No events added for this day.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Gallery lightbox */}
      {galleryOpen !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setGalleryOpen(null)}
        >
          <img
            src={imgUrl(pkg.images[galleryOpen])}
            alt="gallery"
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
