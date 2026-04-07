import { useNavigate } from 'react-router-dom'
import { AGENCY_PANEL_BASE } from '@/travelAgency/agency/constants.js'
import { MapPin, Clock, IndianRupee, Image, Edit2, ImagePlus, Trash2, Eye } from 'lucide-react'

export default function PackageCard({ pkg, onEdit, onUpdateCover, onUpdateGallery, onDeactivate }) {
  const navigate = useNavigate()
  const base = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
  const coverSrc = pkg.coverImage
    ? `${base}/${pkg.coverImage.replace(/\\/g, '/')}`
    : null

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
      {/* Cover */}
      <div className="relative h-44 bg-gray-100 flex items-center justify-center">
        {coverSrc ? (
          <img src={coverSrc} alt={pkg.title} className="h-full w-full object-cover" />
        ) : (
          <Image className="h-10 w-10 text-gray-300" />
        )}
        {!pkg.isActive && (
          <span className="absolute top-2 right-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
            Inactive
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-4 space-y-2">
        <h3 className="font-bold text-gray-900 text-base leading-tight">{pkg.title}</h3>
        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1"><MapPin size={13} />{pkg.destination}</span>
          <span className="flex items-center gap-1"><Clock size={13} />{pkg.totalDays} days</span>
          <span className="flex items-center gap-1"><IndianRupee size={13} />{Number(pkg.basePrice).toLocaleString('en-IN')}</span>
        </div>
        {pkg.description && (
          <p className="text-xs text-gray-400 line-clamp-2">{pkg.description}</p>
        )}
        <div className="flex gap-3 text-xs text-gray-400">
          <span>{pkg.images?.length || 0} gallery image(s)</span>
          {pkg.maxCapacity && <span>· Max {pkg.maxCapacity} pax</span>}
          {pkg.itinerary?.length > 0 && <span>· {pkg.itinerary.length} day(s)</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-100 p-3 flex gap-2 flex-wrap">
        <button onClick={() => navigate(`${AGENCY_PANEL_BASE}/packages/${pkg._id}`)} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors">
          <Eye size={13} /> View
        </button>
        <button onClick={() => onEdit(pkg)} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors">
          <Edit2 size={13} /> Edit
        </button>
        <button onClick={() => onUpdateCover(pkg)} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors">
          <Image size={13} /> Cover
        </button>
        <button onClick={() => onUpdateGallery(pkg)} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 transition-colors">
          <ImagePlus size={13} /> Gallery
        </button>
        {pkg.isActive && (
          <button onClick={() => onDeactivate(pkg)} className="ml-auto flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={13} /> Deactivate
          </button>
        )}
      </div>
    </div>
  )
}
