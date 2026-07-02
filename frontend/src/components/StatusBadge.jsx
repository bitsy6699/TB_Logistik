import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle,
  Package,
  PackageOpen,
  Truck,
  MapPin,
  CheckCircle2,
  XCircle,
  Check,
  AlertTriangle,
} from 'lucide-react';

const statusConfig = {
  'Menunggu Pembayaran': { icon: Clock, variant: 'warning' },
  'Pembayaran Diverifikasi': { icon: CheckCircle, variant: 'warning' },
  'Diproses': { icon: Clock, variant: 'secondary' },
  'Dikemas': { icon: Package, variant: 'secondary' },
  'Siap Dijemput': { icon: PackageOpen, variant: 'secondary' },
  'Dalam Perjalanan': { icon: Truck, variant: 'default' },
  'Sampai Tujuan': { icon: MapPin, variant: 'success' },
  'Terkirim': { icon: CheckCircle2, variant: 'success' },
  'Dibatalkan': { icon: XCircle, variant: 'destructive' },
  'Tersedia': { icon: Check, variant: 'success' },
  'Dalam transit': { icon: Truck, variant: 'default' },
  'Rusak': { icon: AlertTriangle, variant: 'destructive' },
  'Hilang': { icon: AlertTriangle, variant: 'destructive' },
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  const config = statusConfig[status];
  if (!config) return <Badge variant="secondary">{status}</Badge>;

  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="inline-flex gap-1 items-center">
      <Icon className="h-3.5 w-3.5" />
      {status}
    </Badge>
  );
}
