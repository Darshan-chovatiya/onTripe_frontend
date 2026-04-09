import { useState } from 'react'
import { MapPin, Clock, IndianRupee, Sparkles, Tag, Pencil, Eye, Users, CalendarDays } from 'lucide-react'
import { packageCoverUrl } from '@/travelAgency/childAgency/components/packageMedia.js'
import PackageDetailModal from '@/travelAgency/childAgency/components/PackageDetailModal.jsx'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=600'

export default function AvailablePackageCard({ pkg, existingWhitelabel, onCreateWhiteLabel, onEditWhiteLabel, disabled = false }) {
  const coverSrc = packageCoverUrl(pkg.coverImage) || PLACEHOLDER
  const [detailOpen, setDetailOpen] = useState(false)

  return (
    <article className={`group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
      disabled ? 'opacity-60 ring-gray-200' : 'ring-gray-200 hover:ring-primary-200'
    }`}>
      {/* Cover */}
      <div className="relative h-44 overflow-hidden bg-gray-100">
        <img
          src={coverSrc}
          alt={pkg.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {disabled && (
          <div className="absolute right-2 top-2 rounded-full bg-gray-900/70 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            Parent inactive
          </div>
        )}

        {/* Price badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-0.5 rounded-xl bg-white/95 px-2.5 py-1.5 shadow-sm backdrop-blur-sm">
          <IndianRupee className="h-3.5 w-3.5 text-primary-700" strokeWidth={2.5} />
          <span className="text-sm font-bold tabular-nums text-primary-900">{Number(pkg.basePrice).toLocaleString('en-IN')}</span>
          <span className="ml-1 text-[10px] text-gray-500">{pkg.currency || 'INR'}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-1 text-sm font-semibold text-gray-900">{pkg.title}</h3>
          {pkg.destination && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
              {pkg.destination}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {pkg.totalDays != null && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-gray-100">
              <Clock className="h-3 w-3 text-primary-500" strokeWidth={2} />{pkg.totalDays}d
            </span>
          )}
          {pkg.maxCapacity != null && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-gray-100">
              <Users className="h-3 w-3 text-primary-500" strokeWidth={2} />{pkg.maxCapacity} pax
            </span>
          )}
          {pkg.itinerary?.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2 py-1 text-[11px] font-medium text-primary-700 ring-1 ring-primary-100">
              <CalendarDays className="h-3 w-3" strokeWidth={2} />{pkg.itinerary.length} days
            </span>
          )}
        </div>

        {pkg.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">{pkg.description}</p>
        )}

        {existingWhitelabel && (
          <div className="rounded-lg border border-primary-100 bg-primary-50/60 px-3 py-2 text-xs text-primary-800">
            <span className="font-semibold">Your offer:</span> {existingWhitelabel.customTitle || 'White-label created'}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-auto space-y-2 border-t border-gray-100 p-3">
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2 text-xs font-medium text-gray-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800"
        >
          <Eye className="h-3.5 w-3.5" strokeWidth={2} />
          View details
        </button>

        {!disabled && (
          existingWhitelabel ? (
            <button
              type="button"
              onClick={() => onEditWhiteLabel(existingWhitelabel)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary-600 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
              Edit white-label
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onCreateWhiteLabel(pkg)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary-600 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
            >
              <Tag className="h-3.5 w-3.5" strokeWidth={2} />
              Create white-label
            </button>
          )
        )}

        {disabled && (
          <p className="text-center text-[11px] text-gray-400">Actions disabled — parent is inactive.</p>
        )}
      </div>

      <PackageDetailModal isOpen={detailOpen} onClose={() => setDetailOpen(false)} pkg={pkg} />
    </article>
  )
}
