import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Flame } from 'lucide-react';
import { computeWarmupSets } from '@/lib/fitnessScience';
import { cn } from '@/lib/utils';

// Deterministic warm-up ramp planner. Percentages of the work-set weight.
export default function WarmupPlanner({ open, onClose, exerciseName, suggestedWeight }) {
  const [workWeight, setWorkWeight] = useState(suggestedWeight || '');
  const sets = useMemo(() => computeWarmupSets(Number(workWeight) || 0), [workWeight]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Warm-up Planner · {exerciseName}</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6 space-y-4">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            A ramp of progressively heavier sets approaching your work weight. Deterministic percentages (40 / 55 / 70 / 80 / 90%).
            Weights round to the nearest 2.5 kg and never drop below the bar.
          </p>

          <Input
            type="number"
            inputMode="decimal"
            placeholder="Work-set weight (kg)"
            value={workWeight}
            onChange={(e) => setWorkWeight(e.target.value)}
            className="h-12 glass text-base"
          />

          {sets.length > 0 ? (
            <div className="space-y-2">
              {sets.map((s, i) => (
                <div key={i} className="flex items-center justify-between glass rounded-xl p-3">
                  <div>
                    <p className="text-sm font-semibold tabular-nums">
                      {s.weight} kg <span className="text-xs text-muted-foreground">× {s.reps} reps</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">{s.label} · {s.pct}%</p>
                  </div>
                  <Flame size={16} className={cn(i === sets.length - 1 ? 'text-luxury-red' : 'text-muted-foreground')} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-3">Enter a work-set weight to generate your warm-up ramp.</p>
          )}

          <Button variant="outline" className="w-full min-h-[44px]" onClick={onClose}>Close</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}