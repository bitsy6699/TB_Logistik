import { Badge } from '@/components/ui/badge';

const statusToVariant = {
  'Diproses': 'amber',
  'Dalam perjalanan': 'blue',
  'Sampai tujuan': 'sky',
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
