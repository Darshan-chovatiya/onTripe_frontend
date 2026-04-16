import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Package,
  MapPin,
  User,
  Search,
  Eye,
  Download,
  MessageSquare,
  Layers,
  Ticket,
  Star,
  IndianRupee,
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import CustomDropdown from '@/shared/components/CustomDropdown.jsx'
import Pagination from '@/admin/components/Pagination.jsx'

/** Neutral count pill — matches other admin tables (gray border / soft bg) */
const countPillClass =
  'inline-flex min-w-[2.25rem] items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium tabular-nums text-gray-800'

const getFileUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  const base = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
  return `${base}/${String(path).replace(/^\//, '')}`
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
  const [exportLoading, setExportLoading] = useState(false)
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
      const pkgs = data?.data?.packages ?? []

      const ExcelJS = (await import('exceljs')).default
      const { saveAs } = await import('file-saver')
      const wb = new ExcelJS.Workbook()
      wb.creator = 'OnTrip Admin'; wb.created = new Date()

      const NAVY = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
      const LBLFIL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
      const STRIPE = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      const WHITE = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
      const HFONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' }
      const LFONT = { bold: true, color: { argb: 'FF334155' }, size: 10, name: 'Calibri' }
      const VFONT = { color: { argb: 'FF1E293B' }, size: 10, name: 'Calibri' }
      const CENTER = { horizontal: 'center', vertical: 'middle' }
      const WRAP = { vertical: 'middle', wrapText: true }
      const MIDDLE = { vertical: 'middle' }
      const TBDR = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } }
      const MBDR = { bottom: { style: 'medium', color: { argb: 'FF3B82F6' } } }

      const styleHdr = (ws, height = 24) => {
        const r = ws.getRow(1); r.height = height
        r.eachCell((c) => { c.fill = NAVY; c.font = HFONT; c.alignment = CENTER; c.border = MBDR })
      }
      const styleData = (row, idx) => {
        row.height = 18
        row.eachCell((c) => { c.fill = idx % 2 === 0 ? STRIPE : WHITE; c.font = VFONT; c.alignment = MIDDLE; c.border = TBDR })
      }

      // ── Sheet 1: Packages Summary ──────────────────────────────────
      const sumWs = wb.addWorksheet('Packages')
      sumWs.views = [{ state: 'frozen', ySplit: 1 }]
      const sumHeaders = [
        '#', 'Title', 'Destination', 'Total Days', 'Base Price (INR)', 'Currency',
        'Max Capacity', 'Status', 'Approval Status',
        'Agency Name', 'Agency Code', 'Agency Email', 'Agency Phone',
        'Inclusions', 'Exclusions', 'Important Notes',
        'Whitelabels', 'Bookings', 'Created On',
      ]
      sumWs.columns = sumHeaders.map((h) => ({ header: h, key: h, width: Math.min(Math.max(h.length + 4, 14), 42) }))
      styleHdr(sumWs)

      pkgs.forEach((p, idx) => {
        const r = sumWs.addRow({
          '#': idx + 1,
          'Title': p.title || '',
          'Destination': p.destination || '',
          'Total Days': p.totalDays ?? '',
          'Base Price (INR)': Number(p.basePrice) || 0,
          'Currency': p.currency || 'INR',
          'Max Capacity': p.maxCapacity ?? '',
          'Status': p.isActive ? 'Active' : 'Inactive',
          'Approval Status': p.status || 'approved',
          'Agency Name': p.createdBy?.name || '',
          'Agency Code': p.createdBy?.agentCode || '',
          'Agency Email': p.createdBy?.email || '',
          'Agency Phone': p.createdBy?.phone || '',
          'Inclusions': Array.isArray(p.inclusions) ? p.inclusions.join('\n') : '',
          'Exclusions': Array.isArray(p.exclusions) ? p.exclusions.join('\n') : '',
          'Important Notes': Array.isArray(p.importantNotes) ? p.importantNotes.join('\n') : '',
          'Whitelabels': Number(p.whitelabelCount) || 0,
          'Bookings': Number(p.bookingCount) || 0,
          'Created On': p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
        })
        r.height = 20
        r.eachCell((c) => {
          c.fill = idx % 2 === 0 ? STRIPE : WHITE; c.font = VFONT
          c.alignment = WRAP; c.border = TBDR
        })
      })

      // ── Sheet 2: Itinerary (one row per day per package) ──────────
      const itnWs = wb.addWorksheet('Itinerary')
      itnWs.views = [{ state: 'frozen', ySplit: 1 }]
      const itnHeaders = [
        'Package Title', 'Day #', 'Day Title', 'Day Description',
        'Breakfast', 'Lunch', 'Dinner',
        'Activity #', 'Activity Name', 'Category', 'Activity Description',
        'Location', 'Start Time', 'End Time', 'Duration (min)',
        'Optional', 'Highlight', 'Included in Price', 'Extra Cost',
        'Difficulty', 'Min Age', 'Max Age',
      ]
      itnWs.columns = itnHeaders.map((h) => ({ header: h, key: h, width: Math.min(Math.max(h.length + 4, 12), 40) }))
      styleHdr(itnWs)

      let itnIdx = 0
      pkgs.forEach((p) => {
        const itinerary = Array.isArray(p.itinerary) ? p.itinerary : []
        if (itinerary.length === 0) {
          // still add one row so the package appears
          const r = itnWs.addRow({ 'Package Title': p.title || '', 'Day #': '—' })
          styleData(r, itnIdx++)
          return
        }
        itinerary.forEach((day) => {
          const experiences = Array.isArray(day.experiences) ? day.experiences : []
          const meals = day.meals || {}
          if (experiences.length === 0) {
            const r = itnWs.addRow({
              'Package Title': p.title || '', 'Day #': day.day ?? '',
              'Day Title': day.title || '', 'Day Description': day.description || '',
              'Breakfast': meals.breakfast ? 'Yes' : 'No',
              'Lunch': meals.lunch ? 'Yes' : 'No',
              'Dinner': meals.dinner ? 'Yes' : 'No',
            })
            styleData(r, itnIdx++)
          } else {
            experiences.forEach((exp, ei) => {
              const r = itnWs.addRow({
                'Package Title': p.title || '', 'Day #': day.day ?? '',
                'Day Title': day.title || '', 'Day Description': day.description || '',
                'Breakfast': meals.breakfast ? 'Yes' : 'No',
                'Lunch': meals.lunch ? 'Yes' : 'No',
                'Dinner': meals.dinner ? 'Yes' : 'No',
                'Activity #': ei + 1,
                'Activity Name': exp.name || '',
                'Category': exp.category || '',
                'Activity Description': exp.description || '',
                'Location': exp.location || '',
                'Start Time': exp.startTime || '',
                'End Time': exp.endTime || '',
                'Duration (min)': exp.durationMinutes ?? '',
                'Optional': exp.isOptional ? 'Yes' : 'No',
                'Highlight': exp.isHighlight ? 'Yes' : 'No',
                'Included in Price': exp.includedInPrice !== false ? 'Yes' : 'No',
                'Extra Cost': exp.extraCost ?? 0,
                'Difficulty': exp.difficulty || '',
                'Min Age': exp.minAge ?? '',
                'Max Age': exp.maxAge ?? '',
              })
              styleData(r, itnIdx++)
            })
          }
        })
      })

      const buf = await wb.xlsx.writeBuffer()
      saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'packages.xlsx')
    } catch (e) {
      console.error(e)
      toastRef.current.error('Export failed')
    } finally {
      setExportLoading(false)
    }
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
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-600">Revenue</th>
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
                        <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-emerald-800">
                          <IndianRupee className="h-3 w-3 shrink-0" strokeWidth={2.5} />
                          {(Number(pkg.totalRevenue) || 0).toLocaleString('en-IN')}
                        </span>
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
                            onClick={() => navigate(`/admin/packages/${pkg._id}/detail`)}
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
    </div>
  )
}

