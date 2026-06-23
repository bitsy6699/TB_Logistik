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
import { inputClass, textareaClass, primaryButtonClass, secondaryButtonClass, smallButtonClass, iconButtonClass, dangerButtonClass } from '../components/ui';

const ORDER_STATUSES = ['Diproses', 'Dalam perjalanan', 'Sampai tujuan', 'Terkirim', 'Dibatalkan'];

const blankForm = {
  idpelanggan: '',
  idkurir: '',
  idgudang_pengirim: '',
  idgudang: '',
  nama_pengirim: '',
  no_hp_pengirim: '',
  alamat_pengirim: '',
  estimasi_sampai: '',
  tanggalpengiriman: '',
      items: [{ idbarang: '', jumlah: 1 }],
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [allBarang, setAllBarang] = useState([]);
  const [formData, setFormData] = useState(blankForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState('idpengiriman');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pendingStatus, setPendingStatus] = useState(null);

  const orderColumns = [
    { 
      key: 'idpengiriman', 
      label: 'ID Order',
      sortKey: 'idpengiriman',
      render: (row) => typeof row.idpengiriman === 'number' ? `ORD-${row.idpengiriman}` : row.idpengiriman
    },
    { 
      key: 'pelanggan', 
      label: 'Pelanggan',
      sortKey: 'nama_pelanggan',
      render: (row) => row.nama_pelanggan || row.pelanggan || '—'
    },
    { 
      key: 'kurir', 
      label: 'Kurir',
      sortKey: 'nama_kurir',
      render: (row) => row.nama_kurir || row.kurir || '—'
    },
    { 
      key: 'gudang', 
      label: 'Gudang',
      sortKey: 'nama_gudang',
      render: (row) => row.nama_gudang || row.gudang || '—'
    },
    { 
      key: 'tanggal', 
      label: 'Tgl Kirim',
      sortKey: 'tanggalpengiriman',
      render: (row) => {
        const d = row.tanggalpengiriman || row.tanggal;
        if (!d) return '—';
        if (d.includes('T') || d.includes('-')) {
          return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        }
        return d;
      }
    },
    {
      key: 'nama_pengirim',
      label: 'Pengirim',
      sortKey: 'nama_pengirim',
      render: (row) => row.nama_pengirim || '—'
    },
    {
      key: 'estimasi_sampai',
      label: 'Estimasi',
      render: (row) => row.estimasi_sampai
        ? new Date(row.estimasi_sampai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
        : '—'
    },
    {
      key: 'total',
      label: 'Total',
      sortKey: 'total',
      render: (row) => row.total ? `Rp ${Number(row.total).toLocaleString('id-ID')}` : '—'
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
              const newStatus = e.target.value;
              if (newStatus) setPendingStatus({ id: row.idpengiriman, status: newStatus });
            }}
            className="rounded-lg border border-slate-200 px-1.5 py-1 text-[11px] text-slate-500 outline-none transition hover:border-slate-300 focus:border-slate-400"
          >
            <option value="">Ubah</option>
            {ORDER_STATUSES.filter(s => s !== row.status).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      ),
    }
  ];

  useEffect(() => {
    if (!pendingStatus) return;
    const { id, status } = pendingStatus;
    api.patch(`/api/orders/${id}/status`, { status })
      .then(() => {
        setOrders(prev => prev.map(o => o.idpengiriman === id ? { ...o, status } : o));
        setNotice(`Status pengiriman ORD-${id} → "${status}"`);
      })
      .catch(err => setError(getErrorMessage(err, 'Gagal memperbarui status.')))
      .finally(() => setPendingStatus(null));
  }, [pendingStatus]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = { page, limit: 10, sort: sortColumn, order: sortOrder };
      if (search) params.search = search;
      const response = await api.get('/api/orders', { params });
      const d = response.data;
      if (d && Array.isArray(d.data)) {
        setOrders(d.data);
        setTotalPages(d.totalPages);
        setTotal(d.total);
      } else if (Array.isArray(d)) {
        setOrders(d);
        setTotalPages(1);
        setTotal(d.length);
      }
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Gagal memuat data pengiriman.'));
    } finally {
      setLoading(false);
    }
  }, [page, search, sortColumn, sortOrder]);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [custRes, courRes, whRes, barangRes] = await Promise.all([
        api.get('/api/customers'),
        api.get('/api/kurirs'),
        api.get('/api/gudangs'),
        api.get('/api/barangs'),
      ]);
      setCustomers(custRes.data);
      setCouriers(courRes.data);
      setWarehouses(whRes.data);
      const barangData = barangRes.data;
      setAllBarang(Array.isArray(barangData) ? barangData : (barangData.data || []));
      setError('');
    } catch (err) {
      console.error('Gagal memuat data untuk form:', err);
      setError('Gagal memuat data pendukung form. Beberapa fitur mungkin tidak tersedia.');
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchDropdownData();
  }, [fetchOrders, fetchDropdownData]);

  const handleOpenModal = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setFormData({
      ...blankForm,
      tanggalpengiriman: todayStr,
      estimasi_sampai: threeDaysLater,
  items: [{ idbarang: '', jumlah: 1 }],
    });
    setError('');
    setNotice('');
    setIsModalOpen(true);
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { idbarang: '', jumlah: 1 }],
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: newItems.length ? newItems : [{ idbarang: '', jumlah: 1 }] };
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    const validItems = formData.items.filter(item => item.idbarang);
    if (validItems.length === 0) {
      setError('Minimal 1 barang harus dipilih.');
      setSaving(false);
      return;
    }

    try {
      const { items, ...orderData } = formData;
      const barang = items
        .filter(item => item.idbarang)
        .map(item => ({ idbarang: Number(item.idbarang), jumlah: Number(item.jumlah) || 1 }));
      await api.post('/api/pengiriman-terpadu', { ...orderData, barang });
      setNotice('Pengiriman berhasil. Barang, penyimpanan, & lacakan otomatis terbuat.');
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
              <Plus className="h-5 w-5" />
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
          description={`${total} entri data logistik.`}
          action={
            <button type="button" onClick={() => exportToCSV(orders, orderColumns, 'pengiriman.csv')} className={smallButtonClass}>
              Export CSV
            </button>
          }
        >
          <DataTable
            rows={orders}
            columns={orderColumns}
            loading={loading}
            getRowKey={(row, idx) => row.idpengiriman || idx}
            emptyTitle="Belum ada pengiriman"
            emptyDescription="Tidak ada data pengiriman. Silakan tambah data di form samping."
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
        onClose={handleCloseModal}
        title="Buat Pengiriman"
        description="Pilih pelanggan, kurir, gudang, dan barang dalam satu langkah."
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

          <FormField label="Gudang Pengirim (Asal Barang)">
            <select
              className={inputClass}
              value={formData.idgudang_pengirim}
              onChange={(event) =>
                setFormData((current) => ({ ...current, idgudang_pengirim: event.target.value }))
              }
              required
            >
              <option value="">Pilih Gudang Asal</option>
              {warehouses.map((g) => (
                <option key={g.idgudang} value={g.idgudang}>
                  {g.namagudang} ({g.kota})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Kurir Pengirim">
            <select
              className={inputClass}
              value={formData.idkurir}
              onChange={(event) =>
                setFormData((current) => ({ ...current, idkurir: event.target.value }))
              }
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

          <FormField label="Gudang Tujuan (Transit)">
            <select
              className={inputClass}
              value={formData.idgudang}
              onChange={(event) =>
                setFormData((current) => ({ ...current, idgudang: event.target.value }))
              }
              required
            >
              <option value="">Pilih Gudang Tujuan</option>
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

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="border-t border-border pt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Barang</p>
              <button type="button" onClick={handleAddItem} className={smallButtonClass}>
                + Barang
              </button>
            </div>
            {formData.items.map((item, idx) => {
              const selectedBarang = allBarang.find(b => Number(b.idbarang) === Number(item.idbarang));
              return (
              <div key={idx} className="mb-3 rounded-2xl border border-border bg-accent/30 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Barang #{idx + 1}</span>
                  {formData.items.length > 1 && (
                    <button type="button" onClick={() => handleRemoveItem(idx)} className={dangerButtonClass}>
                      Hapus
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <FormField label="Pilih Barang">
                    <select
                      className={inputClass}
                      value={item.idbarang}
                      onChange={(e) => handleItemChange(idx, 'idbarang', e.target.value)}
                      required
                    >
                      <option value="">Pilih Barang</option>
                      {allBarang.map((b) => (
                        <option key={b.idbarang} value={b.idbarang}>
                          {b.nama_barang} (BRG-{b.idbarang}) — stok: {b.jumlah}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  {selectedBarang && (
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Jumlah">
                        <input
                          type="number"
                          className={inputClass}
                          value={item.jumlah}
                          min="1"
                          max={selectedBarang.jumlah}
                          onChange={(e) => handleItemChange(idx, 'jumlah', e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </FormField>
                      <div className="flex items-end pb-3">
                        <p className="text-xs text-muted-foreground">
                          Berat: {selectedBarang.berat} kg
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>

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


