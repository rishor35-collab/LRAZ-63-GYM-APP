import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/fitness';
import { CheckCircle2, Calendar, TrendingUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const WEEK = 7 * 86400000;

export default function ProgramProgress({ program }) {
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    if (!program?.id) return;
    base44.entities.WorkoutSession.filter({ program_id: program.id }, '-date', 500)
      .then(setWorkouts).catch(() => {});
  }, [program?.id]);

  const data = useMemo(() => {
    const days = program.days || [];
    const durationWeeks = program.duration_weeks || 8;
    const freq = program.days_per_week || days.length || 3;
    const start = program.start_date ? new Date(program.start_date) : (program.created_date ? new Date(program.created_date) : new Date());
    const weeksElapsed = Math.max(0, (Date.now() - start.getTime()) / WEEK);
    const currentWeek = Math.min(durationWeeks, Math.max(1, Math.ceil(weeksElapsed)));
    const completed = workouts.filter((w) => w.status === 'completed').length;
    const totalPlanned = freq * durationWeeks;
    const adherence = totalPlanned > 0 ? Math.min(100, Math.round((completed / totalPlanned) * 100)) : 0;
    const nextIndex = days.length ? completed % days.length : 0;
    const next = days[nextIndex];
    // Mesocycle block tracking
    let currentBlock = null, blockWeek = null;
    const blocks = program.blocks || [];
    if (blocks.length) {
      let acc = 0;
      for (const b of blocks) {
        if (weeksElapsed < acc + b.weeks) { currentBlock = b; blockWeek = Math.floor(weeksElapsed - acc) + 1; break; }
        acc += b.weeks;
      }
      if (!currentBlock) { currentBlock = blocks[blocks.length - 1]; blockWeek = currentBlock.weeks; }
    }
    const isComplete = weeksElapsed >= durationWeeks;
    const completedSessions = workouts.filter((w) => w.status === 'completed');
    const totalVolume = completedSessions.reduce((a, w) => a + (w.total_volume_kg || 0), 0);
    const avgVolume = completedSessions.length ? Math.round(totalVolume / completedSessions.length) : 0;
    return { currentWeek, durationWeeks, completed, totalPlanned, adherence, next, weeksElapsed, currentBlock, blockWeek, isComplete, totalVolume, avgVolume };
  }, [program, workouts]);

  return (
    <>
    <Card className="mb-4">
      <p className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp size={15} className="text-luxury-blue" /> Program Progress</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2"><Calendar size={14} className="text-muted-foreground" /><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Week</p><p className="text-lg font-bold tabular-nums">{data.currentWeek} / {data.durationWeeks}</p></div></div>
        <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-muted-foreground" /><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Workouts</p><p className="text-lg font-bold tabular-nums">{data.completed} / {data.totalPlanned}</p></div></div>
      </div>
      <div className="w-full h-2 rounded-full bg-muted/30 overflow-hidden mb-3">
        <div className="h-full bg-luxury-blue transition-all" style={{ width: `${data.adherence}%` }} />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Adherence</span>
        <span className="font-semibold tabular-nums">{data.adherence}%</span>
      </div>
      {data.next && (
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
          <Target size={14} className="text-luxury-red" />
          <span className="text-xs text-muted-foreground">Next:</span>
          <span className="text-sm font-medium">{data.next.day_name}</span>
        </div>
      )}
      {data.currentBlock && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Block</p>
          <p className="text-sm font-semibold">{data.currentBlock.name} <span className="text-muted-foreground font-normal">· {data.currentBlock.phase}</span></p>
          <p className="text-[11px] text-muted-foreground">Week {data.blockWeek} of {data.currentBlock.weeks}{data.currentBlock.target_rpe ? ` · target RPE ${data.currentBlock.target_rpe}` : ''}</p>
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-2">Started {program.start_date || program.created_date ? new Date(program.start_date || program.created_date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—'}. Editing this program updates future workouts only — completed sessions keep their original values.</p>
    </Card>
    {data.isComplete && (
      <Card className="mb-4 border-luxury-blue/30">
        <p className="text-sm font-semibold mb-3 flex items-center gap-2"><CheckCircle2 size={15} className="text-luxury-blue" /> Program Complete</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><p className="text-lg font-bold tabular-nums">{data.completed}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Workouts</p></div>
          <div><p className="text-lg font-bold tabular-nums">{data.adherence}%</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Adherence</p></div>
          <div><p className="text-lg font-bold tabular-nums">{Math.round(data.totalVolume).toLocaleString()}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Volume kg</p></div>
          <div><p className="text-lg font-bold tabular-nums">{data.avgVolume.toLocaleString()}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg / Session kg</p></div>
        </div>
        <p className="text-[11px] text-muted-foreground">Set a new active program or extend this block to keep progressing.</p>
      </Card>
    )}
    </>
  );
}