export default function DataTable({ columns = [], rows = [], emptyMessage = 'No data' }) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center">
        <p className="text-sm font-medium text-gray-400">{emptyMessage}</p>
      </div>
    )
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="border-b border-gray-50 transition-all last:border-0 hover:bg-gray-50/80">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3.5 text-gray-700">
                  {row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
