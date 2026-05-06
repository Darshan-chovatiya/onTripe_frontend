import { useEffect, useMemo, useState } from 'react'
import {
  User, Mail, Phone, Calendar, FileText, CheckCircle, XCircle,
  Clock, BookOpen, ShieldCheck, X, ChevronLeft, ChevronRight, Pencil, Building2
} from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import Button from '@/shared/components/Button.jsx'

const KYC_STYLES = {
  approved: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
  pending:  'bg-amber-50 text-amber-900 ring-amber-100',
  rejected: 'bg-red-50 text-red-800 ring-red-100',
}
const KYC_ICONS = { approved: CheckCircle, pending: Clock, rejected: XCircle }

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

export default function SubChildDetailModal({ isOpen, onClose, subId, fetchOne, onToggleActive, busyId, onEdit }) {
  const [sub, setSub] = useState(null)
  const [loadErr, setLoadErr] = useState(null)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    if (!isOpen || !subId || !fetchOne) { setSub(null); setLoadErr(null); return }
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchOne(subId)
        if (!cancelled) { setSub(data); setLoadErr(null) }
      } catch {
        if (!cancelled) { setSub(null); setLoadErr('Could not load details.') }
      }
    })()
    return () => { cancelled = true }
  }, [isOpen, subId, fetchOne])

  const handleEdit = () => {
    if (onEdit && sub) {
      onEdit(sub)
    }
  }

  const baseUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_API_BASE_URL
    const base = !envUrl || envUrl.includes('VITE_API_BASE_URL') ? 'http://localhost:5001' : envUrl.trim().replace(/\/+$/, '')
    return base.endsWith('/api') ? base.slice(0, -4) : base
  }, [])

  const docHref = (path) => path ? `${baseUrl}/${String(path).replace(/^\/+/, '')}` : ''

  const kyc = sub?.kyc || {}
  const kycStatus = kyc.status || 'pending'
  const KycIcon = KYC_ICONS[kycStatus] || Clock

  const kycDocs = [
    { label: 'Aadhar Front', path: kyc.aadharFront },
    { label: 'Aadhar Back',  path: kyc.aadharBack },
    { label: 'PAN Card',     path: kyc.panCard },
    { label: 'Passport',     path: kyc.passport },
    { label: 'Visa',         path: kyc.visaDoc },
    ...(Array.isArray(kyc.otherDocs) ? kyc.otherDocs.map((p, i) => ({ label: `Other Doc ${i + 1}`, path: p })) : []),
  ].filter(d => d.path)

  const busy = sub && busyId && String(busyId) === String(sub._id)
  const initials = sub?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  const handleStatusClick = async () => {
    if (!sub) return
    try {
      await onToggleActive(sub, !sub.isActive)
      const data = await fetchOne(subId)
      if (data) setSub(data)
    } catch { /* parent toast */ }
  }

  const footer = (
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100">
      <button
        type="button"
        onClick={handleStatusClick}
        disabled={busy}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
          sub?.isActive
            ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        } disabled:opacity-50`}
      >
        {busy ? 'Please wait…' : sub?.isActive ? 'Deactivate account' : 'Activate account'}
      </button>
      <div className="flex gap-2">
        {onEdit && sub && (
          <button
            type="button"
            onClick={handleEdit}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
          >
            <Pencil size={16} />
            Edit Details
          </button>
        )}
        <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
      </div>
    </div>
  )

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Agent details" footer={footer} size="xl">
        <div className="pr-1">
          {/* Loading */}
          {!sub && !loadErr && (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-gray-100" />)}
            </div>
          )}

          {/* Error */}
          {loadErr && <p className="text-sm text-red-600">{loadErr}</p>}

          {sub && (
            <div className="space-y-6">

              {/* Header card */}
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 shrink-0 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                      {initials}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{sub.name}</p>
                      <p className="mt-0.5 text-sm text-gray-500">Agent</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${KYC_STYLES[kycStatus]}`}>
                      <KycIcon size={11} /> KYC {kycStatus}
                    </span>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${sub.isActive ? 'bg-emerald-50 text-emerald-900 ring-emerald-100' : 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
                      {sub.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                      <BookOpen className="h-3.5 w-3.5" /> Bookings
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{sub.bookingCount ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                      <Calendar className="h-3.5 w-3.5" /> Joined
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatDateOnly(sub.createdAt)}</p>
                  </div>
                  <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                      <Clock className="h-3.5 w-3.5" /> Last updated
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatDateOnly(sub.updatedAt)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-gray-100/80 pt-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Created {formatDateTime(sub.createdAt)}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Updated {formatDateTime(sub.updatedAt)}</span>
                </div>
              </div>

              {/* Contact */}
              <div>
                <SectionTitle icon={User}>Contact</SectionTitle>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <DetailRow label="Name">{sub.name || '—'}</DetailRow>
                  <DetailRow label="Email">
                    {sub.email
                      ? <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-gray-400" />{sub.email}</span>
                      : '—'}
                  </DetailRow>
                  <DetailRow label="Phone">
                    {sub.phone
                      ? <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-gray-400" />{sub.phone}</span>
                      : '—'}
                  </DetailRow>
                </div>
              </div>

              {/* Business */}
              <div>
                <SectionTitle icon={Building2}>Business</SectionTitle>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <DetailRow label="Business Name">{sub.contactPersonName || '—'}</DetailRow>
                  <DetailRow label="GST Number">
                    <span className="font-mono text-xs font-semibold text-primary-700">{sub.gstNumber || '—'}</span>
                  </DetailRow>
                  <DetailRow label="Business Address">{sub.address || '—'}</DetailRow>
                </div>
              </div>

              {/* KYC */}
              <div>
                <SectionTitle icon={ShieldCheck}>KYC</SectionTitle>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <DetailRow label="Status">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${KYC_STYLES[kycStatus]}`}>
                      <KycIcon size={11} /> {kycStatus}
                    </span>
                  </DetailRow>
                  {kyc.aadharNumber && (
                    <DetailRow label="Aadhar number">{kyc.aadharNumber}</DetailRow>
                  )}
                  {kyc.rejectionReason && (
                    <DetailRow label="Rejection reason">
                      <span className="text-red-600">{kyc.rejectionReason}</span>
                    </DetailRow>
                  )}
                  <DetailRow label="Documents">
                    {kycDocs.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {kycDocs.map((doc, i) => {
                          const href = docHref(doc.path)
                          return (
                            <button
                              key={doc.label}
                              type="button"
                              onClick={() => href && setLightbox({ index: i, docs: kycDocs })}
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

            </div>
          )}
        </div>
      </Modal>

      {/* Lightbox */}
      {lightbox && (() => {
        const doc = lightbox.docs[lightbox.index]
        const href = docHref(doc.path)
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
