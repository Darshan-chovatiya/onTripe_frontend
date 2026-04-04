export default function BookingCard({ title, status }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium text-gray-900">{title || 'Booking'}</h3>
        {status ? <span className="text-xs font-medium text-primary-600">{status}</span> : null}
      </div>
    </div>
  )
}
