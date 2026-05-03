import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'focus-ring inline-flex items-center justify-center rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default:
          'bg-emerald-600 px-4 py-2 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 dark:bg-violet-600 dark:shadow-[0_0_20px_rgba(139,92,246,0.35)] dark:hover:bg-violet-500 dark:active:bg-violet-700',
        outline:
          'border border-zinc-300 bg-white px-4 py-2 text-zinc-800 hover:border-emerald-300 hover:bg-emerald-50/80 dark:border-cyan-500/35 dark:bg-transparent dark:text-cyan-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-500/10',
        ghost:
          'px-3 py-2 text-zinc-700 hover:bg-emerald-50 hover:text-emerald-900 dark:text-dm-muted dark:hover:bg-dm-hover dark:hover:text-dm-fg',
        success:
          'bg-emerald-600 px-4 py-2 text-white shadow-sm hover:bg-emerald-700 dark:bg-emerald-500 dark:shadow-[0_0_18px_rgba(52,211,153,0.35)] dark:hover:bg-emerald-400',
        danger:
          'bg-rose-600 px-4 py-2 text-white shadow-sm hover:bg-rose-700 dark:bg-[#7f1d1d] dark:hover:bg-[#991b1b]',
      },
      size: {
        sm: 'h-8',
        md: 'h-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export function Button({ className, variant, size, ...props }) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
