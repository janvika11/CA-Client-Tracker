import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'focus-ring h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors hover:border-zinc-400 focus:border-emerald-500 dark:border-dm-border dark:bg-dm-bg dark:text-dm-fg dark:placeholder:text-dm-muted dark:hover:border-dm-muted dark:focus:border-emerald-500',
        className
      )}
      {...props}
    />
  );
});
