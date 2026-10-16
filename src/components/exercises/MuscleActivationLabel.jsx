import React from 'react';
import { cn } from '@/lib/utils';

// Compact, elegant muscle label — primary in a gold-filled box, secondary subtle.
export default function MuscleActivationLabel({ name, primary = false }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2', primary ? 'bg-primary text-primary-foreground' : 'bg-background/60')}>
      <span aria-hidden="true" className={cn('h-2.5 w-2.5 shrink-0 rounded-full', primary ? 'bg-primary-foreground/80' : 'bg-anatomy-secondary')} />
      <div className="min-w-0">
        <p className={cn('text-[9px] leading-tight uppercase tracking-wider', primary ? 'text-primary-foreground/70' : 'text-anatomy-muted')}>{primary ? 'Primary' : 'Secondary'}</p>
        <p className={cn('[overflow-wrap:anywhere] text-sm leading-tight', primary ? 'font-semibold' : 'font-medium text-anatomy-ink')}>{name}</p>
      </div>
    </div>
  );
}