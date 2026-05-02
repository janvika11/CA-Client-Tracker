import { cn } from '../../lib/utils';

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-zinc-200/90 bg-white p-4 shadow-sm transition-shadow duration-200 dark:border-dm-border dark:bg-dm-surface dark:shadow-none',
        className
      )}
      {...props}
    />
  );
}
