import { useNavigate } from 'react-router-dom'
import { AGENCY_PANEL_BASE } from '@/travelAgency/agency/constants.js'
import {
  MapPin,
  Clock,
  IndianRupee,
  ImageIcon,
  Edit2,
  ImagePlus,
  Trash2,
  Eye,
  CheckCircle2,
  Users,
  Images,
  Sparkles,
} from 'lucide-react'
import { destinationText } from '@/travelAgency/parentAgency/utils/packageDisplay.js'

export default function PackageCard({ pkg, onEdit, onUpdateCover, onUpdateGallery, onDeactivate, onActivate }) {
  const navigate = useNavigate()
  const base = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
  const coverSrc = pkg.coverImage ? `${base}/${pkg.coverImage.replace(/\\/g, '/')}` : null

  const fmtPrice = Number(pkg.basePrice).toLocaleString('en-IN')
  const dest = destinationText(pkg.destination)

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200/90 shadow-md shadow-gray-200/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-900/5 hover:ring-primary-300/50">
      {/* Cover */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary-100/80 via-slate-100 to-sky-50">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-primary-400/60">
            <Sparkles className="h-10 w-10" strokeWidth={1.25} />
            <span className="text-xs font-medium text-primary-600/50">Add a cover image</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm ${
              pkg.isActive
                ? 'bg-emerald-500/95 text-white'
                : 'bg-white/95 text-red-600 ring-1 ring-red-200'
            }`}
          >
            {pkg.isActive ? 'Live' : 'Inactive'}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3 pt-10">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-base font-bold leading-snug text-white drop-shadow-md">{pkg.title}</h3>
            </div>
            <div className="shrink-0 rounded-lg bg-white/95 px-2 py-1 text-right shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-0.5 text-sm font-bold tabular-nums text-primary-800">
                <IndianRupee className="h-3.5 w-3.5" strokeWidth={2.5} />
                {fmtPrice}
              </div>
              {pkg.currency && (
                <div className="text-[9px] font-medium uppercase tracking-wider text-gray-500">{pkg.currency}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body — destination: single source of truth, full text, readable label */}
      <div className="flex flex-1 flex-col gap-3 p-4 pt-3">
        {dest ? (
          <div className="rounded-xl border border-primary-200/60 bg-gradient-to-br from-primary-50/90 via-white to-sky-50/30 px-3.5 py-3 shadow-sm ring-1 ring-primary-100/50">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
                <MapPin className="h-4 w-4" aria-hidden strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary-800">Destination</p>
                <p className="mt-1 text-[15px] font-semibold leading-snug text-gray-900 break-words [overflow-wrap:anywhere]">
                  {dest}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-amber-200/80 bg-amber-50/40 px-3.5 py-2.5 text-xs text-amber-900/90">
            <span className="font-medium">No destination set</span>
            <span className="text-amber-800/80"> — add one when you edit this package.</span>
          </div>
        )}

        {pkg.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-gray-600">{pkg.description}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-100">
            <Clock className="h-3 w-3 text-primary-600" />
            {pkg.totalDays} days
          </span>
          {pkg.maxCapacity != null && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-100">
              <Users className="h-3 w-3 text-primary-600" />
              {pkg.maxCapacity} pax
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-100">
            <Images className="h-3 w-3 text-primary-600" />
            {pkg.images?.length || 0} photos
          </span>
          {pkg.itinerary?.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2 py-1 text-[11px] font-medium text-primary-800 ring-1 ring-primary-100">
              {pkg.itinerary.length} itinerary days
            </span>
          )}
        </div>

        <div className="mt-auto space-y-2 border-t border-gray-100 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdateCover(pkg)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2 text-xs font-medium text-sky-800 transition hover:bg-sky-100"
            >
              <ImageIcon className="h-3.5 w-3.5 shrink-0" />
              Cover
            </button>
            <button
              type="button"
              onClick={() => onUpdateGallery(pkg)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-100 bg-violet-50/80 px-3 py-2 text-xs font-medium text-violet-800 transition hover:bg-violet-100"
            >
              <ImagePlus className="h-3.5 w-3.5 shrink-0" />
              Gallery
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => navigate(`${AGENCY_PANEL_BASE}/packages/${pkg._id}`)}
              className="inline-flex min-h-[2.5rem] items-center justify-center gap-1 rounded-xl bg-primary-600 px-1.5 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-primary-700 sm:text-xs"
            >
              <Eye className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">View</span>
            </button>
            <button
              type="button"
              onClick={() => onEdit(pkg)}
              className="inline-flex min-h-[2.5rem] items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white px-1.5 py-2 text-[11px] font-semibold text-gray-800 shadow-sm transition hover:border-primary-200 hover:bg-primary-50/50 sm:text-xs"
            >
              <Edit2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Update</span>
            </button>
            {pkg.isActive ? (
              <button
                type="button"
                onClick={() => onDeactivate(pkg)}
                className="inline-flex min-h-[2.75rem] flex-col items-center justify-center gap-0.5 rounded-xl border border-red-100 bg-red-50/80 px-1 py-1.5 text-[10px] font-semibold leading-tight text-red-600 transition hover:bg-red-100 sm:min-h-[2.5rem] sm:flex-row sm:gap-1 sm:px-1.5 sm:text-[11px] sm:leading-none"
                title="Deactivate package"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-full text-center leading-tight">Deactivate</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onActivate(pkg)}
                className="inline-flex min-h-[2.75rem] flex-col items-center justify-center gap-0.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-1 py-1.5 text-[10px] font-semibold leading-tight text-emerald-700 transition hover:bg-emerald-100 sm:min-h-[2.5rem] sm:flex-row sm:gap-1 sm:px-1.5 sm:text-[11px] sm:leading-none"
                title="Activate package"
              >
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-full text-center leading-tight">Activate</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
