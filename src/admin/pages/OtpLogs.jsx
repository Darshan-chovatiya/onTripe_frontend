import { useEffect, useState } from 'react'
import {
  Clock,
  Search,
  Key,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  History,
  ShieldCheck,
  RefreshCcw,
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import Pagination from '@/admin/components/Pagination.jsx'

export default function OtpLogs() {
  const { toast } = useToast()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(searchQuery) }, 400)
    return () => clearTimeout(handler)
  }, [searchQuery])

  useEffect(() => { setPage(1) }, [debouncedSearch])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.getOtpLogs({
        page,
        limit: 10,
        search: debouncedSearch || undefined
      })
      if (data?.success) {
        setLogs(data.data.logs || [])
        setTotalPages(data.data.totalPages || 1)
        setTotal(data.data.totalCount || 0)
      }
    } catch (error) {
      toast.error('Failed to fetch OTP logs')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, debouncedSearch])

  const getStatus = (log) => {
    if (log.used) return { label: 'Used', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle }
    const now = new Date()
    const expiry = new Date(log.expiresAt)
    if (now > expiry) return { label: 'Expired', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle }
    return { label: 'Active', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 shadow-sm">
              <ShieldCheck size={24} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">OTP Requests Monitor</h1>
              <p className="text-sm text-gray-500">Monitor all platform security codes and verification status in real-time.</p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex w-full justify-center sm:w-auto items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by phone or email..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader size="lg" />
            <p className="mt-4 text-sm font-medium text-gray-500">Retrieving security logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300">
              <History size={32} />
            </div>
            <p className="mt-4 text-base font-semibold text-gray-900">No OTP logs found</p>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-6 py-4 font-semibold text-gray-700 uppercase tracking-wider text-[11px]">Verification Target</th>
                    <th className="px-6 py-4 font-semibold text-gray-700 uppercase tracking-wider text-[11px]">Security Code</th>
                    <th className="px-6 py-4 font-semibold text-gray-700 uppercase tracking-wider text-[11px]">Timeline</th>
                    <th className="px-6 py-4 font-semibold text-gray-700 uppercase tracking-wider text-[11px]">Expiry</th>
                    <th className="px-6 py-4 font-semibold text-gray-700 uppercase tracking-wider text-[11px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((log) => {
                    const status = getStatus(log)
                    const StatusIcon = status.icon
                    return (
                      <tr key={log._id} className="group transition-colors hover:bg-gray-50/80">
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {log.phone && (
                              <div className="flex items-center gap-2">
                                <Phone size={14} className="text-gray-400" />
                                <span className="font-medium text-gray-900">{log.phone}</span>
                              </div>
                            )}
                            {log.email && (
                              <div className="flex items-center gap-2">
                                <Mail size={14} className="text-gray-400" />
                                <span className="font-medium text-gray-900">{log.email}</span>
                              </div>
                            )}
                            {!log.phone && !log.email && <span className="italic text-gray-400 text-xs">Unknown target</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 font-mono text-base font-bold text-primary-700">
                            <Key size={14} className="text-primary-400" />
                            {log.otp}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-medium">
                              {new Date(log.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(log.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-medium">
                              {new Date(log.expiresAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`text-[10px] font-bold uppercase ${new Date() > new Date(log.expiresAt) ? 'text-red-400' : 'text-blue-400'}`}>
                              {new Date() > new Date(log.expiresAt) ? 'Expired' : 'Valid until'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${status.color}`}>
                            <StatusIcon size={12} strokeWidth={2.5} />
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={10}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
