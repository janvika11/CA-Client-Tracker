import { Inbox } from 'lucide-react';
import { Card } from '../components/ui/card';

export default function PlaceholderPage({ title, description }) {
  return (
    <Card className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-dm-hover">
        <Inbox className="h-7 w-7 text-zinc-400 dark:text-dm-muted" aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-dm-fg">{title}</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-dm-muted">{description}</p>
    </Card>
  );
}
