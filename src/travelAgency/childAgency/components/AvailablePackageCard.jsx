import { useState, useMemo } from 'react'
import { MapPin, Clock, IndianRupee, Sparkles, Tag, Pencil, Eye, Users, CalendarDays, ShieldAlert, CheckCircle2, Ticket } from 'lucide-react'
import { packageCoverUrl } from '@/travelAgency/childAgency/components/packageMedia.js'
import PackageDetailModal from '@/travelAgency/childAgency/components/PackageDetailModal.jsx'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=600'

export default function AvailablePackageCard({ pkg, existingWhitelabel, onCreateWhiteLabel, onEditWhiteLabel, disabled = false }) {
  const isWhitelabel = pkg.sourceType === 'whitelabel'
  const displayTitle = isWhitelabel ? (pkg.customTitle || pkg.originalPackage?.title) : pkg.title
  const displayPrice = isWhitelabel ? pkg.finalPrice : pkg.basePrice
  const displayCover = isWhitelabel 
    ? (pkg.customCoverImage || pkg.originalPackage?.coverImage) 
    : pkg.coverImage
  const displayDestination = isWhitelabel ? pkg.originalPackage?.destination : pkg.destination
  const displayDays = isWhitelabel ? pkg.originalPackage?.totalDays : pkg.totalDays
  const displayPax = isWhitelabel ? pkg.originalPackage?.maxCapacity : pkg.maxCapacity
  const displayItineraryCount = isWhitelabel ? pkg.originalPackage?.itinerary?.length : pkg.itinerary?.length
  const displayDescription = isWhitelabel ? (pkg.customDescription || pkg.originalPackage?.description) : pkg.description

  const coverSrc = packageCoverUrl(displayCover) || PLACEHOLDER
  const [detailOpen, setDetailOpen] = useState(false)

  const creatorName = isWhitelabel 
    ? (pkg.createdBy?.name || 'Sub-agent') 
    : (pkg.createdBy?.name || 'Parent agent')

  const displayStartDate = isWhitelabel ? pkg.originalPackage?.startDate : pkg.startDate
  const isExpired = useMemo(() => {
    if (!displayStartDate) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(displayStartDate)
    startDate.setHours(0, 0, 0, 0)
    return startDate.getTime() < today.getTime()
  }, [displayStartDate])

  return (
    <article className={`group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
      disabled ? 'opacity-60 ring-gray-200' : 'ring-gray-200 hover:ring-primary-200'
    }`}>
      {/* Cover */}
      <div className="relative h-44 overflow-hidden bg-gray-100">
        <img
          src={coverSrc}
          alt={displayTitle}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <div className="absolute right-2 top-2 flex flex-col gap-1.5 items-end">
          {isWhitelabel && (
            <div className="rounded-full bg-violet-600/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm">
              From {creatorName}
            </div>
          )}
          {existingWhitelabel && (
            <div className="flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm">
              <CheckCircle2 className="h-3 w-3" />
              Whitelabeled
            </div>
          )}
          {disabled && (
            <div className="rounded-full bg-gray-900/70 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              Parent inactive
            </div>
          )}
          {pkg.isSuspended && (
            <div className="rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm">
              <ShieldAlert className="h-3 w-3" />
              Suspended
            </div>
          )}
        </div>

        {/* Price badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-0.5 rounded-xl bg-white/95 px-2.5 py-1.5 shadow-sm backdrop-blur-sm">
          <IndianRupee className="h-3.5 w-3.5 text-primary-700" strokeWidth={2.5} />
          <span className="text-sm font-bold tabular-nums text-primary-900">{Number(displayPrice).toLocaleString('en-IN')}</span>
          <span className="ml-1 text-[10px] text-gray-500">{pkg.currency || 'INR'}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-1 text-sm font-semibold text-gray-900">{displayTitle}</h3>
          {displayDestination && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
              {displayDestination}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {displayDays != null && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-gray-100">
              <Clock className="h-3 w-3 text-primary-500" strokeWidth={2} />{displayDays}d
            </span>
          )}
          {displayPax != null && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-gray-100">
              <Users className="h-3 w-3 text-primary-500" strokeWidth={2} />{displayPax} max
            </span>
          )}
          {displayItineraryCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2 py-1 text-[11px] font-medium text-primary-700 ring-1 ring-primary-100">
              <CalendarDays className="h-3 w-3" strokeWidth={2} />{displayItineraryCount} days
            </span>
          )}
          {pkg.whitelabelCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-700 ring-1 ring-violet-100">
              <Tag className="h-3 w-3 text-violet-500" strokeWidth={2} />{pkg.whitelabelCount} Whitelabeled
            </span>
          )}
        </div>

        {displayDescription && (
          <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">{displayDescription}</p>
        )}

        {existingWhitelabel && (
          <div className="rounded-lg border border-primary-100 bg-primary-50/60 px-3 py-2 text-xs text-primary-800">
            <span className="font-semibold">Your offer:</span> {existingWhitelabel.customTitle || 'White-label created'}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-auto space-y-2 border-t border-gray-100 p-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold text-gray-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800 shadow-sm"
          >
            <Eye className="h-3.5 w-3.5 inline mr-1" strokeWidth={2.5} />
            View
          </button>
        </div>

        <button
          type="button"
          disabled={disabled || pkg.isSuspended || isExpired}
          onClick={() => existingWhitelabel ? onEditWhiteLabel(existingWhitelabel) : onCreateWhiteLabel(pkg)}
          className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition shadow-sm active:scale-[0.98] ${
            (disabled || pkg.isSuspended || isExpired)
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {existingWhitelabel ? <Pencil className="h-3.5 w-3.5" /> : <Tag className="h-3.5 w-3.5" />}
          {isExpired ? 'Expired' : existingWhitelabel ? 'Edit white-label' : 'Create white-label'}
        </button>

        {(disabled || pkg.isSuspended || isExpired) && (
          <p className="text-center text-[10px] font-medium text-red-500/80">
            {isExpired ? 'Package start date has passed' : pkg.isSuspended ? 'Original package suspended by admin' : 'Parent agent is currently inactive'}
          </p>
        )}
      </div>

      <PackageDetailModal 
        isOpen={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        pkg={isWhitelabel ? { ...pkg.originalPackage, ...pkg, title: displayTitle, description: displayDescription, basePrice: displayPrice } : pkg} 
      />
    </article>
  )
}
