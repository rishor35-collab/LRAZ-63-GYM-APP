import React from 'react';
import { cn } from '@/lib/utils';
import { MUSCLE_GROUPS } from '@/lib/performanceAnalytics';

const STATUS = {
  ready: { dot: 'bg-emerald-400', label: 'Ready', text: 'text-emerald-400' },
  partial: { dot: 'bg-luxury-gold', label: 'Partial', text: 'text-luxury-gold' },
  needs: { dot: 'bg-luxury-red', label: 'Recovering', text: 'text-luxury-red' },
  unknown: { dot: 'bg-muted-foreground/40', label: 'No data', text: 'text-muted-foreground' },
};

function fmtHours(h) {
  if (h == null) return 'no data';
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

// Visual, color-coded muscle recovery map. All statuses are estimates.
export default function MuscleRecoveryMap({ recovery }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {MUSCLE_GROUPS.map((m) => {
        const r = recovery[m] || { status: 'unknown' };
        const s = STATUS[r.status] || STATUS.unknown;
        return (
          <div key={m} className="rounded-xl border border-border/50 bg-background/30 p-2.5 flex items-center gap-2.5 min-h-[44px]">
            <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', s.dot)} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{m}</p>
              <p className={cn('text-[10px]', s.text)}>{s.label} · {fmtHours(r.hoursSince)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}