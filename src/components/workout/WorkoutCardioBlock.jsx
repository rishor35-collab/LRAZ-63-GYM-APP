import React, { useState } from 'react';
import { Card } from '@/components/ui/fitness';
import { Input } from '@/components/ui/input';
import { Activity, ChevronDown, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getActivity, estimateCalories } from '@/lib/cardioAnalytics';

// Logs one cardio block inside a workout. Reuses the same MET-based calorie
// estimation and activity catalog as the standalone Cardio Session feature.
export default function WorkoutCardioBlock({ block, ci, onUpdate, onComplete, onRemove, bodyWeight }) {
  const [expanded, setExpanded] = useState(true);
  const dur = Math.round((Number(block.actual.duration_min) || 0) * 60);
  const est = estimateCalories(block.activity, dur, bodyWeight, null);
  const calSource = block.actual.calSource || 'Estimated';
  const calories = calSource === 'Estimated' ? est : (block.actual.calories ? Number(block.actual.calories) : 0);

  return (
    <Card className="p-3 border-luxury-red/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Activity size={15} className="text-luxury-red shrink-0" />
          <p className="font-semibold text-sm truncate">{block.activity_label}</p>
          {block.target_duration_minutes ? <span className="text-[10px] text-muted-foreground shrink-0">· target {block.target_duration_minutes}min</span> : null}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onComplete(ci)} className={cn('h-9 w-9 rounded-lg flex items-center justify-center transition-all', block.actual.completed ? 'bg-luxury-blue text-white glow-blue' : 'glass text-muted-foreground')}><Check size={16} /></button>
          <button onClick={() => setExpanded(!expanded)} className="min-h-[40px] min-w-[36px] flex items-center justify-center text-muted-foreground"><ChevronDown size={16} className={cn('transition-transform', expanded && 'rotate-180')} /></button>
        </div>
      </div>
      {expanded && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Duration (min)</span>
              <Input type="number" inputMode="decimal" value={block.actual.duration_min} onChange={(e) => onUpdate(ci, 'duration_min', e.target.value)} className="glass h-11 text-center tabular-nums" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Distance (km)</span>
              <Input type="number" inputMode="decimal" value={block.actual.distance} onChange={(e) => onUpdate(ci, 'distance', e.target.value)} className="glass h-11 text-center tabular-nums" />
            </div>
          </div>
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Calories</p>
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {['Estimated', 'Recorded', 'Manual'].map((s) => (
              <button key={s} onClick={() => onUpdate(ci, 'calSource', s)} className={cn('text-[10px] px-2 py-1.5 rounded-lg border min-h-[36px]', calSource === s ? 'border-luxury-blue bg-luxury-blue/15 text-luxury-blue' : 'border-border glass text-muted-foreground')}>{s}</button>
            ))}
          </div>
          {calSource !== 'Estimated' && (
            <Input type="number" inputMode="numeric" value={block.actual.calories} onChange={(e) => onUpdate(ci, 'calories', e.target.value)} placeholder={String(est)} className="glass h-11 text-center tabular-nums mb-2" />
          )}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Avg HR (bpm)</span>
              <Input type="number" inputMode="numeric" value={block.actual.avgHr} onChange={(e) => onUpdate(ci, 'avgHr', e.target.value)} placeholder="Optional" className="glass h-11 text-center tabular-nums" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Calories</span>
              <div className="h-11 flex items-center justify-center text-luxury-red font-bold tabular-nums">{calories} kcal</div>
            </div>
          </div>
          <Input value={block.actual.notes} onChange={(e) => onUpdate(ci, 'notes', e.target.value)} placeholder="Notes" className="glass h-9 text-xs mb-2" />
          <button onClick={() => onRemove(ci)} className="text-[10px] text-muted-foreground hover:text-luxury-red flex items-center gap-1"><Trash2 size={11} /> Remove cardio</button>
        </>
      )}
    </Card>
  );
}