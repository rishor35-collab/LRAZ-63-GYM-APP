import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/fitness';
import { cn } from '@/lib/utils';
import { computeRecoveryHistory } from '@/lib/performanceAnalytics';

// Recovery history with 7d / 30d / 3m / 6m ranges. Deterministic averages.
export default function RecoveryHistory({ records }) {
  const [range, setRange] = useState('30d');
  const data = useMemo(() => computeRecoveryHistory(records, range), [records, range]);
  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">Recovery history</p>
        <div className="flex gap-1">
          {['7d', '30d', '3m', '6m'].map((r) => (
            <button key={r} onClick={() => setRange(r)} className={cn('px-2.5 py-1 rounded-full text-[11px] font-semibold min-h-[32px]', range === r ? 'bg-luxury-blue text-white' : 'glass text-muted-foreground')}>{r}</button>
          ))}
        </div>
      </div>
      {!data.count ? (
        <p className="text-sm text-muted-foreground text-center py-2">No recovery logs in this range.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Avg sleep" value={data.avgSleep != null ? `${data.avgSleep}h` : '—'} />
          <Metric label="Avg readiness" value={data.avgReadiness != null ? data.avgReadiness : '—'} />
          <Metric label="Avg resting HR" value={data.avgRestingHr != null ? `${data.avgRestingHr} bpm` : '—'} />
          <Metric label="Avg soreness" value={data.avgSoreness != null ? `${data.avgSoreness}/10` : '—'} />
          <Metric label="Logs" value={data.count} />
        </div>
      )}
    </Card>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}