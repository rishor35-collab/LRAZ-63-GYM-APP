import React, { useState } from 'react';
import { Card } from '@/components/ui/fitness';
import { cn } from '@/lib/utils';
import { MUSCLE_GROUPS } from '@/lib/performanceAnalytics';

// Muscle training frequency with 4 / 8 / 12-week averages.
export default function MuscleFrequency({ freq4, freq8, freq12 }) {
  const [range, setRange] = useState(8);
  const data = range === 4 ? freq4 : range === 12 ? freq12 : freq8;
  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">Muscle training frequency</p>
        <div className="flex gap-1">
          {[4, 8, 12].map((w) => (
            <button key={w} onClick={() => setRange(w)} className={cn('px-2.5 py-1 rounded-full text-[11px] font-semibold min-h-[32px]', range === w ? 'bg-luxury-blue text-white' : 'glass text-muted-foreground')}>{w}w</button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        {MUSCLE_GROUPS.filter((m) => data?.[m]?.sessions > 0).map((m) => (
          <div key={m} className="flex items-center justify-between">
            <span className="text-sm">{m}</span>
            <span className="text-xs tabular-nums text-muted-foreground">{data[m].sessions} sessions · {data[m].perWeek}/wk</span>
          </div>
        ))}
        {!MUSCLE_GROUPS.some((m) => data?.[m]?.sessions > 0) && <p className="text-sm text-muted-foreground text-center py-2">No training in this range yet.</p>}
      </div>
    </Card>
  );
}