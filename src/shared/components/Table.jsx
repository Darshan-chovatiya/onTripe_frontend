/**
 * Shared table primitives — consistent look across all agency/admin tables.
 * Usage:
 *   <TableWrap>
 *     <TableHead cols={['Name', 'Status', { label: 'Actions', right: true }]} />
 *     <tbody>
 *       <TableRow> ... </TableRow>
 *     </tbody>
 *   </TableWrap>
 */

export function TableWrap({ children, minWidth = '700px' }) {
  return (
    <div className="overflow-x-auto rounded-b-xl">
      <table className={`w-full text-sm`} style={{ minWidth }}>
        {children}
      </table>
    </div>
  )
}

export function TableHead({ cols }) {
  return (
    <thead>
      <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
        {cols.map((col, i) => {
          const label = typeof col === 'string' ? col : col.label
          const right = typeof col === 'object' && col.right
          return (
            <th
              key={i}
              className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 ${right ? 'text-right' : 'text-left'}`}
            >
              {label}
            </th>
          )
        })}
      </tr>
    </thead>
  )
}

export function TableRow({ children, onClick, selected }) {
  return (
    <tr
      onClick={onClick}
      className={`group border-b border-gray-50 transition-all duration-150 last:border-0 ${
        selected
          ? 'bg-primary-50/60'
          : 'hover:bg-gray-50/80'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      {children}
    </tr>
  )
}

export function Td({ children, right, muted, className = '' }) {
  return (
    <td className={`px-4 py-3.5 align-middle ${right ? 'text-right' : ''} ${muted ? 'text-gray-400' : ''} ${className}`}>
      {children}
    </td>
  )
}

/** Colored status pill */
export function StatusPill({ status, map }) {
  const styles = map?.[status] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${styles}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {status}
    </span>
  )
}

/** Avatar circle with initials */
export function Avatar({ name, size = 'md', color = 'from-primary-400 to-primary-600' }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const sz = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-[11px]'
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${color} font-bold text-white shadow-sm ${sz}`}>
      {initials}
    </div>
  )
}

/** Action icon button */
export function ActionBtn({ onClick, title, children, variant = 'default' }) {
  const variants = {
    default: 'border-gray-200 bg-white text-gray-500 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600',
    danger:  'border-gray-200 bg-white text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600',
    warning: 'border-gray-200 bg-white text-gray-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600',
    success: 'border-gray-200 bg-white text-gray-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border shadow-sm transition-all ${variants[variant]}`}
    >
      {children}
    </button>
  )
}
