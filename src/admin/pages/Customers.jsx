import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Search, Mail, Phone, Building2, Download } from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import Pagination from '@/admin/components/Pagination.jsx'
import { exportToExcel } from '@/admin/utils/exportExcel.js'

export default function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
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

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.listCustomers({
        page,
        limit: 10,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      })
      const payload = data?.data
      if (data?.success && payload) {
        const rows = Array.isArray(payload.customers) ? payload.customers : []
        setCustomers(rows)
        const tp = payload.totalPages
        setTotalPages(typeof tp === 'number' && tp > 0 ? tp : 1)
        setTotal(typeof payload.totalCount === 'number' ? payload.totalCount : 0)
      } else {
        setCustomers([])
        setTotalPages(1)
        toastRef.current.error(data?.message || 'Could not load customers')
      }
    } catch (err) {
      setCustomers([])
      setTotalPages(1)
      const msg = err?.response?.data?.message || err?.message || 'Failed to load customers'
      toastRef.current.error(msg)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const profileCount = (c) => (Array.isArray(c.agencyProfiles) ? c.agencyProfiles.length : 0)

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const { data } = await adminApi.listCustomers({ page: 1, limit: 10000, ...(debouncedSearch ? { search: debouncedSearch } : {}) })
      await exportToExcel(
        (data?.data?.customers ?? []).map((c) => ({
          Name: c.name || '', Email: c.email || '', Phone: c.phone || '',
          'Agency Profiles': Array.isArray(c.agencyProfiles) ? c.agencyProfiles.length : 0,
          'Joined On': c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
        })),
        'customers', 'Customers'
      )
    } catch { toastRef.current.error('Export failed') }
    finally { setExportLoading(false) }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">Platform traveler registry — search by name, email, or phone.</p>
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

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
            <input
              type="search"
              placeholder="Search name, email, or phone…"
              autoComplete="off"
              className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader size="lg" />
            <p className="mt-4 text-xs text-gray-500">Loading customers…</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <Users className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-gray-900">No customers found</p>
            <p className="mt-1 text-sm text-gray-500">Try another search.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Customer</th>
                    <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Email</th>
                    <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Mobile</th>
                    <th className="px-4 py-2.5 text-left align-middle text-xs font-medium text-gray-600">Joined</th>
                    <th className="px-4 py-2.5 text-center align-middle text-xs font-medium text-gray-600">
                      Agency profiles
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((c) => (
                    <tr key={c._id} className="group transition-colors hover:bg-gray-50/80">
                      <td className="align-middle px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500 transition-transform group-hover:scale-[1.02]">
                            <Users className="h-4 w-4" strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-gray-900">{c.name || 'Unnamed'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[220px] align-middle px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
                          <span className="truncate text-xs text-gray-800" title={c.email || ''}>
                            {c.email || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="align-middle px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
                          <span className="text-xs font-medium text-gray-900">{c.phone || '—'}</span>
                        </div>
                      </td>
                      <td className="align-middle whitespace-nowrap px-4 py-2.5 text-center text-xs text-gray-600 sm:text-left">
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="align-middle px-4 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/customers/${c._id}`)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-900"
                          title="View agency profiles and full profile"
                        >
                          <Building2 className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
                          <span className="tabular-nums font-semibold">{profileCount(c)}</span>
                        </button>
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
