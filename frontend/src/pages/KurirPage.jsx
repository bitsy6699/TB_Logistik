import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import FormField from '../components/FormField';
import StatusBadge from '../components/StatusBadge';
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { Package, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

const ORDER_STATUSES = ['Diproses', 'Dalam perjalanan', 'Sampai tujuan', 'Terkirim', 'Dibatalkan'];

export default function KurirPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/kurir/orders');
      setOrders(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal memuat pesanan.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleUpdateStatus = async (id, status, lokasi) => {
    setSaving(id);
    setError('');
    setNotice('');
    try {
      await api.patch(`/api/orders/${id}/status`, { status, lokasi: lokasi || '' });
      setNotice(`ORD-${id} → ${status}`);
      setExpandedId(null);
      await fetchOrders();
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal memperbarui status.'));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pesanan Saya"
        actions={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{orders.length} pesanan</span>
          </div>
        }
      />

      {notice ? (
        <div className="rounded-[24px] border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">{notice}</div>
      ) : null}
      {error ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      {loading ? (
        <SectionCard title="Memuat...">
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">Memuat pesanan...</div>
        </SectionCard>
      ) : orders.length === 0 ? (
        <SectionCard title="Belum Ada Pesanan">
          <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
            <Package className="mb-2 h-10 w-10 text-muted-foreground/50" />
            <p>Tidak ada pesanan yang ditugaskan ke Anda.</p>
          </div>
        </SectionCard>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <SectionCard key={o.idpengiriman} title="" description="">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-2xl bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {typeof o.idpengiriman === 'number' ? `ORD-${o.idpengiriman}` : o.idpengiriman}
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{o.nama_pelanggan}</p>
                    {o.nama_barang && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{o.nama_barang}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {o.tanggalpengiriman ? new Date(o.tanggalpengiriman).toLocaleDateString('id-ID') : '—'}
                    </span>
                    {o.total ? (
                      <span>Rp {Number(o.total).toLocaleString('id-ID')}</span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === o.idpengiriman ? null : o.idpengiriman)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-accent"
                >
                  {expandedId === o.idpengiriman ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {expandedId === o.idpengiriman && (
                <UpdateForm
                  order={o}
                  saving={saving}
                  onUpdate={handleUpdateStatus}
                  onCancel={() => setExpandedId(null)}
                />
              )}
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}

function UpdateForm({ order, saving, onUpdate, onCancel }) {
  const [status, setStatus] = useState('');
  const [lokasi, setLokasi] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!status) return;
    onUpdate(order.idpengiriman, status, lokasi);
  };

  const isSaving = saving === order.idpengiriman;

  return (
    <form onSubmit={handleSubmit} className="mt-4 border-t border-border pt-4">
      <div className="mb-3 rounded-2xl border border-border bg-accent/30 p-3">
        <p className="text-xs text-muted-foreground">Status saat ini:</p>
        <div className="mt-1">
          <StatusBadge status={order.status} />
        </div>
      </div>
      <div className="space-y-3">
        <FormField label="Status Baru">
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)} required>
            <option value="">Pilih Status</option>
            {ORDER_STATUSES.filter((s) => s !== order.status).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Lokasi (opsional)">
          <input
            type="text"
            className={inputClass}
            value={lokasi}
            onChange={(e) => setLokasi(e.target.value)}
            placeholder="Contoh: Jakarta - Gudang Utama"
          />
        </FormField>
      </div>
      <div className="mt-4 flex gap-3">
        <button type="submit" className={primaryButtonClass} disabled={isSaving || !status}>
          {isSaving ? 'Menyimpan...' : 'Perbarui Status'}
        </button>
        <button type="button" className={secondaryButtonClass} onClick={onCancel}>Batal</button>
      </div>
    </form>
  );
}
