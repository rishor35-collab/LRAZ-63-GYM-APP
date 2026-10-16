import { useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { estimate1RM } from '@/lib/fitnessScience';

export default function useExerciseHistoryData(name, limit = 40) {
  const { user } = useAuth();
  const query = { created_by_id: user?.id, exercise_name: name, set_type: { $ne: 'warmup' } };
  const list = useInfiniteQuery({ queryKey: ['exercise-history', user?.id, name, limit], enabled: !!user && !!name, initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      const page = await base44.entities.WorkoutSet.filter(query, { sort: '-created_date', limit, cursor: pageParam });
      const ids = [...new Set(page.items.map((set) => set.session_id).filter(Boolean))];
      const sessions = ids.length ? await base44.entities.WorkoutSession.filter({ created_by_id: user.id, id: { $in: ids } }, { limit, fields: ['date'] }) : { items: [] };
      const dates = Object.fromEntries(sessions.items.map((session) => [session.id, session.date]));
      return { ...page, points: page.items.map((set) => ({ id: set.id, date: (dates[set.session_id] || set.created_date || '').slice(0, 10), weight: set.weight_kg, reps: set.reps, e1rm: Math.round(set.estimated_1rm || estimate1RM(set.weight_kg, set.reps) || 0), isPr: set.is_pr, volume: Math.round((set.weight_kg || 0) * (set.reps || 0)) })) };
    }, getNextPageParam: (page) => page.has_more ? page.next_cursor : undefined });
  const stats = useQuery({ queryKey: ['exercise-history-summary', user?.id, name], enabled: !!user && !!name,
    queryFn: () => base44.entities.WorkoutSet.aggregate({ query, groupBy: 'is_pr', max: 'estimated_1rm' }) });
  const points = useMemo(() => (list.data?.pages.flatMap((page) => page.points) || []).sort((a, b) => b.date.localeCompare(a.date)), [list.data]);
  const rows = stats.data?.rows || [];
  return { points, loading: list.isLoading, error: list.error || stats.error, retry: () => Promise.all([list.refetch(), stats.refetch()]),
    bestE1rm: Math.max(0, ...rows.map((row) => row.max_estimated_1rm || 0), ...points.map((point) => point.e1rm)),
    totalSets: stats.data ? rows.reduce((sum, row) => sum + row.count, 0) : undefined,
    prCount: rows.find((row) => row.is_pr === true)?.count || 0,
    shownVolume: points.reduce((sum, point) => sum + point.volume, 0),
    hasMore: list.hasNextPage, loadingMore: list.isFetchingNextPage, loadMore: list.fetchNextPage };
}