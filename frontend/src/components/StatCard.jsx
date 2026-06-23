import { Card } from '@/components/ui/card';

const toneMap = {
  teal: {
    chip: 'bg-teal-50 text-teal-700 border-teal-200',
    accent: 'from-teal-500 to-cyan-400',
  },
  blue: {
    chip: 'bg-sky-50 text-sky-700 border-sky-200',
    accent: 'from-sky-500 to-cyan-400',
  },
  amber: {
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    accent: 'from-amber-500 to-orange-400',
  },
  slate: {
    chip: 'bg-slate-50 text-slate-700 border-slate-200',
    accent: 'from-slate-500 to-slate-300',
  },
};

export default function StatCard({ label, value, note, tone = 'slate' }) {
  const theme = toneMap[tone] || toneMap.slate;

  return (
    <Card className="relative overflow-hidden p-5 sm:p-6">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.accent}`} />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            {label}
          </p>
          <div className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {value}
          </div>
        </div>
        {note && (
          <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${theme.chip}`}>
            {note}
          </span>
        )}
      </div>
    </Card>
  );
}
