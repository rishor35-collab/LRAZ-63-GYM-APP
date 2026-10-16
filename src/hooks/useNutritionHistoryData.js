import { useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { localDateStr } from '@/lib/utils';

export default function useNutritionHistoryData(selectedDate, month) {
  const { user } = useAuth();
  const today = localDateStr();
  const since = useMemo(() => { const date = new Date(); date.setDate(date.getDate() - 60); return localDateStr(date); }, [today]);
  const data = useQuery({ queryKey: ['nutrition-history-summary', user?.id, month, today], enabled: !!user, placeholderData: previous => previous, queryFn: async () => {
    const [year, m] = month.split('-').map(Number);
    const monthEnd = localDateStr(new Date(year, m, 1));
    const owner = { created_by_id: user.id };
    const recentSince = new Date(); recentSince.setDate(recentSince.getDate() - 30);
    const [goals, daily, recent, training] = await Promise.all([
      base44.entities.Goal.filter({ ...owner, status: 'active' }, { sort: '-created_date', limit: 1 }),
      base44.entities.NutritionLog.aggregate({ query: { ...owner, $or: [{ date: { $gte: since, $lte: today } }, { date: { $gte: `${month}-01`, $lt: monthEnd } }] }, groupBy: 'date', sum: ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g'], limit: 1000 }),
      base44.entities.NutritionLog.aggregate({ query: { ...owner, date: { $gte: localDateStr(recentSince) }, food_name: { $ne: 'Water' } }, groupBy: 'food_name', avg: ['calories', 'protein_g'], max: 'logged_at', sort: '-max_logged_at', limit: 30 }),
      base44.entities.WorkoutSession.aggregate({ query: { ...owner, status: 'completed', date: { $gte: new Date(`${since}T00:00:00`).toISOString() } }, groupBy: 'date', limit: 1000 }),
    ]);
    return { goal: goals.items[0] || null, byDate: Object.fromEntries(daily.rows.map(row => [row.date, { date: row.date, calories: row.sum_calories || 0, protein: row.sum_protein_g || 0, carbs: row.sum_carbs_g || 0, fat: row.sum_fat_g || 0, fiber: row.sum_fiber_g || 0 }])), recentFoods: recent.rows.map(row => ({ food_name: row.food_name, calories: row.avg_calories || 0, protein_g: row.avg_protein_g || 0, _count: row.count })), sessions: training.rows.map(row => ({ date: row.date, status: 'completed' })) };
  } });
  const day = useInfiniteQuery({ queryKey: ['nutrition-history-day', user?.id, selectedDate], enabled: !!user, initialPageParam: undefined, queryFn: ({ pageParam }) => base44.entities.NutritionLog.filter({ created_by_id: user.id, date: selectedDate }, { sort: 'logged_at', limit: 50, cursor: pageParam }), getNextPageParam: page => page.has_more ? page.next_cursor : undefined });
  const dayLogs = useMemo(() => day.data?.pages.flatMap(page => page.items) || [], [day.data]);
  const latestFood = async name => {
    const page = await base44.entities.NutritionLog.filter({ created_by_id: user.id, food_name: name }, { sort: '-logged_at', limit: 1 });
    return page.items[0];
  };
  return { goal: data.data?.goal, byDate: data.data?.byDate || {}, sessions: data.data?.sessions || [], recentFoods: data.data?.recentFoods || [], dayLogs, loading: data.isLoading, dayLoading: day.isLoading, error: data.error || day.error, hasMore: day.hasNextPage, loadingMore: day.isFetchingNextPage, loadMore: day.fetchNextPage, latestFood, refresh: () => Promise.all([data.refetch(), day.refetch()]) };
}