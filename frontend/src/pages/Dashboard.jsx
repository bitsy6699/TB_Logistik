import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import { primaryButtonClass, secondaryButtonClass } from '../components/ui';

const statConfig = [
  { key: 'customers', label: 'Total pelanggan', tone: 'teal'},
  { key: 'kurirs', label: 'Total kurir', tone: 'blue'},
  { key: 'gudangs', label: 'Total gudang', tone: 'amber'},
  { key: 'orders', label: 'Total pengiriman', tone: 'slate'},
];

const quickLinks = [
  {
    to: '/customers',
    title: 'Kelola pelanggan',
    description: 'Tambah, edit, dan hapus data pelanggan.',
  },
  {
    to: '/kurirs',
    title: 'Kelola kurir',
    description: 'Manage kurir dan data kendaraan.',
  },
  {
    to: '/gudangs',
    title: 'Kelola gudang',
    description: 'Kelola lokasi gudang transit.',
  },
  {
    to: '/barangs',
    title: 'Lihat barang',
    description: 'Monitoring barang dan status stok.',
  },
];

function formatTime(date) {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    customers: 0,
    kurirs: 0,
    gudangs: 0,
    orders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncedAt, setSyncedAt] = useState(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');

    const results = await Promise.allSettled([
      api.get('/api/customers'),
      api.get('/api/kurirs'),
      api.get('/api/gudangs'),
      api.get('/api/orders'),
    ]);

    const [customers, kurirs, gudangs, orders] = results;

    setStats({
      customers: customers.status === 'fulfilled' ? customers.value.data.length : 0,
      kurirs: kurirs.status === 'fulfilled' ? kurirs.value.data.length : 0,
      gudangs: gudangs.status === 'fulfilled' ? gudangs.value.data.length : 0,
      orders: orders.status === 'fulfilled' ? orders.value.data.length : 0,
    });

    const failures = results.filter((result) => result.status === 'rejected').length;
    if (failures === results.length) {
      setError(getErrorMessage(results[0]?.reason, 'Semua endpoint dashboard gagal dimuat.'));
    } else if (failures > 0) {
      setError(
        `Sebagian data belum bisa dimuat. ${failures} dari ${results.length} endpoint gagal dibaca.`,
      );
    }

    setSyncedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard operasional"
        actions={
          <>
            <button type="button" onClick={loadStats} className={secondaryButtonClass}>
              Refresh data
            </button>
            <Link to="/customers" className={primaryButtonClass}>
              Tambah pelanggan
            </Link>
          </>
        }
      />

      {error ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_320px]">
        <SectionCard
          title="Ringkasan utama"
          description={
            syncedAt
              ? `Pembaruan terakhir ${formatTime(syncedAt)}`
              : 'Data dibaca langsung dari backend lokal.'
          }
        >
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-[28px] border border-slate-100 bg-slate-100"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {statConfig.map((item) => (
                <StatCard
                  key={item.key}
                  label={item.label}
                  value={stats[item.key]}
                  note={item.note}
                  tone={item.tone}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Aksi cepat"
        >
          <div className="space-y-3">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group block rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-white"
              >
                <p className="font-display text-base font-semibold tracking-tight text-slate-950">
                  {item.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.28em] text-teal-700 transition group-hover:translate-x-0.5">
                  Buka modul
                </p>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
