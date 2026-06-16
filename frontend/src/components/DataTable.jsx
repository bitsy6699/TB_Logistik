function prettifyKey(key) {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : '—';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

export default function DataTable({
  rows = [],
  columns,
  getRowKey,
  loading = false,
  emptyTitle = 'Belum ada data',
  emptyDescription = 'Data akan muncul di sini setelah backend mengirimkan hasil.',
}) {
  const resolvedColumns = columns?.length
    ? columns
    : rows[0]
      ? Object.keys(rows[0]).map((key) => ({
          key,
          label: prettifyKey(key),
        }))
      : [];

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-10 rounded-2xl bg-slate-100" />
        <div className="h-10 rounded-2xl bg-slate-100" />
        <div className="h-10 rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
        <p className="font-display text-lg font-semibold tracking-tight text-slate-950">
          {emptyTitle}
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200/80">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 bg-white">
          <thead className="bg-slate-50/80">
            <tr>
              {resolvedColumns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={[
                    'px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500',
                    column.headerClassName || '',
                  ].join(' ')}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={getRowKey?.(row, index) ?? row.id ?? row.idpelanggan ?? index} className="hover:bg-slate-50/60">
                {resolvedColumns.map((column) => {
                  const value = column.render ? column.render(row, index) : formatValue(row[column.key]);

                  return (
                    <td
                      key={column.key}
                      className={[
                        'px-5 py-4 text-sm text-slate-600',
                        column.className || 'whitespace-nowrap',
                      ].join(' ')}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
