import { ReactNode } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: 'navy' | 'gold' | 'success' | 'danger' | 'warning';
  icon?: ReactNode;
}) {
  const accentColor = {
    navy: 'text-navy',
    gold: 'text-gold',
    success: 'text-success',
    danger: 'text-danger',
    warning: 'text-warning',
  }[accent ?? 'navy'];

  return (
    <div className="card-compact flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">{label}</p>
        <p className={clsx('mt-2 text-3xl font-semibold tabular-nums', accentColor)}>{value}</p>
        {hint && <p className="mt-1 text-xs text-on-surface-variant">{hint}</p>}
      </div>
      {icon && <div className={clsx('rounded-md bg-surface-low p-2', accentColor)}>{icon}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx('animate-spin', className)} />;
}

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-on-surface-variant">
      <Spinner className="h-5 w-5" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-outline-variant bg-surface-low py-12 text-center">
      <p className="font-medium text-on-surface">{title}</p>
      {description && <p className="mt-1 text-sm text-on-surface-variant">{description}</p>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{message}</div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  WORKING: 'badge-success',
  FULL: 'badge-success',
  OK: 'badge-success',
  AVAILABLE: 'badge-success',
  CONFIRMED: 'badge-success',
  CLOSED: 'badge-success',
  CHECKED_IN: 'badge-success',
  CHECKED_OUT: 'badge-neutral',
  MEDIUM: 'badge-warning',
  PENDING: 'badge-warning',
  OPEN: 'badge-warning',
  NA: 'badge-neutral',
  NOT_OK: 'badge-danger',
  NOT_WORKING: 'badge-danger',
  LOW: 'badge-danger',
  CANCELLED: 'badge-danger',
  HIGH: 'badge-danger',
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'badge-neutral';
  return <span className={cls}>{status.replace(/_/g, ' ')}</span>;
}
