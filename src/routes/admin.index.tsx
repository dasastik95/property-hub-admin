import { Link, createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Building2, CheckCircle, Clock, Settings, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';

import {
  adminActionTileClass,
  adminPageDescriptionClass,
  adminPageTitleClass,
  adminSurfaceClass,
} from '@/components/admin/adminTheme';
import { Card } from '@/components/ui/card';
import { getDashboardStats } from '@/integrations/supabase/admin';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/admin/')({
  head: () => ({
    title: 'Admin Dashboard - Purulia Properties',
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    activeListings: 0,
    pendingApprovals: 0,
    soldRented: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      iconClass: 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/18 dark:text-blue-200',
      glowClass: 'from-blue-500/14 via-blue-500/0 to-transparent',
    },
    {
      label: 'Total Properties',
      value: stats.totalProperties,
      icon: Building2,
      iconClass: 'bg-orange-500/15 text-orange-700 dark:bg-orange-500/18 dark:text-orange-200',
      glowClass: 'from-orange-500/14 via-orange-500/0 to-transparent',
    },
    {
      label: 'Active Listings',
      value: stats.activeListings,
      icon: CheckCircle,
      iconClass: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/18 dark:text-emerald-200',
      glowClass: 'from-emerald-500/14 via-emerald-500/0 to-transparent',
    },
    {
      label: 'Pending Approval',
      value: stats.pendingApprovals,
      icon: Clock,
      iconClass: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/18 dark:text-amber-200',
      glowClass: 'from-amber-500/14 via-amber-500/0 to-transparent',
    },
  ];

  const detailCards = [
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      body: 'Properties waiting for verification before they go live.',
      valueClass: 'text-amber-600 dark:text-amber-200',
      accentClass: 'from-amber-500/12 via-transparent to-transparent',
    },
    {
      title: 'Sold or Rented',
      value: stats.soldRented,
      body: 'Completed transactions tracked by the admin workflow.',
      valueClass: 'text-emerald-600 dark:text-emerald-200',
      accentClass: 'from-emerald-500/12 via-transparent to-transparent',
    },
  ];

  const quickActions = [
    {
      title: 'Manage Users',
      to: '/admin/users',
      icon: Users,
      iconClass: 'bg-blue-500/12 text-blue-700 dark:bg-blue-500/18 dark:text-blue-200',
    },
    {
      title: 'Manage Properties',
      to: '/admin/properties',
      icon: Building2,
      iconClass: 'bg-orange-500/12 text-orange-700 dark:bg-orange-500/18 dark:text-orange-200',
    },
    {
      title: 'Approvals',
      to: '/admin/properties',
      icon: Clock,
      iconClass: 'bg-amber-500/12 text-amber-700 dark:bg-amber-500/18 dark:text-amber-200',
    },
    {
      title: 'Settings',
      to: '/admin/settings',
      icon: Settings,
      iconClass: 'bg-slate-500/12 text-slate-700 dark:bg-slate-500/18 dark:text-slate-200',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className={adminPageTitleClass}>Dashboard</h1>
          <p className={adminPageDescriptionClass}>
            A cleaner snapshot of users, listings, and approvals across the platform.
          </p>
        </div>

        <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200/75 bg-white/85 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-300">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary">
            <TrendingUp size={18} />
          </span>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-50">Live activity</p>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Admin overview
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className={cn(
              adminSurfaceClass,
              'relative overflow-hidden p-6 transition duration-200 hover:-translate-y-0.5',
            )}
          >
            <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90', stat.glowClass)} />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-300">{stat.label}</p>
                <p
                  className={cn(
                    'mt-4 text-4xl font-bold tracking-tight text-slate-950 dark:text-white',
                    loading && 'animate-pulse',
                  )}
                >
                  {stat.value}
                </p>
              </div>
              <div className={cn('inline-flex h-14 w-14 items-center justify-center rounded-2xl', stat.iconClass)}>
                <stat.icon size={24} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {detailCards.map((card) => (
          <Card key={card.title} className={cn(adminSurfaceClass, 'relative overflow-hidden p-6')}>
            <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br', card.accentClass)} />
            <div className="relative">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{card.title}</h2>
              <p className={cn('mt-4 text-4xl font-bold tracking-tight', card.valueClass)}>{card.value}</p>
              <p className="mt-3 max-w-md text-sm text-slate-600 dark:text-slate-300">{card.body}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className={cn(adminSurfaceClass, 'p-6')}>
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Quick Actions</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Jump straight into the most common admin tasks.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.title} to={action.to} className={adminActionTileClass}>
              <span className={cn('inline-flex h-12 w-12 items-center justify-center rounded-2xl', action.iconClass)}>
                <action.icon size={22} />
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{action.title}</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
