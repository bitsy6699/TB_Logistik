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
  namagudang: '',
  alamat: '',
  kota: '',
};

export default function Warehouses() {
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
  const [sortColumn, setSortColumn] = useState('idgudang');
  const [sortOrder, setSortOrder] = useState('asc');

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = { page, limit: 10, sort: sortColumn, order: sortOrder };
      if (search) params.search = search;
      const response = await api.get('/api/gudangs', { params });
      const d = response.data;
      if (d && Array.isArray(d.data)) {
        setWarehouses(d.data);
        setTotalPages(d.totalPages);
        setTotal(d.total);
      } else if (Array.isArray(d)) {
        setWarehouses(d);
        setTotalPages(1);
        setTotal(d.length);
      }
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Gagal memuat data gudang.'));
    } finally {
      setLoading(false);
    }
  }, [page, search, sortColumn, sortOrder]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const handleEdit = (row) => {
    setEditingId(row.idgudang);
    setFormData({ namagudang: row.namagudang, alamat: row.alamat, kota: row.kota });
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
    if (!window.confirm(`Hapus gudang "${row.namagudang}"?`)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/api/gudangs/${row.idgudang}`);
      setNotice('Gudang berhasil dihapus.');
      if (editingId === row.idgudang) handleCancelEdit();
      await fetchWarehouses();
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menghapus gudang.'));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      if (editingId) {
        await api.put(`/api/gudangs/${editingId}`, formData);
        setNotice('Gudang berhasil diperbarui.');
      } else {
        await api.post('/api/gudangs', formData);
        setNotice('Gudang berhasil disimpan.');
      }
      setFormData(blankForm);
      setEditingId(null);
      setIsModalOpen(false);
      await fetchWarehouses();
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Gagal menyimpan data gudang.'));
    } finally {
      setSaving(false);
    }
  };

  const warehouseColumns = [
    { key: 'idgudang', label: 'ID' },
    { key: 'namagudang', label: 'Nama gudang' },
    { key: 'alamat', label: 'Alamat', className: 'whitespace-normal min-w-[240px]' },
    { key: 'kota', label: 'Kota' },
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
        title="Data gudang"
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
              title="Tambah Gudang"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => exportToCSV(warehouses, warehouseColumns, 'gudang.csv')} className={smallButtonClass}>
              Export CSV
            </button>
            <button type="button" onClick={fetchWarehouses} className={secondaryButtonClass}>
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
        <SectionCard title="Daftar gudang" description={`${total} gudang tersimpan.`}>
          <DataTable
            rows={warehouses}
            columns={warehouseColumns}
            loading={loading}
            getRowKey={(row) => row.idgudang}
            emptyTitle="Belum ada gudang"
            emptyDescription="Tambahkan gudang pertama agar tabel ini terisi."
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
        title={editingId ? 'Edit Gudang' : 'Tambah Gudang'}
        description={editingId ? 'Ubah data gudang lalu simpan.' : 'Masukkan nama gudang, alamat, dan kota lokasi.'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Nama gudang">
            <input
              type="text"
              className={inputClass}
              value={formData.namagudang}
              onChange={(event) =>
                setFormData((current) => ({ ...current, namagudang: event.target.value }))
              }
              placeholder="Contoh: Gudang Utama Jakarta"
              required
            />
          </FormField>

          <FormField label="Alamat">
            <input
              type="text"
              className={inputClass}
              value={formData.alamat}
              onChange={(event) =>
                setFormData((current) => ({ ...current, alamat: event.target.value }))
              }
              placeholder="Contoh: Jl. Raya Industri No. 88"
              required
            />
          </FormField>

          <FormField label="Kota">
            <input
              type="text"
              className={inputClass}
              value={formData.kota}
              onChange={(event) =>
                setFormData((current) => ({ ...current, kota: event.target.value }))
              }
              placeholder="Contoh: Jakarta"
              required
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <button type="submit" className={primaryButtonClass} disabled={saving}>
              {saving ? 'Menyimpan...' : editingId ? 'Perbarui gudang' : 'Simpan gudang'}
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

