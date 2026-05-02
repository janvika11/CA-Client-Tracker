import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'focus-ring w-full rounded-md border-[0.5px] border-zinc-300 bg-white px-[10px] py-[6px] text-sm leading-5 text-zinc-900 outline-none placeholder:text-zinc-400 transition-colors hover:border-zinc-400 focus:border-emerald-500 disabled:opacity-60',
        'shadow-sm dark:border-dm-border dark:bg-dm-surface dark:text-dm-fg dark:shadow-none dark:placeholder:text-dm-muted dark:hover:border-dm-border dark:focus:border-dm-accent',
        /** Match select min tap height without fixed h-10 everywhere */
        'min-h-[38px]',
        className
      )}
      {...props}
    />
  );
});
