import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="animate-fadeIn flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="max-w-xl rounded-xl border border-border bg-card p-8 text-center shadow-card">
        <p className="font-display text-7xl font-bold tracking-tight text-primary">404</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Halaman ini belum tersedia atau alamatnya tidak cocok dengan navigasi aplikasi.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </section>
  );
}
