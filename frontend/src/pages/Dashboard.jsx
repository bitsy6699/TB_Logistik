import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import { primaryButtonClass, secondaryButtonClass } from '../components/ui';

const PIE_COLORS = ['#0f766e', '#0284c7', '#d97706', '#65a30d', '#dc2626', '#7c3aed', '#06b6d4', '#f59e0b', '#84cc16'];

const statConfig = [
  { key: 'customers', label: 'Total pelanggan', tone: 'teal'},
  { key: 'kurirs', label: 'Total kurir', tone: 'blue'},
  { key: 'gudangs', label: 'Total gudang', tone: 'amber'},
  { key: 'orders', label: 'Total pengiriman', tone: 'slate'},
];

const quickLinks = [
  { to: '/customers', title: 'Kelola pelanggan', description: 'Tambah, edit, dan hapus data pelanggan.' },
  { to: '/kurirs', title: 'Kelola kurir', description: 'Manage kurir dan data kendaraan.' },
  { to: '/gudangs', title: 'Kelola gudang', description: 'Kelola lokasi gudang transit.' },
  { to: '/barangs', title: 'Lihat barang', description: 'Monitoring barang dan status stok.' },
];

function formatTime(date) {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(date);
}

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

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard operasional" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-[28px] border border-slate-100 bg-slate-100" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-[24px] border border-slate-100 bg-slate-100" />
          <div className="h-72 animate-pulse rounded-[24px] border border-slate-100 bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard operasional"
        actions={
          <>
            <button type="button" onClick={loadStats} className={secondaryButtonClass}>Refresh data</button>
            <Link to="/customers" className={primaryButtonClass}>Tambah pelanggan</Link>
          </>
        }
      />

      {error ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statConfig.map((item) => (
          <StatCard key={item.key} label={item.label} value={stats.totals[item.key]} tone={item.tone} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Status Pengiriman" description="Distribusi status order saat ini.">
          {stats.orderStatuses.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Belum ada data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={stats.orderStatuses} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} innerRadius={40} label={({ status, count }) => `${status}: ${count}`}>
                  {stats.orderStatuses.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Pengiriman per Bulan" description="Tren pengiriman bulanan.">
          {stats.monthlyOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Belum ada data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.monthlyOrders} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Pelanggan Teratas" description="Top 5 pelanggan dengan pengiriman terbanyak.">
          {stats.topCustomers.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Belum ada data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.topCustomers} layout="vertical" margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="nama" type="category" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0284c7" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Aksi Cepat">
          <div className="space-y-3">
            {quickLinks.map((item) => (
              <Link key={item.to} to={item.to}
                className="group block rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-white">
                <p className="font-display text-base font-semibold tracking-tight text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.28em] text-teal-700 transition group-hover:translate-x-0.5">Buka modul</p>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
