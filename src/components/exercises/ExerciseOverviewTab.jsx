import React from 'react';
import { Layers, Package, Repeat } from 'lucide-react';
import MuscleActivation from '@/components/exercises/MuscleActivation';

// Parses a free-text instruction string into clean numbered steps.
function parseSteps(text) {
  if (!text) return [];
  return text
    .split(/(?<=[.])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

function AttributeRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-medium whitespace-pre-line [overflow-wrap:anywhere]">{value}</p>
      </div>
    </div>
  );
}

export default function ExerciseOverviewTab({ exercise, history, historyLoading, bestE1rm, totalVolume, prCount, lastSession, onViewHistory }) {
  const steps = parseSteps(exercise.instructions);
  const equipment = (exercise.equipment || []).join(', ') || '—';
  const muscleType = exercise.compound ? 'Compound exercise' : 'Isolation exercise';

  return (
    <div className="min-w-0 space-y-3">
      <MuscleActivation exercise={exercise} />

      {/* Exercise attributes — vertical list with icons */}
      <div className="rounded-2xl border border-border/40 bg-card shadow-sm p-4 divide-y divide-border/30">
        <AttributeRow icon={Layers} label="Type" value={muscleType} />
        <AttributeRow icon={Repeat} label="Movement" value={exercise.movement_pattern || '—'} />
        <AttributeRow icon={Package} label="Equipment" value={equipment} />
      </div>

      {/* Quick stats */}
      {!exercise.cardio && (exercise.rep_low || exercise.rest) && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-border/40 bg-card shadow-sm py-3 text-center">
            <p className="text-lg font-bold tabular-nums">{exercise.rep_low}-{exercise.rep_high}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Reps</p>
          </div>
          <div className="rounded-2xl border border-border/40 bg-card shadow-sm py-3 text-center">
            <p className="text-lg font-bold tabular-nums">{exercise.rest}s</p>
            <p className="text-[10px] text-muted-foreground uppercase">Rest</p>
          </div>
          <div className="rounded-2xl border border-border/40 bg-card shadow-sm py-3 text-center">
            <p className="break-words px-1 text-xs font-bold sm:text-sm">{exercise.difficulty}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Level</p>
          </div>
        </div>
      )}

      {/* Performance history */}
      {!historyLoading && history.length > 0 && (
        <div className="rounded-2xl border border-border/40 bg-card shadow-sm p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Your Performance</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className="text-lg font-bold tabular-nums text-primary">{bestE1rm}</p><p className="text-[10px] text-muted-foreground uppercase">Best e1RM</p></div>
            <div><p className="text-lg font-bold tabular-nums break-words">{Math.round(totalVolume)}</p><p className="text-[10px] text-muted-foreground uppercase">Recent volume kg</p></div>
            <div><p className="text-lg font-bold tabular-nums">{prCount}</p><p className="text-[10px] text-muted-foreground uppercase">PRs</p></div>
          </div>
          {lastSession && <p className="text-[11px] text-muted-foreground mt-2">Last: {lastSession.weight}kg × {lastSession.reps}</p>}
          {onViewHistory && (
            <button onClick={onViewHistory} className="w-full mt-2 text-xs text-primary font-medium min-h-[40px]">View full history →</button>
          )}
        </div>
      )}

      {/* Instructions — numbered in gold circles */}
      {steps.length > 0 && (
        <div className="rounded-2xl border border-border/40 bg-card shadow-sm p-4">
          <p className="font-serif-display text-base font-semibold mb-3">Instructions</p>
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <p className="min-w-0 flex-1 whitespace-pre-line text-sm text-foreground/80 leading-relaxed pt-0.5 [overflow-wrap:anywhere]">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Setup notes */}
      {exercise.setup && (
        <div className="rounded-2xl border border-border/40 bg-card shadow-sm p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Setup</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{exercise.setup}</p>
        </div>
      )}
    </div>
  );
}