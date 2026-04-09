import { MapPin, Clock, IndianRupee, Image, Pencil, Power, MessageSquare, Eye } from 'lucide-react'
import { useState } from 'react'
import Button from '@/shared/components/Button.jsx'
import { packageCoverUrl } from '@/travelAgency/childAgency/components/packageMedia.js'
import PackageDetailModal from '@/travelAgency/childAgency/components/PackageDetailModal.jsx'

export default function WhitelabelPackageCard({ item, onEdit, onToggleActive, onChat, hasBooking, disabled = false }) {
  const orig = item.originalPackage
  const coverSrc = packageCoverUrl(item.customCoverImage || orig?.coverImage)
  const title = item.customTitle || orig?.title || 'White-label package'
  const [detailOpen, setDetailOpen] = useState(false)

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${disabled ? 'border-gray-200 opacity-60' : 'border-gray-100'}`}>
      <div className="relative flex h-44 items-center justify-center bg-gray-100">
        {coverSrc ? (
          <img src={coverSrc} alt={title} className="h-full w-full object-cover" />
        ) : (
          <Image className="h-10 w-10 text-gray-300" />
        )}
        {!item.isActive && !disabled && (
          <span className="absolute right-2 top-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
            Inactive
          </span>
        )}
        {disabled && (
          <span className="absolute right-2 top-2 rounded-full bg-gray-800/70 px-2 py-0.5 text-xs font-semibold text-white">
            Parent inactive
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col space-y-2 p-4">
        <h3 className="text-base font-bold leading-tight text-gray-900">{title}</h3>
        {orig?.title && item.customTitle ? (
          <p className="text-xs text-gray-400">From parent package: {orig.title}</p>
        ) : null}
        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
          {orig?.destination ? (
            <span className="flex items-center gap-1">
              <MapPin size={13} />
              {orig.destination}
            </span>
          ) : null}
          {orig?.totalDays != null ? (
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {orig.totalDays} days
            </span>
          ) : null}
          <span className="flex items-center gap-1">
            <IndianRupee size={13} />
            {Number(item.finalPrice ?? orig?.basePrice ?? 0).toLocaleString('en-IN')}{' '}
            {orig?.currency || 'INR'}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Markup: {item.commissionType === 'percentage' ? `${item.commissionValue}%` : `₹${item.commissionValue}`} on
          base {Number(orig?.basePrice ?? 0).toLocaleString('en-IN')}
        </p>
        {item.customDescription ? (
          <p className="line-clamp-2 text-xs text-gray-400">{item.customDescription}</p>
        ) : null}
        <div className="flex flex-wrap gap-2 text-xs text-gray-400">
          <span className={item.visibleToSubChildren ? 'text-primary-600' : 'text-gray-400'}>
            {item.visibleToSubChildren ? 'Visible to sub-children' : 'Hidden from sub-children'}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-gray-100 p-3">
        <Button type="button" variant="secondary" className="w-full" onClick={() => setDetailOpen(true)} disabled={disabled}>
          <Eye className="mr-1 inline h-3.5 w-3.5" />
          View details
        </Button>
        {disabled ? (
          <p className="w-full text-center text-xs text-gray-400">Actions disabled — parent is inactive.</p>
        ) : (
          <>
            <Button type="button" variant="secondary" className="flex-1 min-w-[7rem]" onClick={() => onEdit(item)}>
              <Pencil className="mr-1 inline h-3.5 w-3.5" />
              Edit
            </Button>
            <Button type="button" variant="secondary" className="flex-1 min-w-[5rem]" onClick={() => onToggleActive(item)}>
              <Power className="mr-1 inline h-3.5 w-3.5" />
              {item.isActive ? 'Off' : 'On'}
            </Button>
            {hasBooking && (
              <Button type="button" variant="secondary" onClick={onChat} title="Community chat">
                <MessageSquare className="h-4 w-4 text-primary-600" />
              </Button>
            )}
          </>
        )}
      </div>

      <PackageDetailModal isOpen={detailOpen} onClose={() => setDetailOpen(false)} pkg={item} isWhitelabel />
    </div>
  )
}
