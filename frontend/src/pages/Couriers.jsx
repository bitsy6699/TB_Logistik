import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';
import Modal from '../components/Modal';
import { inputClass, primaryButtonClass, secondaryButtonClass, dangerButtonClass, smallButtonClass, iconButtonClass } from '../components/ui';

const blankForm = {
  nama: '',
  notelepon: '',
  kendaraan: '',
};

export default function Couriers() {
  const [couriers, setCouriers] = useState([]);
  const [formData, setFormData] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchCouriers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/api/kurirs');
      setCouriers(response.data);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Gagal memuat data kurir.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCouriers();
  }, [fetchCouriers]);

  const handleEdit = (row) => {
    setEditingId(row.idkurir);
    setFormData({ nama: row.nama, notelepon: row.notelepon, kendaraan: row.kendaraan });
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
    if (!window.confirm(`Hapus kurir "${row.nama}"?`)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/api/kurirs/${row.idkurir}`);
      setNotice('Kurir berhasil dihapus.');
      if (editingId === row.idkurir) handleCancelEdit();
      await fetchCouriers();
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menghapus kurir.'));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      if (editingId) {
        await api.put(`/api/kurirs/${editingId}`, formData);
        setNotice('Kurir berhasil diperbarui.');
      } else {
        await api.post('/api/kurirs', formData);
        setNotice('Kurir berhasil disimpan.');
      }
      setFormData(blankForm);
      setEditingId(null);
      setIsModalOpen(false);
      await fetchCouriers();
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Gagal menyimpan data kurir.'));
    } finally {
      setSaving(false);
    }
  };

  const courierColumns = [
    { key: 'idkurir', label: 'ID' },
    { key: 'nama', label: 'Nama' },
    { key: 'notelepon', label: 'No Telepon' },
    { key: 'kendaraan', label: 'Kendaraan' },
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
        eyebrow="Master data"
        title="Data kurir"
        description="Daftar kurir dikurasi dengan tampilan yang lebih tenang dan fokus."
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
              title="Tambah Kurir"
            >
              +
            </button>
            <button type="button" onClick={fetchCouriers} className={secondaryButtonClass}>
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
          title="Daftar kurir"
          description={`${couriers.length} kurir tersimpan di database.`}
        >
          <DataTable
            rows={couriers}
            columns={courierColumns}
            loading={loading}
            getRowKey={(row) => row.idkurir}
            emptyTitle="Belum ada kurir"
            emptyDescription="Tambahkan kurir pertama untuk mulai mengisi tabel ini."
          />
        </SectionCard>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCancelEdit}
        title={editingId ? 'Edit Kurir' : 'Tambah Kurir'}
        description={editingId ? 'Ubah data kurir lalu simpan.' : 'Simpan identitas kurir beserta armadanya.'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Nama kurir">
            <input
              type="text"
              className={inputClass}
              value={formData.nama}
              onChange={(event) =>
                setFormData((current) => ({ ...current, nama: event.target.value }))
              }
              placeholder="Contoh: Budi Santoso"
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
              placeholder="Contoh: 081212345678"
              required
            />
          </FormField>

          <FormField label="Kendaraan">
            <input
              type="text"
              className={inputClass}
              value={formData.kendaraan}
              onChange={(event) =>
                setFormData((current) => ({ ...current, kendaraan: event.target.value }))
              }
              placeholder="Contoh: Motor Box"
              required
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <button type="submit" className={primaryButtonClass} disabled={saving}>
              {saving ? 'Menyimpan...' : editingId ? 'Perbarui kurir' : 'Simpan kurir'}
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

