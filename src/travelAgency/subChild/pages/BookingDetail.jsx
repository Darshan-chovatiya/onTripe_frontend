import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Hash, Calendar, IndianRupee, Users, Navigation,
  Clock, Package, MapPin, Phone, Mail, User, Layers, Ticket,
  Building2, Pencil,
} from 'lucide-react'
import { useSubChildBookings } from '@/travelAgency/subChild/hooks/useSubChildBookings.js'
import {
  filePublicUrl, formatDateTime, formatDateOnly,
  bookingOfferTitle, basePackageFromBooking, flattenDocPaths,
} from '@/travelAgency/shared/utils/bookingDetailHelpers.js'

const STATUS_BADGE = {
  confirmed: 'bg-blue-50 text-blue-800 ring-blue-100',
  ongoing: 'bg-amber-50 text-amber-900 ring-amber-100',
  completed: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
  cancelled: 'bg-red-50 text-red-800 ring-red-100',
}
const PAYMENT_BADGE = {
  pending: 'bg-slate-100 text-slate-700 ring-slate-200',
  partial: 'bg-orange-50 text-orange-900 ring-orange-100',
  paid: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
  refunded: 'bg-violet-50 text-violet-900 ring-violet-100',
}

function DetailRow({ label, children }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-2.5 last:border-0 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className="min-w-0 text-sm text-gray-900 [overflow-wrap:anywhere]">{children}</div>
    </div>
  )
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
      {Icon && <Icon className="h-4 w-4 text-primary-500" strokeWidth={2} />}
      {children}
    </h3>
  )
}

function DocLinks({ docs }) {
  const paths = flattenDocPaths(docs)
  if (!paths.length) return <span className="text-gray-400">None uploaded</span>
  return (
    <ul className="space-y-1">
      {paths.map((d) => {
        const href = filePublicUrl(d.path)
        return (
          <li key={d.key}>
            {href
              ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-700 hover:underline">{d.label}</a>
              : <span className="text-sm text-gray-600">{d.label}</span>}
          </li>
        )
      })}
    </ul>
  )
}

