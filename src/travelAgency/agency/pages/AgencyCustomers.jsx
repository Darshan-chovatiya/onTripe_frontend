import { useMemo, useState } from 'react'
import { Mail, Phone, Search, UserCircle } from 'lucide-react'

const DUMMY_CUSTOMERS = [
  { id: '1', name: 'Priya Sharma', phone: '+91 98765 43210', email: 'priya.s@email.com', trips: 3, lastTrip: '2026-03-12', status: 'Active' },
  { id: '2', name: 'Rahul Verma', phone: '+91 91234 56789', email: 'rahul.v@gmail.com', trips: 1, lastTrip: '2026-01-28', status: 'Active' },
  { id: '3', name: 'Ananya Iyer', phone: '+91 99887 76655', email: 'ananya.i@outlook.com', trips: 0, lastTrip: '—', status: 'Lead' },
]

export default function AgencyCustomers() {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return DUMMY_CUSTOMERS
    return DUMMY_CUSTOMERS.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.phone.replace(/\s/g, '').includes(s) ||
        c.email.toLowerCase().includes(s)
    )
  }, [q])

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Travelers and leads linked to your agency. Connect your CRM or booking API when ready — data below is placeholder.
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
                  <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{c.lastTrip}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        c.status === 'Lead' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">No customers match your search.</p>
        ) : null}
      </div>
    </div>
  )
}
