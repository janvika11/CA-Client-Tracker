import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'focus-ring inline-flex items-center justify-center rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default:
          'bg-emerald-600 px-4 py-2 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:active:bg-emerald-600',
        outline:
          'border border-zinc-300 bg-white px-4 py-2 text-zinc-800 hover:border-emerald-300 hover:bg-emerald-50/80 dark:border-dm-border dark:bg-dm-surface dark:text-dm-fg dark:hover:border-emerald-600 dark:hover:bg-emerald-950/40',
        ghost:
          'px-3 py-2 text-zinc-700 hover:bg-emerald-50 hover:text-emerald-900 dark:text-dm-fg dark:hover:bg-emerald-950/30 dark:hover:text-emerald-100',
        success: 'bg-emerald-600 px-4 py-2 text-white shadow-sm hover:bg-emerald-700',
        danger: 'bg-rose-600 px-4 py-2 text-white shadow-sm hover:bg-rose-700',
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
