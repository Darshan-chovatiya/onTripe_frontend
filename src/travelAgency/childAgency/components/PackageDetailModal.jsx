import { useState } from 'react'
import {
  MapPin, Clock, Users, IndianRupee, CheckCircle2, XCircle,
  CalendarDays, Image, AlertTriangle, X, ChevronLeft, ChevronRight, Phone, Mail, Building2
} from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'

const BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=1200'
const imgUrl = (path) => path ? `${BASE}/${path.replace(/\\/g, '/')}` : null

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-2.5 last:border-0 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 shrink-0">{label}</span>
      <span className="text-gray-900 text-right">{children}</span>
    </div>
  )
}

/** @param {{ pkg: Record<string, any>, isWhitelabel?: boolean }} props */
export default function PackageDetailModal({ isOpen, onClose, pkg, isWhitelabel = false }) {
  const [activeDay, setActiveDay] = useState(0)

  if (!pkg) return null

  // For whitelabel, base package info comes from originalPackage
  const base = isWhitelabel ? (pkg.originalPackage || {}) : pkg
  const title = isWhitelabel ? (pkg.customTitle || base.title || 'Package') : pkg.title
  const description = isWhitelabel ? (pkg.customDescription || base.description) : pkg.description
  const cover = imgUrl(base.coverImage)
  const itinerary = base.itinerary || []
  const currentDay = itinerary[activeDay]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl"
      footer={
        <div className="flex justify-end p-4">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-6">

        {/* Cover */}
        <div className="overflow-hidden rounded-2xl bg-gray-100 h-52">
          <img 
            src={cover || DEFAULT_COVER} 
            alt={title} 
            className="h-full w-full object-cover" 
            onError={(e) => { e.currentTarget.src = DEFAULT_COVER }}
          />
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {base.destination && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
              <MapPin className="mx-auto mb-1 h-4 w-4 text-primary-500" />
              <p className="text-xs text-gray-500">Destination</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-900 truncate">{base.destination}</p>
            </div>
          )}
          {base.totalDays != null && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
              <Clock className="mx-auto mb-1 h-4 w-4 text-primary-500" />
              <p className="text-xs text-gray-500">Duration</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-900">{base.totalDays} days</p>
            </div>
          )}
          {base.maxCapacity != null && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
              <Users className="mx-auto mb-1 h-4 w-4 text-primary-500" />
              <p className="text-xs text-gray-500">Max guests</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-900">{base.maxCapacity}</p>
            </div>
          )}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
            <IndianRupee className="mx-auto mb-1 h-4 w-4 text-primary-500" />
            <p className="text-xs text-gray-500">{isWhitelabel ? 'Your price' : 'Base price'}</p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">
              ₹{Number(isWhitelabel ? pkg.finalPrice : base.basePrice ?? 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Whitelabel markup info */}
        {isWhitelabel && (
          <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-sm space-y-1">
            <p className="font-semibold text-violet-900">White-label details</p>
            <Row label="Base price">₹{Number(pkg.parentWhitelabel?.finalPrice ?? base.basePrice ?? 0).toLocaleString('en-IN')}</Row>
            <Row label="Markup">
              {pkg.commissionType === 'percentage'
                ? `${pkg.commissionValue}%`
                : `₹${Number(pkg.commissionValue ?? 0).toLocaleString('en-IN')}`}
            </Row>
            <Row label="Final price">₹{Number(pkg.finalPrice ?? 0).toLocaleString('en-IN')}</Row>
            {/* <Row label="Visible to sub-children">{pkg.visibleToSubChildren ? 'Yes' : 'No'}</Row> */}
            <Row label="Status">{pkg.isActive ? 'Active' : 'Inactive'}</Row>
          </div>
        )}

        {/* Description */}
        {description?.trim() && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Description</p>
            <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{description.trim()}</p>
          </div>
        )}

        {/* Important notes */}
        {base.importantNotes?.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5" /> Important notes
            </p>
            <ul className="space-y-1.5">
              {base.importantNotes.map((n, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{n}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Inclusions / Exclusions */}
        {(base.inclusions?.length > 0 || base.exclusions?.length > 0) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {base.inclusions?.length > 0 && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Inclusions
                </p>
                <ul className="space-y-1.5">
                  {base.inclusions.map((inc, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-emerald-900">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />{inc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {base.exclusions?.length > 0 && (
              <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-rose-800">
                  <XCircle className="h-3.5 w-3.5" /> Exclusions
                </p>
                <ul className="space-y-1.5">
                  {base.exclusions.map((exc, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-rose-900">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />{exc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Gallery */}
        {base.images?.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Gallery</p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {base.images.map((img, i) => (
                <img key={i} src={imgUrl(img)} alt=""
                  className="h-28 w-40 shrink-0 rounded-xl object-cover ring-1 ring-gray-100" />
              ))}
            </div>
          </div>
        )}

        {/* Itinerary */}
        {itinerary.length > 0 && (
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <CalendarDays className="h-3.5 w-3.5" /> Day-by-day itinerary
            </p>
            {/* Day tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
              {itinerary.map((day, i) => (
                <button key={i} type="button" onClick={() => setActiveDay(i)}
                  className={`flex min-w-[4rem] shrink-0 flex-col items-center rounded-xl px-3 py-2 text-center transition-all ${
                    activeDay === i
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase opacity-80">Day</span>
                  <span className="text-lg font-bold leading-none">{day.day}</span>
                </button>
              ))}
            </div>

            {currentDay && (
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">
                    Day {currentDay.day}{currentDay.title ? ` — ${currentDay.title}` : ''}
                  </h4>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setActiveDay(i => Math.max(0, i - 1))}
                      disabled={activeDay === 0}
                      className="rounded-lg p-1 text-gray-400 hover:bg-gray-200 disabled:opacity-30">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setActiveDay(i => Math.min(itinerary.length - 1, i + 1))}
                      disabled={activeDay === itinerary.length - 1}
                      className="rounded-lg p-1 text-gray-400 hover:bg-gray-200 disabled:opacity-30">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {currentDay.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">{currentDay.description}</p>
                )}
                {currentDay.experiences?.length > 0 && (
                  <ul className="mt-2 space-y-2">
                    {currentDay.experiences.map((exp, ei) => (
                      <li key={ei} className="rounded-lg border border-white bg-white px-3 py-2.5 shadow-sm">
                        <p className="font-medium text-gray-900 text-sm">{exp.title}</p>
                        {exp.description && <p className="text-xs text-gray-500 mt-0.5">{exp.description}</p>}
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                          {exp.startTime && <span>{exp.startTime}{exp.endTime ? ` – ${exp.endTime}` : ''}</span>}
                          {exp.location && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{exp.location}</span>}
                          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ${exp.includedInPrice !== false
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                              : 'bg-amber-50 text-amber-700 ring-amber-100'
                            }`}>
                            {exp.includedInPrice !== false ? 'Included' : 'Extra Chargeable'}
                          </span>
                        </div>

                        {exp.vendor && typeof exp.vendor === 'object' && exp.vendor.name && (
                          <div className="mt-3 border-t border-gray-100 pt-2.5">
                            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              <Building2 size={10} /> Vendor Details
                            </p>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]">
                              <span className="font-semibold text-gray-700">
                                {exp.vendor.name}
                              </span>
                              {exp.vendor.phone && (
                                <a href={`tel:${exp.vendor.phone}`} className="flex items-center gap-1 text-primary-600 hover:underline">
                                  <Phone size={10} /> {exp.vendor.phone}
                                </a>
                              )}
                              {exp.vendor.email && (
                                <a href={`mailto:${exp.vendor.email}`} className="flex items-center gap-1 text-primary-600 hover:underline">
                                  <Mail size={10} /> {exp.vendor.email}
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </Modal>
  )
}
