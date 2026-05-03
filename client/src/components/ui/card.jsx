import { cn } from '../../lib/utils';

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm transition-shadow duration-200 dark:border-white/[0.06] dark:bg-dm-surface dark:shadow-card-dark',
        className
      )}
      {...props}
    />
  );
}
