import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';
import Modal from '../components/Modal';
import { Plus } from 'lucide-react';
import { exportToCSV } from '../lib/export';
import StatusBadge from '../components/StatusBadge';
import { inputClass, primaryButtonClass, secondaryButtonClass, dangerButtonClass, smallButtonClass, iconButtonClass } from '../components/ui';

const TREK_STATUSES = ['Dalam perjalanan', 'Sampai tujuan', 'Terkirim', 'Diproses', 'Dibatalkan'];

const blankForm = {
  idpengiriman: '',
  lokasiterakhir: '',
  status: '',
};

export default function Treks() {
  const [treks, setTreks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState('waktuupdate');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchTreks = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = { page, limit: 10, sort: sortColumn, order: sortOrder };
      if (search) params.search = search;
      const response = await api.get('/api/treks', { params });
      const d = response.data;
      if (d && Array.isArray(d.data)) {
        setTreks(d.data);
        setTotalPages(d.totalPages);
        setTotal(d.total);
      } else if (Array.isArray(d)) {
        setTreks(d);
        setTotalPages(1);
        setTotal(d.length);
      }
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Gagal memuat data lacakan.'));
    } finally {
      setLoading(false);
    }
  }, [page, search, sortColumn, sortOrder]);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.get('/api/orders');
      setOrders(response.data);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Gagal memuat data pengiriman.'));
    }
  }, []);

  useEffect(() => {
    fetchTreks();
    fetchOrders();
  }, [fetchTreks, fetchOrders]);

  const handleEdit = (row) => {
    setEditingId(row.idtrek);
    setFormData({ idpengiriman: row.idpengiriman, lokasiterakhir: row.lokasiterakhir, status: row.status });
    setNotice('');
    setError('');
    setIsModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(blankForm);
    setIsModalOpen(false);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Hapus lacakan untuk "${row.nama_pelanggan}"?`)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/api/treks/${row.idtrek}`);
      setNotice('Lacakan berhasil dihapus.');
      if (editingId === row.idtrek) handleCancelEdit();
      await fetchTreks();
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menghapus lacakan.'));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      if (editingId) {
        await api.put(`/api/treks/${editingId}`, formData);
        setNotice('Lacakan berhasil diperbarui.');
      } else {
        await api.post('/api/treks', formData);
        setNotice('Lacakan berhasil disimpan.');
      }
      setFormData(blankForm);
      setEditingId(null);
      setIsModalOpen(false);
      await fetchTreks();
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Gagal menyimpan data lacakan.'));
    } finally {
      setSaving(false);
    }
  };

  const [statusLoading, setStatusLoading] = useState(null);

  const handleStatusChange = async (id, newStatus) => {
    setStatusLoading(id);
    try {
      await api.patch(`/api/treks/${id}/status`, { status: newStatus });
      setTreks((prev) => prev.map((t) => (t.idtrek === id ? { ...t, status: newStatus } : t)));
      setNotice('Status berhasil diperbarui.');
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal memperbarui status.'));
    } finally {
      setStatusLoading(null);
    }
  };

  const trekColumns = [
    { key: 'idtrek', label: 'ID' },
    {
      key: 'idpengiriman', label: 'ID Pengiriman',
      render: (row) => typeof row.idpengiriman === 'number' ? `ORD-${row.idpengiriman}` : row.idpengiriman,
    },
    { key: 'nama_pelanggan', label: 'Pelanggan' },
    { key: 'lokasiterakhir', label: 'Lokasi Terakhir' },
    {
      key: 'waktuupdate', label: 'Waktu Update',
      render: (row) => row.waktuupdate ? new Date(row.waktuupdate).toLocaleString('id-ID') : '—',
    },
    {
      key: 'status', label: 'Status',
      render: (row) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={row.status} />
          <select
            value={row.status}
            disabled={statusLoading === row.idtrek}
            onChange={(e) => handleStatusChange(row.idtrek, e.target.value)}
            className="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
          >
            {TREK_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
      ),
    },
    {
      key: '_actions',
      label: 'Aksi',
      render: (row) => (
        <div className="flex gap-2">
          <button type="button" className={smallButtonClass} onClick={() => handleEdit(row)}>Edit</button>
          <button type="button" className={dangerButtonClass} onClick={() => handleDelete(row)}>Hapus</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lacakan Pengiriman"
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormData(blankForm);
                setIsModalOpen(true);
              }}
              className={iconButtonClass}
              title="Tambah Lacakan"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => exportToCSV(treks, trekColumns, 'lacakan.csv')} className={smallButtonClass}>
              Export CSV
            </button>
            <button type="button" onClick={fetchTreks} className={secondaryButtonClass}>
              Refresh data
            </button>
          </div>
        }
      />

      {notice ? (
        <div className="rounded-[24px] border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="w-full">
        <SectionCard
          title="Daftar lacakan"
          description={`${total} lacakan tersimpan di database.`}
        >
          <DataTable
            rows={treks}
            columns={trekColumns}
            loading={loading}
            getRowKey={(row) => row.idtrek}
            emptyTitle="Belum ada lacakan"
            emptyDescription="Tambahkan lacakan pertama untuk mulai melacak pengiriman."
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

      <Modal
        isOpen={isModalOpen}
        onClose={handleCancelEdit}
        title={editingId ? 'Edit Lacakan' : 'Tambah Lacakan'}
        description={editingId ? 'Ubah data lacakan lalu simpan.' : 'Catat posisi terakhir pengiriman.'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {!editingId && (
            <FormField label="Kaitkan dengan Pengiriman">
              <select className={inputClass} value={formData.idpengiriman}
                onChange={(e) => setFormData((c) => ({...c, idpengiriman: e.target.value}))} required>
                <option value="">Pilih Pengiriman</option>
                {orders.map((o) => {
                  const id = typeof o.idpengiriman === 'number' ? `ORD-${o.idpengiriman}` : o.idpengiriman;
                  const client = o.nama_pelanggan || o.pelanggan || '—';
                  return <option key={o.idpengiriman} value={o.idpengiriman}>{id} ({client})</option>;
                })}
              </select>
            </FormField>
          )}
          <FormField label="Lokasi Terakhir">
            <input type="text" className={inputClass} value={formData.lokasiterakhir}
              onChange={(e) => setFormData((c) => ({...c, lokasiterakhir: e.target.value}))}
              placeholder="Contoh: Jakarta - Gudang Utama" required />
          </FormField>
          <FormField label="Status">
            <select className={inputClass} value={formData.status}
              onChange={(e) => setFormData((c) => ({...c, status: e.target.value}))} required>
              <option value="">Pilih Status</option>
              {TREK_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </FormField>
          <div className="flex gap-3 pt-2">
            <button type="submit" className={primaryButtonClass} disabled={saving}>
              {saving ? 'Menyimpan...' : editingId ? 'Perbarui Lacakan' : 'Tambah Lacakan'}
            </button>
            <button type="button" className={secondaryButtonClass} onClick={handleCancelEdit}>Batal</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
