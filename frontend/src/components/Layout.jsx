import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const logoutButtonClass =
  'inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-950/10';

const navigation = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/customers', label: 'Data Pelanggan' },
  { to: '/orders', label: 'Data Pengiriman' },
  { to: '/kurirs', label: 'Data Kurir' },
  { to: '/gudangs', label: 'Data Gudang' },
  { to: '/barangs', label: 'Data Barang' },
];

function getInitials(name) {
  return (name || 'Demo User')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = getInitials(user?.name || user?.username);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen w-full max-w-[1720px] gap-6 p-4 lg:p-6">
        <aside className="hidden w-72 shrink-0 flex-col rounded-[32px] border border-slate-200/80 bg-slate-950 px-5 py-6 text-slate-100 shadow-soft lg:flex">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
            <p className="font-display text-xl font-semibold tracking-tight">LogistikApp</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Minimal operations dashboard for shipment, warehouse, and customer data.
            </p>
          </div>

          <nav className="mt-6 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-white text-slate-950 shadow-lg shadow-black/10'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    <span
                      className={[
                        'h-2.5 w-2.5 rounded-full transition',
                        isActive ? 'bg-teal-500' : 'bg-white/20 group-hover:bg-white/40',
                      ].join(' ')}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto rounded-[28px] border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            <p className="font-medium text-white">Backend trial</p>
            <p className="mt-1 leading-6">Express API with dummy data for testing.</p>
            <p className="mt-3 text-xs uppercase tracking-[0.28em] text-slate-500">
              Port 5001
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="rounded-[32px] border border-slate-200/80 bg-white/85 px-5 py-4 shadow-soft backdrop-blur-sm lg:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-700">
                  Minimal Ops
                </p>
                <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-slate-950">
                  LogistikApp Admin
                </h1>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Login first, then manage data from the dummy backend.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 sm:inline-flex">
                  Demo mode
                </span>
                <div className="hidden text-right sm:block">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Signed in as</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {user?.name || 'Admin Demo'}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                  {initials}
                </div>
                <button type="button" onClick={handleLogout} className={logoutButtonClass}>
                  Logout
                </button>
              </div>
            </div>

            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    [
                      'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition',
                      isActive
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </header>

          <main className="flex-1 rounded-[32px] border border-slate-200/80 bg-white/70 p-4 shadow-soft backdrop-blur-sm sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
