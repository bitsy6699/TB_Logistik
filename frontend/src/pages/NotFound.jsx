import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="max-w-xl rounded-[32px] border border-slate-200/80 bg-white/90 p-8 text-center shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-700">404</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-950">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-500">
          Halaman ini belum tersedia atau alamatnya tidak cocok dengan navigasi aplikasi.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </section>
  );
}
