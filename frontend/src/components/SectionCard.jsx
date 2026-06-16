export default function SectionCard({ title, description, action, children, className = '' }) {
  return (
    <section
      className={[
        'rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-soft backdrop-blur-sm sm:p-6',
        className,
      ].join(' ')}
    >
      {(title || description || action) ? (
        <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {title ? (
              <h2 className="font-display text-xl font-semibold tracking-tight text-slate-950">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-sm leading-6 text-slate-500">{description}</p>
            ) : null}
          </div>
          {action ? <div className="flex items-center gap-2">{action}</div> : null}
        </div>
      ) : null}

      {children}
    </section>
  );
}
