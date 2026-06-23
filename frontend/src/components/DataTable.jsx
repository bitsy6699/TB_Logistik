import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

function prettifyKey(key) {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function ChevronUp() { return <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>; }
function ChevronDown() { return <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>; }

function SortIcon({ active, direction }) {
  if (!active) return <span className="ml-1.5 inline-block text-muted-foreground/40"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg></span>;
  return <span className="ml-1.5 inline-block text-foreground">{direction === 'asc' ? <ChevronUp /> : <ChevronDown />}</span>;
}

export default function DataTable({
  rows = [],
  columns,
  getRowKey,
  loading = false,
  emptyTitle = 'Belum ada data',
  emptyDescription = 'Data akan muncul di sini setelah backend mengirimkan hasil.',
  page,
  totalPages,
  total,
  onPageChange,
  search,
  onSearchChange,
  sortColumn,
  sortOrder,
  onSort,
}) {
  const searchRef = useRef(null);
  const [localSearch, setLocalSearch] = useState(search || '');

  useEffect(() => {
    setLocalSearch(search || '');
  }, [search]);

  useEffect(() => {
    if (!onSearchChange) return;
    const timer = setTimeout(() => {
      if (localSearch !== (search || '')) {
        onSearchChange(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange]);

  const resolvedColumns = columns?.length
    ? columns
    : rows[0]
      ? Object.keys(rows[0]).map((key) => ({
          key,
          label: prettifyKey(key),
        }))
      : [];

  const hasPagination = typeof page === 'number' && typeof totalPages === 'number' && onPageChange;
  const hasSearch = !!onSearchChange;
  const hasSort = !!onSort;

  const renderPagination = () => {
    if (!hasPagination) return null;
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-end gap-3 border-t px-4 py-3">
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {total !== undefined ? `${total.toLocaleString('id-ID')} total` : ''}
        </span>
        <div className="flex items-center gap-0.5 whitespace-nowrap">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            Prev
          </button>
          {start > 1 && <span className="w-4 text-center text-xs text-muted-foreground/40">...</span>}
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-[28px] rounded-full px-1.5 py-1.5 text-xs font-semibold transition ${
                p === page
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {p}
            </button>
          ))}
          {end < totalPages && <span className="w-4 text-center text-xs text-muted-foreground/40">...</span>}
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const handleSort = (key) => {
    if (!onSort) return;
    if (sortColumn === key) {
      onSort(key, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(key, 'asc');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {hasSearch && <div className="h-9 rounded-xl bg-muted" />}
        <div className="h-10 rounded-2xl bg-muted" />
        <div className="h-10 rounded-2xl bg-muted" />
        <div className="h-10 rounded-2xl bg-muted" />
      </div>
    );
  }

  const showSearch = hasSearch && !loading;

  return (
    <div>
      {showSearch && (
        <div className="mb-4">
          <Input
            ref={searchRef}
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Cari data..."
            className="h-auto rounded-2xl px-4 py-3"
          />
        </div>
      )}

      {!rows.length ? (
        <div className="rounded-[24px] border border-dashed bg-muted/50 px-6 py-10 text-center">
          <p className="font-display text-lg font-semibold tracking-tight">{emptyTitle}</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[24px] border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {resolvedColumns.map((column) => {
                    const isSortable = hasSort && column.key !== '_actions';
                    return (
                      <TableHead
                        key={column.key}
                        onClick={() => isSortable && handleSort(column.sortKey || column.key)}
                        className={[
                          'h-11 px-5 text-[11px] font-semibold uppercase tracking-[0.2em]',
                          isSortable ? 'cursor-pointer select-none hover:text-foreground' : '',
                          column.key === '_actions' ? 'text-right' : '',
                          column.headerClassName || '',
                        ].join(' ')}
                      >
                        {column.label}
                        {isSortable && (
                          <SortIcon
                            active={sortColumn === (column.sortKey || column.key)}
                            direction={sortOrder}
                          />
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={getRowKey?.(row, index) ?? row.id ?? row.idpelanggan ?? index}>
                    {resolvedColumns.map((column) => {
                      const value = column.render ? column.render(row, index) : formatValue(row[column.key]);
                      return (
                        <TableCell key={column.key} className={`p-4 px-5 ${column.className || 'whitespace-nowrap'}`}>
                          {value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {renderPagination()}
        </div>
      )}
    </div>
  );
}
