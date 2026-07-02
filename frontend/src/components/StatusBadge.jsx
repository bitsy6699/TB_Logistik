import { Badge } from '@/components/ui/badge';

const statusToVariant = {
  'Menunggu Pembayaran': 'purple',
  'Pembayaran Diverifikasi': 'purple',
  'Diproses': 'amber',
  'Dikemas': 'cyan',
  'Siap Dijemput': 'blue',
  'Dalam Perjalanan': 'indigo',
  'Sampai Tujuan': 'sky',
  'Terkirim': 'emerald',
  'Dibatalkan': 'rose',
  'Tersedia': 'teal',
  'Dalam transit': 'indigo',
  'Rusak': 'orange',
  'Hilang': 'red',
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  const variant = statusToVariant[status] || 'secondary';
  return <Badge variant={variant}>{status}</Badge>;
}
