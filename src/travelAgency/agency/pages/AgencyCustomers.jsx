import { useEffect, useMemo, useRef, useState } from 'react'
import { Mail, Phone, Search, UserCircle } from 'lucide-react'
import { ROLES } from '@/shared/utils/constants.js'
import { useAgencyPermissions } from '@/travelAgency/agency/hooks/useAgencyPermissions.js'
import { listCustomers as listChildCustomers } from '@/travelAgency/childAgency/services/childAgencyApi.js'
import { listCustomers as listSubCustomers } from '@/travelAgency/subChild/services/subChildApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'

export default function AgencyCustomers() {
  const { role } = useAgencyPermissions()
  const { toast } = useToast()
  const toastRef = useRef(toast)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (role !== ROLES.CHILD_AGENCY && role !== ROLES.SUB_CHILD) {
        setRows([])
        return
      }
      setLoading(true)
      try {
        const res =
          role === ROLES.CHILD_AGENCY
            ? await listChildCustomers()
            : await listSubCustomers()
        const customers = res.data?.data?.customers ?? []
        if (cancelled) return
        setRows(
          customers.map((item) => ({
            id: item._id,
            name: item.name || item.customer?.name || '—',
            phone: item.customer?.phone || '—',
            email: item.email || item.customer?.email || '—',
            trips: Array.isArray(item.bookings) ? item.bookings.length : 0,
            lastActivity: item.updatedAt || item.createdAt,
            isActive: item.isActive !== false,
          }))
        )
      } catch (err) {
        if (!cancelled) toastRef.current.error(getApiErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [role])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.phone.replace(/\s/g, '').includes(s) ||
        c.email.toLowerCase().includes(s)
    )
  }, [q, rows])

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Travelers and leads linked to your agency.
          </p>
        </div>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, phone, or email…"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 shadow-sm outline-none ring-primary-500/20 placeholder:text-gray-400 focus:border-primary-300 focus:ring-2"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-gray-500">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Contact</th>
                <th className="px-4 py-3 font-medium">Trips</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Last activity</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium text-gray-900">
                      <UserCircle className="h-4 w-4 shrink-0 text-primary-500" aria-hidden />
                      {c.name}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        {c.phone}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        {c.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{c.trips}</td>
                  <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                    {c.lastActivity ? new Date(c.lastActivity).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        c.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">Loading customers…</p>
        ) : null}
        {!loading && filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">No customers match your search.</p>
        ) : null}
      </div>
    </div>
  )
}
