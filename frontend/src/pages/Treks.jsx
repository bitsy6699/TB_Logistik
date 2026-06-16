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

  const fetchTreks = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/api/treks');
      setTreks(response.data);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Gagal memuat data lacakan.'));
    } finally {
      setLoading(false);
    }
  }, []);

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
    { key: 'status', label: 'Status' },
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
              +
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
          description={`${treks.length} lacakan tersimpan di database.`}
        >
          <DataTable
            rows={treks}
            columns={trekColumns}
            loading={loading}
            getRowKey={(row) => row.idtrek}
            emptyTitle="Belum ada lacakan"
            emptyDescription="Tambahkan lacakan pertama untuk mulai melacak pengiriman."
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
            <input type="text" className={inputClass} value={formData.status}
              onChange={(e) => setFormData((c) => ({...c, status: e.target.value}))}
              placeholder="Contoh: Dalam perjalanan" required />
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
