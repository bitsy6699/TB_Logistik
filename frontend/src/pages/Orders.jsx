import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import { secondaryButtonClass } from '../components/ui';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transaksi"
        title="Data pengiriman"
        description="Tabel ini menampilkan data pengiriman dummy agar workflow bisa dicoba tanpa database asli."
        actions={
          <button type="button" onClick={fetchOrders} className={secondaryButtonClass}>
            Refresh data
          </button>
        }
      />

      {error ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <SectionCard
        title="Daftar pengiriman"
        description={`${orders.length} entri data percobaan.`}
      >
        <DataTable
          rows={orders}
          loading={loading}
          emptyTitle="Belum ada pengiriman"
          emptyDescription="Backend dummy belum mengembalikan data pengiriman."
        />
      </SectionCard>
    </div>
  );
}
