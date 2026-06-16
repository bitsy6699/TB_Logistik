import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField';
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const defaultForm = {
  username: 'admin',
  password: 'admin123',
};

const highlights = [
  {
    title: 'Login first',
    description: 'Dashboard baru terbuka setelah autentikasi berhasil.',
  },
  {
    title: 'Dummy backend',
    description: 'Data percobaan siap dipakai tanpa database asli.',
  },
  {
    title: 'Minimal flow',
    description: 'Alur masuk dibuat singkat, rapi, dan jelas.',
  },
];

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const redirectTo = location.state?.from?.pathname || '/';

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData);
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError(submitError?.message || 'Login gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-slate-200/50 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6 lg:pr-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-teal-700 shadow-soft backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            Demo login required
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Login dulu sebelum masuk dashboard.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-500">
              Versi percobaan ini memakai backend dummy supaya workflow bisa dicoba tanpa setup
              database asli. Setelah login, kamu langsung masuk ke dashboard minimalis yang sudah
              disiapkan.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4 shadow-soft backdrop-blur-sm"
              >
                <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="rounded-[28px] border border-slate-200/80 bg-white/80 p-5 shadow-soft backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              Akun demo
            </p>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Username</p>
                <p className="mt-2 font-mono text-base text-slate-950">admin</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Password</p>
                <p className="mt-2 font-mono text-base text-slate-950">admin123</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-soft backdrop-blur-sm sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-700">
                Sign in
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950">
                Masuk ke LogistikApp
              </h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                Gunakan akun demo untuk membuka dashboard, lalu coba data pelanggan, kurir,
                gudang, dan pengiriman.
              </p>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <FormField label="Username">
              <input
                type="text"
                className={inputClass}
                value={formData.username}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, username: event.target.value }))
                }
                placeholder="admin"
                autoComplete="username"
                required
              />
            </FormField>

            <FormField label="Password">
              <input
                type="password"
                className={inputClass}
                value={formData.password}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="admin123"
                autoComplete="current-password"
                required
              />
            </FormField>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" className={primaryButtonClass} disabled={loading}>
                {loading ? 'Masuk...' : 'Masuk ke dashboard'}
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => setFormData({ ...defaultForm })}
                disabled={loading}
              >
                Pakai akun demo
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
