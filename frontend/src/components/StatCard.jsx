export default function StatCard({ label, value, note, icon }) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card shadow-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cardHover">
      <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <div className="mt-2 font-display text-3xl font-semibold tracking-tight">
            {value}
          </div>
          {note && (
            <span className="mt-3 inline-flex rounded-full border border-border bg-secondary text-secondary-foreground px-3 py-1 text-xs">
              {note}
            </span>
          )}
        </div>
        {icon && (
          <div className="shrink-0 rounded-full bg-accent p-2.5 text-accent-foreground">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
