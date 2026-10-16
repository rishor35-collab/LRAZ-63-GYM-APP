import React, { useMemo } from 'react';
import { Card } from '@/components/ui/fitness';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAY = 86400000;

function getWeek(d) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

export default function StreakWidget({ data, standalone }) {
  const { sessions, goal, loading } = data;

  const { streak, thisWeek } = useMemo(() => {
    const weeks = {};
    (sessions || []).filter((s) => s.status === 'completed' && s.date).forEach((s) => {
      const d = new Date(s.date);
      weeks[`${d.getFullYear()}-${getWeek(d)}`] = true;
    });
    let count = 0;
    let cursor = new Date();
    if (weeks[`${cursor.getFullYear()}-${getWeek(cursor)}`]) count++;
    cursor = new Date(cursor.getTime() - 7 * DAY);
    while (weeks[`${cursor.getFullYear()}-${getWeek(cursor)}`]) { count++; cursor = new Date(cursor.getTime() - 7 * DAY); }
    const thisWk = (sessions || []).filter((s) => s.status === 'completed' && s.date && Date.now() - new Date(s.date).getTime() < 7 * DAY).length;
    return { streak: count, thisWeek: thisWk };
  }, [sessions]);

  const target = goal?.days_per_week || 4;

  if (loading) return <Card className={cn('animate-pulse', standalone ? 'min-h-[240px]' : 'min-h-[150px]')} />;

  return (
    <Card className={cn('flex flex-col items-center justify-center text-center', standalone && 'min-h-[260px]')}>
      <div className="w-12 h-12 rounded-full bg-luxury-red/15 flex items-center justify-center mb-2">
        <Flame size={24} className="text-luxury-red" />
      </div>
      <p className={cn('font-bold tabular-nums text-gradient-red', standalone ? 'text-4xl' : 'text-2xl')}>{streak}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">week streak</p>
      <div className="mt-3 pt-3 border-t border-border/40 w-full">
        <p className="text-sm font-semibold">{thisWeek} / {target} <span className="text-muted-foreground font-normal">this week</span></p>
      </div>
    </Card>
  );
}