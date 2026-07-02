import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField';
import { inputClass } from '../components/ui';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import logoImg from '../asset/logo.jpg';

const defaultForm = {
  username: '',
  password: '',
};

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  if (isAuthenticated) {
    const roleRedirect = location.state?.from?.pathname || (user?.role === 'Pelanggan' ? '/pelanggan' : user?.role === 'Kurir' ? '/courier' : user?.role === 'Pengirim' ? '/pengirim' : '/dashboard');
    return <Navigate to={roleRedirect} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const session = await login(formData);
      const role = session?.user?.role;
      if (role === 'Pelanggan') {
        navigate('/pelanggan', { replace: true });
      } else if (role === 'Kurir') {
        navigate('/courier', { replace: true });
      } else if (role === 'Pengirim') {
        navigate('/pengirim', { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (submitError) {
      setError(submitError?.message || 'Login gagal. Silakan periksa kembali username dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-ring/20 blur-3xl" />
      </div>

        <div className="relative w-full max-w-md space-y-6 -translate-y-10">
        <div className="flex flex-col items-center text-center">
          <div className="mx-auto flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl bg-transparent animate-fade-in">
            <img src={logoImg} alt="Logo" className="h-full w-full object-contain" />
          </div>

          <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight">
            Masuk ke LogistikApp
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Silakan masuk untuk mengakses panel manajemen logistik
          </p>
        </div>

        <div className="rounded-[28px] border bg-card p-8 shadow-xl shadow-primary/5">
          {error && (
            <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <FormField label="Username">
              <input
                type="text"
                className={inputClass}
                value={formData.username}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, username: event.target.value }))
                }
                placeholder="Masukkan username Anda"
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
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </FormField>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memproses...
                </span>
              ) : (
                'Masuk ke Sistem'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
