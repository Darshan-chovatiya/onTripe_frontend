/** Lightweight table shell — extend when wiring real admin lists */
export default function DataTable({ columns = [], rows = [], emptyMessage = 'No data' }) {
  if (!rows.length) {
    return <p className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">{emptyMessage}</p>
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 font-semibold text-gray-700">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="border-b border-gray-100 hover:bg-gray-50/80">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3 text-gray-800">
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
