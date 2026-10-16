import React from 'react';
import { cn } from '@/lib/utils';

export default function WeightGoalValues({ current, start, target, standalone, imperial }) {
  const factor = imperial ? 2.2046226218 : 1, unit = imperial ? 'lb' : 'kg';
  const display = value => Number((value * factor).toFixed(1));
  const pct = start != null && target != null ? start === target ? current === target ? 100 : 0 : Math.min(100, Math.max(0, (current - start) / (target - start) * 100)) : null;
  if (current == null) return <p className="text-xs text-muted-foreground mt-1 leading-relaxed">No weight logged yet. Add your first measurement to start tracking.</p>;
  return <>
    <div className="flex items-end justify-between gap-2">
      <div><p className={cn('font-bold tabular-nums', standalone ? 'text-3xl' : 'text-xl')}>{display(current)}<span className="text-sm text-muted-foreground ml-1">{unit}</span></p><p className="text-[10px] text-muted-foreground">current</p></div>
      {target != null && <div className="text-right"><p className="text-lg font-bold tabular-nums text-muted-foreground">{display(target)}<span className="text-xs ml-1">{unit}</span></p><p className="text-[10px] text-muted-foreground">target</p></div>}
    </div>
    {pct != null && <><div className="h-2 rounded-full bg-muted/40 overflow-hidden mt-3"><div className="h-full bg-luxury-gold" style={{ width: `${pct}%` }} /></div><p className="text-[10px] text-muted-foreground mt-1 text-center">{Math.round(pct)}% to goal</p></>}
    {target == null && <p className="text-[10px] text-muted-foreground mt-2">No target weight set.</p>}
  </>;
}