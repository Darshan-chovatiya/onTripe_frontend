import { MapPin, Clock, IndianRupee, Image, Tag, Pencil, Eye } from 'lucide-react'
import { useState } from 'react'
import Button from '@/shared/components/Button.jsx'
import { packageCoverUrl } from '@/travelAgency/childAgency/components/packageMedia.js'
import PackageDetailModal from '@/travelAgency/childAgency/components/PackageDetailModal.jsx'

export default function AvailablePackageCard({ pkg, existingWhitelabel, onCreateWhiteLabel, onEditWhiteLabel, disabled = false }) {
  const coverSrc = packageCoverUrl(pkg.coverImage)
  const [detailOpen, setDetailOpen] = useState(false)

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${disabled ? 'border-gray-200 opacity-60' : 'border-gray-100'}`}>
      <div className="relative flex h-44 items-center justify-center bg-gray-100">
        {coverSrc ? (
          <img src={coverSrc} alt={pkg.title} className="h-full w-full object-cover" />
        ) : (
          <Image className="h-10 w-10 text-gray-300" />
        )}
        {disabled && (
          <span className="absolute right-2 top-2 rounded-full bg-gray-800/70 px-2 py-0.5 text-xs font-semibold text-white">
            Parent inactive
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col space-y-2 p-4">
        <h3 className="text-base font-bold leading-tight text-gray-900">{pkg.title}</h3>
        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
          {pkg.destination ? (
            <span className="flex items-center gap-1">
              <MapPin size={13} />
              {pkg.destination}
            </span>
          ) : null}
          {pkg.totalDays != null ? (
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {pkg.totalDays} days
            </span>
          ) : null}
          <span className="flex items-center gap-1">
            <IndianRupee size={13} />
            {Number(pkg.basePrice).toLocaleString('en-IN')} {pkg.currency || 'INR'}
          </span>
        </div>
        {pkg.description ? <p className="line-clamp-2 text-xs text-gray-400">{pkg.description}</p> : null}
      </div>
      <div className="space-y-2 border-t border-gray-100 p-3">
        <Button type="button" variant="secondary" className="w-full" onClick={() => setDetailOpen(true)} disabled={disabled}>
          <Eye className="mr-1.5 inline h-4 w-4" />
          View details
        </Button>
        {!disabled && (
          existingWhitelabel ? (
            <>
              <p className="text-center text-xs text-gray-500">One white-label per package — you already have an offer.</p>
              <Button type="button" className="w-full" variant="secondary" onClick={() => onEditWhiteLabel(existingWhitelabel)}>
                <Pencil className="mr-1.5 inline h-4 w-4" />
                Edit white-label
              </Button>
            </>
          ) : (
            <Button type="button" className="w-full" variant="secondary" onClick={() => onCreateWhiteLabel(pkg)}>
              <Tag className="mr-1.5 inline h-4 w-4" />
              Create white-label
            </Button>
          )
        )}
        {disabled && (
          <p className="text-center text-xs text-gray-400">Actions disabled — parent is inactive.</p>
        )}
      </div>

      <PackageDetailModal isOpen={detailOpen} onClose={() => setDetailOpen(false)} pkg={pkg} />
    </div>
  )
}
