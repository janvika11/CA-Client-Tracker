import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

/**
 * Matches Input field spec for filters and forms (see `input.jsx`).
 */
export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'focus-ring min-h-[38px] w-full cursor-pointer rounded-[6px] border-[0.5px] border-[#e2e8f0] bg-white py-[6px] pl-[10px] pr-9 text-sm leading-5 text-[#374151] outline-none transition-[border-color,color]',
        'focus:border-[#059669] disabled:cursor-not-allowed disabled:opacity-50',
        'dark:border-[#334155] dark:bg-[#1e293b] dark:text-[#94a3b8]',
        'dark:focus:border-[#059669]',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
