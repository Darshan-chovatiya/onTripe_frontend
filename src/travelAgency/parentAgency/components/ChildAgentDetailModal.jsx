import { useEffect, useState } from 'react'
import { Mail, Phone, CheckCircle, XCircle, Clock, Layers, BookOpen, Calendar, FileText } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import { getChildAgent } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

const KYC_STYLES = {
  approved: 'bg-green-50 text-green-700 border-green-200',
  pending:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}
const KYC_ICONS = { approved: CheckCircle, pending: Clock, rejected: XCircle }

const BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const docUrl = (path) => path ? `${BASE}/${path.replace(/\\/g, '/')}` : null

export default function ChildAgentDetailModal({ isOpen, onClose, childId }) {
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Child Agent Details" size="md">
      {loading && (
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

      {error && <p className="text-sm text-red-500">{error}</p>}

      {child && (
        <div className="space-y-5">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
              {child.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{child.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${KYC_STYLES[kycStatus]}`}>
                  <KycIcon size={10} /> KYC {kycStatus}
                </span>
                <span className={`text-xs font-medium ${child.isActive ? 'text-green-600' : 'text-red-500'}`}>
                  {child.isActive ? '● Active' : '● Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-xl border border-gray-100 p-4 space-y-2.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</p>
            {child.email && (
              <p className="flex items-center gap-2 text-sm text-gray-700"><Mail size={14} className="text-gray-400" />{child.email}</p>
            )}
            {child.phone && (
              <p className="flex items-center gap-2 text-sm text-gray-700"><Phone size={14} className="text-gray-400" />{child.phone}</p>
            )}
            {child.createdAt && (
              <p className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar size={14} className="text-gray-400" />
                Joined {new Date(child.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-100 p-4 text-center">
              <Layers size={18} className="mx-auto text-purple-500 mb-1" />
              <p className="text-2xl font-bold text-gray-900">{data.whitelabelCount ?? 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">Whitelabels</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4 text-center">
              <BookOpen size={18} className="mx-auto text-blue-500 mb-1" />
              <p className="text-2xl font-bold text-gray-900">{data.bookingCount ?? 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">Bookings</p>
            </div>
          </div>

          {/* KYC Documents */}
          {child.kyc && (
            <div className="rounded-xl border border-gray-100 p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">KYC Details</p>
              {child.kyc.aadharNumber && (
                <p className="text-sm text-gray-700">Aadhar: <span className="font-medium">{child.kyc.aadharNumber}</span></p>
              )}
              {child.kyc.rejectionReason && (
                <p className="text-sm text-red-600">Rejection reason: {child.kyc.rejectionReason}</p>
              )}
              {/* Docs */}
              {[
                { label: 'Aadhar Front', path: child.kyc.aadharFront },
                { label: 'Aadhar Back',  path: child.kyc.aadharBack },
                { label: 'PAN Card',     path: child.kyc.panCard },
              ].filter(d => d.path).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Aadhar Front', path: child.kyc.aadharFront },
                    { label: 'Aadhar Back',  path: child.kyc.aadharBack },
                    { label: 'PAN Card',     path: child.kyc.panCard },
                  ].filter(d => d.path).map(doc => (
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
                  {child.kyc.otherDocs?.map((d, i) => (
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
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
