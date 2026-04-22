import { useState, useEffect } from 'react'
import { Search, RotateCcw, Calendar, Phone, Hash, Clock, CheckCircle, XCircle } from 'lucide-react'
import { getOtpLogs } from '../services/otpService'
import Pagination from '../components/Pagination'

export default function OtpLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const data = await getOtpLogs({ page, search })
      if (data.success) {
        setLogs(data.data.logs)
        setTotalPages(data.data.totalPages)
        setTotalCount(data.data.totalCount)
      }
    } catch (error) {
      console.error('Failed to fetch OTP logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchLogs()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OTP Logs</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and monitor all platform OTP requests and their status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPage(1)
              fetchLogs()
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <RotateCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4 sm:p-5">
          <form onSubmit={handleSearch} className="flex max-w-md items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by phone number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Search
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500">
                <th className="px-5 py-3 font-semibold text-gray-600">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    Phone Number
                  </div>
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  <div className="flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5" />
                    OTP
                  </div>
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Status
                  </div>
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    Expires At
                  </div>
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    Requested Date
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-28 rounded bg-gray-100"></div></td>
                    <td className="px-5 py-4"><div className="h-4 w-12 rounded bg-gray-100"></div></td>
                    <td className="px-5 py-4"><div className="h-6 w-20 rounded-full bg-gray-100"></div></td>
                    <td className="px-5 py-4"><div className="h-4 w-32 rounded bg-gray-100"></div></td>
                    <td className="px-5 py-4"><div className="h-4 w-32 rounded bg-gray-100"></div></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Hash className="h-8 w-8 text-gray-300" />
                      <p>No OTP logs found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpired = new Date(log.expiresAt) < new Date()
                  return (
                    <tr key={log._id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-5 py-4 font-medium text-gray-900">{log.phone}</td>
                      <td className="px-5 py-4">
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-primary-700">{log.otp}</code>
                      </td>
                      <td className="px-5 py-4">
                        {log.used ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                            <CheckCircle className="h-3 w-3" />
                            Used
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                            <XCircle className="h-3 w-3" />
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            <Clock className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {new Date(log.expiresAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && logs.length > 0 && (
          <div className="border-t border-gray-100 p-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  )
}
