export default function DataTable({ columns, rows }) {
  return (
    <div className="overflow-auto rounded-2xl border border-gray-100">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            {columns.map((c, i) => (
              <th key={i} className="text-left px-4 py-2 font-medium">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                className="px-4 py-6 text-center text-gray-400"
                colSpan={columns.length}
              >
                No data
              </td>
            </tr>
          )}
          {rows.map((r, ri) => (
            <tr key={ri} className="odd:bg-white even:bg-gray-50">
              {columns.map((c, ci) => (
                <td key={ci} className="px-4 py-2">
                  {c.cell ? c.cell(r) : r[c.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
