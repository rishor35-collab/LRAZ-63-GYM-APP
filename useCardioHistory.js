import { useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import useLocalDay from '@/hooks/useLocalDay';
import { rangeCutoff, getActivity } from '@/lib/cardioAnalytics';

export default function useCardioHistory(range) {
  const { user } = useAuth();
  const today = useLocalDay();
  const query = useMemo(() => {
    const owner = { created_by_id: user?.id };
    if (range === 'all') return owner;
    if (range === 'today') { const start = new Date(`${today}T00:00:00`); const end = new Date(start); end.setDate(end.getDate() + 1); return { ...owner, date: { $gte: start.toISOString(), $lt: end.toISOString() } }; }
    return { ...owner, date: { $gte: new Date(rangeCutoff(range)).toISOString() } };
  }, [range, user?.id, today]);
  const list = useInfiniteQuery({ queryKey: ['cardio-history', user?.id, range, today], enabled: !!user, initialPageParam: undefined, queryFn: ({ pageParam }) => base44.entities.CardioSession.filter(query, { sort: '-date', limit: 50, cursor: pageParam }), getNextPageParam: page => page.has_more ? page.next_cursor : undefined });
  const totals = useQuery({ queryKey: ['cardio-summary', user?.id, range, today], enabled: !!user, queryFn: () => base44.entities.CardioSession.aggregate({ query, groupBy: ['activity', 'calorie_source'], sum: ['duration_seconds', 'distance_km', 'calories'], limit: 1000 }) });
  const sessions = useMemo(() => list.data?.pages.flatMap(page => page.items) || [], [list.data]);
  const agg = useMemo(() => {
    const out = { sessions: 0, totalSeconds: 0, totalDistance: 0, totalCalories: 0, estimatedCalories: 0, recordedCalories: 0, breakdown: [], inRange: sessions };
    const activities = new Map();
    (totals.data?.rows || []).forEach(row => {
      const seconds = row.sum_duration_seconds || 0, distance = row.sum_distance_km || 0, calories = row.sum_calories || 0;
      out.sessions += row.count; out.totalSeconds += seconds; out.totalDistance += distance; out.totalCalories += calories;
      out[row.calorie_source === 'Estimated' ? 'estimatedCalories' : 'recordedCalories'] += calories;
      const item = activities.get(row.activity) || { activity: row.activity, label: getActivity(row.activity).label, sessions: 0, seconds: 0, distance: 0, calories: 0 };
      item.sessions += row.count; item.seconds += seconds; item.distance += distance; item.calories += calories; activities.set(row.activity, item);
    });
    out.avgDuration = out.sessions ? out.totalSeconds / out.sessions : 0;
    out.avgDistance = out.sessions ? out.totalDistance / out.sessions : 0;
    out.breakdown = [...activities.values()].sort((a, b) => b.seconds - a.seconds);
    return out;
  }, [sessions, totals.data]);
  return { agg, loading: list.isLoading || totals.isLoading, error: list.error || totals.error, hasMore: list.hasNextPage, loadingMore: list.isFetchingNextPage, loadMore: list.fetchNextPage, refresh: () => Promise.all([list.refetch(), totals.refetch()]) };
}