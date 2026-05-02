import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

/** Shared native select styling; dark mode matches app inputs (surface #1e293b). */
export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'focus-ring min-h-[38px] w-full cursor-pointer rounded-md border-[0.5px] border-zinc-300 bg-white py-[6px] pl-[10px] pr-9 text-sm leading-5 text-zinc-900 outline-none transition-colors',
        'shadow-sm hover:border-zinc-400 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50',
        'dark:border-dm-border dark:bg-dm-surface dark:text-dm-muted dark:shadow-none',
        'dark:hover:border-dm-border dark:focus:border-emerald-500',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
