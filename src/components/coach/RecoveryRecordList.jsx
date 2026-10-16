import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import RecordActions from '@/components/records/RecordActions';
import { recoveryFields } from '@/lib/recordFields';

export default function RecoveryRecordList({ onRefresh }) {
  const { user } = useAuth();
  const data = useInfiniteQuery({ queryKey: ['recovery-records', user?.id], enabled: !!user, initialPageParam: undefined, queryFn: ({ pageParam }) => base44.entities.RecoveryRecord.filter({ created_by_id: user.id }, { sort: '-date', limit: 50, cursor: pageParam }), getNextPageParam: page => page.has_more ? page.next_cursor : undefined });
  return <div className="mt-4">
    <p className="text-xs font-medium mb-2">Saved check-ins · all dates</p>
    {data.isLoading && <p role="status" className="text-sm text-muted-foreground">Loading check-ins…</p>}
    {data.error && <p role="alert" className="text-sm text-destructive">Could not load check-ins. <button className="underline min-h-11" onClick={() => data.refetch()}>Retry</button></p>}
    <div className="divide-y divide-border/50">{data.data?.pages.flatMap(page => page.items).map(record => <div key={record.id} className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0"><p className="text-xs font-medium">{record.date}</p><p className="text-[11px] text-muted-foreground">Sleep {record.sleep_hours ?? '—'}h · Readiness {record.readiness_score ?? '—'}</p></div>
      <RecordActions entity="RecoveryRecord" record={record} fields={recoveryFields} title="recovery check-in" onChanged={onRefresh} />
    </div>)}</div>
    {data.hasNextPage && <Button variant="outline" className="w-full mt-3" disabled={data.isFetchingNextPage} onClick={() => data.fetchNextPage()}>{data.isFetchingNextPage ? 'Loading…' : 'Load older check-ins'}</Button>}
  </div>;
}