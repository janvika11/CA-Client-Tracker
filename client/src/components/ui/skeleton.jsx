import { cn } from '../../lib/utils';

export function SkeletonBlock({ className }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-zinc-200 dark:bg-dm-surface dark:ring-1 dark:ring-dm-border/60',
        className
      )}
    />
  );
}
