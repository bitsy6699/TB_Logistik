import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { ShoppingCart, Package, Clock, Trash2, Minus, Plus, ArrowLeft, LogOut, CreditCard, XCircle, CheckCircle } from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'qris', label: 'QRIS' },
  { value: 'transfer', label: 'Transfer Bank' },
  { value: 'e_wallet', label: 'E-Wallet' },
  { value: 'cod', label: 'COD (Bayar di Tempat)' },
];

const CANCELLABLE_STATUSES = ['Menunggu Pembayaran', 'Pembayaran Diverifikasi', 'Diproses'];

const tabs = [
  { key: 'produk', label: 'Produk', icon: Package },
  { key: 'keranjang', label: 'Keranjang', icon: ShoppingCart },
  { key: 'pesanan', label: 'Pesanan Saya', icon: Clock },
];

function ProdukTab({ cart, onAddToCart, onRemoveFromCart }) {
  const [barang, setBarang] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/pelanggan/barang')
      .then((res) => setBarang(res.data))
      .catch((err) => setError(getErrorMessage(err, 'Gagal memuat produk.')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center text-muted-foreground py-8">Memuat produk...</p>;
  if (error) return <p className="text-center text-destructive py-8">{error}</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {barang.map((b) => {
        const inCart = cart.find((c) => c.idbarang === b.idbarang);
        const qty = inCart?.jumlah || 0;
        return (
          <Card key={b.idbarang} className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{b.nama_barang}</CardTitle>
              <p className="text-sm text-muted-foreground">{b.kategori || '—'}</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">Rp {Number(b.harga).toLocaleString('id')}</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${b.stok > 0 ? 'bg-secondary text-secondary-foreground' : 'bg-destructive text-destructive-foreground'}`}>
                  {b.stok > 0 ? `Stok: ${b.stok}` : 'Habis'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {qty > 0 ? (
                  <>
                    <Button variant="outline" size="icon" onClick={() => onRemoveFromCart(b.idbarang)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{qty}</span>
                    <Button variant="outline" size="icon" onClick={() => onAddToCart(b)} disabled={qty >= b.stok}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button className="w-full" onClick={() => onAddToCart(b)} disabled={b.stok < 1}>
                    + Keranjang
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function KeranjangTab({ cart, onAddToCart, onRemoveFromCart, onClearCart, onCheckout, checkingOut, paymentMethod, setPaymentMethod }) {
  const total = cart.reduce((sum, c) => sum + c.harga * c.jumlah, 0);

  if (cart.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ShoppingCart className="mx-auto h-12 w-12 mb-3 opacity-40" />
        <p>Keranjang masih kosong.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {cart.map((c) => (
        <Card key={c.idbarang}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex-1">
              <p className="font-medium">{c.nama_barang}</p>
              <p className="text-sm text-muted-foreground">Rp {c.harga.toLocaleString('id')} x {c.jumlah}</p>
              <p className="text-sm font-semibold">Rp {(c.harga * c.jumlah).toLocaleString('id')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => onRemoveFromCart(c.idbarang)}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">{c.jumlah}</span>
              <Button variant="outline" size="icon" onClick={() => onAddToCart({ ...c })}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onRemoveFromCart(c.idbarang, true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metode Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <Button
                key={pm.value}
                variant={paymentMethod === pm.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPaymentMethod(pm.value)}
                className="justify-start"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {pm.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      <hr className="border-t" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold">Total: Rp {total.toLocaleString('id')}</p>
          <p className="text-sm text-muted-foreground">{cart.length} barang</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClearCart}>Kosongkan</Button>
          <Button onClick={onCheckout} disabled={checkingOut || !paymentMethod}>
            {checkingOut ? 'Memproses...' : 'Checkout'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PesananTab({ onOrderUpdated }) {
  const [orders, setOrders] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    api.get('/api/pelanggan/orders')
      .then((res) => setOrders(res.data))
      .catch((err) => setError(getErrorMessage(err, 'Gagal memuat pesanan.')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders, onOrderUpdated]);

  const openDetail = async (id) => {
    try {
      const res = await api.get(`/api/pelanggan/orders/${id}`);
      setDetail(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal memuat detail pesanan.'));
    }
  };

  const handlePay = async (id) => {
    setActionLoading(id);
    try {
      await api.patch(`/api/pelanggan/orders/${id}/pay`);
      fetchOrders();
      if (detail?.idpengiriman === id) openDetail(id);
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal bayar.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Yakin ingin membatalkan pesanan ini?')) return;
    setActionLoading(id);
    try {
      await api.patch(`/api/pelanggan/orders/${id}/cancel`);
      fetchOrders();
      if (detail?.idpengiriman === id) setDetail(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal batalkan.'));
    } finally {
      setActionLoading(null);
    }
  };

  const paymentLabel = (method) => {
    const pm = PAYMENT_METHODS.find(p => p.value === method);
    return pm ? pm.label : method;
  };

  if (detail) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => setDetail(null)} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pesanan #{detail.idpengiriman}</span>
              <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">{detail.status}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tanggal</p>
                <p>{new Date(detail.tanggalpengiriman).toLocaleDateString('id')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Pembayaran</p>
                <p>{detail.payment_method ? paymentLabel(detail.payment_method) : '—'}</p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${detail.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {detail.payment_status === 'paid' ? 'Lunas' : 'Belum Dibayar'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Penerima</p>
              <p>{detail.nama_pengirim}</p>
              <p className="text-sm">{detail.alamat_pengirim}</p>
              <p className="text-sm">{detail.no_hp_pengirim}</p>
            </div>
            <hr className="border-t" />
            <p className="text-sm text-muted-foreground">Barang</p>
            {detail.items?.map((item) => (
              <div key={item.idorder_barang || item.idbarang} className="flex justify-between text-sm">
                <span>{item.nama_barang} x{item.jumlah}</span>
                <span>Rp {(item.harga * item.jumlah).toLocaleString('id')}</span>
              </div>
            ))}
            <hr className="border-t" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>Rp {Number(detail.total).toLocaleString('id')}</span>
            </div>
            {detail.status === 'Menunggu Pembayaran' && (
              <Button className="w-full" onClick={() => handlePay(detail.idpengiriman)} disabled={actionLoading === detail.idpengiriman}>
                <CheckCircle className="h-4 w-4 mr-2" /> Bayar Sekarang (Demo)
              </Button>
            )}
            {CANCELLABLE_STATUSES.includes(detail.status) && (
              <Button variant="destructive" className="w-full" onClick={() => handleCancel(detail.idpengiriman)} disabled={actionLoading === detail.idpengiriman}>
                <XCircle className="h-4 w-4 mr-2" /> Batalkan Pesanan
              </Button>
            )}
            {detail.treks?.length > 0 && (
              <>
                <hr className="border-t" />
                <p className="text-sm text-muted-foreground">Riwayat Lacak</p>
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
              <p className="text-sm text-muted-foreground">{o.items}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(o.tanggalpengiriman).toLocaleDateString('id')}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold">Rp {Number(o.total).toLocaleString('id')}</p>
              <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">{o.status}</span>
              {o.payment_method && (
                <p className="text-xs text-muted-foreground mt-1">{paymentLabel(o.payment_method)}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CustomerPage() {
  const { user, logout, getSocket } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('produk');
  const [cart, setCart] = useState([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [orderUpdateTrigger, setOrderUpdateTrigger] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (data) => {
      if (data.status) setOrderUpdateTrigger(t => t + 1);
    };
    socket.on('order:update', handler);
    return () => socket.off('order:update', handler);
  }, [getSocket]);

  const handleAddToCart = useCallback((barang) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.idbarang === barang.idbarang);
      if (existing) {
        return prev.map((c) =>
          c.idbarang === barang.idbarang ? { ...c, jumlah: c.jumlah + 1 } : c
        );
      }
      return [...prev, { idbarang: barang.idbarang, nama_barang: barang.nama_barang, harga: Number(barang.harga), jumlah: 1 }];
    });
  }, []);

  const handleRemoveFromCart = useCallback((idbarang, removeAll) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.idbarang === idbarang);
      if (!existing) return prev;
      if (removeAll || existing.jumlah <= 1) {
        return prev.filter((c) => c.idbarang !== idbarang);
      }
      return prev.map((c) =>
        c.idbarang === idbarang ? { ...c, jumlah: c.jumlah - 1 } : c
      );
    });
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
    setPaymentMethod(null);
  }, []);

  const handleCheckout = async () => {
    if (cart.length === 0 || !paymentMethod) return;
    setError(null);
    setCheckingOut(true);
    try {
      await api.post('/api/pelanggan/orders', {
        barang: cart.map((c) => ({ idbarang: c.idbarang, jumlah: c.jumlah })),
        payment_method: paymentMethod,
      });
      setCart([]);
      setPaymentMethod(null);
      setActiveTab('pesanan');
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal checkout.'));
    } finally {
      setCheckingOut(false);
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
          <h1 className="text-lg font-bold">TB Logistik — Pelanggan</h1>
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
            const cartCount = cart.reduce((s, c) => s + c.jumlah, 0);
            const isCartTab = tab.key === 'keranjang';
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
                {isCartTab && cartCount > 0 && (
                  <span className="ml-1 inline-flex items-center rounded-full bg-destructive px-1.5 py-0.5 text-xs font-medium text-destructive-foreground h-5">
                    {cartCount}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        {activeTab === 'produk' && (
          <ProdukTab cart={cart} onAddToCart={handleAddToCart} onRemoveFromCart={handleRemoveFromCart} />
        )}
        {activeTab === 'keranjang' && (
          <KeranjangTab
            cart={cart}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onCheckout={handleCheckout}
            checkingOut={checkingOut}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
          />
        )}
        {activeTab === 'pesanan' && <PesananTab onOrderUpdated={orderUpdateTrigger} />}
      </main>
    </div>
  );
}
