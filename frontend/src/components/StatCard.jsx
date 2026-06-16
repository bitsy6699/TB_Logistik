const toneMap = {
  teal: {
    chip: 'border-teal-200 bg-teal-50 text-teal-700',
    accent: 'from-teal-500 to-cyan-400',
  },
  blue: {
    chip: 'border-sky-200 bg-sky-50 text-sky-700',
    accent: 'from-sky-500 to-cyan-400',
  },
  amber: {
    chip: 'border-amber-200 bg-amber-50 text-amber-700',
    accent: 'from-amber-500 to-orange-400',
  },
  slate: {
    chip: 'border-slate-200 bg-slate-50 text-slate-700',
    accent: 'from-slate-500 to-slate-300',
  },
};

export default function StatCard({ label, value, note, tone = 'slate' }) {
  const theme = toneMap[tone] || toneMap.slate;

  return (
    <article className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-soft">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.accent}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            {label}
          </p>
          <div className="mt-4 font-display text-4xl font-semibold tracking-tight text-slate-950">
            {value}
          </div>
        </div>
        {note ? (
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.chip}`}>
            {note}
          </span>
        ) : null}
      </div>
    </article>
  );
}
