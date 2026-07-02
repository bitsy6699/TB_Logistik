import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { LogOut, Package, ShoppingBag, ArrowLeft, Clock, Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';

const CANCELLABLE_STATUSES = ['Menunggu Pembayaran', 'Pembayaran Diverifikasi', 'Diproses'];

const tabs = [
  { key: 'barang', label: 'Barang Saya', icon: Package },
  { key: 'pesanan', label: 'Pesanan', icon: ShoppingBag },
];

function BarangForm({ item, onSaved, onCancel }) {
  const [nama_barang, setNama] = useState(item?.nama_barang || '');
  const [harga, setHarga] = useState(item?.harga || '');
  const [jumlah, setJumlah] = useState(item?.stok || '');
  const [kategori, setKategori] = useState(item?.kategori || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (item) {
        await api.put(`/api/pengirim/barang/${item.idbarang}`, { nama_barang, harga: Number(harga), jumlah: Number(jumlah), kategori });
      } else {
        await api.post('/api/pengirim/barang', { nama_barang, harga: Number(harga), jumlah: Number(jumlah), kategori });
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menyimpan barang.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
      {error && <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm">{error}</div>}
      <div>
        <label className="text-sm font-medium">Nama Barang</label>
        <input className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={nama_barang} onChange={e => setNama(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Harga</label>
          <input type="number" className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={harga} onChange={e => setHarga(e.target.value)} min="0" required />
        </div>
        <div>
          <label className="text-sm font-medium">Stok</label>
          <input type="number" className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={jumlah} onChange={e => setJumlah(e.target.value)} min="0" required />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Kategori</label>
        <input className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={kategori} onChange={e => setKategori(e.target.value)} placeholder="Umum" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? 'Menyimpan...' : item ? 'Simpan' : 'Tambah Barang'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
      </div>
    </form>
  );
}

function BarangTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchItems = useCallback(() => {
    setLoading(true);
    api.get('/api/pengirim/barang')
      .then((res) => setItems(res.data))
      .catch((err) => setError(getErrorMessage(err, 'Gagal memuat barang.')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDelete = async (id) => {
    if (!confirm('Hapus barang ini?')) return;
    try {
      await api.delete(`/api/pengirim/barang/${id}`);
      fetchItems();
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal hapus.'));
    }
  };

  if (showForm || editing) {
    return (
      <div>
        <Button variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
        </Button>
        <BarangForm item={editing} onSaved={() => { setShowForm(false); setEditing(null); fetchItems(); }} onCancel={() => { setShowForm(false); setEditing(null); }} />
      </div>
    );
  }

  if (loading) return <p className="text-center text-muted-foreground py-8">Memuat barang...</p>;
  if (error) return <p className="text-center text-destructive py-8">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{items.length} barang</p>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> Tambah Barang</Button>
      </div>
      {items.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Belum ada barang.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((b) => (
            <Card key={b.idbarang}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{b.nama_barang}</CardTitle>
                    <p className="text-sm text-muted-foreground">{b.kategori || '—'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(b)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(b.idbarang)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Rp {Number(b.harga).toLocaleString('id')}</span>
                  <StatusBadge status={b.status} />
                </div>
                {b.stok != null && (
                  <p className="text-xs text-muted-foreground mt-2">Stok: {b.stok}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PesananTab() {
  const [orders, setOrders] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    api.get('/api/pengirim/orders')
      .then((res) => setOrders(res.data))
      .catch((err) => setError(getErrorMessage(err, 'Gagal memuat pesanan.')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openDetail = async (id) => {
    try {
      const res = await api.get(`/api/pengirim/orders/${id}`);
      setDetail(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal memuat detail pesanan.'));
    }
  };

  const handleConfirm = async (id) => {
    setActionLoading(id);
    try {
      await api.patch(`/api/pengirim/orders/${id}/confirm`);
      fetchOrders();
      if (detail?.idpengiriman === id) openDetail(id);
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal konfirmasi.'));
    } finally {
      setActionLoading(null);
    }
  };

  const needsConfirmation = (order) => {
    return order.status === 'Pembayaran Diverifikasi' || order.status === 'Diproses';
  };

  const orderItemsConfirmed = (order) => {
    return order.items_confirmed > 0;
  };

  if (detail) {
    const allConfirmed = detail.items?.every(i => i.seller_confirmed === 1);
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => setDetail(null)} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pesanan #{detail.idpengiriman}</span>
              <StatusBadge status={detail.status} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Pelanggan</p>
              <p className="font-medium">{detail.nama_pelanggan}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal</p>
              <p>{new Date(detail.tanggalpengiriman).toLocaleDateString('id')}</p>
            </div>
            <hr className="border-t" />
            <p className="text-sm text-muted-foreground">Barang Anda</p>
            {detail.items?.map((item) => (
              <div key={item.idorder_barang || item.idbarang} className="flex justify-between text-sm items-center">
                <span>{item.nama_barang} x{item.jumlah}</span>
                <div className="text-right">
                  <span>Rp {(item.harga * item.jumlah).toLocaleString('id')}</span>
                  {item.seller_confirmed === 1 ? (
                    <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700"><CheckCircle className="h-3 w-3 mr-0.5" />OK</span>
                  ) : (
                    <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">Pending</span>
                  )}
                </div>
              </div>
            ))}
            <hr className="border-t" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>Rp {Number(detail.total).toLocaleString('id')}</span>
            </div>
            {detail.status === 'Pembayaran Diverifikasi' && (
              <Button className="w-full" onClick={() => handleConfirm(detail.idpengiriman)} disabled={actionLoading === detail.idpengiriman || allConfirmed}>
                <CheckCircle className="h-4 w-4 mr-2" /> Konfirmasi Semua Barang Saya
              </Button>
            )}
            {detail.treks?.length > 0 && (
              <>
                <hr className="border-t" />
                <p className="text-sm text-muted-foreground">Lacak</p>
                <div className="space-y-2">
                  {detail.treks.map((t) => (
                    <div key={t.idtrek} className="flex items-start gap-3 text-sm">
                      <div className="min-w-[24px] pt-0.5">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{t.status}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.waktuupdate).toLocaleString('id')}
                        </p>
                        {t.lokasiterakhir && <p className="text-xs">{t.lokasiterakhir}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) return <p className="text-center text-muted-foreground py-8">Memuat pesanan...</p>;
  if (error) return <p className="text-center text-destructive py-8">{error}</p>;

  if (orders.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Belum ada pesanan.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {orders.map((o) => (
        <Card key={o.idpengiriman} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => openDetail(o.idpengiriman)}>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">Pesanan #{o.idpengiriman}</p>
              <p className="text-sm text-muted-foreground">{o.nama_pelanggan}</p>
              <p className="text-xs text-muted-foreground">{o.items}</p>
              {o.items_confirmed > 0 && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 mt-1">
                  <CheckCircle className="h-3 w-3 mr-0.5" /> {o.items_confirmed} dikonfirmasi
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold">Rp {Number(o.total).toLocaleString('id')}</p>
              <StatusBadge status={o.status} />
              {needsConfirmation(o) && (
                <Button size="sm" variant="outline" className="mt-2 w-full" onClick={(e) => { e.stopPropagation(); handleConfirm(o.idpengiriman); }} disabled={actionLoading === o.idpengiriman}>
                  Konfirmasi
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function SellerPortal() {
  const { user, logout, getSocket } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('barang');
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => {
      setNotifCount(c => c + 1);
    };
    socket.on('new-order:pengirim', handler);
    return () => socket.off('new-order:pengirim', handler);
  }, [getSocket]);

  useEffect(() => {
    if (activeTab === 'pesanan') setNotifCount(0);
  }, [activeTab]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background animate-fadeIn">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold">TB Logistik — Pengirim</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" /> Keluar
            </Button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 flex gap-1 pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isPesanan = tab.key === 'pesanan';
            return (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.key)}
                className="relative"
              >
                <Icon className="h-4 w-4 mr-1" />
                {tab.label}
                {isPesanan && notifCount > 0 && (
                  <span className="ml-1 inline-flex items-center rounded-full bg-destructive px-1.5 py-0.5 text-xs font-medium text-destructive-foreground h-5">
                    {notifCount}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'barang' && <BarangTab />}
        {activeTab === 'pesanan' && <PesananTab />}
      </main>
    </div>
  );
}
