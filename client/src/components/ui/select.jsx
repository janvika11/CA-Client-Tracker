import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'focus-ring h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 transition-colors hover:border-zinc-400 focus:border-emerald-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-500 dark:focus:border-emerald-500',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
