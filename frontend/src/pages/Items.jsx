import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import { secondaryButtonClass } from '../components/ui';

export default function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/api/barangs');
      setItems(response.data);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Gagal memuat data barang.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Data barang"
        description="Data barang percobaan ditarik dari backend dummy lalu dirapikan dalam tabel modern."
        actions={
          <button type="button" onClick={fetchItems} className={secondaryButtonClass}>
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
        title="Daftar barang"
        description={`${items.length} entri data percobaan.`}
      >
        <DataTable
          rows={items}
          loading={loading}
          emptyTitle="Belum ada barang"
          emptyDescription="Backend dummy belum mengembalikan data barang."
        />
      </SectionCard>
    </div>
  );
}
