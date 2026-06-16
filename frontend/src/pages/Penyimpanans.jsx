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
  idbarang: '',
  idgudang: '',
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

  const fetchPenyimpanans = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/api/penyimpanans');
      setPenyimpanans(response.data);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Gagal memuat data penyimpanan.'));
    } finally {
      setLoading(false);
    }
  }, []);

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
    setFormData({ idbarang: row.idbarang, idgudang: row.idgudang, waktu_masuk: row.waktu_masuk, waktu_keluar: row.waktu_keluar });
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
        await api.put(`/api/penyimpanans/${editingId}`, formData);
        setNotice('Penyimpanan berhasil diperbarui.');
      } else {
        await api.post('/api/penyimpanans', formData);
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
    { key: 'namagudang', label: 'Gudang' },
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
    <div className="space-y-6">
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
              +
            </button>
            <button type="button" onClick={fetchPenyimpanans} className={secondaryButtonClass}>
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
          title="Daftar penyimpanan"
          description={`${penyimpanans.length} penyimpanan tersimpan di database.`}
        >
          <DataTable
            rows={penyimpanans}
            columns={penyimpananColumns}
            loading={loading}
            getRowKey={(row) => row.idpenyimpanan}
            emptyTitle="Belum ada penyimpanan"
            emptyDescription="Tambahkan penyimpanan pertama untuk mencatat barang di gudang."
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
              <FormField label="Waktu Masuk">
                <input type="datetime-local" className={inputClass} value={formData.waktu_masuk}
                  onChange={(e) => setFormData((c) => ({...c, waktu_masuk: e.target.value}))} />
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
