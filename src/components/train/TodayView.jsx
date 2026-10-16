import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, EmptyState } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Play, Dumbbell, Clock, Layers, Plus, ChevronRight } from 'lucide-react';
import { localDateStr } from '@/lib/utils';

export default function TodayView({ programs }) {
  const navigate = useNavigate();
  const [scheduled, setScheduled] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const activeProgram = useMemo(() => programs.find((p) => p.active && !p.archived && !p.draft) || programs.find((p) => !p.archived && !p.draft) || null, [programs]);

  useEffect(() => {
    let active = true;
    (async () => {
      const today = localDateStr();
      try {
        const [sched, completed] = await Promise.all([
          base44.entities.ScheduledWorkout.filter({ date: today, completed: false }, { limit: 1 }),
          activeProgram ? base44.entities.WorkoutSession.count({ program_id: activeProgram.id, status: 'completed' }) : Promise.resolve(0),
        ]);
        if (!active) return;
        setScheduled(sched.items[0] || null);
        setCompletedCount(completed);
      } catch (e) { console.error(e); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [activeProgram?.id]);

  const todayDay = useMemo(() => {
    if (!activeProgram?.days?.length) return null;
    const days = activeProgram.days;
    if (activeProgram.schedule_type === 'fixed' && activeProgram.weekday_map) {
      const jsDow = new Date().getDay();
      const mondayIndex = (jsDow + 6) % 7;
      const dayIndex = activeProgram.weekday_map[String(mondayIndex)];
      if (dayIndex != null && days[dayIndex]) return { ...days[dayIndex], _index: dayIndex };
    }
    const nextIndex = days.length ? completedCount % days.length : 0;
    return { ...days[nextIndex], _index: nextIndex };
  }, [activeProgram, completedCount]);

  const startWorkout = () => {
    if (scheduled?.program_id && scheduled.day_index != null) {
      navigate(`/workout/new?programId=${scheduled.program_id}&dayIndex=${scheduled.day_index}`);
    } else if (activeProgram && todayDay?._index != null) {
      navigate(`/workout/new?programId=${activeProgram.id}&dayIndex=${todayDay._index}`);
    } else {
      navigate('/workout/new');
    }
  };

  if (loading) return <div className="py-16 text-center text-sm text-muted-foreground">Loading today's training…</div>;

  if (!activeProgram) {
    return (
      <Card className="luxury-gradient border border-primary/30 text-center py-10">
        <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mx-auto mb-4"><Layers size={26} className="text-primary" /></div>
        <h3 className="font-semibold text-lg mb-1">No active program</h3>
        <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">Create or activate a program to get a structured plan, or jump into a quick log.</p>
        <div className="flex flex-col gap-2 max-w-xs mx-auto">
          <Button className="btn-gold min-h-[48px]" onClick={() => navigate('/program/new?mode=templates')}><Plus size={16} /> New Program</Button>
          <Button variant="outline" className="glass min-h-[48px]" onClick={() => navigate('/workout/new')}><Play size={16} /> Quick Log</Button>
        </div>
      </Card>
    );
  }

  const exerciseCount = todayDay?.exercises?.length || 0;
  const estimatedMinutes = activeProgram.session_duration_minutes || 45;
  const weekNum = Math.min(activeProgram.duration_weeks || 8, Math.max(1, Math.ceil((Date.now() - new Date(activeProgram.start_date || activeProgram.created_date).getTime()) / (7 * 86400000))));

  return (
    <div className="space-y-4">
      <Card className="luxury-gradient border border-primary/30">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Today's Workout</p>
          <button onClick={() => navigate(`/program/${activeProgram.id}`)} className="text-[11px] text-primary flex items-center gap-0.5">Program <ChevronRight size={12} /></button>
        </div>
        <p className="text-2xl font-bold tracking-tight">{todayDay?.day_name || (scheduled?.title || 'Workout')}</p>
        <div className="flex items-center gap-4 mt-1.5">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Dumbbell size={12} /> {exerciseCount} exercises</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} /> ~{estimatedMinutes} min</p>
          {todayDay?.focus && <p className="text-xs text-muted-foreground truncate">{todayDay.focus}</p>}
        </div>

        {todayDay?.exercises?.length > 0 && (
          <div className="space-y-1.5 mt-4">
            {todayDay.exercises.map((ex, i) => (
              <button key={i} onClick={() => navigate(`/exercise/${ex.exercise_id || ex.exercise_name?.toLowerCase().replace(/\s+/g, '-')}`)} className="w-full flex items-center gap-3 p-2.5 rounded-xl glass hover:bg-muted/30 transition-all text-left min-h-[44px]">
                <div className="w-7 h-7 rounded-lg bg-luxury-blue/15 text-luxury-blue flex items-center justify-center shrink-0 text-xs font-bold">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ex.exercise_name}</p>
                  <p className="text-[11px] text-muted-foreground">{ex.sets || 1} sets · {ex.reps_low || ''}{ex.reps_high ? `-${ex.reps_high}` : ''} reps{ex.rir_target != null ? ` @${ex.rir_target}RIR` : ''}</p>
                </div>
                <ChevronRight size={14} className="text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}

        <Button onClick={startWorkout} className="w-full btn-gold min-h-[52px] text-base font-semibold mt-4"><Play size={18} /> Start Workout</Button>
      </Card>

      {/* Program progress strip */}
      <button onClick={() => navigate(`/program/${activeProgram.id}`)} className="w-full glass rounded-2xl p-4 flex items-center justify-between hover:border-primary/30 transition-all min-h-[64px]">
        <div className="flex-1 text-left min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Active Program</p>
          <p className="font-semibold truncate">{activeProgram.name}</p>
          <p className="text-[11px] text-muted-foreground">{activeProgram.goal} · Week {weekNum} of {activeProgram.duration_weeks || 8}</p>
        </div>
        <div className="flex flex-col items-end shrink-0 ml-3">
          <span className="text-lg font-bold text-primary tabular-nums">{Math.round((weekNum / (activeProgram.duration_weeks || 8)) * 100)}%</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </div>
      </button>
    </div>
  );
}