export default function PackageCard({ title, subtitle }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900">{title || 'Package'}</h3>
      {subtitle ? <p className="mt-1 text-sm text-gray-600">{subtitle}</p> : null}
    </div>
  )
}
