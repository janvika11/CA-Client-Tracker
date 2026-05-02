import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'focus-ring h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 transition-colors hover:border-zinc-400 focus:border-emerald-500 dark:border-dm-border dark:bg-dm-bg dark:text-dm-fg dark:hover:border-dm-muted dark:focus:border-emerald-500',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
