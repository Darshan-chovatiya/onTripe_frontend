export default function TripCard({ title, meta }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="font-semibold text-gray-900 dark:text-white">{title || 'Trip'}</h3>
      {meta ? <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{meta}</p> : null}
    </div>
  )
}
