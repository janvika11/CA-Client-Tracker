import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

/** Same surface spec as `Input` for multiline fields (notes, etc.). */
export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'focus-ring w-full rounded-[6px] border-[0.5px] border-[#e2e8f0] bg-white px-[10px] py-[6px] text-sm leading-5 text-[#374151] outline-none transition-[border-color,color] placeholder:text-[#94a3b8]',
        'focus:border-[#059669]',
        'dark:border-[#334155] dark:bg-[#1e293b] dark:text-[#94a3b8] dark:placeholder:text-[#64748b]',
        'dark:focus:border-[#059669]',
        className
      )}
      {...props}
    />
  );
});
