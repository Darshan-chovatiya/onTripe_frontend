import { useEffect, useState } from 'react'
import { CalendarDays, IndianRupee, Ticket } from 'lucide-react'
import { listMyBookings } from '@/travelAgency/subChild/services/subChildApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await listMyBookings()
        if (!cancelled) setBookings(res.data?.data?.bookings ?? [])
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="animate-fade-in space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">My bookings</h1>
        <p className="mt-1 text-sm text-gray-500">Bookings created by your sub-child agency account.</p>
      </header>

      {error ? <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {loading && bookings.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500">Loading bookings…</div>
      ) : null}

      {!loading && bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 py-16 text-center">
          <Ticket className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">No bookings yet</p>
        </div>
      ) : null}

      {bookings.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/80 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Booking ID</th>
                  <th className="px-4 py-3 font-medium">Package</th>
                  <th className="px-4 py-3 font-medium">Travel date</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{b.bookingId || '—'}</td>
                    <td className="px-4 py-3 text-gray-900">{b.package?.title || b.whitelabelPackage?.customTitle || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                        {b.travelDate ? new Date(b.travelDate).toLocaleDateString('en-IN') : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      <span className="inline-flex items-center gap-0.5">
                        <IndianRupee className="h-3.5 w-3.5" />
                        {Number(b.totalAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-700">
                        {b.bookingStatus || 'confirmed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
