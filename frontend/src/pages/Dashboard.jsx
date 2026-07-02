import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Truck, Warehouse, Package } from 'lucide-react';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import { primaryButtonClass, secondaryButtonClass } from '../components/ui';

const PIE_COLORS = ['#1e3a5f', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#0f172a', '#1e293b'];

const statIcons = {
  customers: <Users className="h-5 w-5" />,
  kurirs: <Truck className="h-5 w-5" />,
  gudangs: <Warehouse className="h-5 w-5" />,
  orders: <Package className="h-5 w-5" />,
};

const statConfig = [
  { key: 'customers', label: 'Total Pelanggan' },
  { key: 'kurirs', label: 'Total Kurir' },
  { key: 'gudangs', label: 'Total Gudang' },
  { key: 'orders', label: 'Total Pengiriman' },
];

const quickLinks = [
  { to: '/customers', title: 'Kelola Pelanggan', description: 'Tambah, edit, dan hapus data pelanggan.' },
  { to: '/kurirs', title: 'Kelola Kurir', description: 'Manage kurir dan data kendaraan.' },
  { to: '/gudangs', title: 'Kelola Gudang', description: 'Kelola lokasi gudang transit.' },
  { to: '/barangs', title: 'Lihat Barang', description: 'Monitoring barang dan status stok.' },
];

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

function formatTime(date) {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(date);
}

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border bg-card px-3 py-2 shadow-soft text-xs">
        <p className="font-semibold">{payload[0].name}</p>
        <p className="text-muted-foreground">{payload[0].value} pengiriman</p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border bg-card px-3 py-2 shadow-soft text-xs">
        <p className="font-semibold">{label}</p>
        <p className="text-muted-foreground">{payload[0].value} pengiriman</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState({ totals: { customers: 0, kurirs: 0, gudangs: 0, orders: 0 }, orderStatuses: [], monthlyOrders: [], topCustomers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncedAt, setSyncedAt] = useState(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/stats');
      setStats(response.data);
      setSyncedAt(new Date());
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal memuat dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const activeShipments = stats.orderStatuses?.filter?.(
    (s) => !['Terkirim', 'Dibatalkan'].includes(s.status)
  )?.reduce?.((acc, s) => acc + s.count, 0) || 0;

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthlyTotal = stats.monthlyOrders?.find?.((m) => m.month === currentYearMonth)?.count || 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Ringkasan operasional sistem logistik."
        actions={
          <>
            <button type="button" onClick={loadStats} className={secondaryButtonClass}>Refresh</button>
            <Link to="/customers" className={primaryButtonClass}>Tambah Pelanggan</Link>
          </>
        }
      />

      {error ? (
        <div className="rounded-xl border border-border bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statConfig.map((item) => {
          const value = stats.totals[item.key];
          let note = null;
          if (item.key === 'kurirs') note = `(${value} aktif)`;
          else if (item.key === 'gudangs') note = `(${value} kota)`;
          return (
            <StatCard
              key={item.key}
              label={item.label}
              value={value}
              icon={statIcons[item.key]}
              note={note}
            />
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Distribusi Status" description="Status pengiriman saat ini.">
          {stats.orderStatuses.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data pengiriman.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={stats.orderStatuses} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={55} outerRadius={90} label={({ status, count }) => `${status}: ${count}`}>
                  {stats.orderStatuses.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Tren Pengiriman" description="Tren pengiriman bulanan.">
          {stats.monthlyOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data pengiriman.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.monthlyOrders} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => { const [y, m] = v.split('-'); return `${monthNames[parseInt(m) - 1]} ${y.slice(2)}`; }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="count" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Pelanggan Teratas" description="Top pelanggan dengan pengiriman terbanyak.">
          {stats.topCustomers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data pelanggan.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.topCustomers} layout="vertical" margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="nama" type="category" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1e3a5f" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Aksi Cepat">
          <div className="space-y-3">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="block rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
              >
                <p className="font-display text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                <p className="mt-3 text-xs font-semibold text-primary">Buka &rarr;</p>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Ringkasan Sistem">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Terakhir Sinkron</p>
            <p className="mt-1 font-display text-lg font-semibold">{syncedAt ? formatTime(syncedAt) : '-'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Pengiriman Aktif</p>
            <p className="mt-1 font-display text-lg font-semibold">{activeShipments}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Total Bulan Ini</p>
            <p className="mt-1 font-display text-lg font-semibold">{monthlyTotal}</p>
          </div>
        </div>
        <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
          Gunakan menu di samping untuk mengelola data pelanggan, kurir, gudang, dan pengiriman secara lengkap.
        </p>
      </SectionCard>
    </div>
  );
}
