import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Package,
  MapPin,
  User,
  Clock,
  Search,
  Eye,
  Download,
  MessageSquare,
  Calendar,
  Layers,
  Ticket,
  Star,
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import Modal from '@/shared/components/Modal.jsx'
import CustomDropdown from '@/shared/components/CustomDropdown.jsx'
import Pagination from '@/admin/components/Pagination.jsx'
import { exportToExcel } from '@/admin/utils/exportExcel.js'

/** Neutral count pill — matches other admin tables (gray border / soft bg) */
const countPillClass =
  'inline-flex min-w-[2.25rem] items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium tabular-nums text-gray-800'

const getFileUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  const base = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
  return `${base}/${String(path).replace(/^\//, '')}`
}

const dayActivities = (day) => {
  if (!day) return []
  if (Array.isArray(day.experiences) && day.experiences.length) return day.experiences
  if (Array.isArray(day.events) && day.events.length) return day.events
  return []
}

const activityTitle = (ev) => ev?.name || ev?.title || 'Activity'

function PackageDetailModal({ isOpen, onClose, pkg }) {
  if (!isOpen || !pkg) return null

  const price = Number(pkg.basePrice) || 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Package details" size="xl">
      <div className="space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">{pkg.title}</h2>
              {pkg.destination ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-700">
                  <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  {pkg.destination}
                </span>
              ) : null}
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              {pkg.description?.trim() || 'No description provided.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-800">
                <Clock className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
                {pkg.totalDays ?? '—'} days
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-800">
                <User className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
                Max {pkg.maxCapacity ?? '—'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-800">
                <Package className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
                {pkg.currency || 'INR'}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium ${pkg.isActive
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-gray-200 bg-gray-100 text-gray-700'
                  }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${pkg.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                {pkg.isActive ? 'Active' : 'Inactive'}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-800"
                title="Total bookings for this package"
              >
                <Ticket className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
                {`${Number(pkg.bookingCount) || 0} booking${(Number(pkg.bookingCount) || 0) === 1 ? '' : 's'
                  }`}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-800"
                title="Whitelabel copies of this package"
              >
                <Layers className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
                {`${Number(pkg.whitelabelCount) || 0} whitelabel${(Number(pkg.whitelabelCount) || 0) === 1 ? '' : 's'
                  }`}
              </span>
            </div>
          </div>
          <div className="min-w-[160px] shrink-0 rounded-xl border border-gray-200 bg-gray-50/80 px-5 py-4 text-center">
            <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Base price</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">₹{price.toLocaleString('en-IN')}</div>
            <div className="mt-0.5 text-[11px] text-gray-500">Per person</div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">Parent agency</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <div className="text-[11px] font-medium text-gray-500">Name</div>
              <div className="mt-0.5 text-sm font-semibold text-gray-900">{pkg.createdBy?.name || '—'}</div>
              <div className="mt-1 text-xs font-medium text-primary-700">{pkg.createdBy?.agentCode || '—'}</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <div className="text-[11px] font-medium text-gray-500">Email</div>
              <div className="mt-0.5 truncate text-sm font-medium text-gray-900">{pkg.createdBy?.email || '—'}</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <div className="text-[11px] font-medium text-gray-500">Phone</div>
              <div className="mt-0.5 text-sm font-medium text-gray-900">{pkg.createdBy?.phone || '—'}</div>
            </div>
          </div>
        </div>

        {(pkg.inclusions?.length > 0 || pkg.exclusions?.length > 0 || pkg.importantNotes?.length > 0) && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {pkg.inclusions?.length > 0 ? (
              <div className="rounded-lg border border-gray-100 bg-white p-3">
                <h4 className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Inclusions</h4>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700">
                  {pkg.inclusions.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {pkg.exclusions?.length > 0 ? (
              <div className="rounded-lg border border-gray-100 bg-white p-3">
                <h4 className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Exclusions</h4>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700">
                  {pkg.exclusions.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {pkg.importantNotes?.length > 0 ? (
              <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-3 md:col-span-3">
                <h4 className="text-[11px] font-medium uppercase tracking-wide text-amber-900/80">Important notes</h4>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-950/90">
                  {pkg.importantNotes.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">Itinerary</h3>
            <span className="text-xs text-gray-400">{pkg.itinerary?.length || 0} days</span>
          </div>
          <div className="max-h-[min(55vh,480px)] space-y-3 overflow-y-auto pr-1">
            {pkg.itinerary?.length ? (
              pkg.itinerary.map((day, idx) => {
                const acts = dayActivities(day)
                return (
                  <div key={idx} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-900 text-xs font-semibold text-white">
                          {day.day ?? idx + 1}
                        </div>
                        <span className="truncate text-sm font-semibold text-gray-900">{day.title || `Day ${day.day ?? idx + 1}`}</span>
                      </div>
                      {day.dateSuffix ? (
                        <span className="shrink-0 text-[11px] text-gray-500">{day.dateSuffix}</span>
                      ) : null}
                    </div>
                    {day.description ? (
                      <p className="border-b border-gray-100 bg-white px-3 py-2 text-xs text-gray-600">{day.description}</p>
                    ) : null}
                    <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">
                      {acts.length ? (
                        acts.map((ev, eIdx) => (
                          <div
                            key={eIdx}
                            className="flex gap-2 rounded-lg border border-gray-100 bg-gray-50/50 p-2.5"
                          >
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400">
                              <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-gray-900">{activityTitle(ev)}</div>
                              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                                {(ev.category || ev.type) && (
                                  <span className="rounded bg-white px-1.5 py-0.5 font-medium capitalize text-primary-800 ring-1 ring-primary-100">
                                    {ev.category || ev.type}
                                  </span>
                                )}
                                {ev.startTime ? (
                                  <span>
                                    {ev.startTime}
                                    {ev.endTime ? ` – ${ev.endTime}` : ''}
                                  </span>
                                ) : null}
                              </div>
                              {ev.description ? (
                                <p className="mt-1 text-[11px] leading-snug text-gray-600">{ev.description}</p>
                              ) : null}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="col-span-full text-center text-xs text-gray-400">No activities for this day</p>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-gray-500">No itinerary data.</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">Cover & gallery</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {pkg.coverImage ? (
              <img
                src={getFileUrl(pkg.coverImage)}
                alt=""
                className="h-24 w-32 rounded-lg border border-gray-200 object-cover"
              />
            ) : null}
            {pkg.images?.map((img, i) => (
              <img key={i} src={getFileUrl(img)} alt="" className="h-24 w-32 rounded-lg border border-gray-200 object-cover" />
            ))}
            {!pkg.coverImage && (!pkg.images || pkg.images.length === 0) ? (
              <p className="text-xs text-gray-400">No images</p>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  )
}

function activeStatusBadgeClass(isActive) {
  return isActive
    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
    : 'border-gray-200 bg-gray-100 text-gray-700'
}

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=120'

function readParentAgencyIdFromUrl() {
  if (typeof window === 'undefined') return 'all'
  try {
    const raw = new URLSearchParams(window.location.search).get('parentAgencyId')
    const id = raw != null ? String(raw).trim() : ''
    if (id && /^[a-f\d]{24}$/i.test(id)) return id
  } catch {
    /* ignore */
  }
  return 'all'
}

export default function Packages() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('all')
  const [parentFilter, setParentFilter] = useState(readParentAgencyIdFromUrl)
  const [parentOptions, setParentOptions] = useState([{ value: 'all', label: 'All parent agencies' }])
  const [selectedPkg, setSelectedPkg] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [chatContext, setChatContext] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)

  /** Ignore stale listPackages responses when parent/page/search changes quickly (e.g. deep link from Agencies). */
  const packagesFetchIdRef = useRef(0)

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
    []
  )

  const parentDropdownOptions = useMemo(() => {
    if (parentFilter === 'all') return parentOptions
    const has = parentOptions.some((o) => o.value === parentFilter)
    if (has) return parentOptions
    return [
      ...parentOptions,
      { value: parentFilter, label: 'Parent agency' },
    ]
  }, [parentOptions, parentFilter])

  useEffect(() => {
    const id = setTimeout(() => {
      const next = searchInput.trim()
      setDebouncedSearch((prev) => {
        if (next !== prev) queueMicrotask(() => setPage(1))
        return next
      })
    }, 400)
    return () => clearTimeout(id)
  }, [searchInput])

  const handleParentChange = useCallback(
    (v) => {
      setPage(1)
      setParentFilter(v)
      setSearchParams(v && v !== 'all' ? { parentAgencyId: v } : {})
    },
    [setSearchParams]
  )

  /** Keep parent filter in sync with ?parentAgencyId= (e.g. deep link from Parent Agencies) */
  useEffect(() => {
    const raw = searchParams.get('parentAgencyId')
    const id = raw != null ? String(raw).trim() : ''
    if (!id || !/^[a-f\d]{24}$/i.test(id)) {
      setParentFilter('all')
      return
    }
    setParentFilter(id)
    setPage(1)
  }, [searchParams])

  const handleStatusChange = useCallback((v) => {
    setPage(1)
    setStatusFilter(v)
  }, [])

  useEffect(() => {
    const loadParents = async () => {
      try {
        const { data } = await adminApi.listAgents({ role: 'parent_agent', limit: 300, page: 1 })
        if (data?.success && Array.isArray(data.data?.agents)) {
          setParentOptions([
            { value: 'all', label: 'All parent agencies' },
            ...data.data.agents.map((a) => ({
              value: String(a._id),
              label: `${a.name}${a.agentCode ? ` (${a.agentCode})` : ''}`,
            })),
          ])
        }
      } catch {
        setParentOptions([{ value: 'all', label: 'All parent agencies' }])
      }
    }
    loadParents()
  }, [])

  const loadPackages = useCallback(async () => {
    const fetchId = ++packagesFetchIdRef.current
    setLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(parentFilter !== 'all' ? { parentAgencyId: parentFilter } : {}),
      }
      const { data } = await adminApi.listPackages(params)
      if (fetchId !== packagesFetchIdRef.current) return
      if (data?.success && data.data) {
        setPackages(Array.isArray(data.data.packages) ? data.data.packages : [])
        setTotalPages(data.data.totalPages ?? 1)
        setTotal(typeof data.data.total === 'number' ? data.data.total : 0)
      } else {
        setPackages([])
        setTotalPages(1)
        setTotal(0)
      }
    } catch {
      if (fetchId !== packagesFetchIdRef.current) return
      toastRef.current.error('Could not load packages')
      setPackages([])
    } finally {
      if (fetchId === packagesFetchIdRef.current) setLoading(false)
    }
  }, [page, debouncedSearch, statusFilter, parentFilter])

  useEffect(() => {
    loadPackages()
  }, [loadPackages])

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false)
    setSelectedPkg(null)
  }, [])

  const openChat = useCallback(
    (pkg) => {
      const title = encodeURIComponent(pkg.title || 'Package')
      navigate(`/admin/packages/${String(pkg._id)}/community?title=${title}`)
    },
    [navigate]
  )

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const { data } = await adminApi.listPackages({
        page: 1, limit: 10000,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(parentFilter !== 'all' ? { parentAgencyId: parentFilter } : {}),
      })
      await exportToExcel(
        (data?.data?.packages ?? []).map((p) => ({
          Title: p.title || '', Destination: p.destination || '',
          'Total Days': p.totalDays ?? '', 'Base Price (INR)': Number(p.basePrice) || 0,
          Currency: p.currency || 'INR', 'Max Capacity': p.maxCapacity ?? '',
          Status: p.isActive ? 'Active' : 'Inactive',
          'Agency Name': p.createdBy?.name || '', 'Agency Code': p.createdBy?.agentCode || '',
          'Agency Email': p.createdBy?.email || '',
          Whitelabels: Number(p.whitelabelCount) || 0, Bookings: Number(p.bookingCount) || 0,
          'Created On': p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
        })),
        'packages', 'Packages'
      )
    } catch { toastRef.current.error('Export failed') }
    finally { setExportLoading(false) }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Packages Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Inventory from parent agencies (including packages created by their network). Status is active or inactive.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exportLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
        >
          {exportLoading ? <Loader size="sm" /> : <Download size={16} strokeWidth={2} />}
          Export
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
            <input
              type="search"
              placeholder="Search title or destination…"
              autoComplete="off"
              className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="flex w-full gap-3 sm:w-auto">
            <div className="min-w-0 flex-1 lg:min-w-[200px] lg:max-w-xs">
              <CustomDropdown
                value={parentFilter}
                onChange={handleParentChange}
                options={parentDropdownOptions}
                searchable
                truncateLength={42}
                maxHeight="280px"
                className="w-full"
                buttonClassName="!border-gray-200 !py-2"
              />
            </div>
            <div className="min-w-0 sm:min-w-[140px] lg:w-40">
              <CustomDropdown
                value={statusFilter}
                onChange={handleStatusChange}
                options={statusOptions}
                className="w-full"
                buttonClassName="!border-gray-200 !py-2"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader size="lg" />
            <p className="mt-4 text-xs text-gray-500">Loading packages…</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <Package className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-gray-900">No packages found</p>
            <p className="mt-1 text-sm text-gray-500">Try adjusting search or filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Package</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Days</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Price</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Agency</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Whitelabels</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Bookings</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Status</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {packages.map((pkg) => (
                    <tr key={String(pkg._id)} className="group transition-colors hover:bg-gray-50/80">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="h-11 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                            <img
                              src={getFileUrl(pkg.coverImage) || PLACEHOLDER_IMG}
                              alt=""
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = PLACEHOLDER_IMG
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-gray-900">{pkg.title}</div>
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
                              <span className="truncate">{pkg.destination || '—'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-800">{pkg.totalDays ?? '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums text-gray-900">
                        ₹{(Number(pkg.basePrice) || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="max-w-[220px] px-4 py-3">
                        <div className="truncate font-medium text-gray-900">{pkg.createdBy?.name || '—'}</div>
                        <div className="truncate text-xs text-gray-500">{pkg.createdBy?.agentCode || '—'}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/packages/${String(pkg._id)}/whitelabels`)}
                          className={`${countPillClass} cursor-pointer transition-colors hover:border-gray-300 hover:bg-gray-100`}
                          title="View all whitelabel offers for this package"
                        >
                          <Layers className="h-3.5 w-3.5 shrink-0 text-gray-500" strokeWidth={2} />
                          {Number(pkg.whitelabelCount) || 0}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/packages/${String(pkg._id)}/bookings`)}
                          className={`${countPillClass} cursor-pointer transition-colors hover:border-gray-300 hover:bg-gray-100`}
                          title="View all bookings for this package"
                        >
                          <Ticket className="h-3.5 w-3.5 shrink-0 text-gray-500" strokeWidth={2} />
                          {Number(pkg.bookingCount) || 0}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${activeStatusBadgeClass(pkg.isActive)}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${pkg.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {pkg.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPkg(pkg)
                              setIsDetailOpen(true)
                            }}
                            className="inline-flex cursor-pointer rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:border-primary-200 hover:text-primary-700 active:scale-95"
                            title="View details"
                            aria-label={`View ${pkg.title}`}
                          >
                            <Eye className="h-4 w-4" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openChat(pkg)}
                            className="inline-flex cursor-pointer rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:border-emerald-200 hover:text-emerald-700 active:scale-95"
                            title="Community chat"
                            aria-label={`Community chat for ${pkg.title}`}
                          >
                            <MessageSquare className="h-4 w-4" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/packages/${String(pkg._id)}/reviews?readOnly=true`)}
                            className="inline-flex cursor-pointer rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:border-amber-200 hover:text-amber-600 active:scale-95"
                            title="View reviews"
                            aria-label={`Reviews for ${pkg.title}`}
                          >
                            <Star className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={10}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <PackageDetailModal isOpen={isDetailOpen} onClose={closeDetail} pkg={selectedPkg} />
    </div>
  )
}
