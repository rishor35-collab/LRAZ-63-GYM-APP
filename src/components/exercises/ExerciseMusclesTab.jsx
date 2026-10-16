import React from 'react';
import MuscleActivation from '@/components/exercises/MuscleActivation';

export default function ExerciseMusclesTab({ exercise }) {
  return (
    <div className="space-y-5">
      <MuscleActivation exercise={exercise} />

      {/* Movement classification */}
      <div className="rounded-2xl border border-border/40 bg-card p-4 shadow-sm grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Movement Pattern</p>
          <p className="text-sm font-medium mt-0.5">{exercise.movement_pattern || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Force Type</p>
          <p className="text-sm font-medium mt-0.5">{exercise.force_type || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Laterality</p>
          <p className="text-sm font-medium mt-0.5">{exercise.laterality || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Category</p>
          <p className="text-sm font-medium mt-0.5">{exercise.category || '—'}</p>
        </div>
      </div>
    </div>
  );
}