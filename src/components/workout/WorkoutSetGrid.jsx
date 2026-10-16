import React from 'react';
import { Check, Trophy, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const COLS = 'grid grid-cols-[1.25rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem] gap-1.5';

export default function WorkoutSetGrid({ block, bi, updateSet, completeSet, removeSet, isPr }) {
  return (
    <div className="space-y-1.5">
      {/* Header row */}
      <div className={cn(COLS, 'px-0.5')}>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground text-center">#</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground text-center">Weight</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground text-center">Reps</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground text-center">RPE</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground text-center">RIR</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground text-center">Done</span>
      </div>
      {/* Data rows */}
      {block.sets.map((set, index) => (
        <div key={index}>
          <div className={cn(COLS, 'items-center')}>
            <span className="text-xs text-muted-foreground text-center tabular-nums">{index + 1}</span>
            <SetInput value={set.weight_kg} placeholder="kg" mode="decimal" onChange={(v) => updateSet(bi, index, 'weight_kg', v)} label={`Set ${index + 1} weight`} />
            <SetInput value={set.reps} placeholder="reps" mode="numeric" onChange={(v) => updateSet(bi, index, 'reps', v)} label={`Set ${index + 1} reps`} />
            <SetInput value={set.rpe ?? ''} placeholder="rpe" mode="numeric" onChange={(v) => updateSet(bi, index, 'rpe', v)} label={`Set ${index + 1} RPE`} />
            <SetInput value={set.rir ?? ''} placeholder="rir" mode="numeric" onChange={(v) => updateSet(bi, index, 'rir', v)} label={`Set ${index + 1} RIR`} />
            <button
              aria-label={`Mark set ${index + 1} ${set.completed ? 'incomplete' : 'complete'}`}
              aria-pressed={set.completed}
              onClick={() => completeSet(bi, index)}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all',
                set.completed ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/50'
              )}
            >
              {set.completed && isPr ? <Trophy size={16} /> : <Check size={18} />}
            </button>
          </div>
          {block.sets.length > 1 && (
            <button
              aria-label={`Remove set ${index + 1}`}
              onClick={() => removeSet(bi, index)}
              className="flex items-center gap-1 ml-auto mt-1 mb-0.5 pr-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 size={11} /> remove set
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

const SetInput = React.memo(function SetInput({ value, placeholder, mode, onChange, label }) {
  return (
    <Input
      aria-label={label}
      type="number"
      inputMode={mode}
      min="0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-10 min-w-0 px-1 text-center text-sm tabular-nums rounded-xl"
    />
  );
});