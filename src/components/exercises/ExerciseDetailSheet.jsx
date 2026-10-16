import React, { useMemo, useState } from 'react';
import { X, ChevronRight, Repeat } from 'lucide-react';
import { getSubstitutions, EXERCISES, normalizeName } from '@/lib/exerciseDatabase';
import { cn } from '@/lib/utils';
import ExerciseOverviewTab from '@/components/exercises/ExerciseOverviewTab';
import ExerciseMusclesTab from '@/components/exercises/ExerciseMusclesTab';
import ExerciseTechniqueTab from '@/components/exercises/ExerciseTechniqueTab';
import ResponsiveSheet from '@/components/ui/ResponsiveSheet';
import ExerciseHeroImage from '@/components/exercises/ExerciseHeroImage';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'muscles', label: 'Muscles' },
  { id: 'technique', label: 'Technique' },
];

function normalizeExercise(ex) {
  if (!ex) return null;
  return {
    ...ex,
    instructions: ex.instructions || ex.execution_instructions || '',
    setup: ex.setup_instructions || '',
    mistakes: ex.mistakes || ex.common_mistakes || [],
    safety: ex.safety || ex.safety_tips || [],
    coaching_cues: ex.coaching_cues || [],
    progressions: ex.progressions || [],
    regressions: ex.regressions || [],
    alternatives: ex.alternatives || [],
    rep_low: ex.rep_low ?? ex.rep_range_low,
    rep_high: ex.rep_high ?? ex.rep_range_high,
    rest: ex.rest ?? ex.rest_seconds,
  };
}

export default function ExerciseDetailSheet({ exercise: rawExercise, onClose, availableEquipment, onSwitch }) {
  const exercise = useMemo(() => normalizeExercise(rawExercise), [rawExercise]);
  const [tab, setTab] = useState('overview');

  const subs = useMemo(() => getSubstitutions(exercise, availableEquipment), [exercise, availableEquipment]);
  const altExercises = useMemo(() => (exercise?.alternatives || []).map((n) => EXERCISES.find((e) => normalizeName(e.name) === normalizeName(n))).filter(Boolean), [exercise]);

  if (!exercise) return null;

  return (
    <ResponsiveSheet onClose={onClose} title={exercise.name} theme="porcelain" className="rounded-t-3xl">
      <div className="min-w-0">
        {/* Header — centered serif title, close button left, spacer right for balance */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md px-4 py-3.5 flex items-center gap-3 border-b border-border/30">
          <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 -ml-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Close">
            <X size={20} />
          </button>
          <div className="flex-1 min-w-0 text-center">
            <h3 className="font-serif-display text-xl font-semibold tracking-tight [overflow-wrap:anywhere] leading-tight">{exercise.name}</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.1em] mt-0.5">{exercise.muscle_group} · {exercise.movement_pattern}</p>
          </div>
          <div className="min-w-[44px] shrink-0" />
        </div>

        {/* Hero image */}
        <div className="px-4 mt-3">
          <ExerciseHeroImage exercise={exercise} className="aspect-[16/10]" />
        </div>

        {/* Tabs — pill container with gold active state */}
        <div className="px-4 mt-4">
          <div className="flex gap-1 p-1 rounded-full bg-muted">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex-1 py-2.5 rounded-full text-sm font-semibold transition-all min-h-[44px] min-w-0',
                  tab === t.id ? 'btn-gold text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="px-4 mt-5 pb-4">
          {tab === 'overview' && (
            <ExerciseOverviewTab
              exercise={exercise}
              history={[]}
              historyLoading={false}
              bestE1rm={0}
              totalVolume={0}
              prCount={0}
              lastSession={null}
              onViewHistory={null}
            />
          )}
          {tab === 'muscles' && <ExerciseMusclesTab exercise={exercise} />}
          {tab === 'technique' && <ExerciseTechniqueTab exercise={exercise} />}
        </div>

        {/* Substitutions & alternatives */}
        {(altExercises.length > 0 || subs.length > 0) && (
          <div className="px-4 pb-4 space-y-3">
            {altExercises.length > 0 && (
              <div className="rounded-2xl border border-border/40 bg-card p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Alternatives</p>
                <div className="space-y-1.5">
                  {altExercises.map((a) => (
                    <button key={a.slug} onClick={() => onSwitch(a)} className="w-full text-left p-2.5 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-between min-h-[44px] transition-colors">
                      <span className="text-sm font-medium">{a.name}</span>
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {subs.length > 0 && (
              <div className="rounded-2xl border border-border/40 bg-card p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Repeat size={13} className="text-primary" /> Smart Substitutions
                </p>
                <p className="text-[11px] text-muted-foreground mb-2">Same primary muscle and movement pattern{availableEquipment?.length ? ', prioritizing your equipment' : ''}.</p>
                <div className="space-y-1.5">
                  {subs.slice(0, 5).map((s) => (
                    <button key={s.slug} onClick={() => onSwitch(s)} className="w-full text-left p-2.5 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-between min-h-[44px] transition-colors">
                      <div className="min-w-0"><p className="text-sm font-medium truncate">{s.name}</p><p className="text-[11px] text-muted-foreground">{(s.equipment || []).join(' · ')}</p></div>
                      <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="h-6 safe-pb" />
      </div>
    </ResponsiveSheet>
  );
}