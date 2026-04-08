import { useEffect, useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import Button from '@/shared/components/Button.jsx'

function formatDt(v) {
  if (!v) return '—'
  try {
    return new Date(v).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-900">{children}</dd>
    </div>
  )
}

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
        if (!cancelled) {
          setSub(data)
          setLoadErr(null)
        }
      } catch {
        if (!cancelled) {
          setSub(null)
          setLoadErr('Could not load details.')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, subId, fetchOne])

  const kyc = sub?.kyc || {}
  const baseUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_API_BASE_URL
    const base = !envUrl || envUrl.includes('VITE_API_BASE_URL') ? 'http://localhost:5001' : envUrl.trim().replace(/\/+$/, '')
    return base.endsWith('/api') ? base.slice(0, -4) : base
  }, [])
  const docHref = (pathValue) => (pathValue ? `${baseUrl}/${String(pathValue).replace(/^\/+/, '')}` : '')
  const kycDocs = [
    { label: 'Aadhar Front', path: kyc.aadharFront },
    { label: 'Aadhar Back', path: kyc.aadharBack },
    { label: 'PAN Card', path: kyc.panCard },
    { label: 'Passport', path: kyc.passport },
    { label: 'Visa', path: kyc.visaDoc },
    ...(Array.isArray(kyc.otherDocs) ? kyc.otherDocs.map((pathValue, idx) => ({ label: `Other Doc ${idx + 1}`, path: pathValue })) : []),
  ].filter((d) => d.path)
  const docCount = [
    kyc.aadharFront,
    kyc.aadharBack,
    kyc.panCard,
    kyc.passport,
    kyc.visaDoc,
    ...(Array.isArray(kyc.otherDocs) ? kyc.otherDocs : []),
  ].filter(Boolean).length

  const busy = sub && busyId && String(busyId) === String(sub._id)

  const handleStatusClick = async () => {
    if (!sub) return
    const next = !sub.isActive
    try {
      await onToggleActive(sub, next)
      if (next) {
        const data = await fetchOne(subId)
        if (data) setSub(data)
      }
    } catch {
      /* parent toast */
    }
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
      <Button type="button" variant="secondary" onClick={onClose}>
        Close
      </Button>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sub-child details" footer={footer} size="lg">
      <div className="px-1">
        {loadErr ? <p className="text-sm text-red-600">{loadErr}</p> : null}
        {!sub && !loadErr ? <p className="text-sm text-gray-500">Loading…</p> : null}
        {sub ? (
          <dl>
            <Row label="Name">{sub.name || '—'}</Row>
            <Row label="Email">{sub.email || '—'}</Row>
            <Row label="Phone">{sub.phone || '—'}</Row>
            <Row label="Account status">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  sub.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {sub.isActive ? 'Active' : 'Inactive'}
              </span>
            </Row>
            <Row label="KYC status">{kyc.status ? String(kyc.status) : '—'}</Row>
            {kyc.rejectionReason ? (
              <Row label="KYC note">
                <span className="text-amber-800">{kyc.rejectionReason}</span>
              </Row>
            ) : null}
            <Row label="Documents">
              {docCount ? (
                <div className="space-y-2">
                  <div>{docCount} file(s) on record</div>
                  <div className="flex flex-wrap gap-2">
                    {kycDocs.map((doc) => (
                      <a
                        key={`${doc.label}-${doc.path}`}
                        href={docHref(doc.path)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <FileText size={12} />
                        {doc.label}
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                'None listed'
              )}
            </Row>
            <Row label="Registered">{formatDt(sub.createdAt)}</Row>
            <Row label="Last updated">{formatDt(sub.updatedAt)}</Row>
          </dl>
        ) : null}
      </div>
    </Modal>
  )
}
