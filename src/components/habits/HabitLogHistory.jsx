import React, { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import RecordEditor from '@/components/records/RecordEditor';
import { recordsChanged } from '@/lib/recordEditing';
const FIELDS = [{ key: 'date', label: 'Completion date', type: 'date', required: true }];

export default function HabitLogHistory({ habit, onClose, onChanged }) {
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const data = useInfiniteQuery({ queryKey: ['habit-history', habit.id], initialPageParam: undefined, queryFn: ({ pageParam }) => base44.entities.HabitLog.filter({ habit_id: habit.id }, { sort: '-date', limit: 50, cursor: pageParam }), getNextPageParam: page => page.has_more ? page.next_cursor : undefined });
  const remove = async record => {
    setBusy(true); setError('');
    try { await base44.entities.HabitLog.delete(record.id); setConfirm(null); recordsChanged('HabitLog'); await onChanged(); }
    catch (err) { setError(err.message || 'Could not delete this completion.'); } finally { setBusy(false); }
  };
  if (editing) return <RecordEditor entity="HabitLog" record={editing} fields={FIELDS} title="Edit completion date" onClose={() => setEditing(null)} onSaved={onChanged} />;
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="record-dialog">
    <DialogTitle>{habit.name} history</DialogTitle><DialogDescription>Edit a previous completion date or delete an incorrect entry.</DialogDescription>
    {data.isLoading && <p role="status">Loading completions…</p>}
    {(error || data.error) && <p role="alert" className="text-destructive text-sm">{error || 'Could not load completions.'}</p>}
    <div className="divide-y divide-border">{data.data?.pages.flatMap(page => page.items).map(record => <div key={record.id} className="py-2 flex items-center justify-between gap-2"><span className="text-sm">{record.date}</span><div className="flex gap-1">
      {confirm === record.id ? <><Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirm(null)}>Cancel</Button><Button size="sm" variant="destructive" disabled={busy} onClick={() => remove(record)}>{busy ? 'Deleting…' : 'Confirm delete'}</Button></> : <><Button size="sm" variant="ghost" onClick={() => setEditing(record)}>Edit</Button><Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirm(record.id)}>Delete</Button></>}
    </div></div>)}</div>
    {data.isSuccess && !data.data.pages[0].items.length && <p className="text-sm text-muted-foreground">No completions saved yet.</p>}
    {data.hasNextPage && <Button variant="outline" disabled={data.isFetchingNextPage} onClick={() => data.fetchNextPage()}>{data.isFetchingNextPage ? 'Loading…' : 'Load older completions'}</Button>}
  </DialogContent></Dialog>;
}