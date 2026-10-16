import React, { useState } from 'react';
import { Card } from '@/components/ui/fitness';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// Deterministic training-balance view across paired muscle groups.
// All values come from computeTrainingDistribution — no AI, no estimates beyond volume.
export default function TrainingDistribution({ distribution }) {
  const [showWhy, setShowWhy] = useState(false);
  const { pairs = [], days = 30 } = distribution || {};
  const hasData = pairs.some((p) => p.total > 0);

  const balanceColor = (b) =>
    b === 'Balanced' ? 'text-emerald-400'
      : b === 'Slightly Imbalanced' ? 'text-luxury-gold'
        : b === 'Imbalanced' ? 'text-luxury-red'
          : 'text-muted-foreground';

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">Last {days} days · volume balance</p>
        <button onClick={() => setShowWhy((v) => !v)} className="text-[11px] text-luxury-blue flex items-center gap-1 min-h-[36px]">
          <Info size={12} /> How?
        </button>
      </div>

      {showWhy && (
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
          Each pair compares total volume (weight × reps) on both sides. Balance is the ratio of the smaller side to the larger:
          ≥80% = Balanced, 60–80% = Slightly Imbalanced, below 60% = Imbalanced. Muscles are classified from exercise-name
          keywords — this is a training guide, not a clinical measurement.
        </p>
      )}

      {!hasData ? (
        <p className="text-sm text-muted-foreground text-center py-2">Log workouts to see your training balance.</p>
      ) : (
        <div className="space-y-3">
          {pairs.map((p) => {
            const total = p.total || 0;
            const aPct = total ? (p.a.volume / total) * 100 : 0;
            const bPct = total ? (p.b.volume / total) * 100 : 0;
            return (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{p.name}</span>
                  <span className={cn('text-[11px] font-semibold', balanceColor(p.balance))}>{p.balance}</span>
                </div>
                <div className="flex h-2.5 rounded-full overflow-hidden bg-muted/40">
                  <div className="bg-luxury-blue transition-all duration-500" style={{ width: `${aPct}%` }} />
                  <div className="bg-luxury-red transition-all duration-500" style={{ width: `${bPct}%` }} />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground tabular-nums">
                  <span>{Math.round(p.a.volume).toLocaleString()} kg</span>
                  <span>{p.ratio}</span>
                  <span>{Math.round(p.b.volume).toLocaleString()} kg</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}