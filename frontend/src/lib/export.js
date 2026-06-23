export function exportToCSV(rows, columns, filename = 'export.csv') {
  if (!rows.length || !columns.length) return;

  const headers = columns
    .filter(c => c.key !== '_actions')
    .map(c => c.label);

  const csvRows = [headers.join(',')];

  for (const row of rows) {
    const values = columns
      .filter(c => c.key !== '_actions')
      .map(c => {
        let val = c.render ? c.render(row, 0) : row[c.key];
        if (typeof val === 'object' && val !== null) {
          val = row[c.key];
        }
        if (val === null || val === undefined || val === '—') val = '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      });
    csvRows.push(values.join(','));
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
