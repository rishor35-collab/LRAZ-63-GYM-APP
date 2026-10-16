import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Check, Trophy, Clock, Dumbbell, Layers, Target, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWorkoutFeedback } from '@/lib/feedbackMessages';

// Post-workout Session Summary. Score is deterministic (computeSessionQuality).
// Stats include duration, exercises, sets, reps, volume, muscles trained, and PRs.
export default function SessionQualitySheet({ open, quality, stats, onDone }) {
  if (!quality) return null;
  const gradeColor =
    quality.score >= 85 ? 'text-emerald-400'
      : quality.score >= 70 ? 'text-luxury-blue'
        : quality.score >= 55 ? 'text-luxury-gold'
          : 'text-luxury-red';

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onDone()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Session Summary</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6 space-y-4">
          <div className="text-center py-2">
            <p className={cn('text-5xl font-bold tabular-nums', gradeColor)}>{quality.score}</p>
            <p className={cn('text-sm font-semibold mt-0.5', gradeColor)}>{quality.grade}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Calculated only from completed sets, reps, RPE/RIR and volume.</p>
            {(() => { const fb = getWorkoutFeedback({ score: quality.score, volume: stats.totalVolume, prCount: stats.prCount, durationMinutes: stats.durationMinutes, exerciseCount: stats.exerciseCount, completedSets: stats.completedSets }); return fb ? <p className="text-sm text-foreground/80 mt-2 leading-relaxed">{fb.message}</p> : null; })()}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <SummaryStat icon={Clock} label="Duration" value={stats.durationMinutes ? `${stats.durationMinutes}m` : '—'} />
            <SummaryStat icon={Dumbbell} label="Exercises" value={stats.exerciseCount || 0} />
            <SummaryStat icon={Layers} label="Sets" value={stats.completedSets || 0} />
            <SummaryStat icon={Repeat} label="Reps" value={stats.totalReps || 0} />
            <SummaryStat icon={Target} label="Volume" value={`${Math.round(stats.totalVolume || 0)} kg`} />
            <SummaryStat icon={Trophy} label="PRs" value={stats.prCount || 0} accent={stats.prCount > 0} />
          </div>

          {stats.muscles?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Muscles Trained</p>
              <div className="flex flex-wrap gap-1.5">
                {stats.muscles.map((m) => <span key={m} className="text-xs px-2.5 py-1 rounded-full glass">{m}</span>)}
              </div>
            </div>
          )}

          {stats.prs?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-luxury-gold mb-1.5 flex items-center gap-1"><Trophy size={11} /> Personal Records</p>
              <div className="space-y-1.5">
                {stats.prs.map((p, i) => (
                  <div key={i} className="glass rounded-xl p-2.5 flex items-center justify-between">
                    <span className="text-sm font-medium">{p.exercise}</span>
                    <span className="text-xs text-luxury-gold font-semibold">{p.type === 'weight' ? `New max weight ${p.value} kg` : `New e1RM ${p.value} kg`}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.cardioCalories > 0 && (
            <div className="grid grid-cols-2 gap-2 text-center">
              <SummaryStat label="Cardio" value={`${stats.cardioCalories} kcal`} />
              <SummaryStat label="Cardio Blocks" value={stats.cardioCount || 0} />
            </div>
          )}

          <div className="space-y-2">
            {quality.breakdown.map((b, i) => (
              <div key={i} className="glass rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{b.label}</span>
                  <span className="text-sm font-semibold tabular-nums">{b.value}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{b.detail} · weight {b.weight}</p>
              </div>
            ))}
          </div>

          <Button className="w-full bg-luxury-blue min-h-[48px]" onClick={onDone}>
            <Check size={18} /> Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SummaryStat({ icon: Icon, label, value, accent }) {
  return (
    <div className="glass rounded-xl py-2.5 px-1">
      {Icon && <Icon size={14} className={cn('mx-auto mb-0.5', accent ? 'text-luxury-gold' : 'text-muted-foreground')} />}
      <p className={cn('text-lg font-bold tabular-nums', accent && 'text-luxury-gold')}>{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}