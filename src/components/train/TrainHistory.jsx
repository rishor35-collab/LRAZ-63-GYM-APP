import React, { useState } from 'react';
import { EmptyState } from '@/components/ui/fitness';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { History, Search } from 'lucide-react';
import useWorkoutHistory from '@/hooks/useWorkoutHistory';
import WorkoutHistoryCard from '@/components/train/WorkoutHistoryCard';
import WorkoutHistoryViewer from '@/components/train/WorkoutHistoryViewer';

export default function TrainHistory() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const { sessions, summaries, count, loading, error, hasMore, loadingMore, loadMore, hasMoreMatches, loadingMatches, loadMatches, searching } = useWorkoutHistory(search);
  return <div className="space-y-3">
    <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search workout history" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes, exercises, workouts…" className="pl-9 glass" /></div>
    {loading || searching ? <p role="status" className="py-8 text-center text-sm text-muted-foreground">Loading history…</p> : <>
      <p className="text-[11px] text-muted-foreground">{count ?? '—'} workouts{search.trim() ? ' matched' : ''}</p>
      {error && <p role="alert" className="text-sm text-destructive">History could not be loaded. Please reopen History to retry.</p>}
      {!sessions.length && !error && <EmptyState icon={History} title={search ? 'No matching workouts' : 'No completed workouts yet'} description={search ? 'Try another workout, exercise or note.' : 'Finish a workout to see its full details, notes and personal records.'} />}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{sessions.map(session => <WorkoutHistoryCard key={session.id} session={session} summary={summaries[session.id]} onOpen={() => setSelected(session)} />)}</div>
      {hasMore && <Button variant="outline" disabled={loadingMore} onClick={() => loadMore()} className="w-full">{loadingMore ? 'Loading…' : 'Load more workouts'}</Button>}
      {hasMoreMatches && <Button variant="outline" disabled={loadingMatches} onClick={() => loadMatches()} className="w-full">{loadingMatches ? 'Searching…' : 'Find more exercise and note matches'}</Button>}
    </>}
    {selected && <WorkoutHistoryViewer session={selected} summary={summaries[selected.id]} onClose={() => setSelected(null)} />}
  </div>;
}