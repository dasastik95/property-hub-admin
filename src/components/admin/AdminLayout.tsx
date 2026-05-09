import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';
import { BarChart3, Building2, LogOut, Menu, Settings, Users, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children?: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await signOut();
    navigate({ to: '/' });
  };

  const navItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/admin' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: Building2, label: 'Properties', href: '/admin/properties' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ];

  const displayName = profile?.display_name || user?.email || 'Admin';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-100/90 text-slate-900 dark:bg-transparent dark:text-slate-50">
      <aside
        className={cn(
          'relative flex flex-col border-r border-white/10 bg-[linear-gradient(180deg,#0e47a1_0%,#0a387d_100%)] text-white shadow-[0_24px_60px_-24px_rgba(14,71,161,0.65)] transition-all duration-300 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.92))] dark:shadow-[0_30px_70px_-30px_rgba(2,6,23,0.95)]',
          sidebarOpen ? 'w-72' : 'w-20',
        )}
      >
        <div className="p-5">
          <div className="rounded-3xl border border-white/12 bg-white/8 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className={cn('text-[11px] uppercase tracking-[0.2em] text-white/65', !sidebarOpen && 'hidden')}>
                  Control Center
                </p>
                <div className={cn('mt-1 font-display text-xl font-semibold tracking-tight', !sidebarOpen && 'hidden')}>
                  Admin
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen((open) => !open)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-white/80 transition hover:bg-white/14 hover:text-white"
                aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white',
                !sidebarOpen && 'justify-center px-0',
              )}
              activeProps={{
                className:
                  'bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_32px_-24px_rgba(2,6,23,0.95)]',
              }}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition group-hover:bg-white/14">
                <item.icon size={18} />
              </span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="h-11 w-full justify-center gap-2 rounded-2xl border border-white/10 bg-white/8 text-white hover:bg-white/14 hover:text-white"
          >
            <LogOut size={18} />
            {sidebarOpen && 'Logout'}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-slate-200/70 bg-white/88 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/52">
          <div className="flex items-center justify-between gap-4 px-6 py-4 lg:px-8">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Purulia Properties
              </p>
              <h1 className="mt-1 truncate font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Admin Console
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Signed in
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {displayName}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--orange)))] text-sm font-bold text-white shadow-[0_12px_30px_-14px_hsl(var(--primary)/0.8)]">
                {avatarLetter}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl p-6 lg:p-8">{children || <Outlet />}</div>
        </main>
      </div>
    </div>
  );
}
