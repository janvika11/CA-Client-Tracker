import { cn } from '../../lib/utils';

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-zinc-200/90 bg-white p-4 shadow-sm transition-shadow duration-200 dark:border-dm-border dark:bg-dm-surface dark:shadow-[0_4px_24px_rgba(15,23,42,0.35),inset_0_1px_0_0_rgba(255,255,255,0.04)]',
        className
      )}
      {...props}
    />
  );
}
