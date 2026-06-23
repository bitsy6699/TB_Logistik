import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus } from 'lucide-react';
import { exportToCSV } from '../lib/export';
import { inputClass, primaryButtonClass, secondaryButtonClass, dangerButtonClass, smallButtonClass, iconButtonClass } from '../components/ui';

const BARANG_STATUSES = ['Tersedia', 'Dalam transit', 'Terkirim', 'Rusak', 'Hilang'];

const blankForm = {
  nama_barang: '',
  jumlah: '1',
  berat: '',
};

export default function Items() {
  const [items, setItems] = useState([]);
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
  const [sortColumn, setSortColumn] = useState('idbarang');
  const [sortOrder, setSortOrder] = useState('asc');
  const [pendingStatus, setPendingStatus] = useState(null);

  useEffect(() => {
    if (!pendingStatus) return;
    const { id, status, oldStatus } = pendingStatus;
    api.patch(`/api/barangs/${id}/status`, { status })
      .then(() => {
        setItems(prev => prev.map(b => b.idbarang === id ? { ...b, status } : b));
        setNotice(`Status barang #${id} → "${status}"`);
      })
      .catch(err => {
        setError(getErrorMessage(err, 'Gagal memperbarui status.'));
        setItems(prev => prev.map(b => b.idbarang === id ? { ...b, status: oldStatus } : b));
      })
      .finally(() => setPendingStatus(null));
  }, [pendingStatus]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = { page, limit: 10, sort: sortColumn, order: sortOrder };
      if (search) params.search = search;
      const response = await api.get('/api/barangs', { params });
      const d = response.data;
      if (d && Array.isArray(d.data)) {
        setItems(d.data);
        setTotalPages(d.totalPages);
        setTotal(d.total);
      } else if (Array.isArray(d)) {
        setItems(d);
        setTotalPages(1);
        setTotal(d.length);
      }
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Gagal memuat data barang.'));
    } finally {
      setLoading(false);
    }
  }, [page, search, sortColumn, sortOrder]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleEdit = (row) => {
    const rawId = typeof row.idbarang === 'string' && row.idbarang.startsWith('BRG-')
      ? row.idbarang.replace('BRG-', '')
      : row.idbarang;
    setEditingId(rawId);
    setFormData({
      nama_barang: row.nama_barang || row.nama || '',
      jumlah: String(row.jumlah || 1),
      berat: row.berat || '',
    });
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
    const rawId = typeof row.idbarang === 'string' && row.idbarang.startsWith('BRG-')
      ? row.idbarang.replace('BRG-', '')
      : row.idbarang;
    const displayName = row.nama_barang || row.nama || `Barang #${rawId}`;
    if (!window.confirm(`Hapus barang "${displayName}"?`)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/api/barangs/${rawId}`);
      setNotice('Barang berhasil dihapus.');
      if (editingId === rawId) handleCancelEdit();
      await fetchItems();
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menghapus barang.'));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      if (editingId) {
        await api.put(`/api/barangs/${editingId}`, {
          nama_barang: formData.nama_barang,
          jumlah: Number(formData.jumlah) || 1,
          berat: formData.berat,
        });
        setNotice('Barang berhasil diperbarui.');
      } else {
        await api.post('/api/barangs', { ...formData, jumlah: Number(formData.jumlah) || 1 });
        setNotice('Barang baru berhasil ditambahkan.');
      }
      setFormData(blankForm);
      setEditingId(null);
      setIsModalOpen(false);
      await fetchItems();
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Gagal menyimpan data barang.'));
    } finally {
      setSaving(false);
    }
  };

  const itemColumns = [
    { 
      key: 'idbarang', 
      label: 'ID Barang',
      render: (row) => typeof row.idbarang === 'number' ? `BRG-${row.idbarang}` : row.idbarang
    },
    { 
      key: 'nama_barang', 
      label: 'Nama Barang',
      sortKey: 'nama_barang',
      render: (row) => row.nama_barang || row.nama || '—'
    },
    { 
      key: 'jumlah',
      label: 'Qty',
      sortKey: 'jumlah',
      className: 'text-center',
    },
    { 
      key: 'berat', 
      label: 'Berat / Deskripsi',
      sortKey: 'berat',
      render: (row) => row.berat !== undefined && row.berat !== null ? `${row.berat} kg` : (row.kategori || '—')
    },
    {
      key: 'status',
      label: 'Status',
      sortKey: 'status',
      render: (row) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={row.status} />
          <select
            value=""
            onChange={(e) => {
              const s = e.target.value;
              if (s) setPendingStatus({ id: row.idbarang, status: s, oldStatus: row.status });
            }}
            className="rounded-lg border border-slate-200 px-1.5 py-1 text-[11px] text-slate-500 outline-none transition hover:border-slate-300 focus:border-slate-400"
          >
            <option value="">Ubah</option>
            {BARANG_STATUSES.filter(s => s !== row.status).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
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
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data barang"
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
              title="Tambah Barang"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button type="button" onClick={fetchItems} className={secondaryButtonClass}>
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
          title="Daftar barang"
          description={`${total} unit terdaftar.`}
          action={
            <button type="button" onClick={() => exportToCSV(items, itemColumns, 'barang.csv')} className={smallButtonClass}>
              Export CSV
            </button>
          }
        >
          <DataTable
            rows={items}
            columns={itemColumns}
            loading={loading}
            getRowKey={(row, idx) => row.idbarang || idx}
            emptyTitle="Belum ada barang"
            emptyDescription="Tidak ada data barang. Silakan tambah data di form samping."
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
        title={editingId ? 'Edit Barang' : 'Tambah Barang'}
        description={editingId ? 'Ubah data barang lalu simpan.' : 'Formulir untuk menambahkan master barang.'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Nama Barang">
            <input
              type="text"
              className={inputClass}
              value={formData.nama_barang}
              onChange={(event) =>
                setFormData((current) => ({ ...current, nama_barang: event.target.value }))
              }
              placeholder="Contoh: Bubble Wrap"
              required
            />
          </FormField>

          <FormField label="Jumlah">
            <input
              type="number"
              min="1"
              className={inputClass}
              value={formData.jumlah}
              onChange={(event) =>
                setFormData((current) => ({ ...current, jumlah: event.target.value }))
              }
              placeholder="Contoh: 10"
              required
            />
          </FormField>

          <FormField label="Berat Barang (kg)">
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={formData.berat}
              onChange={(event) =>
                setFormData((current) => ({ ...current, berat: event.target.value }))
              }
              placeholder="Contoh: 12.5"
              required
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <button type="submit" className={primaryButtonClass} disabled={saving}>
              {saving ? 'Menyimpan...' : editingId ? 'Perbarui Barang' : 'Tambah Barang'}
            </button>
            <button type="button" className={secondaryButtonClass} onClick={handleCancelEdit}>
              Batal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}



