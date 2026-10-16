import React, { useState } from 'react';
import { Card } from '@/components/ui/fitness';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dumbbell, Plus, Trash2, Search, X, ChevronDown, ChevronUp, Copy, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import ExercisePicker from '@/components/programs/ExercisePicker';
import DayCardioEditor from '@/components/programs/DayCardioEditor';

export default function DayEditor({ day, onChange, onRemove, index }) {
  const [expanded, setExpanded] = useState(true);

  const addExercise = (ex) => {
    onChange({ ...day, exercises: [...(day.exercises || []), { exercise_name: ex.name, sets: 3, reps_low: 8, reps_high: 12, rir_target: 2, rest_seconds: 120, notes: '', set_type: 'working', optional: false }] });
  };

  const updateExercise = (i, field, value) => {
    const isNumeric = !['exercise_name', 'notes', 'set_type', 'optional'].includes(field);
    onChange({ ...day, exercises: day.exercises.map((ex, j) => j === i ? { ...ex, [field]: isNumeric ? (Number(value) || 0) : value } : ex) });
  };
  const removeExercise = (i) => onChange({ ...day, exercises: day.exercises.filter((_, j) => j !== i) });
  const moveExercise = (i, dir) => {
    const arr = [...day.exercises]; const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange({ ...day, exercises: arr });
  };
  const duplicateExercise = (i) => {
    const arr = [...day.exercises];
    arr.splice(i + 1, 0, { ...arr[i] });
    onChange({ ...day, exercises: arr });
  };

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex min-w-0 flex-1 items-center gap-2"><button type="button" aria-label="Toggle training day" onClick={() => setExpanded(!expanded)} className="flex h-11 w-11 shrink-0 items-center justify-center">
          <ChevronDown size={16} className={cn('transition-transform', expanded && 'rotate-180')} />
          </button>
          <Input value={day.day_name} onChange={(e) => onChange({ ...day, day_name: e.target.value })} className="glass h-10 text-sm font-semibold" />
        </div>
        {onRemove && <button onClick={onRemove} className="ml-2 text-muted-foreground hover:text-luxury-red min-h-[44px] min-w-[44px] flex items-center justify-center"><Trash2 size={15} /></button>}
      </div>
      {expanded && (
        <>
          <Input value={day.focus || ''} onChange={(e) => onChange({ ...day, focus: e.target.value })} placeholder="Focus (e.g. Chest/Triceps)" className="glass h-9 text-xs mb-3" />
          <div className="space-y-2">
            {(day.exercises || []).map((ex, i) => (
              <div key={i} className={cn('rounded-xl glass p-2.5', ex.optional && 'opacity-60')}>
                <div className="grid grid-cols-[repeat(4,minmax(0,1fr))] sm:flex items-center gap-1 mb-2 [&>input]:col-span-4 [&>svg]:hidden sm:[&>svg]:block">
                  <Dumbbell size={13} className="text-luxury-blue shrink-0" />
                  <Input value={ex.exercise_name} onChange={(e) => updateExercise(i, 'exercise_name', e.target.value)} placeholder="Exercise name" className="glass h-10 text-sm flex-1 min-w-0" />
                  <button onClick={() => moveExercise(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 min-h-[40px] min-w-[36px] flex items-center justify-center"><ChevronUp size={14} /></button>
                  <button onClick={() => moveExercise(i, 1)} disabled={i === (day.exercises.length - 1)} className="text-muted-foreground hover:text-foreground disabled:opacity-30 min-h-[40px] min-w-[36px] flex items-center justify-center"><ChevronDown size={14} /></button>
                  <button onClick={() => duplicateExercise(i)} className="text-muted-foreground hover:text-luxury-blue min-h-[40px] min-w-[36px] flex items-center justify-center"><Copy size={13} /></button>
                  <button onClick={() => removeExercise(i)} className="text-muted-foreground hover:text-luxury-red min-h-[40px] min-w-[36px] flex items-center justify-center"><Trash2 size={13} /></button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <NumField label="Sets" value={ex.sets} onChange={(v) => updateExercise(i, 'sets', v)} />
                  <NumField label="Reps lo" value={ex.reps_low} onChange={(v) => updateExercise(i, 'reps_low', v)} />
                  <NumField label="Reps hi" value={ex.reps_high} onChange={(v) => updateExercise(i, 'reps_high', v)} />
                  <NumField label="RIR" value={ex.rir_target} onChange={(v) => updateExercise(i, 'rir_target', v)} />
                  <NumField label="Rest s" value={ex.rest_seconds} onChange={(v) => updateExercise(i, 'rest_seconds', v)} />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => updateExercise(i, 'set_type', ex.set_type === 'warmup' ? 'working' : 'warmup')} className={cn('text-[10px] px-2 py-1 rounded-full border min-h-[28px]', ex.set_type === 'warmup' ? 'border-luxury-gold bg-luxury-gold/15 text-luxury-gold' : 'border-border text-muted-foreground')}>{ex.set_type === 'warmup' ? 'Warm-up' : 'Working'}</button>
                  <button onClick={() => updateExercise(i, 'optional', !ex.optional)} className={cn('text-[10px] px-2 py-1 rounded-full border min-h-[28px]', ex.optional ? 'border-luxury-red/40 bg-luxury-red/10 text-luxury-red' : 'border-border text-muted-foreground')}>{ex.optional ? 'Optional' : 'Required'}</button>
                </div>
                <Input value={ex.notes || ''} onChange={(e) => updateExercise(i, 'notes', e.target.value)} placeholder="Notes (tempo, cues…)" className="glass h-8 text-xs mt-2" />
              </div>
            ))}
          </div>
          <ExercisePicker onPick={addExercise} />
          <DayCardioEditor day={day} onChange={onChange} />
        </>
      )}
    </Card>
  );
}

function NumField({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <Input type="number" inputMode="numeric" value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="glass h-10 text-xs text-center tabular-nums min-w-0" />
    </div>
  );
}