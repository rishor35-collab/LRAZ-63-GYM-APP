import React from 'react';
import { cn } from '@/lib/utils';
import AnatomyFigure from '@/components/exercises/AnatomyFigure';
import MuscleActivationLabel from '@/components/exercises/MuscleActivationLabel';

// Compact muscle activation section: body on LEFT, labels on RIGHT.
// Premium reference design — tight spacing, elegant labels, gold highlights.
export default function MuscleActivation({ exercise }) {
  const secondary = exercise.secondary_muscles || [];
  return (
    <section aria-label="Muscle Activation" className="mx-auto w-full min-w-0 max-w-[420px] rounded-2xl bg-anatomy-surface border border-anatomy-outline/20 p-4">
      <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-anatomy-muted">Muscle Activation</h3>
      <div className="flex items-center gap-4">
        {/* Anatomical body — left side */}
        <AnatomyFigure primaryMuscle={exercise.primary_muscle} secondaryMuscles={secondary} className="shrink-0" />
        {/* Muscle labels — right side, vertically centered */}
        <div className="min-w-0 flex-1 space-y-2">
          <MuscleActivationLabel primary name={exercise.primary_muscle || 'Not specified'} />
          {secondary.map((name) => <MuscleActivationLabel key={name} name={name} />)}
          {secondary.length === 0 && <p className="px-2 py-1 text-[10px] text-anatomy-muted">No secondary muscles</p>}
        </div>
      </div>
    </section>
  );
}