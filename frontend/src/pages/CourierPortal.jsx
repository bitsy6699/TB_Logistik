import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../context/AuthContext';
import { LogOut, Package, MapPin, ChevronDown, ChevronUp, Camera, QrCode, ScanLine } from 'lucide-react';

const VALID_TRANSITIONS = {
  'Siap Dijemput': ['Dalam Perjalanan'],
  'Dalam Perjalanan': ['Sampai Tujuan'],
  'Sampai Tujuan': ['Terkirim'],
};

function UpdateForm({ order, saving, onUpdate, onCancel }) {
  const allowedNext = VALID_TRANSITIONS[order.status] || [];
  const [status, setStatus] = useState(allowedNext.length === 1 ? allowedNext[0] : '');
  const [lokasi, setLokasi] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!status) return;
    onUpdate(order.idpengiriman, status, lokasi);
  };

  const isSaving = saving === order.idpengiriman;

  if (allowedNext.length === 0) {
    return (
      <div className="mt-4 border-t pt-4 text-sm text-muted-foreground">
        Tidak ada perubahan status yang tersedia.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border-t pt-4">
      <div className="mb-3 rounded-lg bg-accent/50 p-3">
        <p className="text-xs text-muted-foreground">Status saat ini:</p>
        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
          {order.status}
        </span>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Status Baru</label>
          <select
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
          >
            <option value="">Pilih Status</option>
            {allowedNext.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Lokasi (opsional)</label>
          <input
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={lokasi}
            onChange={(e) => setLokasi(e.target.value)}
            placeholder="Contoh: Jakarta - Gudang Utama"
          />
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Button type="submit" disabled={isSaving || !status}>
          {isSaving ? 'Menyimpan...' : 'Perbarui Status'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
      </div>
    </form>
  );
}

function QRScanner({ onScan }) {
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState(null);

  // We use a simpler approach: manual input field + camera if available
  const handleManual = () => {
    if (!manualInput.trim()) return;
    const match = manualInput.trim().match(/\d+/);
    if (match) onScan(Number(match[0]));
    else setError('Format barcode tidak valid. Masukkan ID pesanan.');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ScanLine className="h-4 w-4" /> Scan Pickup Barang
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <div className="p-2 rounded bg-destructive/10 text-destructive text-xs">{error}</div>}
        <div>
          <label className="text-sm font-medium">Input Manual (ID Pesanan)</label>
          <div className="flex gap-2 mt-1">
            <input
              className="flex h-10 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={manualInput}
              onChange={e => { setManualInput(e.target.value); setError(null); }}
              placeholder="ORD-123 atau 123"
            />
            <Button size="sm" onClick={handleManual}>Scan</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CourierPortal() {
  const { user, logout, getSocket } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [newTaskNotif, setNewTaskNotif] = useState(0);

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

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => {
      setNewTaskNotif(c => c + 1);
      fetchOrders();
    };
    socket.on('new-task', handler);
    return () => socket.off('new-task', handler);
  }, [getSocket, fetchOrders]);

  const handleScanPickup = async (orderId) => {
    setSaving(orderId);
    setError('');
    setNotice('');
    try {
      const res = await api.patch(`/api/orders/${orderId}/scan-pickup`);
      setNotice(res.data.message || `Pesanan #${orderId} diambil.`);
      await fetchOrders();
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal scan pickup.'));
    } finally {
      setSaving(null);
    }
  };

  const handleUpdateStatus = async (id, status, lokasi) => {
    setSaving(id);
    setError('');
    setNotice('');
    try {
      const res = await api.patch(`/api/orders/${id}/status`, { status, lokasi: lokasi || '' });
      setNotice(res.data.message || `Pesanan #${id} → ${status}`);
      setExpandedId(null);
      await fetchOrders();
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal memperbarui status.'));
    } finally {
      setSaving(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold">TB Logistik — Kurir</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            {newTaskNotif > 0 && (
              <span className="inline-flex items-center rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">
                {newTaskNotif} tugas baru
              </span>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" /> Keluar
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {notice && (
          <div className="p-3 rounded bg-teal-50 text-teal-700 text-sm border border-teal-200">
            {notice}
          </div>
        )}
        {error && (
          <div className="p-3 rounded bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <QRScanner
          onScan={(orderId) => {
            setNewTaskNotif(0);
            handleScanPickup(orderId);
          }}
        />

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Pesanan Saya</h2>
          <span className="text-sm text-muted-foreground">{orders.length} pesanan</span>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Memuat pesanan...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="mx-auto h-12 w-12 mb-3 opacity-40" />
            <p>Tidak ada pesanan yang ditugaskan ke Anda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <Card key={o.idpengiriman}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Pesanan #{o.idpengiriman}
                      </CardTitle>
                      <p className="text-sm font-medium mt-1">{o.nama_pelanggan}</p>
                      {o.nama_barang && (
                        <p className="text-xs text-muted-foreground mt-0.5">{o.nama_barang}</p>
                      )}
                      {o.payment_method === 'cod' && (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-800 mt-1">
                          COD — Bayar di Tempat
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                      {o.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {o.tanggalpengiriman ? new Date(o.tanggalpengiriman).toLocaleDateString('id-ID') : '—'}
                      </span>
                      {o.total ? (
                        <span>Rp {Number(o.total).toLocaleString('id-ID')}</span>
                      ) : null}
                    </div>
                    {o.status === 'Siap Dijemput' && (
                      <Button
                        size="sm"
                        onClick={() => handleScanPickup(o.idpengiriman)}
                        disabled={saving === o.idpengiriman}
                      >
                        <Camera className="h-4 w-4 mr-1" /> Ambil
                      </Button>
                    )}
                    {VALID_TRANSITIONS[o.status]?.length > 0 && o.status !== 'Siap Dijemput' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(expandedId === o.idpengiriman ? null : o.idpengiriman)}
                      >
                        {expandedId === o.idpengiriman ? (
                          <><ChevronUp className="h-4 w-4 mr-1" /> Tutup</>
                        ) : (
                          <><ChevronDown className="h-4 w-4 mr-1" /> Update</>
                        )}
                      </Button>
                    )}
                  </div>

                  {expandedId === o.idpengiriman && (
                    <UpdateForm
                      order={o}
                      saving={saving}
                      onUpdate={handleUpdateStatus}
                      onCancel={() => setExpandedId(null)}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
