import { useEffect, useState } from 'react'
import { Mail, Phone, CheckCircle, XCircle, Clock, Calendar, FileText } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import Button from '@/shared/components/Button.jsx'

const KYC_STYLES = {
  approved: 'bg-green-50 text-green-700 border-green-200',
  pending:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}
const KYC_ICONS = { approved: CheckCircle, pending: Clock, rejected: XCircle }

const BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const docUrl = (path) => path ? `${BASE}/${path.replace(/\\/g, '/')}` : null

export default function SubChildDetailModal({ isOpen, onClose, subId, fetchOne, onToggleActive, busyId }) {
  const [sub, setSub] = useState(null)
  const [loadErr, setLoadErr] = useState(null)

  useEffect(() => {
    if (!isOpen || !subId || !fetchOne) {
      setSub(null)
      setLoadErr(null)
      return
    }
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

  const kyc = sub?.kyc || {}
  const kycStatus = kyc.status || 'pending'
  const KycIcon = KYC_ICONS[kycStatus] || Clock
  const busy = sub && busyId && String(busyId) === String(sub._id)

  const kycDocs = [
    { label: 'Aadhar Front', path: kyc.aadharFront },
    { label: 'Aadhar Back',  path: kyc.aadharBack },
    { label: 'PAN Card',     path: kyc.panCard },
  ].filter(d => d.path)

  const handleStatusClick = async () => {
    if (!sub) return
    try {
      await onToggleActive(sub, !sub.isActive)
      const data = await fetchOne(subId)
      if (data) setSub(data)
    } catch { /* parent toast */ }
  }

  const footer = (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2">
        {sub ? (
          <Button
            type="button"
            variant={sub.isActive ? 'secondary' : 'primary'}
            disabled={busy}
            onClick={handleStatusClick}
          >
            {sub.isActive ? 'Deactivate account' : 'Activate account'}
          </Button>
        ) : null}
      </div>
      <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sub-child Details" footer={footer} size="md">
      {loadErr && <p className="text-sm text-red-600">{loadErr}</p>}
      {!sub && !loadErr && (
        <div className="space-y-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gray-200" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
          <div className="h-24 bg-gray-200 rounded-xl" />
          <div className="h-16 bg-gray-200 rounded-xl" />
        </div>
      )}

      {sub && (
        <div className="space-y-5">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
              {sub.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{sub.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${KYC_STYLES[kycStatus]}`}>
                  <KycIcon size={10} /> KYC {kycStatus}
                </span>
                <span className={`text-xs font-medium ${sub.isActive ? 'text-green-600' : 'text-red-500'}`}>
                  {sub.isActive ? '● Active' : '● Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-xl border border-gray-100 p-4 space-y-2.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</p>
            {sub.email && (
              <p className="flex items-center gap-2 text-sm text-gray-700"><Mail size={14} className="text-gray-400" />{sub.email}</p>
            )}
            {sub.phone && (
              <p className="flex items-center gap-2 text-sm text-gray-700"><Phone size={14} className="text-gray-400" />{sub.phone}</p>
            )}
            {sub.createdAt && (
              <p className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar size={14} className="text-gray-400" />
                Joined {new Date(sub.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>

          {/* KYC Details */}
          <div className="rounded-xl border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">KYC Details</p>
            {kyc.aadharNumber && (
              <p className="text-sm text-gray-700">Aadhar: <span className="font-medium">{kyc.aadharNumber}</span></p>
            )}
            {kyc.rejectionReason && (
              <p className="text-sm text-red-600">Rejection reason: {kyc.rejectionReason}</p>
            )}
            {kycDocs.length > 0 || kyc.otherDocs?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {kycDocs.map(doc => (
                  <a
                    key={doc.label}
                    href={docUrl(doc.path)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <FileText size={12} /> {doc.label}
                  </a>
                ))}
                {kyc.otherDocs?.map((d, i) => (
                  <a
                    key={i}
                    href={docUrl(d)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <FileText size={12} /> Doc {i + 1}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No documents uploaded.</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
