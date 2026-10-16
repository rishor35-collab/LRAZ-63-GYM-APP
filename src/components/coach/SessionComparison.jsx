import React from 'react';
import { Card } from '@/components/ui/fitness';
import { cn } from '@/lib/utils';

// Current vs previous completed session comparison. Deterministic deltas.
export default function SessionComparison({ comparison }) {
  if (!comparison) return null;
  const { curr, prev, volumeDelta, setsDelta, e1rmDelta } = comparison;
  const deltaColor = (d) => (d > 0 ? 'text-luxury-blue' : d < 0 ? 'text-luxury-red' : 'text-muted-foreground');
  const fmtDate = (d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' });
  return (
    <Card className="mb-4">
      <p className="text-xs text-muted-foreground mb-3">Current vs previous session</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase">Previous · {fmtDate(prev.date)}</p>
          <p className="text-sm font-semibold truncate">{prev.name}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{prev.volume} kg · {prev.sets} sets · e1RM {prev.topE1RM}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground uppercase">Current · {fmtDate(curr.date)}</p>
          <p className="text-sm font-semibold truncate">{curr.name}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{curr.volume} kg · {curr.sets} sets · e1RM {curr.topE1RM}</p>
        </div>
      </div>
      <div className="flex justify-between mt-3 pt-3 border-t border-border text-xs">
        <span>Volume <span className={cn('font-semibold tabular-nums', deltaColor(volumeDelta))}>{volumeDelta > 0 ? '+' : ''}{volumeDelta} kg</span></span>
        <span>Sets <span className={cn('font-semibold tabular-nums', deltaColor(setsDelta))}>{setsDelta > 0 ? '+' : ''}{setsDelta}</span></span>
        <span>e1RM <span className={cn('font-semibold tabular-nums', deltaColor(e1rmDelta))}>{e1rmDelta > 0 ? '+' : ''}{e1rmDelta}</span></span>
      </div>
    </Card>
  );
}