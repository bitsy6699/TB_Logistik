import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';
import { inputClass, textareaClass, primaryButtonClass, secondaryButtonClass } from '../components/ui';

const blankForm = {
  nama: '',
  alamat: '',
  notelepon: '',
};

const customerColumns = [
  { key: 'idpelanggan', label: 'ID' },
  { key: 'nama', label: 'Nama' },
  { key: 'alamat', label: 'Alamat', className: 'whitespace-normal min-w-[240px]' },
  { key: 'notelepon', label: 'No Telepon' },
];

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState(blankForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/api/customers');
      setCustomers(response.data);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Gagal memuat data pelanggan.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      await api.post('/api/customers', formData);
      setFormData(blankForm);
      setNotice('Pelanggan berhasil disimpan.');
      await fetchCustomers();
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Gagal menyimpan data pelanggan.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master data"
        title="Data pelanggan"
        description="Kelola pelanggan dalam tampilan yang lebih bersih, ringan, dan mudah dipindai."
        actions={
          <button type="button" onClick={fetchCustomers} className={secondaryButtonClass}>
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
          title="Tambah pelanggan"
          description="Isi formulir ini untuk menambahkan data pelanggan baru."
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormField label="Nama pelanggan">
              <input
                type="text"
                className={inputClass}
                value={formData.nama}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, nama: event.target.value }))
                }
                placeholder="Contoh: Siti Aminah"
                required
              />
            </FormField>

            <FormField label="Alamat">
              <textarea
                className={textareaClass}
                value={formData.alamat}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, alamat: event.target.value }))
                }
                placeholder="Contoh: Jl. Cempaka No. 10, Jakarta"
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
                placeholder="Contoh: 08123456789"
                required
              />
            </FormField>

            <button type="submit" className={primaryButtonClass} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan pelanggan'}
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Daftar pelanggan"
          description={`${customers.length} pelanggan tersimpan di database.`}
          action={
            <Link
              to="/orders"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Lihat pengiriman
            </Link>
          }
        >
          <DataTable
            rows={customers}
            columns={customerColumns}
            loading={loading}
            getRowKey={(row) => row.idpelanggan}
            emptyTitle="Belum ada pelanggan"
            emptyDescription="Tambahkan pelanggan pertama untuk mulai mengisi tabel ini."
          />
        </SectionCard>
      </div>
    </div>
  );
}
