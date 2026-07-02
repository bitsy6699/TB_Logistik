import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';
import Modal from '../components/Modal';
import { exportToCSV } from '../lib/export';
import { Plus } from 'lucide-react';
import { inputClass, textareaClass, primaryButtonClass, secondaryButtonClass, dangerButtonClass, smallButtonClass, iconButtonClass } from '../components/ui';

const blankForm = {
  nama: '',
  alamat: '',
  notelepon: '',
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
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
  const [sortColumn, setSortColumn] = useState('idpelanggan');
  const [sortOrder, setSortOrder] = useState('asc');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = { page, limit: 10, sort: sortColumn, order: sortOrder };
      if (search) params.search = search;
      const response = await api.get('/api/customers', { params });
      const d = response.data;
      if (d && Array.isArray(d.data)) {
        setCustomers(d.data);
        setTotalPages(d.totalPages);
        setTotal(d.total);
      } else if (Array.isArray(d)) {
        setCustomers(d);
        setTotalPages(1);
        setTotal(d.length);
      }
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Gagal memuat data pelanggan.'));
    } finally {
      setLoading(false);
    }
  }, [page, search, sortColumn, sortOrder]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleSort = (column, order) => {
    setSortColumn(column);
    setSortOrder(order);
    setPage(1);
  };

  const handleEdit = (row) => {
    setEditingId(row.idpelanggan);
    setFormData({ nama: row.nama, alamat: row.alamat, notelepon: row.notelepon });
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
    if (!window.confirm(`Hapus pelanggan "${row.nama}"?`)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/api/customers/${row.idpelanggan}`);
      setNotice('Pelanggan berhasil dihapus.');
      if (editingId === row.idpelanggan) handleCancelEdit();
      await fetchCustomers();
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menghapus pelanggan.'));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      if (editingId) {
        await api.put(`/api/customers/${editingId}`, formData);
        setNotice('Pelanggan berhasil diperbarui.');
      } else {
        await api.post('/api/customers', formData);
        setNotice('Pelanggan berhasil disimpan.');
      }
      setFormData(blankForm);
      setEditingId(null);
      setIsModalOpen(false);
      await fetchCustomers();
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Gagal menyimpan data pelanggan.'));
    } finally {
      setSaving(false);
    }
  };

  const customerColumns = [
    { key: 'idpelanggan', label: 'ID' },
    { key: 'nama', label: 'Nama' },
    { key: 'alamat', label: 'Alamat', className: 'whitespace-normal min-w-[240px]' },
    { key: 'notelepon', label: 'No Telepon' },
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
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Data pelanggan"
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
              title="Tambah Pelanggan"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button type="button" onClick={fetchCustomers} className={secondaryButtonClass}>
              Refresh data
            </button>
          </div>
        }
      />

      {notice ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="w-full">
        <SectionCard
          title="Daftar pelanggan"
          description={`${total} pelanggan tersimpan di database.`}
          action={
            <div className="flex gap-2">
              <button type="button" onClick={() => exportToCSV(customers, customerColumns, 'pelanggan.csv')} className={smallButtonClass}>
                Export CSV
              </button>
              <Link to="/orders" className="rounded-full border border-input bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent hover:text-accent-foreground">
                Lihat pengiriman
              </Link>
            </div>
          }
        >
          <DataTable
            rows={customers}
            columns={customerColumns}
            loading={loading}
            getRowKey={(row) => row.idpelanggan}
            emptyTitle="Belum ada pelanggan"
            emptyDescription="Tambahkan pelanggan pertama untuk mulai mengisi tabel ini."
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={handlePageChange}
            search={search}
            onSearchChange={handleSearchChange}
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        </SectionCard>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCancelEdit}
        title={editingId ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
        description={editingId ? 'Ubah data pelanggan lalu simpan.' : 'Isi formulir ini untuk menambahkan data pelanggan baru.'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Nama pelanggan">
            <input
              type="text"
              className={inputClass}
              value={formData.nama}
              onChange={(event) =>
                setFormData((current) => ({ ...current, nama: event.target.value }))
              }
              placeholder="Contoh: Siti Aminah"
              required
            />
          </FormField>

          <FormField label="Alamat">
            <textarea
              className={textareaClass}
              value={formData.alamat}
              onChange={(event) =>
                setFormData((current) => ({ ...current, alamat: event.target.value }))
              }
              placeholder="Contoh: Jl. Cempaka No. 10, Jakarta"
              required
            />
          </FormField>

          <FormField label="No telepon">
            <input
              type="text"
              className={inputClass}
              value={formData.notelepon}
              onChange={(event) =>
                setFormData((current) => ({ ...current, notelepon: event.target.value }))
              }
              placeholder="Contoh: 08123456789"
              required
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <button type="submit" className={primaryButtonClass} disabled={saving}>
              {saving ? 'Menyimpan...' : editingId ? 'Perbarui pelanggan' : 'Simpan pelanggan'}
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
