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
  nama_barang: '',
  berat: '',
};

export default function Items() {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/api/barangs');
      setItems(response.data);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Gagal memuat data barang.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.get('/api/orders');
      setOrders(response.data);
    } catch (err) {
      console.error('Gagal memuat daftar pengiriman:', err);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchOrders();
  }, [fetchItems, fetchOrders]);

  const handleEdit = (row) => {
    const rawId = typeof row.idbarang === 'string' && row.idbarang.startsWith('BRG-')
      ? row.idbarang.replace('BRG-', '')
      : row.idbarang;
    setEditingId(rawId);
    setFormData({
      idpengiriman: row.idpengiriman || '',
      nama_barang: row.nama_barang || row.nama || '',
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
          berat: formData.berat,
        });
        setNotice('Barang berhasil diperbarui.');
      } else {
        await api.post('/api/barangs', formData);
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
      render: (row) => row.nama_barang || row.nama || '—'
    },
    { 
      key: 'pelanggan', 
      label: 'Pemilik (Pelanggan)',
      render: (row) => row.pelanggan || '—'
    },
    { 
      key: 'berat', 
      label: 'Berat / Deskripsi',
      render: (row) => row.berat !== undefined && row.berat !== null ? `${row.berat} kg` : (row.kategori || '—')
    },
    { 
      key: 'lokasi', 
      label: 'Lokasi Transit',
      render: (row) => row.lokasi || 'Gudang Transit'
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
              +
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
          description={`${items.length} unit terdaftar.`}
        >
          <DataTable
            rows={items}
            columns={itemColumns}
            loading={loading}
            getRowKey={(row, idx) => row.idbarang || idx}
            emptyTitle="Belum ada barang"
            emptyDescription="Tidak ada data barang. Silakan tambah data di form samping."
          />
        </SectionCard>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCancelEdit}
        title={editingId ? 'Edit Barang' : 'Tambah Barang'}
        description={editingId ? 'Ubah data barang bawaan lalu simpan.' : 'Formulir untuk mencatat barang bawaan dalam pengiriman.'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {!editingId && (
            <FormField label="Kaitkan dengan Pengiriman">
              <select
                className={inputClass}
                value={formData.idpengiriman}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, idpengiriman: event.target.value }))
                }
                required
              >
                <option value="">Pilih Pengiriman</option>
                {orders.map((o) => {
                  const displayId = typeof o.idpengiriman === 'number' ? `ORD-${o.idpengiriman}` : o.idpengiriman;
                  const client = o.nama_pelanggan || o.pelanggan || '—';
                  return (
                    <option key={o.idpengiriman} value={o.idpengiriman}>
                      {displayId} ({client})
                    </option>
                  );
                })}
              </select>
            </FormField>
          )}

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



