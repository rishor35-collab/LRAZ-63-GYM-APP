import React from 'react';
import { Card } from '@/components/ui/fitness';
import { cn } from '@/lib/utils';

const BUCKETS = ['1-5', '6-8', '9-12', '13-20', '21+'];
const COLORS = ['bg-luxury-red', 'bg-orange-500', 'bg-luxury-blue', 'bg-luxury-gold', 'bg-emerald-500'];

// Deterministic rep-range distribution across logged sets.
export default function RepRangeDistribution({ dist }) {
  const { buckets = {}, total = 0 } = dist || {};
  return (
    <Card className="mb-4">
      <p className="text-xs text-muted-foreground mb-3">Rep-range distribution · last 90 days</p>
      {!total ? (
        <p className="text-sm text-muted-foreground text-center py-2">Log sets to see your rep-range spread.</p>
      ) : (
        <div className="space-y-2">
          {BUCKETS.map((b, i) => {
            const pct = total ? Math.round((buckets[b] / total) * 100) : 0;
            return (
              <div key={b}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>{b} reps</span>
                  <span className="tabular-nums text-muted-foreground">{buckets[b]} sets · {pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                  <div className={cn('h-full transition-all duration-500', COLORS[i])} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}