export default function BookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchBooking } = useSubChildBookings()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await fetchBooking(id)
        if (!cancelled) setBooking(data)
      } catch {
        if (!cancelled) setErr('Could not load booking.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id, fetchBooking])

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  if (err || !booking) {
    return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err || 'Booking not found.'}</div>
  }

  const b = booking
  const basePkg = basePackageFromBooking(b)
  const wl = b?.whitelabelPackage && typeof b.whitelabelPackage === 'object' ? b.whitelabelPackage : null
  const ac = b?.agencyCustomer && typeof b.agencyCustomer === 'object' ? b.agencyCustomer : null

  return (
    <div className="animate-fade-in mx-auto _max-w-3xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/agency/my-bookings')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50" aria-label="Back">
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">Booking details</h1>
            <p className="font-mono text-xs text-gray-400">{b.bookingId}</p>
          </div>
        </div>
        {/* <button type="button" onClick={() => navigate(`/agency/my-bookings/edit/${b._id}`)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700">
          <Pencil className="h-4 w-4" strokeWidth={2} /> Edit
        </button> */}
      </div>

      {/* Summary card */}
      <section className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              <Hash size={14} className="text-primary-500" /> Booking reference
            </p>
            <p className="font-mono text-lg font-bold text-gray-900">{b.bookingId}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${STATUS_BADGE[b.bookingStatus] || STATUS_BADGE.confirmed}`}>{b.bookingStatus || '—'}</span>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${PAYMENT_BADGE[b.paymentStatus] || PAYMENT_BADGE.pending}`}>Payment: {b.paymentStatus || '—'}</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Calendar, label: 'Travel date', value: formatDateTime(b.travelDate) },
            { icon: IndianRupee, label: 'Total amount', value: `₹${Number(b.totalAmount ?? 0).toLocaleString('en-IN')}` },
            { icon: Users, label: 'Travelers', value: b.travelerCount ?? (b.travelers?.length ?? 0) },
            { icon: Navigation, label: 'Current day', value: b.currentDay != null ? String(b.currentDay) : '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500"><Icon className="h-3.5 w-3.5" /> {label}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-gray-100/80 pt-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Created {formatDateTime(b.createdAt)}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Updated {formatDateTime(b.updatedAt)}</span>
        </div>
      </section>

      {/* Package & offer */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <SectionTitle icon={Package}>Package & offer</SectionTitle>
        <p className="text-base font-semibold text-gray-900">{bookingOfferTitle(b)}</p>
        {wl && (
          <div className="mt-3 space-y-2 rounded-xl bg-violet-50/60 px-3 py-2 text-sm text-violet-950">
            <p><span className="font-medium">Offer type: </span>White-label</p>
            {wl.finalPrice != null && <p><span className="font-medium">Offer price: </span>₹{Number(wl.finalPrice).toLocaleString('en-IN')}</p>}
            {wl.customDescription && String(wl.customDescription).trim() && <p className="border-t border-violet-100 pt-2 text-xs leading-relaxed text-violet-900/85">{String(wl.customDescription).trim()}</p>}
          </div>
        )}
        {basePkg && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Base package</p>
            <DetailRow label="Title">{String(basePkg.title || '—')}</DetailRow>
            {basePkg.destination && <DetailRow label="Destination"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />{String(basePkg.destination)}</span></DetailRow>}
            {basePkg.totalDays != null && <DetailRow label="Duration">{String(basePkg.totalDays)} days</DetailRow>}
            {basePkg.basePrice != null && <DetailRow label="Base price">₹{Number(basePkg.basePrice).toLocaleString('en-IN')}{basePkg.currency ? ` ${basePkg.currency}` : ''}</DetailRow>}
          </div>
        )}
      </section>

      {/* Customer */}
      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="p-5">
          <SectionTitle icon={User}>Customer</SectionTitle>
          <DetailRow label="Name">{b.customer?.name || '—'}</DetailRow>
          <DetailRow label="Phone">{b.customer?.phone ? <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-gray-400" />{b.customer.phone}</span> : '—'}</DetailRow>
          <DetailRow label="Email">{b.customer?.email ? <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-gray-400" />{b.customer.email}</span> : '—'}</DetailRow>
        </div>
        {ac && (
          <div className="border-t border-gray-100 bg-gray-50/80 p-5">
            <p className="mb-2 text-xs font-semibold text-gray-500">Agency profile</p>
            {ac.name && <DetailRow label="Name on file">{ac.name}</DetailRow>}
            {ac.email && <DetailRow label="Email on file">{ac.email}</DetailRow>}
            {ac.dob && <DetailRow label="Date of birth">{formatDateOnly(ac.dob)}</DetailRow>}
            {ac.gender && <DetailRow label="Gender"><span className="capitalize">{ac.gender}</span></DetailRow>}
            <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-2.5 last:border-0 sm:grid-cols-[11rem_1fr] sm:gap-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Documents</div>
              <div><DocLinks docs={ac.docs} /></div>
            </div>
          </div>
        )}
      </section>

      {/* Additional travelers */}
      {b.travelers?.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <SectionTitle icon={Layers}>Additional travelers</SectionTitle>
          <ul className="space-y-3">
            {b.travelers.map((t, i) => (
              <li key={i} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="font-semibold text-gray-900">{t.name}{t.age != null ? <span className="ml-2 font-normal text-gray-500">· Age {t.age}</span> : null}</p>
                {t.gender && <p className="mt-1 text-xs capitalize text-gray-500">{t.gender}</p>}
                <div className="mt-2 border-t border-gray-100 pt-2">
                  <p className="mb-1 text-[11px] font-semibold uppercase text-gray-400">Documents</p>
                  <DocLinks docs={t.docs ? { ...t.docs } : null} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tickets */}
      {b.tickets?.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <SectionTitle icon={Ticket}>Tickets & vouchers</SectionTitle>
          <ul className="space-y-2">
            {b.tickets.map((tk, i) => {
              const href = filePublicUrl(tk.fileUrl)
              return (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">
                  <span className="font-medium text-gray-900">{tk.name || 'Ticket'}</span>
                  {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-700 hover:underline">Open file</a> : <span className="text-xs text-gray-400">No file</span>}
                  {tk.uploadedAt && <span className="w-full text-xs text-gray-400 sm:w-auto">{formatDateTime(tk.uploadedAt)}</span>}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Booked by */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <SectionTitle icon={Building2}>Booked by</SectionTitle>
        {typeof b.bookedBy === 'object' && b.bookedBy ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
            <p className="font-semibold text-gray-900">{b.bookedBy.name || '—'}</p>
            <p className="mt-1 text-sm text-gray-600">{b.bookedBy.email || ''}</p>
            {b.bookedBy.role && <p className="mt-2 text-xs uppercase tracking-wide text-gray-400">{String(b.bookedBy.role).replace(/_/g, ' ')}</p>}
          </div>
        ) : <p className="text-sm text-gray-500">—</p>}
      </section>
    </div>
  )
}
