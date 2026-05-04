import { useState } from 'react'
import {
  User, Mail, Phone, Calendar, FileText, MapPin,
  Clock, Briefcase, ShieldCheck, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'

function formatDateTime(v) {
  if (!v) return '—'
  try { return new Date(v).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) }
  catch { return '—' }
}

function formatDateOnly(v) {
  if (!v) return '—'
  try { return new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) }
  catch { return '—' }
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-gray-500">
      {Icon && <Icon className="h-4 w-4 text-primary-500" strokeWidth={2} />}
      {children}
    </h3>
  )
}

function DetailRow({ label, children }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-2.5 last:border-0 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className="min-w-0 text-sm text-gray-900 [overflow-wrap:anywhere]">{children}</div>
    </div>
  )
}

function isImage(url) {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(url)
}

const BASE_URL = (() => {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  const base = !envUrl || envUrl.includes('VITE_API_BASE_URL') ? 'http://localhost:5001' : envUrl.trim().replace(/\/+$/, '')
  return base.endsWith('/api') ? base.slice(0, -4) : base
})()

function fileHref(path) {
  return path ? `${BASE_URL}/${String(path).replace(/^\/+/, '')}` : ''
}

/**
 * @param {{ isOpen: boolean, onClose: () => void, customer: object | null }} props
 * customer shape: { name, phone, email, notes, isActive, trips, dob, gender,
 *   nationality, address, aadharNumber, passportNumber, docs, createdAt, updatedAt }
 */
export default function CustomerDetailModal({ isOpen, onClose, customer }) {
  const [lightbox, setLightbox] = useState(null)

  const c = customer

  const docs = c ? [
    { label: 'Aadhar Front', path: c.docs?.aadharFront },
    { label: 'Aadhar Back',  path: c.docs?.aadharBack },
    { label: 'PAN Card',     path: c.docs?.panCard },
    { label: 'Passport',     path: c.docs?.passport },
    { label: 'Visa',         path: c.docs?.visaDoc },
    ...(Array.isArray(c.docs?.otherDocs) ? c.docs.otherDocs.map((p, i) => ({ label: `Other Doc ${i + 1}`, path: p })) : []),
  ].filter(d => d.path) : []

  const initials = c?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  const profileImgUrl = c?.profileImage ? `${BASE_URL}/${String(c.profileImage).replace(/^\/+/, '')}` : null

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Customer details" size="xl">
        <div className="pr-1">
          {!c ? (
            <p className="text-sm text-gray-500">No customer selected.</p>
          ) : (
            <div className="space-y-6">

              {/* Header card */}
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                      {profileImgUrl
                        ? <img src={profileImgUrl} alt={c.name} className="h-full w-full object-cover" />
                        : initials
                      }
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{c.name}</p>
                      <p className="mt-0.5 text-sm text-gray-500">Customer</p>
                    </div>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${c.isActive ? 'bg-emerald-50 text-emerald-900 ring-emerald-100' : 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Stats row */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                      <Briefcase className="h-3.5 w-3.5" /> Trips
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{c.trips ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                      <Calendar className="h-3.5 w-3.5" /> Joined
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatDateOnly(c.createdAt)}</p>
                  </div>
                  <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                      <Clock className="h-3.5 w-3.5" /> Last activity
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatDateOnly(c.lastActivity || c.updatedAt)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-gray-100/80 pt-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Created {formatDateTime(c.createdAt)}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Updated {formatDateTime(c.updatedAt)}</span>
                </div>
              </div>

              {/* Contact */}
              <div>
                <SectionTitle icon={User}>Contact</SectionTitle>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <DetailRow label="Name">{c.name || '—'}</DetailRow>
                  <DetailRow label="Phone">
                    {c.phone && c.phone !== '—'
                      ? <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-gray-400" />{c.phone}</span>
                      : '—'}
                  </DetailRow>
                  <DetailRow label="Email">
                    {c.email && c.email !== '—'
                      ? <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-gray-400" />{c.email}</span>
                      : '—'}
                  </DetailRow>
                  {c.dob && <DetailRow label="Date of birth">{formatDateOnly(c.dob)}</DetailRow>}
                  {c.gender && <DetailRow label="Gender"><span className="capitalize">{c.gender}</span></DetailRow>}
                  {c.nationality && <DetailRow label="Nationality">{c.nationality}</DetailRow>}
                  {c.address && (
                    <DetailRow label="Address">
                      <span className="inline-flex items-start gap-1"><MapPin className="h-3.5 w-3.5 mt-0.5 text-gray-400 shrink-0" />{c.address}</span>
                    </DetailRow>
                  )}
                  {c.notes && <DetailRow label="Notes">{c.notes}</DetailRow>}
                </div>
              </div>

              {/* Identity & Documents */}
              {(c.aadharNumber || c.passportNumber || docs.length > 0) && (
                <div>
                  <SectionTitle icon={ShieldCheck}>Identity & Documents</SectionTitle>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    {c.aadharNumber && <DetailRow label="Aadhar number">{c.aadharNumber}</DetailRow>}
                    {c.passportNumber && <DetailRow label="Passport number">{c.passportNumber}</DetailRow>}
                    <DetailRow label="Documents">
                      {docs.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {docs.map((doc, i) => {
                            const href = fileHref(doc.path)
                            return (
                              <button
                                key={doc.label}
                                type="button"
                                onClick={() => href && setLightbox({ index: i, docs })}
                                disabled={!href}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                              >
                                <FileText size={12} />
                                {doc.label}
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-400">None uploaded</span>
                      )}
                    </DetailRow>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </Modal>

      {/* Lightbox */}
      {lightbox && (() => {
        const doc = lightbox.docs[lightbox.index]
        const href = fileHref(doc.path)
        const img = href && isImage(href)
        const prev = () => setLightbox(l => ({ ...l, index: (l.index - 1 + l.docs.length) % l.docs.length }))
        const next = () => setLightbox(l => ({ ...l, index: (l.index + 1) % l.docs.length }))
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={() => setLightbox(null)}>
            <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-800">{doc.label}</span>
                <button type="button" onClick={() => setLightbox(null)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                  <X size={18} />
                </button>
              </div>
              <div className="flex items-center justify-center bg-gray-50 min-h-[280px] max-h-[65vh] overflow-auto p-4">
                {img ? (
                  <img src={href} alt={doc.label} className="max-w-full max-h-[58vh] rounded-lg object-contain" />
                ) : href ? (
                  <div className="text-center space-y-3">
                    <FileText className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="text-sm text-gray-500">Preview not available for this file type.</p>
                    <a href={href} download className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                      Download {doc.label}
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">File not available.</p>
                )}
              </div>
              {lightbox.docs.length > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                  <button type="button" onClick={prev} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span className="text-xs text-gray-400">{lightbox.index + 1} / {lightbox.docs.length}</span>
                  <button type="button" onClick={next} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </>
  )
}
