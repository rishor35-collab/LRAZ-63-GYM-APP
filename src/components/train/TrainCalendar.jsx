import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Dumbbell, Flame, Check, Calendar as CalIcon } from 'lucide-react';
import { cn, localDateStr } from '@/lib/utils';
import useTrainingCalendar from '@/hooks/useTrainingCalendar';
import WorkoutHistoryViewer from '@/components/train/WorkoutHistoryViewer';

const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TrainCalendar() {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const calendar = useTrainingCalendar(cursor);
  const data = calendar.data;
  const loading = calendar.isLoading;
  const [selected, setSelected] = useState(null);



  // Map: dateStr -> { sessions: [], cardio: [], scheduled: [] }
  const dayMap = useMemo(() => {
    if (!data) return {};
    const map = {};
    data.sessions.forEach((s) => {
      const d = localDateStr(s.date);
      if (!map[d]) map[d] = { sessions: [], cardio: [], scheduled: [] };
      map[d].sessions.push(s);
    });
    data.cardio.forEach((c) => {
      const d = localDateStr(c.date);
      if (!map[d]) map[d] = { sessions: [], cardio: [], scheduled: [] };
      map[d].cardio.push(c);
    });
    data.scheduled.forEach((s) => {
      const d = localDateStr(s.date);
      if (!map[d]) map[d] = { sessions: [], cardio: [], scheduled: [] };
      map[d].scheduled.push(s);
    });
    return map;
  }, [data]);

  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7; // Monday=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const str = localDateStr(date);
      cells.push({ day: d, date: str, info: dayMap[str] });
    }
    return cells;
  }, [cursor, dayMap]);

  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayStr = localDateStr();

  if (loading) return <div className="py-20 text-center text-muted-foreground text-sm">Loading calendar…</div>;

  const hasAny = data && (data.sessions.length > 0 || data.scheduled.length > 0 || data.cardio.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="min-h-[40px]"><ChevronLeft size={18} /></Button>
        <p className="font-semibold">{monthLabel}</p>
        <Button variant="ghost" size="sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="min-h-[40px]"><ChevronRight size={18} /></Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WD.map((w) => <div key={w} className="text-center text-[10px] uppercase tracking-wider text-muted-foreground py-1">{w}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map((cell, i) => {
          if (!cell) return <div key={i} />;
          const info = cell.info;
          const hasWorkout = info?.sessions?.length > 0;
          const hasCardio = info?.cardio?.length > 0;
          const hasScheduled = info?.scheduled?.length > 0;
          const isToday = cell.date === todayStr;
          return (
            <button
              key={i}
              onClick={() => {
                if (hasWorkout) {
                  const s = info.sessions[0];
                  setSelected({ session: s });
                } else if (hasScheduled) {
                  const sch = info.scheduled[0];
                  if (sch.program_id) navigate(`/program/${sch.program_id}`);
                }
              }}
              className={cn(
                'aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all min-h-[40px]',
                hasWorkout ? 'bg-luxury-blue/20 border border-luxury-blue/40' :
                hasScheduled ? 'bg-luxury-gold/10 border border-luxury-gold/30' :
                hasCardio ? 'bg-luxury-red/10 border border-luxury-red/30' :
                'glass',
                isToday && 'ring-1 ring-luxury-blue',
                (hasWorkout || hasScheduled || hasCardio) && 'cursor-pointer hover:scale-105'
              )}
            >
              <span className={cn('text-xs font-medium', isToday && 'text-luxury-blue')}>{cell.day}</span>
              <div className="flex gap-0.5 mt-0.5">
                {hasWorkout && <Dumbbell size={9} className="text-luxury-blue" />}
                {hasCardio && <Flame size={9} className="text-luxury-red" />}
                {hasScheduled && !hasWorkout && <Check size={9} className="text-luxury-gold" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><Dumbbell size={11} className="text-luxury-blue" /> Completed</span>
        <span className="flex items-center gap-1"><Check size={11} className="text-luxury-gold" /> Planned</span>
        <span className="flex items-center gap-1"><Flame size={11} className="text-luxury-red" /> Cardio</span>
      </div>

      {calendar.error && <p role="alert" className="text-sm text-destructive">Calendar could not load. <button onClick={() => calendar.refetch()} className="min-h-11 underline">Retry</button></p>}
      {calendar.hasNextPage && <Button variant="outline" className="w-full" disabled={calendar.isFetchingNextPage} onClick={() => calendar.fetchNextPage()}>{calendar.isFetchingNextPage ? 'Loading…' : 'Load more entries for this month'}</Button>}
      {!hasAny && (
        <EmptyState icon={CalIcon} title="No calendar entries yet" description="Completed workouts, planned sessions, and cardio will appear here on their dates." />
      )}

      {selected && (
        <WorkoutHistoryViewer session={selected.session} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}