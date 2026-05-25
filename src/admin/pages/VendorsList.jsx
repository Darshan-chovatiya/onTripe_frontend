import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, Search, Mail, Phone, Building2, Download, Eye, MapPin } from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import Pagination from '@/admin/components/Pagination.jsx'
import { exportToExcel } from '@/admin/utils/exportExcel.js'

export default function VendorsList() {
  const navigate = useNavigate()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const { toast } = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast
  const [exportLoading, setExportLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => { setPage(1) }, [debouncedSearch])

  const fetchVendors = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.listAllVendors({
        page,
        limit: 10,
        type: typeFilter === 'all' ? undefined : typeFilter,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      })
      const payload = data?.data
      if (data?.success && payload) {
        const rows = Array.isArray(payload.vendors) ? payload.vendors : []
        setVendors(rows)
        const tp = payload.totalPages
        setTotalPages(typeof tp === 'number' && tp > 0 ? tp : 1)
        setTotal(typeof payload.totalCount === 'number' ? payload.totalCount : 0)
      } else {
        setVendors([])
        setTotalPages(1)
        toastRef.current.error(data?.message || 'Could not load vendors')
      }
    } catch (err) {
      setVendors([])
      setTotalPages(1)
      toastRef.current.error(err?.response?.data?.message || 'Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, typeFilter])

  useEffect(() => { fetchVendors() }, [fetchVendors])

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const { data } = await adminApi.listAllVendors({ 
        page: 1, 
        limit: 10000, 
        type: typeFilter === 'all' ? undefined : typeFilter,
        ...(debouncedSearch ? { search: debouncedSearch } : {}) 
      })
      await exportToExcel(
        (data?.data?.vendors ?? []).map((v) => ({
          Name: v.name || '', Email: v.email || '', Phone: v.phone || '',
          Type: v.type || '', City: v.city || '', State: v.state || '',
          'Parent Agent': v.createdBy?.name || '',
          'Joined On': v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '',
        })),
        'vendors', 'Vendors'
      )
    } catch { toastRef.current.error('Export failed') }
    finally { setExportLoading(false) }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Vendors</h1>
          <p className="mt-1 text-sm text-gray-500">Platform vendor registry — search by name, email, or phone.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exportLoading || vendors.length === 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
        >
          {exportLoading ? <Loader size="sm" /> : <Download size={16} strokeWidth={2} />}
          Export
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
            <input
              type="search"
              placeholder="Search name, email, or phone…"
              autoComplete="off"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-200"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-64">
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 px-3 text-sm text-gray-900 focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-200"
            >
              <option value="all">All Types</option>
              <option value="hotel">Hotel</option>
              <option value="restaurant">Restaurant</option>
              <option value="transport">Transport</option>
              <option value="activity_provider">Activity Provider</option>
              <option value="guide">Guide</option>
              <option value="cruise">Cruise</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader size="lg" />
            <p className="mt-4 text-xs text-gray-500">Loading vendors…</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <Store className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-gray-900">No vendors found</p>
            <p className="mt-1 text-sm text-gray-500">Try another search or filter.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/60">
                  <tr>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Vendor Info</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Type & Status</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Contact</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Parent Agent</th>
                    <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {vendors.map((v) => {
                    const initials = (v.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                    return (
                      <tr key={v._id} className="group transition-colors hover:bg-gray-50/60">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-[11px] font-bold text-white shadow-sm">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">{v.name}</p>
                              {v.city && (
                                <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                  <MapPin className="h-3 w-3" /> {v.city}{v.state ? `, ${v.state}` : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 capitalize">
                              {v.type || 'Unknown'}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${v.isActive ? 'text-green-600' : 'text-red-600'}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${v.isActive ? 'bg-green-600' : 'bg-red-600'}`} />
                              {v.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="max-w-[200px] px-5 py-3.5 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
                            <span className="truncate text-xs text-gray-700" title={v.email || ''}>{v.email || '—'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
                            <span className="text-xs font-medium text-gray-900">{v.phone || '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {v.createdBy ? (
                            <div>
                              <p className="text-sm font-medium text-gray-900">{v.createdBy.name}</p>
                              <p className="text-xs text-gray-500">{v.createdBy.agentCode}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">None</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/vendors/${v._id}`)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                          >
                            <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
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
