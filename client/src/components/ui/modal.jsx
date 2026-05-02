import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

export function Modal({ open, onClose, title, children, panelClassName = '' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onEsc = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 ${panelClassName}`.trim()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
