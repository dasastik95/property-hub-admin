import { cn } from '@/lib/utils';

export const adminPageTitleClass =
  'text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50';

export const adminPageDescriptionClass = 'mt-2 text-sm text-slate-600 dark:text-slate-300';

export const adminSurfaceClass =
  'rounded-[28px] border border-slate-200/80 bg-white/92 shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/72 dark:shadow-[0_26px_70px_-32px_rgba(2,6,23,0.95)]';

export const adminSubtleSurfaceClass =
  'rounded-2xl border border-slate-200/70 bg-slate-50/90 dark:border-white/10 dark:bg-slate-900/82';

export const adminInputClass =
  'border-slate-200 bg-white/90 text-slate-700 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-white/10 dark:bg-slate-900/82 dark:text-slate-100 dark:placeholder:text-slate-400';

export const adminSelectClass =
  'h-11 rounded-xl border border-slate-200 bg-white/90 px-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900/82 dark:text-slate-100 dark:focus:border-primary dark:focus:ring-primary/25';

export const adminTableHeadClass = 'bg-slate-100/80 dark:bg-slate-900/90';

export const adminTableHeaderCellClass =
  'px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300';

export const adminTableRowClass =
  'border-t border-slate-200/70 transition-colors hover:bg-slate-50/80 dark:border-white/10 dark:hover:bg-white/5';

export const adminTableCellClass = 'px-6 py-4 text-sm text-slate-600 dark:text-slate-300';

export const adminStrongCellClass =
  'px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-50';

export const adminIconButtonClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white';

export const adminFieldLabelClass =
  'mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200';

export const adminNoteClass = 'text-sm text-slate-500 dark:text-slate-400';

export const adminDialogContentClass =
  'max-h-[90vh] overflow-y-auto rounded-[28px] border border-slate-200/80 bg-white/96 shadow-2xl dark:border-white/10 dark:bg-slate-950/90';

export const adminActionTileClass =
  'group flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/75 bg-slate-50/90 px-4 py-5 text-center transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white dark:border-white/10 dark:bg-slate-900/82 dark:hover:border-primary/45 dark:hover:bg-slate-900';

export const adminInsetPanelClass =
  'rounded-2xl border border-slate-200/70 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-slate-900/75';

const pillClass =
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset';

export function getRoleBadgeClass(role?: string) {
  switch (role) {
    case 'admin':
      return cn(
        pillClass,
        'bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-500/18 dark:text-rose-200 dark:ring-rose-400/20',
      );
    case 'broker':
      return cn(
        pillClass,
        'bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-500/18 dark:text-violet-200 dark:ring-violet-400/20',
      );
    case 'seller':
      return cn(
        pillClass,
        'bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-500/18 dark:text-blue-200 dark:ring-blue-400/20',
      );
    default:
      return cn(
        pillClass,
        'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/18 dark:text-slate-200 dark:ring-slate-400/20',
      );
  }
}

export function getPropertyStatusClass(status?: string) {
  switch (status) {
    case 'active':
      return 'border-green-200 bg-green-100 text-green-700 dark:border-green-400/20 dark:bg-green-500/18 dark:text-green-200';
    case 'pending':
      return 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/18 dark:text-amber-200';
    case 'sold':
      return 'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/18 dark:text-blue-200';
    case 'rented':
      return 'border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/18 dark:text-violet-200';
    default:
      return 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-400/20 dark:bg-slate-500/18 dark:text-slate-200';
  }
}
