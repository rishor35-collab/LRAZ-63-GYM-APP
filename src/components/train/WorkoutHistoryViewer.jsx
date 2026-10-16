import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import WorkoutDetailSheet from '@/components/train/WorkoutDetailSheet';

export default function WorkoutHistoryViewer({ session, summary, onClose }) {
  const data = useInfiniteQuery({ queryKey: ['workout-history-sets', session.id], initialPageParam: undefined, queryFn: ({ pageParam }) => base44.entities.WorkoutSet.filter({ session_id: session.id }, { sort: 'created_date', limit: 100, cursor: pageParam }), getNextPageParam: page => page.has_more ? page.next_cursor : undefined });
  return <WorkoutDetailSheet session={session} sets={data.data?.pages.flatMap(page => page.items) || []} totals={summary} onClose={onClose} footer={<>
    {data.isLoading && <p role="status" className="py-4 text-center text-sm text-muted-foreground">Loading saved sets…</p>}
    {data.error && <p role="alert" className="text-destructive">Could not load sets. <button onClick={() => data.refetch()} className="underline min-h-11">Retry</button></p>}
    {data.hasNextPage && <Button variant="outline" disabled={data.isFetchingNextPage} onClick={() => data.fetchNextPage()} className="w-full mt-4">{data.isFetchingNextPage ? 'Loading…' : 'Load more saved sets'}</Button>}
  </>} />;
}