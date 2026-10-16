import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import RecordField from '@/components/records/RecordField';
import WorkoutSetEditor from '@/components/train/WorkoutSetEditor';
import { workoutFields } from '@/lib/recordFields';
import { fieldValue } from '@/lib/recordEditing';
import { saveWorkoutHistory } from '@/lib/workoutHistoryEditing';

export default function WorkoutHistoryEditor({ session, firstPage, onClose, onSaved }) {
  const [form, setForm] = useState(() => Object.fromEntries(workoutFields.map(field => [field.key, fieldValue(session, field)])));
  const [original, setOriginal] = useState(firstPage.items);
  const [sets, setSets] = useState(firstPage.items);
  const [page, setPage] = useState(firstPage);
  const [removed, setRemoved] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const more = async () => {
    setBusy(true); setError('');
    try { const next = await base44.entities.WorkoutSet.filter({ session_id: session.id }, { sort: 'created_date', limit: 100, cursor: page.next_cursor }); setOriginal(prev => [...prev, ...next.items]); setSets(prev => [...prev, ...next.items]); setPage(next); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const save = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try { await saveWorkoutHistory(session, original, sets, removed, form); await onSaved(); }
    catch (err) { setError(err.message || 'Changes could not be saved. Please retry.'); } finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="record-dialog">
    <DialogTitle>Edit workout</DialogTitle><DialogDescription>Correct workout details and saved sets. Removed sets are deleted only when you save.</DialogDescription>
    <form onSubmit={save} className="space-y-5"><fieldset disabled={busy} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">{workoutFields.map(field => <RecordField key={field.key} field={field} value={form[field.key]} onChange={value => setForm(prev => ({ ...prev, [field.key]: value }))} />)}</div>
      <h4 className="font-semibold">Saved sets</h4>
      {sets.map((set, index) => <WorkoutSetEditor key={set.id} set={set} index={index} removed={removed.includes(set.id)} onRemove={() => setRemoved(prev => prev.includes(set.id) ? prev.filter(id => id !== set.id) : [...prev, set.id])} onChange={(key, value) => setSets(prev => prev.map(item => item.id === set.id ? { ...item, [key]: value } : item))} />)}
      {page.has_more && <Button type="button" variant="outline" onClick={more} className="w-full">Load remaining sets before saving</Button>}
    </fieldset>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="sticky bottom-0 bg-background py-3 flex gap-3"><Button type="button" variant="outline" onClick={onClose} disabled={busy} className="flex-1">Cancel</Button><Button type="submit" disabled={busy || page.has_more} className="flex-1">{busy ? 'Please wait…' : 'Save changes'}</Button></div>
    </form>
  </DialogContent></Dialog>;
}