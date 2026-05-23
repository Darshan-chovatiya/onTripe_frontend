import { useEffect, useState } from 'react'
import {
  Mail, Phone, Calendar, FileText, User,
  CheckCircle, XCircle, Clock, Layers, BookOpen,
  Hash, ShieldCheck, Briefcase, Pencil
} from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import { getChildAgent } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { filePublicUrl, formatDateTime } from '@/travelAgency/shared/utils/bookingDetailHelpers.js'

const KYC_STYLES = {
  approved: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
  pending:  'bg-amber-50 text-amber-900 ring-amber-100',
  rejected: 'bg-red-50 text-red-800 ring-red-100',
}
const KYC_ICONS = { approved: CheckCircle, pending: Clock, rejected: XCircle }

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

export default function ChildAgentDetailModal({ isOpen, onClose, childId, onEdit }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen || !childId) return
    setLoading(true)
    setError(null)
    setData(null)
    getChildAgent(childId)
      .then(res => setData(res.data?.data || null))
      .catch(err => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [isOpen, childId])

  const child = data?.child
  const kycStatus = child?.kyc?.status || 'pending'
  const KycIcon = KYC_ICONS[kycStatus] || Clock

  const kyc = child?.kyc
  const kycDocs = kyc ? [
    { label: 'Aadhar Front', path: kyc.aadharFront },
    { label: 'Aadhar Back',  path: kyc.aadharBack },
    { label: 'PAN Card',     path: kyc.panCard },
    ...(kyc.otherDocs || []).map((p, i) => ({ label: `Other Doc ${i + 1}`, path: p })),
  ].filter(d => d.path) : []

  const handleEdit = () => {
    if (onEdit && child) {
      onEdit(child)
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Child agent details" 
      size="xl"
      footer={
        onEdit && child ? (
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/80 px-4 sm:px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleEdit}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
            >
              <FileText size={16} />
              Edit Details
            </button>
          </div>
        ) : null
      }
    >
      <div className="pr-1">

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 rounded-xl bg-gray-100" />
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {child && !loading && (
          <div className="space-y-6">

            {/* Hero */}
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-4">
                  {child.agencyLogo ? (
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-sm ring-1 ring-gray-100">
                      <img src={filePublicUrl(child.agencyLogo)} alt={child.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 font-bold text-xl shadow-sm ring-1 ring-primary-100">
                      {child.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                    </div>
                  )}
                  <div>
                    <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                      <User size={14} className="text-primary-500" />
                      <span>Child agent</span>
                      {child.agentCode && <span className="font-mono text-gray-400">({child.agentCode})</span>}
                      {child.createdByAdmin && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700 ring-1 ring-blue-200 normal-case">
                          Created by admin
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold text-gray-900">{child.name}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${KYC_STYLES[kycStatus]}`}>
                    <KycIcon size={11} /> KYC {kycStatus}
                  </span>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${child.isActive ? 'bg-emerald-50 text-emerald-900 ring-emerald-100' : 'bg-red-50 text-red-800 ring-red-100'}`}>
                    {child.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                    <Layers className="h-3.5 w-3.5" /> Whitelabels
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{data.whitelabelCount ?? 0}</p>
                </div>
                <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                    <BookOpen className="h-3.5 w-3.5" /> Bookings
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{data.bookingCount ?? 0}</p>
                </div>
                {/* <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm col-span-2">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                    <Hash className="h-3.5 w-3.5" /> Agent ID
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold text-gray-900">{child._id?.slice(-8).toUpperCase()}</p>
                </div> */}
              </div>
            </div>

            {/* Contact */}
            <div>
              <SectionTitle icon={User}>Contact info</SectionTitle>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <DetailRow label="Name">{child.name || '—'}</DetailRow>
                {child.email && (
                  <DetailRow label="Email">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />{child.email}
                    </span>
                  </DetailRow>
                )}
                {child.phone && (
                  <DetailRow label="Phone">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />{child.phone}
                    </span>
                  </DetailRow>
                )}
                {child.createdAt && (
                  <DetailRow label="Joined">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />{formatDateTime(child.createdAt)}
                    </span>
                  </DetailRow>
                )}
              </div>
            </div>

            {/* Business details */}
            <div>
              <SectionTitle icon={Briefcase}>Business details</SectionTitle>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <DetailRow label="GST Number">{child.gstNumber || '—'}</DetailRow>
                <DetailRow label="Business Name">{child.contactPersonName || '—'}</DetailRow>
                <DetailRow label="Address">{child.address || '—'}</DetailRow>
              </div>
            </div>

            {/* KYC */}
            {kyc && (
              <div>
                <SectionTitle icon={ShieldCheck}>KYC details</SectionTitle>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <DetailRow label="KYC status">
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

                  {kycDocs.length > 0 && (
                    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-2.5 last:border-0 sm:grid-cols-[11rem_1fr] sm:gap-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Documents</div>
                      <div className="flex flex-wrap gap-2">
                        {kycDocs.map(doc => {
                          const href = filePublicUrl(doc.path)
                          return href ? (
                            <a
                              key={doc.label}
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-100 hover:bg-violet-100 transition-colors"
                            >
                              <FileText className="h-3 w-3" /> {doc.label}
                            </a>
                          ) : (
                            <span key={doc.label} className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500 ring-1 ring-inset ring-gray-200">
                              <FileText className="h-3 w-3" /> {doc.label}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </Modal>
  )
}
