import { useEffect, useState } from 'react'
import {
  Hash,
  User,
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  Users,
  MapPin,
  Package,
  Clock,
  Ticket,
  Building2,
  Navigation,
  Layers,
} from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import { getBooking } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import {
  filePublicUrl,
  formatDateTime,
  formatDateOnly,
  bookingOfferTitle,
  basePackageFromBooking,
  flattenDocPaths,
} from '@/travelAgency/shared/utils/bookingDetailHelpers.js'

const STATUS_STYLES = {
  confirmed: 'bg-blue-50 text-blue-800 ring-blue-100',
  ongoing: 'bg-amber-50 text-amber-900 ring-amber-100',
  completed: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
  cancelled: 'bg-red-50 text-red-800 ring-red-100',
}
const PAYMENT_STYLES = {
  pending: 'bg-slate-100 text-slate-700 ring-slate-200',
  partial: 'bg-orange-50 text-orange-900 ring-orange-100',
  paid: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
  refunded: 'bg-violet-50 text-violet-900 ring-violet-100',
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
      {Icon && <Icon className="h-4 w-4 text-primary-500" strokeWidth={2} />}
      {children}
    </h3>
  )
}

function DetailRow({ label, children, className = '' }) {
  return (
    <div className={`grid grid-cols-1 gap-1 border-b border-gray-100 py-2.5 last:border-0 sm:grid-cols-[11rem_1fr] sm:gap-4 ${className}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className="min-w-0 text-sm text-gray-900 [overflow-wrap:anywhere]">{children}</div>
    </div>
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
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-700 hover:underline">
                {d.label}
              </a>
            ) : (
              <span className="text-sm text-gray-600">{d.label}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default function BookingDetailModal({ isOpen, onClose, bookingId }) {
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen || !bookingId) return
    setLoading(true)
    setError(null)
    setBooking(null)
    getBooking(bookingId)
      .then((res) => setBooking(res.data?.data?.booking || null))
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [isOpen, bookingId])

  const b = booking
  const basePkg = b ? basePackageFromBooking(b) : null
  const wl = b?.whitelabelPackage && typeof b.whitelabelPackage === 'object' ? b.whitelabelPackage : null
  const ac = b?.agencyCustomer && typeof b.agencyCustomer === 'object' ? b.agencyCustomer : null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Booking details" size="xl">
      <div className="pr-1">
        {loading && (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-100" />
            ))}
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {b && !loading && (
          <div className="space-y-5 sm:space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-4 sm:p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
                <div>
                  <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    <Hash size={14} className="text-primary-500" />
                    Booking reference
                  </p>
                  <p className="font-mono text-lg font-bold text-gray-900">{b.bookingId}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${
                      STATUS_STYLES[b.bookingStatus] || STATUS_STYLES.confirmed
                    }`}
                  >
                    {b.bookingStatus || '—'}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${
                      PAYMENT_STYLES[b.paymentStatus] || PAYMENT_STYLES.pending
                    }`}
                  >
                    Payment: {b.paymentStatus || '—'}
                  </span>
                </div>
              </div>
              <div className="mt-4 sm:mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    Travel date
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{formatDateTime(b.travelDate)}</p>
                </div>
                <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                    <IndianRupee className="h-3.5 w-3.5" />
                    Total amount
                  </p>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900">
                    ₹{Number(b.totalAmount ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                    <Users className="h-3.5 w-3.5" />
                    Travelers
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{b.travelerCount ?? (b.travelers?.length ?? 0)}</p>
                </div>
                <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                    <Navigation className="h-3.5 w-3.5" />
                    Current day
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{b.currentDay != null ? String(b.currentDay) : '—'}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-gray-100/80 pt-3 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Created {formatDateTime(b.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Updated {formatDateTime(b.updatedAt)}
                </span>
              </div>
            </div>

            <div>
              <SectionTitle icon={Package}>Package & offer</SectionTitle>
              <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                <p className="text-base font-semibold text-gray-900">{bookingOfferTitle(b)}</p>
                {wl ? (
                  <div className="mt-3 space-y-2 rounded-xl bg-violet-50/60 px-3 py-2 text-sm text-violet-950">
                    <p>
                      <span className="font-medium">Offer type: </span>
                      White-label
                    </p>
                    {wl.finalPrice != null && (
                      <p>
                        <span className="font-medium">Offer price: </span>₹{Number(wl.finalPrice).toLocaleString('en-IN')}
                      </p>
                    )}
                    {(wl.commissionType || wl.commissionValue != null) && (
                      <p className="text-xs text-violet-900/90">
                        Commission: {String(wl.commissionType || '—')}
                        {wl.commissionValue != null ? ` · ${wl.commissionValue}` : ''}
                      </p>
                    )}
                    {wl.customDescription && String(wl.customDescription).trim() ? (
                      <p className="border-t border-violet-100 pt-2 text-xs leading-relaxed text-violet-900/85">
                        {String(wl.customDescription).trim()}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {basePkg ? (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Base package</p>
                    <DetailRow label="Title">{String(basePkg.title || '—')}</DetailRow>
                    {basePkg.destination != null && String(basePkg.destination).trim() ? (
                      <DetailRow label="Destination">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                          {String(basePkg.destination)}
                        </span>
                      </DetailRow>
                    ) : null}
                    {basePkg.totalDays != null ? <DetailRow label="Duration">{String(basePkg.totalDays)} days</DetailRow> : null}
                    {basePkg.basePrice != null ? (
                      <DetailRow label="Base price">
                        ₹{Number(basePkg.basePrice).toLocaleString('en-IN')}
                        {basePkg.currency ? ` ${basePkg.currency}` : ''}
                      </DetailRow>
                    ) : null}
                    {basePkg.maxCapacity != null ? (
                      <DetailRow label="Max capacity">{String(basePkg.maxCapacity)} guests</DetailRow>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <SectionTitle icon={User}>Customer</SectionTitle>
              <div className="rounded-2xl border border-gray-200 bg-white p-0 shadow-sm">
                <div className="p-3 sm:p-4">
                  <p className="mb-2 text-xs font-semibold text-gray-500">Primary traveler (record)</p>
                  <DetailRow label="Name">{b.customer?.name || '—'}</DetailRow>
                  <DetailRow label="Phone">
                    {b.customer?.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        {b.customer.phone}
                      </span>
                    ) : (
                      '—'
                    )}
                  </DetailRow>
                  <DetailRow label="Email">
                    {b.customer?.email ? (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        {b.customer.email}
                      </span>
                    ) : (
                      '—'
                    )}
                  </DetailRow>
                </div>
                {ac ? (
                  <div className="border-t border-gray-100 bg-gray-50/80 p-3 sm:p-4">
                    <p className="mb-2 text-xs font-semibold text-gray-500">Agency profile (this booking)</p>
                    <DetailRow label="Agency name on file">{ac.name != null && String(ac.name).trim() ? ac.name : '—'}</DetailRow>
                    <DetailRow label="Agency email on file">{ac.email != null && String(ac.email).trim() ? ac.email : '—'}</DetailRow>
                    {ac.notes != null && String(ac.notes).trim() ? (
                      <DetailRow label="Notes">{String(ac.notes).trim()}</DetailRow>
                    ) : null}
                    {ac.dob ? <DetailRow label="Date of birth">{formatDateOnly(ac.dob)}</DetailRow> : null}
                    {ac.gender ? (
                      <DetailRow label="Gender">
                        <span className="capitalize">{String(ac.gender)}</span>
                      </DetailRow>
                    ) : null}
                    {ac.nationality != null && String(ac.nationality).trim() ? (
                      <DetailRow label="Nationality">{String(ac.nationality)}</DetailRow>
                    ) : null}
                    {ac.address != null && String(ac.address).trim() ? (
                      <DetailRow label="Address">{String(ac.address)}</DetailRow>
                    ) : null}
                    {ac.aadharNumber != null && String(ac.aadharNumber).trim() ? (
                      <DetailRow label="Aadhar">{String(ac.aadharNumber)}</DetailRow>
                    ) : null}
                    {ac.passportNumber != null && String(ac.passportNumber).trim() ? (
                      <DetailRow label="Passport">{String(ac.passportNumber)}</DetailRow>
                    ) : null}
                    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-2.5 last:border-0 sm:grid-cols-[11rem_1fr] sm:gap-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Documents</div>
                      <div>
                        <DocLinks docs={ac.docs} />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <SectionTitle icon={Layers}>Additional travelers</SectionTitle>
              {b.travelers?.length ? (
                <ul className="space-y-3">
                  {b.travelers.map((t, i) => (
                    <li key={i} className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                      <p className="font-semibold text-gray-900">{t.name}</p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        {t.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {t.phone}</span>}
                        {t.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {t.email}</span>}
                      </div>
                      {t.idProof != null && String(t.idProof).trim() ? (
                        <p className="mt-1 text-xs text-gray-500">ID note: {String(t.idProof)}</p>
                      ) : null}
                      <div className="mt-2 border-t border-gray-100 pt-2">
                        <p className="mb-1 text-[11px] font-semibold uppercase text-gray-400">Documents</p>
                        <DocLinks docs={t.docs} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No additional travelers listed.</p>
              )}
            </div>

            <div>
              <SectionTitle icon={Ticket}>Tickets & vouchers</SectionTitle>
              {b.tickets?.length ? (
                <ul className="space-y-2">
                  {b.tickets.map((tk, i) => {
                    const href = filePublicUrl(tk.fileUrl)
                    return (
                      <li
                        key={i}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-sm"
                      >
                        <span className="font-medium text-gray-900 flex-1 min-w-[120px] break-words">{tk.name || 'Ticket'}</span>
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-primary-700 hover:underline"
                          >
                            Open file
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">No file</span>
                        )}
                        {tk.uploadedAt ? (
                          <span className="w-full text-xs text-gray-400 sm:w-auto">{formatDateTime(tk.uploadedAt)}</span>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No tickets uploaded for this booking yet.</p>
              )}
            </div>

            <div>
              <SectionTitle icon={Building2}>Booked by</SectionTitle>
              <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-3 sm:p-4">
                {typeof b.bookedBy === 'object' && b.bookedBy ? (
                  <>
                    <p className="font-semibold text-gray-900">{b.bookedBy.name || '—'}</p>
                    <p className="mt-1 text-sm text-gray-600">{b.bookedBy.email || ''}</p>
                    {b.bookedBy.phone ? <p className="text-sm text-gray-600">{b.bookedBy.phone}</p> : null}
                    {b.bookedBy.role ? (
                      <p className="mt-2 text-xs uppercase tracking-wide text-gray-400">{String(b.bookedBy.role).replace(/_/g, ' ')}</p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">—</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
