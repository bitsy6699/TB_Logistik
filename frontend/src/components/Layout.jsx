import { useState, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

const navGroups = [
  {
    label: 'Dashboard',
    items: [
      { to: '/dashboard', label: 'Dashboard' },
    ],
  },
  {
    label: 'Data',
    items: [
      { to: '/customers', label: 'Pelanggan' },
      { to: '/kurirs', label: 'Kurir' },
      { to: '/gudangs', label: 'Gudang' },
      { to: '/barangs', label: 'Barang' },
    ],
  },
  {
    label: 'Transaksi',
    items: [
      { to: '/orders', label: 'Pengiriman' },
      { to: '/treks', label: 'Lacak Kiriman' },
      { to: '/penyimpanans', label: 'Penyimpanan' },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { to: '/backup', label: 'Backup & Restore' },
      { to: '/audit-logs', label: 'Audit Log' },
    ],
  },
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
  const navLocation = useLocation();
  const initials = getInitials(user?.name || user?.username);
  const [openGroups, setOpenGroups] = useState(() => {
    const group = navGroups.find((g) =>
      g.items.some((item) => navLocation.pathname === item.to || navLocation.pathname.startsWith(item.to + '/'))
    );
    return group && group.items.length > 1 ? [group.label] : [];
  });

  const toggleGroup = useCallback((label) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const renderNavItem = (item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        [
          'group flex items-center justify-between rounded-2xl px-4 py-2.5 text-sm font-medium transition',
          isActive
            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span>{item.label}</span>
          {isActive && (
            <span className="h-2 w-2 rounded-full bg-primary-foreground" />
          )}
        </>
      )}
    </NavLink>
  );

  const allNavItems = navGroups.flatMap((g) => g.items);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen w-full max-w-[1720px] gap-6 p-4 lg:p-6">
        <aside className="hidden w-72 shrink-0 flex-col rounded-[32px] border bg-card px-5 py-6 text-card-foreground shadow-soft lg:flex">
          <div className="rounded-[28px] bg-gradient-to-br from-primary/90 to-primary p-4 text-primary-foreground">
            <p className="font-display text-xl font-semibold tracking-tight">LogistikApp</p>
          </div>

          <nav className="mt-6 flex-1 space-y-1">
            {navGroups.map((group) => {
              const isOpen = openGroups.includes(group.label);
              const isSingle = group.items.length === 1;
              const singleItem = group.items[0];

              if (isSingle) {
                return (
                  <div key={group.label}>
                    {renderNavItem(singleItem)}
                  </div>
                );
              }

              return (
                <div key={group.label}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.label)}
                    className="flex w-full items-center justify-between rounded-2xl px-4 py-2.5 text-sm font-semibold text-muted-foreground/70 transition hover:bg-accent hover:text-accent-foreground"
                  >
                    {group.label}
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="ml-2 mt-0.5 space-y-0.5 border-l-2 border-border pl-3">
                      {group.items.map(renderNavItem)}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="rounded-[32px] border bg-card/85 px-5 py-4 shadow-soft backdrop-blur-sm lg:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground lg:hidden">
                  L
                </div>
                <p className="text-sm font-medium text-muted-foreground lg:hidden">LogistikApp</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Masuk sebagai</p>
                  <p className="mt-1 text-sm font-semibold">
                    {user?.name || 'Admin Demo'}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {initials}
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Keluar
                </Button>
              </div>
            </div>

            <nav className="mt-4 -mb-1 flex gap-2 overflow-x-auto pb-2 lg:hidden">
              {allNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    [
                      'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </header>

          <main className="flex-1 rounded-[32px] border bg-card/70 p-4 shadow-soft backdrop-blur-sm sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
