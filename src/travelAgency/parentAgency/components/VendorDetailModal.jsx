import { Mail, Phone, MapPin, FileText, Building2, User, Hash, MessageSquare, Users } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import { filePublicUrl } from '@/travelAgency/shared/utils/bookingDetailHelpers.js'
import { useState } from 'react'
import VendorCustomerChatsViewerModal from '@/travelAgency/parentAgency/components/VendorCustomerChatsViewerModal.jsx'
import CustomerSelectModal from '@/travelAgency/parentAgency/components/CustomerSelectModal.jsx'

const TYPE_META = {
  hotel:             'bg-blue-50 text-blue-700 ring-blue-100',
  transport:         'bg-purple-50 text-purple-700 ring-purple-100',
  restaurant:        'bg-orange-50 text-orange-700 ring-orange-100',
  activity_provider: 'bg-green-50 text-green-700 ring-green-100',
  guide:             'bg-yellow-50 text-yellow-700 ring-yellow-100',
  cruise:            'bg-cyan-50 text-cyan-700 ring-cyan-100',
  other:             'bg-gray-100 text-gray-600 ring-gray-200',
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

export default function VendorDetailModal({ isOpen, onClose, vendor }) {
  const [showCustomerChats, setShowCustomerChats] = useState(false)
  const [showCustomerSelect, setShowCustomerSelect] = useState(false)

  if (!vendor) return null

  const typeCls = TYPE_META[vendor.type] || TYPE_META.other
  const initials = vendor.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  const location = [vendor.address, vendor.city, vendor.state, vendor.country].filter(Boolean).join(', ')
  const typeLabel = vendor.type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vendor details" size="xl">
      <div className="pr-1 space-y-4 sm:space-y-6">

        {/* Hero */}
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 font-bold text-xl">
                {initials}
              </div>
              <div>
                <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <Building2 size={14} className="text-primary-500" />
                  Vendor
                </p>
                <p className="text-lg font-bold text-gray-900 leading-tight">{vendor.name}</p>
                {vendor.contactPerson && (
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                    <User size={12} /> {vendor.contactPerson}
                  </p>
                )}
              </div>
            </div>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${typeCls}`}>
              {typeLabel}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            {vendor.email && (
              <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                  <Mail className="h-3.5 w-3.5 shrink-0" /> Email
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900 break-all">{vendor.email}</p>
              </div>
            )}
            {vendor.phone && (
              <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                  <Phone className="h-3.5 w-3.5 shrink-0" /> Phone
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{vendor.phone}</p>
              </div>
            )}
            {location && (
              <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" /> Location
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{location}</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {/* <button 
              onClick={() => setShowCustomerSelect(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-gray-800 active:scale-95"
            >
              <MessageSquare size={16} />
              Assign Customer Chat
            </button> */}
            <button 
              onClick={() => setShowCustomerChats(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-900 shadow-sm transition-all hover:bg-gray-50 active:scale-95"
            >
              <Users size={16} />
              View Customer Chats
            </button>
          </div>
        </div>

        {/* Details */}
        <div>
          <SectionTitle icon={Building2}>Vendor info</SectionTitle>
          <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
            <DetailRow label="Name">{vendor.name || '—'}</DetailRow>
            <DetailRow label="Type">{typeLabel}</DetailRow>
            {vendor.contactPerson && <DetailRow label="Contact person">{vendor.contactPerson}</DetailRow>}
            {vendor.email && (
              <DetailRow label="Email">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />{vendor.email}
                </span>
              </DetailRow>
            )}
            {vendor.phone && (
              <DetailRow label="Phone">
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />{vendor.phone}
                </span>
              </DetailRow>
            )}
            {vendor.address && <DetailRow label="Address">{vendor.address}</DetailRow>}
            {vendor.city && <DetailRow label="City">{vendor.city}</DetailRow>}
            {vendor.state && <DetailRow label="State">{vendor.state}</DetailRow>}
            {vendor.country && <DetailRow label="Country">{vendor.country}</DetailRow>}
            <DetailRow label="Status">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${vendor.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                {vendor.isActive !== false ? 'Active' : 'Inactive'}
              </span>
            </DetailRow>
          </div>
        </div>

        {/* Documents */}
        {vendor.docs?.length > 0 && (
          <div>
            <SectionTitle icon={FileText}>Documents</SectionTitle>
            <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {vendor.docs.map((doc, i) => {
                  const href = filePublicUrl(doc)
                  return href ? (
                    <a
                      key={i}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-100 hover:bg-violet-100 transition-colors"
                    >
                      <FileText className="h-3 w-3" /> Document {i + 1}
                    </a>
                  ) : (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500 ring-1 ring-inset ring-gray-200">
                      <FileText className="h-3 w-3" /> Document {i + 1}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        )}

      </div>
      
      <CustomerSelectModal
        isOpen={showCustomerSelect}
        onClose={() => setShowCustomerSelect(false)}
        vendor={vendor}
      />

      <VendorCustomerChatsViewerModal
        isOpen={showCustomerChats}
        onClose={() => setShowCustomerChats(false)}
        vendor={vendor}
      />
    </Modal>
  )
}
