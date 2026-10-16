import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Dumbbell, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TodayWorkoutWidget({ data, standalone }) {
  const navigate = useNavigate();
  const { scheduled, programs, sessions, loading } = data;

  const todayProgramDay = useMemo(() => {
    if (!scheduled?.program_id) return null;
    const prog = programs.find((p) => p.id === scheduled.program_id);
    if (!prog?.days) return null;
    return prog.days[scheduled.day_index] || null;
  }, [scheduled, programs]);

  const workoutName = scheduled?.name || todayProgramDay?.focus || todayProgramDay?.day_name || 'Quick Workout';
  const exerciseCount = todayProgramDay?.exercises?.length || 0;
  const hasWorkouts = sessions.length > 0;

  const startUrl = scheduled?.program_id && scheduled.day_index != null
    ? `/workout/new?programId=${scheduled.program_id}&dayIndex=${scheduled.day_index}`
    : '/workout/new';

  if (loading) return <Card className={cn('animate-pulse', standalone ? 'min-h-[240px]' : 'min-h-[150px]')} />;

  return (
    <Card className={cn('flex flex-col', standalone && 'min-h-[260px]')}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-luxury-blue/15 flex items-center justify-center">
          <Dumbbell size={16} className="text-luxury-blue" />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Today's Workout</span>
      </div>
      <h3 className={cn('font-bold leading-tight', standalone ? 'text-xl' : 'text-base')}>{workoutName}</h3>
      {exerciseCount > 0 && <p className="text-xs text-muted-foreground mt-0.5">{exerciseCount} exercises · {todayProgramDay?.focus || ''}</p>}
      {!hasWorkouts && !scheduled && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">No workout scheduled. Start a quick session.</p>}
      <Button className={cn('w-full mt-auto', standalone ? 'mt-4 h-12' : 'mt-3')} onClick={() => navigate(startUrl)}>
        <Dumbbell size={16} /> Start Workout <ArrowRight size={14} />
      </Button>
    </Card>
  );
}