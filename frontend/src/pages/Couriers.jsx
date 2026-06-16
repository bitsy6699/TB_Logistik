import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../components/ui';

const blankForm = {
  nama: '',
  notelepon: '',
  kendaraan: '',
};

const courierColumns = [
  { key: 'idkurir', label: 'ID' },
  { key: 'nama', label: 'Nama' },
  { key: 'notelepon', label: 'No Telepon' },
  { key: 'kendaraan', label: 'Kendaraan' },
];

export default function Couriers() {
  const [couriers, setCouriers] = useState([]);
  const [formData, setFormData] = useState(blankForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchCouriers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/api/kurirs');
      setCouriers(response.data);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Gagal memuat data kurir.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCouriers();
  }, [fetchCouriers]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      await api.post('/api/kurirs', formData);
      setFormData(blankForm);
      setNotice('Kurir berhasil disimpan.');
      await fetchCouriers();
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Gagal menyimpan data kurir.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master data"
        title="Data kurir"
        description="Daftar kurir dikurasi dengan tampilan yang lebih tenang dan fokus."
        actions={
          <button type="button" onClick={fetchCouriers} className={secondaryButtonClass}>
            Refresh data
          </button>
        }
      />

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

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SectionCard title="Tambah kurir" description="Simpan identitas kurir beserta armadanya.">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormField label="Nama kurir">
              <input
                type="text"
                className={inputClass}
                value={formData.nama}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, nama: event.target.value }))
                }
                placeholder="Contoh: Budi Santoso"
                required
              />
            </FormField>

            <FormField label="No telepon">
              <input
                type="text"
                className={inputClass}
                value={formData.notelepon}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, notelepon: event.target.value }))
                }
                placeholder="Contoh: 081212345678"
                required
              />
            </FormField>

            <FormField label="Kendaraan">
              <input
                type="text"
                className={inputClass}
                value={formData.kendaraan}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, kendaraan: event.target.value }))
                }
                placeholder="Contoh: Motor Box"
                required
              />
            </FormField>

            <button type="submit" className={primaryButtonClass} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan kurir'}
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Daftar kurir"
          description={`${couriers.length} kurir tersimpan di database.`}
        >
          <DataTable
            rows={couriers}
            columns={courierColumns}
            loading={loading}
            getRowKey={(row) => row.idkurir}
            emptyTitle="Belum ada kurir"
            emptyDescription="Tambahkan kurir pertama untuk mulai mengisi tabel ini."
          />
        </SectionCard>
      </div>
    </div>
  );
}
