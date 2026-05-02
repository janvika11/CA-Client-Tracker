import { cn } from '../../lib/utils';

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-zinc-200/90 bg-white p-4 shadow-sm transition-shadow duration-200 dark:border-zinc-700/80 dark:bg-zinc-900 dark:shadow-none',
        className
      )}
      {...props}
    />
  );
}
