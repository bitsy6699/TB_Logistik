import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../components/ui';

const blankForm = {
  namagudang: '',
  alamat: '',
  kota: '',
};

const warehouseColumns = [
  { key: 'idgudang', label: 'ID' },
  { key: 'namagudang', label: 'Nama gudang' },
  { key: 'alamat', label: 'Alamat', className: 'whitespace-normal min-w-[240px]' },
  { key: 'kota', label: 'Kota' },
];

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState(blankForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/api/gudangs');
      setWarehouses(response.data);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Gagal memuat data gudang.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      await api.post('/api/gudangs', formData);
      setFormData(blankForm);
      setNotice('Gudang berhasil disimpan.');
      await fetchWarehouses();
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Gagal menyimpan data gudang.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master data"
        title="Data gudang"
        description="Kelola lokasi gudang dengan visual yang bersih dan tidak ramai."
        actions={
          <button type="button" onClick={fetchWarehouses} className={secondaryButtonClass}>
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
        <SectionCard
          title="Tambah gudang"
          description="Masukkan nama gudang, alamat, dan kota lokasi."
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormField label="Nama gudang">
              <input
                type="text"
                className={inputClass}
                value={formData.namagudang}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, namagudang: event.target.value }))
                }
                placeholder="Contoh: Gudang Utama Jakarta"
                required
              />
            </FormField>

            <FormField label="Alamat">
              <input
                type="text"
                className={inputClass}
                value={formData.alamat}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, alamat: event.target.value }))
                }
                placeholder="Contoh: Jl. Raya Industri No. 88"
                required
              />
            </FormField>

            <FormField label="Kota">
              <input
                type="text"
                className={inputClass}
                value={formData.kota}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, kota: event.target.value }))
                }
                placeholder="Contoh: Jakarta"
                required
              />
            </FormField>

            <button type="submit" className={primaryButtonClass} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan gudang'}
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Daftar gudang" description={`${warehouses.length} gudang tersimpan.`}>
          <DataTable
            rows={warehouses}
            columns={warehouseColumns}
            loading={loading}
            getRowKey={(row) => row.idgudang}
            emptyTitle="Belum ada gudang"
            emptyDescription="Tambahkan gudang pertama agar tabel ini terisi."
          />
        </SectionCard>
      </div>
    </div>
  );
}
