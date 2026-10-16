import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function useWorkoutHistory(search) {
  const { user } = useAuth();
  const [term, setTerm] = useState('');
  useEffect(() => { const timer = setTimeout(() => setTerm(search.trim()), 350); return () => clearTimeout(timer); }, [search]);
  const regex = useMemo(() => ({ $regex: term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }), [term]);
  const matches = useInfiniteQuery({ queryKey: ['workout-search-sets', user?.id, term], enabled: !!user && !!term, initialPageParam: undefined, queryFn: ({ pageParam }) => base44.entities.WorkoutSet.filter({ created_by_id: user.id, $or: [{ exercise_name: regex }, { notes: regex }] }, { distinct: 'session_id', limit: 100, cursor: pageParam }), getNextPageParam: page => page.has_more ? page.next_cursor : undefined });
  const matchingIds = useMemo(() => matches.data?.pages.flatMap(page => page.items) || [], [matches.data]);
  const query = useMemo(() => ({ created_by_id: user?.id, status: 'completed', ...(term ? { $or: [{ name: regex }, { notes: regex }, { program_day_name: regex }, { id: { $in: matchingIds } }] } : {}) }), [user?.id, term, regex, matchingIds]);
  const enabled = !!user && (!term || matches.isSuccess);
  const list = useInfiniteQuery({ queryKey: ['workout-history', query], enabled, initialPageParam: undefined, queryFn: async ({ pageParam }) => {
    const page = await base44.entities.WorkoutSession.filter(query, { sort: '-date', limit: 50, cursor: pageParam });
    const summaries = Object.fromEntries(page.items.map(session => [session.id, { exerciseCount: 0, totalSets: 0, hasNotes: false }]));
    if (page.items.length) {
      const totals = await base44.entities.WorkoutSet.aggregate({ query: { created_by_id: user.id, session_id: { $in: page.items.map(session => session.id) }, completed: true }, groupBy: ['session_id', 'exercise_name'], max: 'notes', limit: 1000 });
      totals.rows.forEach(row => { const item = summaries[row.session_id]; if (item) { item.exerciseCount++; item.totalSets += row.count; item.hasNotes ||= !!row.max_notes; } });
    }
    return { ...page, summaries };
  }, getNextPageParam: page => page.has_more ? page.next_cursor : undefined });
  const count = useQuery({ queryKey: ['workout-history-count', query], enabled, queryFn: () => base44.entities.WorkoutSession.count(query) });
  const sessions = useMemo(() => list.data?.pages.flatMap(page => page.items) || [], [list.data]);
  const summaries = useMemo(() => Object.assign({}, ...(list.data?.pages.map(page => page.summaries) || [])), [list.data]);
  return { sessions, summaries, count: count.data, loading: list.isLoading || (!!term && matches.isLoading), error: list.error || matches.error || count.error, hasMore: list.hasNextPage, loadingMore: list.isFetchingNextPage, loadMore: list.fetchNextPage, hasMoreMatches: !!term && matches.hasNextPage, loadingMatches: matches.isFetchingNextPage, loadMatches: matches.fetchNextPage, searching: search.trim() !== term };
}