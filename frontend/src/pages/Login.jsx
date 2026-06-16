import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField';
import { inputClass, primaryButtonClass } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import logoImg from '../asset/logo.jpg';

const defaultForm = {
  username: '',
  password: '',
};

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
      setError(submitError?.message || 'Login gagal. Silakan periksa kembali username dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background radial/blur gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          {/* Logo / Delivery Icon */}
          <div className="flex h-20 w-20 items-center justify-center bg-transparent animate-fade-in">
            <img 
              src={logoImg} 
              alt="Logo" 
              className="h-full w-full object-contain rounded-2xl" 
            />
          </div>

          
          <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight text-slate-900">
            Masuk ke LogistikApp
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Silakan masuk untuk mengakses panel manajemen logistik
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-xl shadow-slate-100/50 backdrop-blur-sm">
          {error ? (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

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

            <button type="submit" className={`${primaryButtonClass} w-full`} disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memproses...
                </span>
              ) : (
                'Masuk ke Sistem'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

