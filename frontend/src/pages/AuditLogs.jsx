import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import { exportToCSV } from '../lib/export';
import { smallButtonClass } from '../components/ui';

const actionColors = {
  CREATE: 'bg-primary/10 text-primary',
  UPDATE: 'bg-muted text-muted-foreground',
  DELETE: 'bg-foreground/5 text-foreground',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 15, sort: sortColumn, order: sortOrder };
      if (search) params.search = search;
      const response = await api.get('/api/audit-logs', { params });
      const d = response.data;
      if (d && Array.isArray(d.data)) {
        setLogs(d.data);
        setTotalPages(d.totalPages);
        setTotal(d.total);
      } else if (Array.isArray(d)) {
        setLogs(d);
        setTotalPages(1);
        setTotal(d.length);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal memuat audit log.'));
    } finally {
      setLoading(false);
    }
  }, [page, search, sortColumn, sortOrder]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const logColumns = [
    { key: 'id', label: 'ID', className: 'text-muted-foreground' },
    {
      key: 'table_name', label: 'Tabel', sortKey: 'table_name',
      render: (row) => (
        <code className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
          {row.table_name}
        </code>
      ),
    },
    { key: 'record_id', label: 'Record ID' },
    {
      key: 'action', label: 'Aksi', sortKey: 'action',
      render: (row) => (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${actionColors[row.action] || 'bg-muted text-muted-foreground'}`}>
          {row.action}
        </span>
      ),
    },
    { key: 'user_name', label: 'User', sortKey: 'user_name' },
    {
      key: 'created_at', label: 'Waktu', sortKey: 'created_at',
      render: (row) => row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : '—',
    },
    {
      key: '_new', label: 'Data Baru',
      render: (row) => {
        if (!row.new_data) return '—';
        try {
          return <code className="text-[11px] leading-4 text-muted-foreground">{JSON.stringify(JSON.parse(row.new_data), null, 1).slice(0, 120)}</code>;
        } catch { return '—'; }
      },
    },
  ];

  return (
    <div className="animate-fadeIn space-y-6">
      <PageHeader title="Audit Log" />

      {error ? (
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">
          {error}
        </div>
      ) : null}

      <SectionCard title="Riwayat perubahan data" description={`${total} total event.`}
        action={
          <button type="button" onClick={() => exportToCSV(logs, logColumns, 'audit-log.csv')} className={smallButtonClass}>
            Export CSV
          </button>
        }
      >
        <DataTable
          rows={logs}
          columns={logColumns}
          loading={loading}
          getRowKey={(row) => row.id}
          emptyTitle="Belum ada aktivitas"
          emptyDescription="Setiap perubahan data akan tercatat di sini."
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={(p) => { if (p >= 1 && p <= totalPages) setPage(p); }}
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={(col, ord) => { setSortColumn(col); setSortOrder(ord); setPage(1); }}
        />
      </SectionCard>
    </div>
  );
}
