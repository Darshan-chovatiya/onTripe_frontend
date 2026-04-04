/** Shared agency UI: commission / tier badge */
export default function CommissionBadge({ label = 'Commission', value }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-800">
      {label}
      {value != null ? `: ${value}` : ''}
    </span>
  )
}
