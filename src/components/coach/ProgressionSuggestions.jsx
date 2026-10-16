import React, { useState } from 'react';
import { Card } from '@/components/ui/fitness';
import { Info, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Deterministic next-time progression suggestions from the user's last session.
export default function ProgressionSuggestions({ suggestions }) {
  const [open, setOpen] = useState(null);
  if (!suggestions || !suggestions.length) return null;

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">From your last session · next-time targets</p>
        <span className="text-[11px] text-luxury-blue flex items-center gap-1"><Info size={12} /> deterministic</span>
      </div>
      <div className="space-y-2">
        {suggestions.map((s, i) => {
          const isOpen = open === i;
          const summary = s.action === 'increase-weight'
            ? `Increase to ${s.newWeight} kg × ${s.newReps} reps`
            : s.action === 'reduce-rir'
              ? `${s.newWeight} kg × ${s.newReps} reps @ ${s.newRir} RIR`
              : `Add reps → ${s.newReps} at ${s.newWeight} kg`;
          return (
            <div key={i} className="glass rounded-xl p-3">
              <button className="w-full flex items-center justify-between gap-2 min-h-[44px]" onClick={() => setOpen(isOpen ? null : i)}>
                <div className="text-left min-w-0">
                  <p className="text-sm font-semibold truncate">{s.exercise}</p>
                  <p className="text-[11px] text-muted-foreground">{summary}</p>
                </div>
                <ChevronRight size={15} className={cn('text-muted-foreground shrink-0 transition-transform', isOpen && 'rotate-90')} />
              </button>
              {isOpen && <p className="text-[11px] text-muted-foreground leading-relaxed mt-2 pt-2 border-t border-border">{s.reason}</p>}
            </div>
          );
        })}
      </div>
    </Card>
  );
}