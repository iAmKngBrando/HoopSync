import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  label?: string;
}

export function Card({ children, className, label }: CardProps) {
  return (
    <section aria-label={label} className={cn('glass flex min-w-0 flex-col rounded-card p-4', className)}>
      {children}
    </section>
  );
}

interface SectionHeaderProps {
  title: string;
  live?: boolean;
  /** Quiet qualifier shown after the title, e.g. "(5)" or "(next game)" */
  note?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, live, note, action, className }: SectionHeaderProps) {
  return (
    <header className={cn('mb-3 flex min-h-6 items-center justify-between gap-3', className)}>
      <h2 className="flex items-center gap-2 text-[13px] font-bold tracking-wide text-foreground-secondary">
        {title}
        {note && <span className="font-normal normal-case text-muted-foreground">{note}</span>}
        {live && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
            <span className="size-1.5 rounded-full bg-primary motion-safe:animate-pulse" />
            LIVE
          </span>
        )}
      </h2>
      {action}
    </header>
  );
}

export function TextAction({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 text-xs font-semibold text-foreground-secondary transition-colors hover:text-foreground"
    >
      {children}
    </button>
  );
}

interface EmptyStateProps {
  title: string;
  hint?: string;
  className?: string;
}

export function EmptyState({ title, hint, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-4 py-8 text-center', className)}>
      <div className="text-sm font-medium text-foreground-secondary">{title}</div>
      {hint && <div className="mt-1 max-w-xs text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
