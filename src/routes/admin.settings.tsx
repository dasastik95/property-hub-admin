import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import {
  adminFieldLabelClass,
  adminInputClass,
  adminPageDescriptionClass,
  adminPageTitleClass,
  adminSurfaceClass,
} from '@/components/admin/adminTheme';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/admin/settings')({
  head: () => ({
    title: 'Admin Settings',
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'Purulia Properties',
    contactEmail: 'contact@puruliaproperties.com',
    supportPhone: '+91-XXXXX-XXXXX',
    commissionRate: 1,
    maxFeaturedListings: 5,
    maintenanceMode: false,
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (field: string, value: string | number | boolean) => {
    setSettings((currentSettings) => ({ ...currentSettings, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    toast.success('Settings saved successfully');
    setSaved(true);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className={adminPageTitleClass}>Settings</h1>
          <p className={adminPageDescriptionClass}>
            Tune platform controls with better contrast and more comfortable spacing.
          </p>
        </div>

        {saved && (
          <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/18 dark:text-emerald-200">
            <ShieldCheck size={18} />
            Changes saved
          </div>
        )}
      </div>

      <Card className={cn(adminSurfaceClass, 'p-6')}>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">General Settings</h2>
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className={adminFieldLabelClass}>Site Name</label>
            <Input
              value={settings.siteName}
              onChange={(e) => handleChange('siteName', e.target.value)}
              className={cn('h-11 rounded-xl', adminInputClass)}
            />
          </div>

          <div>
            <label className={adminFieldLabelClass}>Contact Email</label>
            <Input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              className={cn('h-11 rounded-xl', adminInputClass)}
            />
          </div>

          <div className="md:col-span-2">
            <label className={adminFieldLabelClass}>Support Phone</label>
            <Input
              value={settings.supportPhone}
              onChange={(e) => handleChange('supportPhone', e.target.value)}
              className={cn('h-11 rounded-xl', adminInputClass)}
            />
          </div>
        </div>
      </Card>

      <Card className={cn(adminSurfaceClass, 'p-6')}>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Monetization</h2>
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className={adminFieldLabelClass}>Commission Rate (%)</label>
            <Input
              type="number"
              value={settings.commissionRate}
              onChange={(e) => handleChange('commissionRate', Number.parseFloat(e.target.value) || 0)}
              className={cn('h-11 rounded-xl', adminInputClass)}
            />
          </div>

          <div>
            <label className={adminFieldLabelClass}>Max Featured Listings Per User</label>
            <Input
              type="number"
              value={settings.maxFeaturedListings}
              onChange={(e) => handleChange('maxFeaturedListings', Number.parseInt(e.target.value, 10) || 0)}
              className={cn('h-11 rounded-xl', adminInputClass)}
            />
          </div>
        </div>
      </Card>

      <Card className={cn(adminSurfaceClass, 'p-6')}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Maintenance Mode</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Disable the platform for everyone except admins while work is in progress.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleChange('maintenanceMode', !settings.maintenanceMode)}
            className={cn(
              'inline-flex h-8 w-16 items-center rounded-full border px-1 transition',
              settings.maintenanceMode
                ? 'border-rose-300 bg-rose-500/85 dark:border-rose-400/20 dark:bg-rose-500/60'
                : 'border-emerald-300 bg-emerald-500/85 dark:border-emerald-400/20 dark:bg-emerald-500/60',
            )}
            aria-pressed={settings.maintenanceMode}
          >
            <span
              className={cn(
                'h-6 w-6 rounded-full bg-white shadow-md transition-transform',
                settings.maintenanceMode ? 'translate-x-8' : 'translate-x-0',
              )}
            />
          </button>
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button onClick={handleSave} className="h-11 rounded-xl px-8">
          Save Settings
        </Button>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          These controls still use demo persistence until the backend save flow is connected.
        </p>
      </div>

      <Card className="rounded-[28px] border border-rose-200/80 bg-rose-50/92 p-6 shadow-[0_20px_55px_-30px_rgba(190,24,93,0.28)] dark:border-rose-400/20 dark:bg-rose-500/10 dark:shadow-[0_24px_60px_-30px_rgba(190,24,93,0.32)]">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/12 text-rose-700 dark:bg-rose-500/18 dark:text-rose-200">
            <AlertTriangle size={20} />
          </span>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-rose-900 dark:text-rose-100">Danger Zone</h2>
            <p className="mt-2 text-sm text-rose-700/85 dark:text-rose-100/80">
              Leave these actions loud and obvious so they do not disappear into the dark theme.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Clear All Cache
              </button>
              <button
                type="button"
                className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Reset Analytics
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
