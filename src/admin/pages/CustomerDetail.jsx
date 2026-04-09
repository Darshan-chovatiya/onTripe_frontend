import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronRight,
  UserCircle2,
  Building2,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Link2,
  Mail,
  Phone,
  ArrowLeft,
  FileText,
  Ticket,
  IndianRupee,
  Users,
  Clock,
  MapPin,
  Download,
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

function roleBadgeClass(role) {
  if (!role) return 'bg-gray-100 text-gray-700 border-gray-200'
  if (role === 'parent_agent') return 'bg-violet-50 text-violet-800 border-violet-200'
  if (role === 'child_agent') return 'bg-amber-50 text-amber-900 border-amber-200'
  if (role === 'sub_child_agent') return 'bg-sky-50 text-sky-900 border-sky-200'
  return 'bg-gray-100 text-gray-700 border-gray-200'
}

function formatRole(role) {
  if (!role) return '—'
  return String(role).replace(/_/g, ' ')
}

function formatDate(v) {
  if (!v) return ''
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function hasText(v) {
  return v !== undefined && v !== null && String(v).trim() !== ''
}

/** Only document slots that have a file path */
function availableDocuments(profile) {
  const docs = profile?.docs || {}
  const rows = [
    { label: 'Aadhaar front', path: docs.aadharFront },
    { label: 'Aadhaar back', path: docs.aadharBack },
    { label: 'PAN', path: docs.panCard },
    { label: 'Passport', path: docs.passport },
    { label: 'Visa', path: docs.visaDoc },
  ]
  const withPaths = rows.filter((r) => hasText(r.path))
  const other = Array.isArray(docs.otherDocs) ? docs.otherDocs : []
  other.forEach((path, i) => {
    if (hasText(path)) withPaths.push({ label: `Other document ${i + 1}`, path })
  })
  return withPaths
}

function DetailRow({ label, children, className = '' }) {
  return (
    <div className={`rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="mt-1 text-sm font-medium text-gray-900">{children}</div>
    </div>
  )
}

function AgencyProfileCard({ profile, index }) {
  const agent = profile.managedBy
  const docs = availableDocuments(profile)
  const hasAgentContact = hasText(agent?.email) || hasText(agent?.phone)

  const profileRows = []
  if (hasText(profile.name)) profileRows.push({ key: 'name', label: 'Display name', value: profile.name })
  if (hasText(profile.email)) profileRows.push({ key: 'email', label: 'Email', value: profile.email })
  if (hasText(profile.phone)) profileRows.push({ key: 'phone', label: 'Phone', value: profile.phone })
  if (profile.dob) {
    const d = formatDate(profile.dob)
    if (d) profileRows.push({ key: 'dob', label: 'Date of birth', value: d })
  }
  if (hasText(profile.gender)) profileRows.push({ key: 'gender', label: 'Gender', value: profile.gender })
  if (hasText(profile.nationality)) profileRows.push({ key: 'nat', label: 'Nationality', value: profile.nationality })
  if (hasText(profile.address))
    profileRows.push({ key: 'addr', label: 'Address', value: profile.address, multiline: true })
  if (hasText(profile.aadharNumber))
    profileRows.push({ key: 'aadhar', label: 'Identity (Aadhaar)', value: profile.aadharNumber })
  if (hasText(profile.passportNumber))
    profileRows.push({ key: 'pass', label: 'Passport no.', value: profile.passportNumber })
  if (profile.createdAt) {
    const d = formatDate(profile.createdAt)
    if (d) profileRows.push({ key: 'c', label: 'Record created', value: d })
  }
  if (profile.updatedAt) {
    const d = formatDate(profile.updatedAt)
    if (d) profileRows.push({ key: 'u', label: 'Record updated', value: d })
  }

  const hasProfileDetails = profileRows.length > 0
  const hasNotes = hasText(profile.notes)

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-900/5">
      <div className="border-b border-gray-100 bg-gradient-to-r from-primary-700/8 via-white to-white px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-700/10 text-primary-800">
              <Building2 className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-800/80">
                Agency profile {index + 1}
              </p>
              <h3 className="mt-0.5 truncate text-base font-semibold text-gray-900">
                {hasText(agent?.name) ? agent.name : 'Agency'}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {hasText(agent?.agentCode) ? (
                  <span className="rounded-md border border-primary-200 bg-primary-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary-900">
                    {agent.agentCode}
                  </span>
                ) : null}
                {hasText(agent?.role) ? (
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleBadgeClass(
                      agent.role
                    )}`}
                  >
                    {formatRole(agent.role)}
                  </span>
                ) : null}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    profile.isActive !== false
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {profile.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {hasAgentContact ? (
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100/80 pt-3 text-sm">
            {hasText(agent?.email) ? (
              <a
                href={`mailto:${agent.email}`}
                className="inline-flex max-w-full items-center gap-2 text-primary-800 hover:text-primary-950"
              >
                <Mail className="h-4 w-4 shrink-0 text-primary-600" strokeWidth={2} />
                <span className="truncate">{agent.email}</span>
              </a>
            ) : null}
            {hasText(agent?.phone) ? (
              <a
                href={`tel:${agent.phone}`}
                className="inline-flex items-center gap-2 text-gray-800 hover:text-gray-950"
              >
                <Phone className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
                <span>{agent.phone}</span>
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="p-4 sm:p-5">
        {hasProfileDetails ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-800">Details</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {profileRows.map((row) => (
                <DetailRow key={row.key} label={row.label} className={row.multiline ? 'sm:col-span-2' : ''}>
                  <span className={row.multiline ? 'whitespace-pre-wrap' : ''}>{row.value}</span>
                </DetailRow>
              ))}
            </div>
          </div>
        ) : null}

        {docs.length > 0 ? (
          <div className={hasProfileDetails ? 'mt-6 border-t border-gray-100 pt-6' : ''}>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-gray-800">
              <FileText className="h-4 w-4 text-primary-700" strokeWidth={2} />
              Documents ({docs.length})
            </p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {docs.map((doc) => (
                <li key={`${doc.label}-${doc.path}`}>
                  <a
                    href={doc.path}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-sm transition-colors hover:border-primary-200 hover:bg-primary-50/40"
                  >
                    <span className="font-medium text-gray-800">{doc.label}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 group-hover:text-primary-900">
                      Open
                      <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!hasProfileDetails && docs.length === 0 && !hasNotes ? (
          <p className="text-sm text-gray-500">No additional details or documents on this profile.</p>
        ) : null}

        {hasNotes ? (
          <div
            className={`rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3 ${
              hasProfileDetails || docs.length > 0 ? 'mt-6' : ''
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-900/80">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{profile.notes}</p>
          </div>
        ) : null}
      </div>
    </article>
  )
}

export default function CustomerDetail() {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)

  const load = useCallback(async () => {
    if (!customerId) return
    setLoading(true)
    try {
      const { data } = await adminApi.getCustomer(customerId)
      if (data?.success && data.data?.customer) {
        setCustomer(data.data.customer)
      } else {
        setCustomer(null)
        toastRef.current.error(data?.message || 'Customer not found')
      }
    } catch (e) {
      setCustomer(null)
      toastRef.current.error(e?.response?.data?.message || 'Failed to load customer')
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!customerId) return
    setBookingsLoading(true)
    adminApi.getCustomerBookings(customerId)
      .then(({ data }) => setBookings(Array.isArray(data?.data?.bookings) ? data.data.bookings : []))
      .catch(() => setBookings([]))
      .finally(() => setBookingsLoading(false))
  }, [customerId])

  const handleExport = async () => {
    if (!customer) return
    setExportLoading(true)
    try {
      const wb = new ExcelJS.Workbook()
      wb.creator = 'OnTrip Admin'; wb.created = new Date()

      const NAVY   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
      const LBLFIL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
      const STRIPE = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      const WHITE  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
      const HFONT  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' }
      const LFONT  = { bold: true, color: { argb: 'FF334155' }, size: 10, name: 'Calibri' }
      const VFONT  = { color: { argb: 'FF1E293B' }, size: 10, name: 'Calibri' }
      const CENTER = { horizontal: 'center', vertical: 'middle' }
      const MIDDLE = { vertical: 'middle' }
      const TBDR   = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } }
      const MBDR   = { bottom: { style: 'medium', color: { argb: 'FF3B82F6' } } }

      // Sheet 1 — Customer Info
      const infoWs = wb.addWorksheet('Customer Info')
      infoWs.columns = [{ key: 'label', width: 26 }, { key: 'value', width: 46 }]
      infoWs.mergeCells('A1:B1')
      const t1 = infoWs.getCell('A1')
      t1.value = `Customer — ${customer.name || 'Unnamed'}`
      t1.font = HFONT; t1.fill = NAVY; t1.alignment = CENTER
      infoWs.getRow(1).height = 26
      ;[
        ['Name', customer.name || '—'],
        ['Email', customer.email || '—'],
        ['Phone', customer.phone || '—'],
        ['Joined On', customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '—'],
        ['Total Bookings', bookings.length],
      ].forEach(([label, value]) => {
        const r = infoWs.addRow({ label, value })
        r.height = 20
        const lc = r.getCell('label'); const vc = r.getCell('value')
        lc.font = LFONT; lc.fill = LBLFIL; lc.alignment = MIDDLE; lc.border = TBDR
        vc.font = VFONT; vc.alignment = MIDDLE; vc.border = TBDR
      })

      // Sheet 2 — Bookings
      const maxTravelers = bookings.reduce((m, b) => Math.max(m, Array.isArray(b.travelers) ? b.travelers.length : 0), 0)
      const bHeaders = [
        'Booking #', 'Booking ID', 'Trip / Package', 'Destination', 'Total Days',
        'Base Price (INR)', 'Travel Date', 'Booked On',
        'Booked By', 'Booked By Email', 'Agent Code',
        'Traveler Count', 'Total Amount (INR)', 'Payment Status', 'Booking Status',
      ]
      for (let i = 1; i <= maxTravelers; i++) bHeaders.push(`Traveler ${i} Name`, `Traveler ${i} Age`)

      const bookWs = wb.addWorksheet('Bookings')
      bookWs.views = [{ state: 'frozen', ySplit: 1 }]
      bookWs.columns = bHeaders.map((h) => ({ header: h, key: h, width: Math.min(Math.max(h.length + 4, 14), 38) }))
      const bHdr = bookWs.getRow(1)
      bHdr.height = 24
      bHdr.eachCell((cell) => { cell.fill = NAVY; cell.font = HFONT; cell.alignment = CENTER; cell.border = MBDR })

      bookings.forEach((b, idx) => {
        const travelers = Array.isArray(b.travelers) ? b.travelers : []
        const row = {
          'Booking #': idx + 1, 'Booking ID': b.bookingId || '—',
          'Trip / Package': b.whitelabelPackage?.customTitle || b.package?.title || '—',
          'Destination': b.package?.destination || '—', 'Total Days': b.package?.totalDays ?? '—',
          'Base Price (INR)': Number(b.package?.basePrice || 0),
          'Travel Date': b.travelDate ? new Date(b.travelDate).toLocaleDateString() : '—',
          'Booked On': b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—',
          'Booked By': b.bookedBy?.name || '—', 'Booked By Email': b.bookedBy?.email || '—',
          'Agent Code': b.bookedBy?.agentCode || '—',
          'Traveler Count': b.travelerCount ?? travelers.length,
          'Total Amount (INR)': Number(b.totalAmount || 0),
          'Payment Status': b.paymentStatus || '—', 'Booking Status': b.bookingStatus || '—',
        }
        for (let i = 1; i <= maxTravelers; i++) {
          const t = travelers[i - 1]
          row[`Traveler ${i} Name`] = t?.name || ''; row[`Traveler ${i} Age`] = t?.age ?? ''
        }
        const r = bookWs.addRow(row)
        r.height = 18
        r.eachCell((cell) => {
          cell.fill = idx % 2 === 0 ? STRIPE : WHITE
          cell.font = VFONT; cell.alignment = MIDDLE; cell.border = TBDR
        })
      })

      const buf = await wb.xlsx.writeBuffer()
      const safeName = (customer.name || 'customer').replace(/[^a-z0-9]/gi, '-').toLowerCase()
      saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `bookings-${safeName}.xlsx`)
    } catch {
      toastRef.current.error('Export failed')
    } finally {
      setExportLoading(false)
    }
  }

  const copyId = async () => {
    if (!customer?._id) return
    try {
      await navigator.clipboard.writeText(String(customer._id))
      setCopied(true)
      toastRef.current.success('Customer ID copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toastRef.current.error('Could not copy')
    }
  }

  const profiles = Array.isArray(customer?.agencyProfiles) ? customer.agencyProfiles : []
  const displayName = customer?.name?.trim() || 'Unnamed traveler'

  if (loading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24">
        <Loader size="lg" />
        <p className="mt-4 text-xs text-gray-500">Loading customer…</p>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="animate-fade-in space-y-4">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <Link to="/admin/customers" className="font-medium text-primary-700 hover:text-primary-900">
            Customers
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          <span className="text-gray-700">Not found</span>
        </nav>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-12 text-center shadow-sm">
          <p className="text-sm text-gray-600">This customer could not be loaded.</p>
          <button
            type="button"
            onClick={() => navigate('/admin/customers')}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to customers
          </button>
        </div>
      </div>
    )
  }

  const showEmail = hasText(customer.email)
  const showPhone = hasText(customer.phone)
  const showUpdated = customer.updatedAt && formatDate(customer.updatedAt)

  return (
    <div className="animate-fade-in space-y-6">
      <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link to="/admin/customers" className="font-medium text-primary-700 hover:text-primary-900">
          Customers
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        <span className="font-medium text-gray-900 truncate max-w-[min(100%,280px)]" title={displayName}>
          {displayName}
        </span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600">
            <UserCircle2 className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">{displayName}</h1>
            <p className="mt-1 text-sm text-gray-500">Global registry and agency CRM records</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  profiles.length > 0
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}
              >
                <Link2 className="h-3 w-3" />
                {profiles.length} agency profile{profiles.length === 1 ? '' : 's'}
              </span>
              {customer.createdAt && formatDate(customer.createdAt) ? (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {formatDate(customer.createdAt)}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        {/* <button
          type="button"
          onClick={() => navigate('/admin/customers')}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </button> */}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-semibold text-gray-900">Registry</h2>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500">Customer ID</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <code className="break-all text-sm text-gray-900">{String(customer._id)}</code>
              <button
                type="button"
                onClick={copyId}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                Copy
              </button>
            </div>
          </div>
          {(showEmail || showPhone || showUpdated) && (
            <div className="grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2">
              {showEmail ? (
                <DetailRow label="Email">
                  <span className="break-all">{customer.email}</span>
                </DetailRow>
              ) : null}
              {showPhone ? (
                <DetailRow label="Mobile">
                  <span>{customer.phone}</span>
                </DetailRow>
              ) : null}
              {showUpdated ? (
                <DetailRow label="Registry last updated" className="sm:col-span-2">
                  <span>{formatDate(customer.updatedAt)}</span>
                </DetailRow>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-gray-900">Agency profiles</h2>
          {profiles.length > 0 ? (
            <span className="text-xs text-gray-500">{profiles.length} total</span>
          ) : null}
        </div>

        {profiles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 px-4 py-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-gray-800">No agency profiles yet</p>
            <p className="mt-1 text-sm text-gray-500">This traveler is not linked to any agency CRM record.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {profiles.map((profile, idx) => (
              <AgencyProfileCard key={profile._id || idx} profile={profile} index={idx} />
            ))}
          </div>
        )}
      </section>

      {/* ── Bookings ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">Bookings</h2>
            {!bookingsLoading && bookings.length > 0 && (
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                {bookings.length}
              </span>
            )}
          </div>
          {bookings.length > 0 && (
            <button
              type="button"
              onClick={handleExport}
              disabled={exportLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {exportLoading ? <Loader size="sm" /> : <Download className="h-4 w-4" strokeWidth={2} />}
              Export Excel
            </button>
          )}
        </div>

        {bookingsLoading ? (
          <div className="flex items-center justify-center py-10"><Loader size="md" /></div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 px-4 py-12 text-center">
            <Ticket className="mx-auto h-10 w-10 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-gray-800">No bookings yet</p>
            <p className="mt-1 text-sm text-gray-500">This customer has no trip bookings on record.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b, idx) => {
              const pkgTitle = b.whitelabelPackage?.customTitle || b.package?.title || '—'
              const travelers = Array.isArray(b.travelers) ? b.travelers : []
              return (
                <article key={b._id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/60 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-200 text-[10px] font-bold text-gray-600">{idx + 1}</span>
                      <Ticket className="h-4 w-4 shrink-0 text-primary-600" strokeWidth={2} />
                      <span className="font-mono text-sm font-semibold text-gray-900">{b.bookingId || '—'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        b.paymentStatus === 'paid' ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : b.paymentStatus === 'partial' ? 'border-sky-200 bg-sky-50 text-sky-800'
                        : b.paymentStatus === 'refunded' ? 'border-violet-200 bg-violet-50 text-violet-800'
                        : 'border-amber-200 bg-amber-50 text-amber-800'
                      }`}>{b.paymentStatus || 'pending'}</span>
                      <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        b.bookingStatus === 'confirmed' ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : b.bookingStatus === 'ongoing' ? 'border-sky-200 bg-sky-50 text-sky-800'
                        : b.bookingStatus === 'completed' ? 'border-gray-200 bg-gray-100 text-gray-700'
                        : 'border-red-200 bg-red-50 text-red-800'
                      }`}>{b.bookingStatus || 'confirmed'}</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <DetailRow label="Trip / Package"><span className="truncate block">{pkgTitle}</span></DetailRow>
                      {b.package?.destination && (
                        <DetailRow label="Destination">
                          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />{b.package.destination}</span>
                        </DetailRow>
                      )}
                      <DetailRow label="Travel Date">
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />{b.travelDate ? new Date(b.travelDate).toLocaleDateString() : '—'}</span>
                      </DetailRow>
                      <DetailRow label="Booked On">
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}</span>
                      </DetailRow>
                      <DetailRow label="Total Amount">
                        <span className="inline-flex items-center gap-1 font-semibold tabular-nums"><IndianRupee className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />{Number(b.totalAmount || 0).toLocaleString('en-IN')}</span>
                      </DetailRow>
                      <DetailRow label="Travelers">
                        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />{b.travelerCount ?? travelers.length}</span>
                      </DetailRow>
                      {b.bookedBy && (
                        <DetailRow label="Booked By" className="sm:col-span-2">
                          <span>{b.bookedBy.name || '—'}</span>
                          {b.bookedBy.agentCode && (
                            <span className="ml-2 rounded bg-primary-50 px-1.5 py-0.5 font-mono text-[10px] text-primary-700">{b.bookedBy.agentCode}</span>
                          )}
                        </DetailRow>
                      )}
                    </div>

                    {travelers.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold text-gray-700">Travelers</p>
                        <div className="overflow-hidden rounded-xl border border-gray-100">
                          <table className="w-full text-sm">
                            <thead className="border-b border-gray-100 bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">#</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">Name</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">Age</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {travelers.map((t, i) => (
                                <tr key={i} className="hover:bg-gray-50/50">
                                  <td className="px-3 py-2 text-xs text-gray-500">{i + 1}</td>
                                  <td className="px-3 py-2 text-xs font-medium text-gray-900">{t.name || '—'}</td>
                                  <td className="px-3 py-2 text-xs text-gray-700">{t.age ?? '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
