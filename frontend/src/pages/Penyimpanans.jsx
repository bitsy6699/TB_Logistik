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
import { inputClass, primaryButtonClass, secondaryButtonClass, dangerButtonClass, smallButtonClass, iconButtonClass } from '../components/ui';

const blankForm = {
  idbarang: '',
  idgudang: '',
  jumlah_masuk: '1',
  jumlah_keluar: '',
  waktu_masuk: '',
  waktu_keluar: '',
};

export default function Penyimpanans() {
  const [penyimpanans, setPenyimpanans] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
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
  const [sortColumn, setSortColumn] = useState('waktu_masuk');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchPenyimpanans = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = { page, limit: 10, sort: sortColumn, order: sortOrder };
      if (search) params.search = search;
      const response = await api.get('/api/penyimpanans', { params });
      const d = response.data;
      if (d && Array.isArray(d.data)) {
        setPenyimpanans(d.data);
        setTotalPages(d.totalPages);
        setTotal(d.total);
      } else if (Array.isArray(d)) {
        setPenyimpanans(d);
        setTotalPages(1);
        setTotal(d.length);
      }
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Gagal memuat data penyimpanan.'));
    } finally {
      setLoading(false);
    }
  }, [page, search, sortColumn, sortOrder]);

  const fetchItems = useCallback(async () => {
    try {
      const response = await api.get('/api/barangs');
      setItems(response.data);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Gagal memuat data barang.'));
    }
  }, []);

  const fetchWarehouses = useCallback(async () => {
    try {
      const response = await api.get('/api/gudangs');
      setWarehouses(response.data);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Gagal memuat data gudang.'));
    }
  }, []);

  useEffect(() => {
    fetchPenyimpanans();
    fetchItems();
    fetchWarehouses();
  }, [fetchPenyimpanans, fetchItems, fetchWarehouses]);

  const handleEdit = (row) => {
    setEditingId(row.idpenyimpanan);
    setFormData({
      idbarang: row.idbarang,
      idgudang: row.idgudang,
      jumlah_masuk: String(row.jumlah_masuk || 1),
      jumlah_keluar: row.jumlah_keluar ? String(row.jumlah_keluar) : '',
      waktu_masuk: row.waktu_masuk,
      waktu_keluar: row.waktu_keluar,
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
    if (!window.confirm(`Hapus penyimpanan barang "${row.nama_barang}" dari gudang "${row.namagudang}"?`)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/api/penyimpanans/${row.idpenyimpanan}`);
      setNotice('Penyimpanan berhasil dihapus.');
      if (editingId === row.idpenyimpanan) handleCancelEdit();
      await fetchPenyimpanans();
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menghapus penyimpanan.'));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      if (editingId) {
        const payload = { ...formData, jumlah_masuk: Number(formData.jumlah_masuk) || 1 };
        if (formData.jumlah_keluar) payload.jumlah_keluar = Number(formData.jumlah_keluar);
        await api.put(`/api/penyimpanans/${editingId}`, payload);
        setNotice('Penyimpanan berhasil diperbarui.');
      } else {
        const payload = { ...formData, jumlah_masuk: Number(formData.jumlah_masuk) || 1 };
        if (formData.jumlah_keluar) payload.jumlah_keluar = Number(formData.jumlah_keluar);
        await api.post('/api/penyimpanans', payload);
        setNotice('Penyimpanan berhasil disimpan.');
      }
      setFormData(blankForm);
      setEditingId(null);
      setIsModalOpen(false);
      await fetchPenyimpanans();
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Gagal menyimpan data penyimpanan.'));
    } finally {
      setSaving(false);
    }
  };

  const penyimpananColumns = [
    { key: 'idpenyimpanan', label: 'ID' },
    { key: 'nama_barang', label: 'Barang' },
    { key: 'namagudang', label: 'Gudang', sortKey: 'namagudang' },
    { key: 'jumlah_masuk', label: 'Masuk', sortKey: 'jumlah_masuk', className: 'text-center' },
    {
      key: 'jumlah_keluar', label: 'Keluar', sortKey: 'jumlah_keluar',
      render: (row) => row.jumlah_keluar ?? '—',
      className: 'text-center',
    },
    {
      key: 'waktu_masuk', label: 'Waktu Masuk',
      render: (row) => row.waktu_masuk ? new Date(row.waktu_masuk).toLocaleString('id-ID') : '—',
    },
    {
      key: 'waktu_keluar', label: 'Waktu Keluar',
      render: (row) => row.waktu_keluar && row.waktu_keluar !== '0000-00-00 00:00:00'
        ? new Date(row.waktu_keluar).toLocaleString('id-ID') : '—',
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
    <div className="animate-fadeIn space-y-6">
      <PageHeader
        title="Penyimpanan Barang"
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
              title="Tambah Penyimpanan"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => exportToCSV(penyimpanans, penyimpananColumns, 'penyimpanan.csv')} className={smallButtonClass}>
              Export CSV
            </button>
            <button type="button" onClick={fetchPenyimpanans} className={secondaryButtonClass}>
              Refresh data
            </button>
          </div>
        }
      />

      {notice ? (
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">
          {error}
        </div>
      ) : null}

      <div className="w-full">
        <SectionCard
          title="Daftar penyimpanan"
          description={`${total} penyimpanan tersimpan di database.`}
        >
          <DataTable
            rows={penyimpanans}
            columns={penyimpananColumns}
            loading={loading}
            getRowKey={(row) => row.idpenyimpanan}
            emptyTitle="Belum ada penyimpanan"
            emptyDescription="Tambahkan penyimpanan pertama untuk mencatat barang di gudang."
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
        title={editingId ? 'Edit Penyimpanan' : 'Tambah Penyimpanan'}
        description={editingId ? 'Ubah data penyimpanan.' : 'Catat barang yang disimpan di gudang.'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {!editingId && (
            <>
              <FormField label="Barang">
                <select className={inputClass} value={formData.idbarang}
                  onChange={(e) => setFormData((c) => ({...c, idbarang: e.target.value}))} required>
                  <option value="">Pilih Barang</option>
                  {items.map((b) => (
                    <option key={b.idbarang} value={b.idbarang}>{b.nama_barang || b.nama}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Gudang">
                <select className={inputClass} value={formData.idgudang}
                  onChange={(e) => setFormData((c) => ({...c, idgudang: e.target.value}))} required>
                  <option value="">Pilih Gudang</option>
                  {warehouses.map((g) => (
                    <option key={g.idgudang} value={g.idgudang}>{g.namagudang} ({g.kota})</option>
                  ))}
                </select>
              </FormField>
            </>
          )}
          {editingId && (
            <FormField label="Gudang">
              <select className={inputClass} value={formData.idgudang}
                onChange={(e) => setFormData((c) => ({...c, idgudang: e.target.value}))}>
                <option value="">Pilih Gudang</option>
                {warehouses.map((g) => (
                  <option key={g.idgudang} value={g.idgudang}>{g.namagudang} ({g.kota})</option>
                ))}
              </select>
            </FormField>
          )}
          <FormField label="Jumlah Masuk">
            <input type="number" min="1" className={inputClass} value={formData.jumlah_masuk}
              onChange={(e) => setFormData((c) => ({...c, jumlah_masuk: e.target.value}))} required />
          </FormField>
          <FormField label="Jumlah Keluar">
            <input type="number" min="1" className={inputClass} value={formData.jumlah_keluar}
              onChange={(e) => setFormData((c) => ({...c, jumlah_keluar: e.target.value}))}
              placeholder="Kosongkan jika belum ada pengeluaran" />
          </FormField>
          <FormField label="Waktu Masuk">
            <input type="datetime-local" className={inputClass} value={formData.waktu_masuk}
              onChange={(e) => setFormData((c) => ({...c, waktu_masuk: e.target.value}))} required />
          </FormField>
          <FormField label="Waktu Keluar">
            <input type="datetime-local" className={inputClass} value={formData.waktu_keluar}
              onChange={(e) => setFormData((c) => ({...c, waktu_keluar: e.target.value}))} />
          </FormField>
          <div className="flex gap-3 pt-2">
            <button type="submit" className={primaryButtonClass} disabled={saving}>
              {saving ? 'Menyimpan...' : editingId ? 'Perbarui Penyimpanan' : 'Tambah Penyimpanan'}
            </button>
            <button type="button" className={secondaryButtonClass} onClick={handleCancelEdit}>Batal</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
