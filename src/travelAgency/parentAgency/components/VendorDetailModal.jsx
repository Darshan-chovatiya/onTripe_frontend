import { Mail, Phone, MapPin, FileText, Building2, User } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import Button from '@/shared/components/Button.jsx'

const TYPE_META = {
  hotel:             { light: 'bg-blue-50 text-blue-700' },
  transport:         { light: 'bg-purple-50 text-purple-700' },
  restaurant:        { light: 'bg-orange-50 text-orange-700' },
  activity_provider: { light: 'bg-green-50 text-green-700' },
  guide:             { light: 'bg-yellow-50 text-yellow-700' },
  cruise:            { light: 'bg-cyan-50 text-cyan-700' },
  other:             { light: 'bg-gray-100 text-gray-600' },
}

const BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        <Icon size={13} />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  )
}

export default function VendorDetailModal({ isOpen, onClose, vendor }) {
  if (!vendor) return null

  const meta = TYPE_META[vendor.type] || TYPE_META.other
  const initials = vendor.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  const location = [vendor.address, vendor.city, vendor.state, vendor.country].filter(Boolean).join(', ')

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vendor Details" size="md"
      footer={
        <div className="flex justify-end p-4">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      }
    >
      <div className="space-y-5">

        {/* Hero banner */}
        <div className="rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xl flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 leading-tight truncate">{vendor.name}</h3>
            {vendor.contactPerson && (
              <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                <User size={12} /> {vendor.contactPerson}
              </p>
            )}
          </div>
          <span className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${meta.light}`}>
            {vendor.type?.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Info grid */}
        <div className="rounded-2xl border border-gray-100 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={Mail}     label="Email"   value={vendor.email} />
          <InfoRow icon={Phone}    label="Phone"   value={vendor.phone} />
          <InfoRow icon={MapPin}   label="Location" value={location || null} />
          <InfoRow icon={Building2} label="Type"   value={vendor.type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />
        </div>

        {/* Documents */}
        {vendor.docs?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Documents</p>
            <div className="flex flex-wrap gap-2">
              {vendor.docs.map((doc, i) => (
                <a
                  key={i}
                  href={`${BASE}/${doc.replace(/\\/g, '/')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors shadow-sm"
                >
                  <FileText size={13} /> Document {i + 1}
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </Modal>
  )
}
