import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { localDateStr } from '@/lib/utils';

export default function useTrainingCalendar(month) {
  const { user } = useAuth();
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const result = useInfiniteQuery({ queryKey: ['training-calendar', user?.id, localDateStr(start)], enabled: !!user, initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      const load = (entity, dates, cursor, fields) => cursor === false ? Promise.resolve({ items: [], has_more: false }) : base44.entities[entity].filter({ created_by_id: user.id, date: dates, ...(entity === 'WorkoutSession' ? { status: 'completed' } : {}) }, { sort: '-date', limit: 50, cursor, fields });
      const [sessions, cardio, scheduled] = await Promise.all([
        load('WorkoutSession', { $gte: start.toISOString(), $lt: end.toISOString() }, pageParam?.sessions, ['name', 'date', 'status', 'focus', 'duration_minutes', 'pr_count', 'total_volume_kg', 'notes', 'program_day_name']),
        load('CardioSession', { $gte: start.toISOString(), $lt: end.toISOString() }, pageParam?.cardio, ['date']),
        load('ScheduledWorkout', { $gte: localDateStr(start), $lt: localDateStr(end) }, pageParam?.scheduled, ['date', 'program_id']),
      ]);
      return { sessions, cardio, scheduled };
    }, getNextPageParam: (page) => Object.values(page).some((part) => part.has_more) ? Object.fromEntries(Object.entries(page).map(([key, part]) => [key, part.has_more ? part.next_cursor : false])) : undefined });
  return { ...result, data: result.data ? { sessions: result.data.pages.flatMap((page) => page.sessions.items), cardio: result.data.pages.flatMap((page) => page.cardio.items), scheduled: result.data.pages.flatMap((page) => page.scheduled.items) } : null };
}