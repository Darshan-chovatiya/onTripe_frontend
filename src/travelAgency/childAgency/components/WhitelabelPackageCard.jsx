import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, IndianRupee, Pencil, Power, MessageSquare, Eye, Star, Users, TrendingUp, CheckCircle2, XCircle, Ticket, ShieldAlert, Layers } from 'lucide-react'
import { packageCoverUrl } from '@/travelAgency/childAgency/components/packageMedia.js'
import PackageDetailModal from '@/travelAgency/childAgency/components/PackageDetailModal.jsx'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=600'

export default function WhitelabelPackageCard({ item, onEdit, onToggleActive, onChat, onRating, onShowAgents, onShowCommissions, hasBooking, disabled = false }) {
  const navigate = useNavigate()
  const orig = item.originalPackage
  const coverSrc = packageCoverUrl(item.customCoverImage || orig?.coverImage) || PLACEHOLDER
  const title = item.customTitle || orig?.title || 'White-label package'
  const finalPrice = Number(item.finalPrice ?? orig?.basePrice ?? 0)
  const basePrice = Number(orig?.basePrice ?? 0)
  const [detailOpen, setDetailOpen] = useState(false)

  const sourcePrice = item.parentWhitelabel ? Number(item.parentWhitelabel.finalPrice || 0) : basePrice
  const myCommission = finalPrice - sourcePrice

  const markupLabel = item.commissionType === 'percentage'
    ? `+${item.commissionValue}%`
    : `+₹${Number(item.commissionValue).toLocaleString('en-IN')}`

  return (
    <article className={`group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${disabled ? 'opacity-60 ring-gray-200' : item.isActive ? 'ring-gray-200 hover:ring-primary-200' : 'ring-gray-200 opacity-75'
      }`}>
      {/* Cover */}
      <div className="relative h-44 overflow-hidden bg-gray-100">
        <img
          src={coverSrc}
          alt={title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Status badge */}
        <div className="absolute right-2 top-2">
          {disabled || orig?.isSuspended ? (
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm ${orig?.isSuspended ? 'bg-red-600' : 'bg-gray-900/70'}`}>
              {orig?.isSuspended ? <span className="flex items-center gap-1"><ShieldAlert size={10} /> Suspended</span> : 'Parent inactive'}
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.isActive ? 'bg-emerald-500/90 text-white' : 'bg-white/90 text-gray-600'
              }`}>
              {item.isActive ? <><CheckCircle2 className="h-2.5 w-2.5" />Live</> : <><XCircle className="h-2.5 w-2.5" />Off</>}
            </span>
          )}
        </div>
        {item.whitelabelCount > 0 && (
          <div className="absolute left-2 top-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-600/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm ring-1 ring-white/20">
              Whitelabeled
            </span>
          </div>
        )}

        {/* Price badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-0.5 rounded-xl bg-white/95 px-2.5 py-1.5 shadow-sm backdrop-blur-sm">
          <IndianRupee className="h-3.5 w-3.5 text-primary-700" strokeWidth={2.5} />
          <span className="text-sm font-bold tabular-nums text-primary-900">{finalPrice.toLocaleString('en-IN')}</span>
          <span className="ml-1 text-[10px] text-gray-500">{orig?.currency || 'INR'}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-1 text-sm font-semibold text-gray-900">{title}</h3>
          {orig?.title && item.customTitle && (
            <p className="mt-0.5 text-[11px] text-gray-400">Base: {orig.title}</p>
          )}
          {orig?.destination && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
              {orig.destination}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {orig?.totalDays != null && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-gray-100">
              <Clock className="h-3 w-3 text-primary-500" strokeWidth={2} />{orig.totalDays}d
            </span>
          )}
          {orig?.maxCapacity != null && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-gray-100">
              <Users className="h-3 w-3 text-primary-500" strokeWidth={2} />{orig.maxCapacity} max
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/agency/bookings?whitelabelId=${item._id}`)
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2 py-1 text-[11px] font-semibold text-primary-700 ring-1 ring-primary-100 shadow-sm transition hover:bg-primary-100"
          >
            <Ticket className="h-3 w-3 text-primary-600" strokeWidth={2.5} />
            {(Number(item.bookingCount) || 0) + (Number(item.totalAdditionalTravelers) || 0)} Bookings
          </button>
          <button
            type="button"
            disabled={!item.whitelabelCount}
            onClick={() => onShowAgents?.(item)}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold ring-1 transition ${item.whitelabelCount ? 'bg-violet-50 text-violet-700 ring-violet-100 hover:bg-violet-100' : 'bg-gray-50 text-gray-400 ring-gray-100'}`}
          >
            <Layers className="h-3 w-3" strokeWidth={2.5} />
            {item.whitelabelCount || 0} WL
          </button>
        </div>

        {/* Financial Breakdown */}
        <div className="flex flex-col gap-2 rounded-xl bg-gray-50/80 p-3 ring-1 ring-gray-100">
          <div className="grid grid-cols-2 gap-2 border-b border-gray-200 pb-2">
            <div className="text-center">
              <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">My Earnings</p>
              <p className="mt-0.5 text-xs font-bold tabular-nums text-primary-700">
                ₹{(Number(item.childEarnings) || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="text-center border-l border-gray-200">
              <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">Extra Income</p>
              <p className="mt-0.5 text-xs font-bold tabular-nums text-emerald-700">
                ₹{(Number(item.extraIncome) || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">To Parent</p>
              <p className="mt-0.5 text-xs font-bold tabular-nums text-gray-600">
                ₹{(Number(item.amountToGiveParent) || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="text-center border-l border-gray-200">
              <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">Commission</p>
              <p className="mt-0.5 text-xs font-bold text-violet-700">
                {markupLabel} (₹{myCommission.toLocaleString('en-IN')})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShowCommissions?.(item);
            }}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-primary-100 bg-white py-1.5 text-[10px] font-bold text-primary-700 transition hover:bg-primary-50 active:scale-[0.98]"
          >
            <TrendingUp className="h-3 w-3" />
            View Detailed Breakdown
          </button>
        </div>

        {item.customDescription && (
          <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">{item.customDescription}</p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-auto space-y-2 border-t border-gray-100 p-3">
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-semibold text-gray-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800"
        >
          <Eye className="h-4 w-4" strokeWidth={2} />
          View details
        </button>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={disabled || orig?.isSuspended}
              onClick={() => onEdit(item)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition ${
                (disabled || orig?.isSuspended)
                  ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800'
              }`}
            >
              <Pencil className="h-4 w-4" strokeWidth={2} />
              Edit
            </button>
            <button
              type="button"
              disabled={disabled || orig?.isSuspended}
              onClick={() => onToggleActive(item)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition ${
                (disabled || orig?.isSuspended)
                  ? 'border border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                  : item.isActive
                    ? 'border border-red-100 bg-white text-red-600 hover:bg-red-50'
                    : 'border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Power className="h-4 w-4" strokeWidth={2} />
              {item.isActive ? 'Pause' : 'Activate'}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={disabled || orig?.isSuspended}
              onClick={() => onRating(item)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition ${
                (disabled || orig?.isSuspended)
                  ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                  : 'border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <Star className="h-4 w-4" strokeWidth={2} />
              Reviews
            </button>
            {hasBooking && (
              <button
                type="button"
                disabled={disabled || orig?.isSuspended}
                onClick={onChat}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition ${
                  (disabled || orig?.isSuspended)
                    ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                    : 'border-primary-100 bg-primary-50 text-primary-700 hover:bg-primary-100'
                }`}
              >
                <MessageSquare className="h-4 w-4" strokeWidth={2} />
                Chat
              </button>
            )}
          </div>
          {(disabled || orig?.isSuspended) && (
            <p className="text-center text-[10px] font-medium text-red-500/80">
              {orig?.isSuspended ? 'Original package suspended' : 'Parent inactive'}
            </p>
          )}
        </div>
      </div>

      <PackageDetailModal isOpen={detailOpen} onClose={() => setDetailOpen(false)} pkg={item} isWhitelabel />
    </article>
  )
}
