import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function WorkoutSetEditor({ set, onChange, removed, onRemove, index }) {
  return (
    <fieldset className="rounded-2xl border border-border p-3 space-y-3">
      <legend className="px-1 text-xs text-muted-foreground">Set {index + 1}</legend>
      {removed ? <div className="flex items-center justify-between"><span className="text-sm line-through">{set.exercise_name}</span><Button type="button" variant="outline" onClick={onRemove}>Undo removal</Button></div> : <>
        <Label className="block text-xs">Exercise<Input required value={set.exercise_name} onChange={e => onChange('exercise_name', e.target.value)} /></Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[['weight_kg', 'Weight (kg)', 0, undefined, 'any'], ['reps', 'Repetitions', 0, undefined, 1], ['rpe', 'RPE', 1, 10, 'any'], ['rir', 'RIR', 0, 10, 'any'], ['rest_seconds', 'Rest (seconds)', 0, undefined, 1]].map(([key, label, min, max, step]) => <Label key={key} className="block text-xs">{label}<Input type="number" min={min} max={max} step={step} value={set[key] ?? ''} onChange={e => onChange(key, e.target.value)} /></Label>)}
        </div>
        <Label className="block text-xs">Set notes<Textarea value={set.notes || ''} onChange={e => onChange('notes', e.target.value)} /></Label>
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 min-h-11 text-xs"><input type="checkbox" checked={!!set.is_pr} onChange={e => onChange('is_pr', e.target.checked)} /> Personal record</label>
          <Button type="button" variant="ghost" onClick={onRemove} className="text-destructive">Remove set</Button>
        </div>
      </>}
    </fieldset>
  );
}