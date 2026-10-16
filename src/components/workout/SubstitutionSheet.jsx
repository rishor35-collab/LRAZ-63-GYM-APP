import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { findSubstitutions } from '@/lib/performanceAnalytics';

// Equipment-based substitution picker. Lists same movement-pattern + muscle alternatives.
export default function SubstitutionSheet({ open, exercise, allExercises, equipmentProfile, onClose, onAdd }) {
  if (!open || !exercise) return null;
  const subs = findSubstitutions(exercise, allExercises, equipmentProfile);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md glass-strong rounded-t-3xl p-4 pb-8 safe-pb max-h-[80vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">Substitutes for {exercise.name}</p>
            <p className="text-[10px] text-muted-foreground">Same movement & muscle · {equipmentProfile?.length ? `filtered to ${equipmentProfile.join(', ')}` : 'all equipment'}</p>
          </div>
          <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground shrink-0"><X size={18} /></button>
        </div>
        {!subs.length ? (
          <p className="text-sm text-muted-foreground text-center py-6">No direct substitutes found in your library.</p>
        ) : (
          <div className="space-y-2">
            {subs.map((s) => (
              <div key={s.id} className="flex items-center justify-between glass rounded-xl p-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.primary_muscle} · {s.equipment?.join(', ') || '—'}</p>
                </div>
                <Button size="sm" className="bg-luxury-blue shrink-0" onClick={() => { onAdd(s); onClose(); }}><Plus size={14} /> Add</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}