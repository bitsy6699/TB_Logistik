import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Download, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { primaryButtonClass, secondaryButtonClass, dangerButtonClass, smallButtonClass } from '../components/ui';

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

export default function BackupRestore() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState('');

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/backups');
      setBackups(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal memuat daftar backup.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreateBackup = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await api.post('/api/backup');
      setNotice(response.data.message || 'Backup berhasil.');
      await fetchBackups();
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal membuat backup.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`Hapus file backup "${filename}"?`)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/api/backups/${encodeURIComponent(filename)}`);
      setNotice('File backup berhasil dihapus.');
      await fetchBackups();
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menghapus backup.'));
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    if (restoreConfirmText !== 'RESTORE') return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await api.post(`/api/backups/restore/${encodeURIComponent(restoreTarget.filename)}`, { confirm: true });
      setNotice(response.data.message || 'Restore berhasil.');
      setRestoreTarget(null);
      setRestoreConfirmText('');
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal merestore database.'));
    } finally {
      setSaving(false);
    }
  };

  const backupColumns = [
    { key: 'filename', label: 'Nama File' },
    {
      key: 'size', label: 'Ukuran',
      render: (row) => formatSize(row.size),
    },
    {
      key: 'createdAt', label: 'Dibuat',
      render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleString('id-ID') : '—',
    },
    {
      key: '_actions', label: 'Aksi',
      render: (row) => (
        <div className="flex gap-2">
          <a
            href={`/api/backups/download/${encodeURIComponent(row.filename)}`}
            className={smallButtonClass}
            title="Download"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            className={dangerButtonClass}
            onClick={() => {
              setRestoreTarget(row);
              setRestoreConfirmText('');
            }}
            title="Restore"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className={dangerButtonClass}
            onClick={() => handleDelete(row.filename)}
            title="Hapus"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fadeIn space-y-6">
      <PageHeader
        title="Backup & Restore Database"
        actions={
          <button
            type="button"
            onClick={handleCreateBackup}
            className={primaryButtonClass}
            disabled={saving}
          >
            {saving ? 'Memproses...' : 'Buat Backup Baru'}
          </button>
        }
      />

      {notice ? (
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">
          {error}
        </div>
      ) : null}

      <SectionCard
        title="Daftar Backup"
        description={`${backups.length} file backup tersimpan.`}
        action={
          <button type="button" onClick={fetchBackups} className={secondaryButtonClass}>
            Refresh
          </button>
        }
      >
        <DataTable
          rows={backups}
          columns={backupColumns}
          loading={loading}
          getRowKey={(row) => row.filename}
          emptyTitle="Belum ada backup"
          emptyDescription="Klik tombol 'Buat Backup Baru' untuk membuat cadangan database pertama."
        />
      </SectionCard>

      <SectionCard title="Informasi">
        <div className="space-y-3 text-sm leading-7 text-muted-foreground">
          <p>
            Backup menggunakan perintah <code className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono">mysqldump</code> dengan opsi <code className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono">--single-transaction</code> sehingga tidak mengganggu operasi database yang sedang berjalan.
          </p>
          <p>
            File backup disimpan di folder <code className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono">backend/backups/</code> dan tidak termasuk dalam version control.
          </p>
          <p className="flex items-start gap-2 text-amber-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Restore akan <strong>menimpa seluruh data</strong> yang ada di database dengan isi file backup. Tindakan ini tidak bisa dibatalkan.</span>
          </p>
        </div>
      </SectionCard>

      <Modal
        isOpen={!!restoreTarget}
        onClose={() => { setRestoreTarget(null); setRestoreConfirmText(''); }}
        title="Restore Database"
        description="Tindakan ini akan menimpa seluruh data saat ini."
      >
        {restoreTarget && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">
              <p className="font-semibold">File: {restoreTarget.filename}</p>
              <p className="mt-1">Ukuran: {formatSize(restoreTarget.size)}</p>
              <p>Dibuat: {new Date(restoreTarget.createdAt).toLocaleString('id-ID')}</p>
            </div>

            <p className="text-sm font-medium text-foreground">
              Ketik <strong>RESTORE</strong> untuk mengonfirmasi:
            </p>
            <input
              type="text"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/10"
              value={restoreConfirmText}
              onChange={(e) => setRestoreConfirmText(e.target.value)}
              placeholder="Ketik RESTORE"
              autoComplete="off"
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                className={dangerButtonClass}
                disabled={restoreConfirmText !== 'RESTORE' || saving}
                onClick={handleRestore}
              >
                {saving ? 'Merestore...' : 'Mulai Restore'}
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => { setRestoreTarget(null); setRestoreConfirmText(''); }}
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
