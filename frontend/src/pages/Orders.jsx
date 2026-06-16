import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';
import Modal from '../components/Modal';
import { inputClass, textareaClass, primaryButtonClass, secondaryButtonClass, iconButtonClass } from '../components/ui';

const blankForm = {
  idpelanggan: '',
  idkurir: '',
  idgudang: '',
  nama_pengirim: '',
  no_hp_pengirim: '',
  alamat_pengirim: '',
  estimasi_sampai: '',
  tanggalpengiriman: '',
};

const orderColumns = [
  { 
    key: 'idpengiriman', 
    label: 'ID Order',
    render: (row) => typeof row.idpengiriman === 'number' ? `ORD-${row.idpengiriman}` : row.idpengiriman
  },
  { 
    key: 'pelanggan', 
    label: 'Pelanggan',
    render: (row) => row.nama_pelanggan || row.pelanggan || '—'
  },
  { 
    key: 'kurir', 
    label: 'Kurir',
    render: (row) => row.nama_kurir || row.kurir || '—'
  },
  { 
    key: 'gudang', 
    label: 'Gudang',
    render: (row) => row.nama_gudang || row.gudang || '—'
  },
  { 
    key: 'tanggal', 
    label: 'Tanggal Kirim',
    render: (row) => {
      const date = row.tanggalpengiriman || row.tanggal;
      if (!date) return '—';
      if (date.includes('T') || date.includes('-')) {
        return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      return date;
    }
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => row.status || 'Aktif'
  }
];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState(blankForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/api/orders');
      setOrders(response.data);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Gagal memuat data pengiriman.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [custRes, courRes, whRes] = await Promise.all([
        api.get('/api/customers'),
        api.get('/api/kurirs'),
        api.get('/api/gudangs')
      ]);
      setCustomers(custRes.data);
      setCouriers(courRes.data);
      setWarehouses(whRes.data);
    } catch (err) {
      console.error('Gagal memuat data untuk form:', err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchDropdownData();
  }, [fetchOrders, fetchDropdownData]);

  // Set default dates when dropdown data is fetched
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setFormData((current) => ({
      ...current,
      tanggalpengiriman: todayStr,
      estimasi_sampai: threeDaysLater,
    }));
  }, []);

  const handleOpenModal = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setFormData({
      ...blankForm,
      tanggalpengiriman: todayStr,
      estimasi_sampai: threeDaysLater,
    });
    setError('');
    setNotice('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      await api.post('/api/orders', formData);
      const todayStr = new Date().toISOString().split('T')[0];
      const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setFormData({
        ...blankForm,
        tanggalpengiriman: todayStr,
        estimasi_sampai: threeDaysLater,
      });
      setNotice('Pengiriman baru berhasil dibuat.');
      setIsModalOpen(false);
      await fetchOrders();
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Gagal menyimpan data pengiriman.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data pengiriman"
        actions={
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={handleOpenModal} 
              className={iconButtonClass}
              title="Buat Pengiriman"
            >
              +
            </button>
            <button type="button" onClick={fetchOrders} className={secondaryButtonClass}>
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
          title="Daftar pengiriman"
          description={`${orders.length} entri data logistik.`}
        >
          <DataTable
            rows={orders}
            columns={orderColumns}
            loading={loading}
            getRowKey={(row, idx) => row.idpengiriman || idx}
            emptyTitle="Belum ada pengiriman"
            emptyDescription="Tidak ada data pengiriman. Silakan tambah data di form samping."
          />
        </SectionCard>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Buat Pengiriman"
        description="Isi formulir untuk pengiriman baru."
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Pelanggan">
            <select
              className={inputClass}
              value={formData.idpelanggan}
              onChange={(event) => {
                const val = event.target.value;
                const customer = customers.find((c) => c.idpelanggan === Number(val));
                setFormData((current) => ({
                  ...current,
                  idpelanggan: val,
                  nama_pengirim: customer ? customer.nama : current.nama_pengirim,
                  no_hp_pengirim: customer ? customer.notelepon : current.no_hp_pengirim,
                  alamat_pengirim: customer ? customer.alamat : current.alamat_pengirim,
                }));
              }}
              required
            >
              <option value="">Pilih Pelanggan</option>
              {customers.map((c) => (
                <option key={c.idpelanggan} value={c.idpelanggan}>
                  {c.nama}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Kurir Pengirim">
            <select
              className={inputClass}
              value={formData.idkurir}
              onChange={(event) => {
                const val = event.target.value;
                const courier = couriers.find((k) => k.idkurir === Number(val));
                setFormData((current) => ({
                  ...current,
                  idkurir: val,
                  nama_pengirim: courier ? courier.nama : current.nama_pengirim,
                  no_hp_pengirim: courier ? courier.notelepon : current.no_hp_pengirim,
                }));
              }}
              required
            >
              <option value="">Pilih Kurir</option>
              {couriers.map((k) => (
                <option key={k.idkurir} value={k.idkurir}>
                  {k.nama} ({k.kendaraan})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Gudang Transit">
            <select
              className={inputClass}
              value={formData.idgudang}
              onChange={(event) =>
                setFormData((current) => ({ ...current, idgudang: event.target.value }))
              }
              required
            >
              <option value="">Pilih Gudang</option>
              {warehouses.map((g) => (
                <option key={g.idgudang} value={g.idgudang}>
                  {g.namagudang} ({g.kota})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Nama Pengirim">
            <input
              type="text"
              className={inputClass}
              value={formData.nama_pengirim}
              onChange={(event) =>
                setFormData((current) => ({ ...current, nama_pengirim: event.target.value }))
              }
              placeholder="Contoh: Budi Santoso"
              required
            />
          </FormField>

          <FormField label="No HP Pengirim">
            <input
              type="text"
              className={inputClass}
              value={formData.no_hp_pengirim}
              onChange={(event) =>
                setFormData((current) => ({ ...current, no_hp_pengirim: event.target.value }))
              }
              placeholder="Contoh: 0812XXXXXXXX"
              required
            />
          </FormField>

          <FormField label="Alamat Asal Pengirim">
            <textarea
              className={textareaClass}
              value={formData.alamat_pengirim}
              onChange={(event) =>
                setFormData((current) => ({ ...current, alamat_pengirim: event.target.value }))
              }
              placeholder="Alamat lengkap asal barang..."
              required
            />
          </FormField>

          <FormField label="Tanggal Pengiriman">
            <input
              type="date"
              className={inputClass}
              value={formData.tanggalpengiriman}
              onChange={(event) =>
                setFormData((current) => ({ ...current, tanggalpengiriman: event.target.value }))
              }
              required
            />
          </FormField>

          <FormField label="Estimasi Sampai">
            <input
              type="date"
              className={inputClass}
              value={formData.estimasi_sampai}
              onChange={(event) =>
                setFormData((current) => ({ ...current, estimasi_sampai: event.target.value }))
              }
              required
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <button type="submit" className={primaryButtonClass} disabled={saving}>
              {saving ? 'Memproses...' : 'Buat Pengiriman'}
            </button>
            <button type="button" className={secondaryButtonClass} onClick={handleCloseModal}>
              Batal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


