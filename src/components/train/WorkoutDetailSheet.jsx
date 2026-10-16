import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Clock, Dumbbell, Trophy, StickyNote, TrendingUp } from 'lucide-react';
import { cn, localDateStr } from '@/lib/utils';
import WorkoutHistoryActions from '@/components/train/WorkoutHistoryActions';
import ResponsiveSheet from '@/components/ui/ResponsiveSheet';

export default function WorkoutDetailSheet({ session, sets, onClose, totals, footer }) {
  if (!session) return null;
  const completed = sets.filter((s) => s.completed);
  const byExercise = {};
  completed.forEach((s) => {
    if (!byExercise[s.exercise_name]) byExercise[s.exercise_name] = [];
    byExercise[s.exercise_name].push(s);
  });
  const exerciseNames = Object.keys(byExercise);
  const volume = completed.reduce((a, s) => a + (Number(s.weight_kg) || 0) * (Number(s.reps) || 0), 0);
  const prCount = completed.filter((s) => s.is_pr).length;
  const date = localDateStr(session.date);

  return (
    <ResponsiveSheet onClose={onClose} title={session.name || 'Workout'}>
      <div className="min-w-0 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg truncate">{session.name || 'Workout'}</h3>
            <p className="text-[11px] text-muted-foreground">
              {date}
              {session.program_day_name ? ` · ${session.program_day_name}` : ''}
              {session.focus ? ` · ${session.focus}` : ''}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0 min-h-[44px] min-w-[44px] p-2"><X size={18} /></Button>
        </div>

        <WorkoutHistoryActions session={session} onChanged={onClose} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <DetailStat icon={Clock} label="Duration" value={session.duration_minutes ? `${session.duration_minutes}m` : '—'} />
          <DetailStat icon={TrendingUp} label="Volume" value={`${Math.round(session.total_volume_kg ?? volume)}kg`} accent="blue" />
          <DetailStat icon={Dumbbell} label="Exercises" value={totals?.exerciseCount ?? exerciseNames.length} />
          <DetailStat icon={Trophy} label="PRs" value={session.pr_count ?? prCount} accent="gold" />
        </div>

        {session.notes && (
          <div className="mb-4 p-3 glass rounded-xl">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><StickyNote size={11} /> Workout Notes</p>
            <p className="text-sm whitespace-pre-wrap" dir="auto">{session.notes}</p>
          </div>
        )}

        <div className="space-y-3">
          {exerciseNames.map((name) => {
            const exSets = byExercise[name].sort((a, b) => (a.set_index || 0) - (b.set_index || 0));
            const exNotes = exSets.find((s) => s.notes)?.notes;
            const exVol = exSets.reduce((a, s) => a + (Number(s.weight_kg) || 0) * (Number(s.reps) || 0), 0);
            return (
              <div key={name} className="glass rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm truncate" dir="auto">{name}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{Math.round(exVol)}kg</span>
                </div>
                <div className="space-y-1">
                  {exSets.map((s, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                      <span className="w-5 text-muted-foreground tabular-nums">{i + 1}</span>
                      <span className="font-medium tabular-nums">{s.weight_kg || 0}kg</span>
                      <span className="text-muted-foreground">×</span>
                      <span className="font-medium tabular-nums">{s.reps || 0}</span>
                      {(s.rpe != null || s.rir != null) && (
                        <span className="text-[10px] text-muted-foreground ml-1">
                          {s.rpe != null ? `RPE ${s.rpe}` : ''}{s.rpe != null && s.rir != null ? ' · ' : ''}{s.rir != null ? `RIR ${s.rir}` : ''}
                        </span>
                      )}
                      {s.is_pr && <Trophy size={11} className="text-luxury-gold ml-auto" />}
                    </div>
                  ))}
                </div>
                {exNotes && (
                  <p className="text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/40 whitespace-pre-wrap" dir="auto">
                    <StickyNote size={10} className="inline mr-1" />{exNotes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        {footer}
      </div>
    </ResponsiveSheet>
  );
}

function DetailStat({ icon: Icon, label, value, accent }) {
  return (
    <div className="glass rounded-xl p-2.5 flex flex-col items-center text-center">
      <Icon size={14} className={cn('mb-1', accent === 'blue' ? 'text-luxury-blue' : accent === 'gold' ? 'text-luxury-gold' : 'text-muted-foreground')} />
      <span className={cn('text-sm font-bold tabular-nums', accent === 'blue' ? 'text-luxury-blue' : accent === 'gold' ? 'text-luxury-gold' : 'text-foreground')}>{value}</span>
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}