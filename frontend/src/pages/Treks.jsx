import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import FormField from '../components/FormField';
import StatusBadge from '../components/StatusBadge';
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../components/ui';
import { MapPin, Clock, Package } from 'lucide-react';

export default function Treks() {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [treks, setTreks] = useState([]);
  const [loadingTreks, setLoadingTreks] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [lokasi, setLokasi] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const response = await api.get('/api/orders');
      const d = response.data;
      setOrders(Array.isArray(d) ? d : (d.data || []));
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal memuat data pengiriman.'));
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const fetchTreks = useCallback(async () => {
    if (!selectedOrderId) return;
    setLoadingTreks(true);
    setError('');
    try {
      const response = await api.get('/api/treks', { params: { idpengiriman: selectedOrderId } });
      setTreks(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal memuat riwayat lacakan.'));
    } finally {
      setLoadingTreks(false);
    }
  }, [selectedOrderId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchTreks();
  }, [fetchTreks]);

  const handleAddTracking = async (e) => {
    e.preventDefault();
    if (!lokasi.trim()) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await api.post('/api/treks', { idpengiriman: Number(selectedOrderId), lokasiterakhir: lokasi.trim() });
      setLokasi('');
      setNotice('Event tracking berhasil ditambahkan.');
      await fetchTreks();
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menambahkan event tracking.'));
    } finally {
      setSaving(false);
    }
  };

  const selectedOrder = orders.find((o) => String(o.idpengiriman) === String(selectedOrderId));

  return (
    <div className="space-y-6">
      <PageHeader title="Lacakan Pengiriman" />

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

      <SectionCard title="Pilih Pengiriman" description="Lihat riwayat tracking berdasarkan pesanan.">
        <div className="max-w-md">
          <select
            className={inputClass}
            value={selectedOrderId}
            onChange={(e) => { setSelectedOrderId(e.target.value); setError(''); setNotice(''); }}
            disabled={loadingOrders}
          >
            <option value="">— Pilih Pesanan —</option>
            {orders.map((o) => (
              <option key={o.idpengiriman} value={o.idpengiriman}>
                {typeof o.idpengiriman === 'number' ? `ORD-${o.idpengiriman}` : o.idpengiriman}
                {' — '}{o.nama_pelanggan || '—'}
                {o.nama_barang ? ` (${o.nama_barang})` : ''}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      {selectedOrderId && (
        <>
          <SectionCard
            title="Timeline Tracking"
            description={selectedOrder
              ? `ORD-${selectedOrder.idpengiriman} — ${selectedOrder.nama_pelanggan || ''} ${selectedOrder.nama_barang ? `— ${selectedOrder.nama_barang}` : ''}`
              : ''}
          >
            {loadingTreks ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                Memuat riwayat...
              </div>
            ) : treks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
                <Package className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p>Belum ada event tracking untuk pesanan ini.</p>
              </div>
            ) : (
              <div className="relative space-y-0">
                {treks.map((t, idx) => (
                  <div key={t.idtrek} className="relative flex gap-4 pb-6 last:pb-0">
                    {/* Vertical line */}
                    {idx < treks.length - 1 && (
                      <div className="absolute left-[11px] top-5 h-full w-0.5 bg-border" />
                    )}
                    {/* Dot */}
                    <div className="relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {t.waktuupdate
                            ? new Date(t.waktuupdate).toLocaleString('id-ID', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })
                            : '—'}
                        </span>
                        {t.status && <StatusBadge status={t.status} />}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {t.lokasiterakhir || 'Tidak diketahui'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Tambah Event Tracking" description="Catat posisi terbaru pengiriman. Status hanya bisa diubah di halaman Pengiriman.">
            <form className="max-w-md space-y-4" onSubmit={handleAddTracking}>
              <div className="mb-3 rounded-2xl border border-border bg-accent/30 p-3 text-sm">
                <span className="text-muted-foreground">Status saat ini: </span>
                {selectedOrder?.status ? <StatusBadge status={selectedOrder.status} /> : <span className="text-muted-foreground">—</span>}
              </div>
              <FormField label="Lokasi">
                <input
                  type="text"
                  className={inputClass}
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  placeholder="Contoh: Jakarta - Gudang Utama"
                  required
                />
              </FormField>
              <div className="flex gap-3">
                <button type="submit" className={primaryButtonClass} disabled={saving || !lokasi.trim()}>
                  {saving ? 'Menyimpan...' : 'Tambah Event'}
                </button>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => setLokasi('')}
                >
                  Reset
                </button>
              </div>
            </form>
          </SectionCard>
        </>
      )}
    </div>
  );
}
