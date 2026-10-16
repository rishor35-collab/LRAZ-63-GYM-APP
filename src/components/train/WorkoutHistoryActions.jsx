import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import WorkoutHistoryEditor from '@/components/train/WorkoutHistoryEditor';
import { deleteWorkoutHistory } from '@/lib/workoutHistoryEditing';

export default function WorkoutHistoryActions({ session, onChanged }) {
  const [mode, setMode] = useState(null);
  const [page, setPage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const edit = async () => {
    setBusy(true); setError('');
    try { setPage(await base44.entities.WorkoutSet.filter({ session_id: session.id }, { sort: 'created_date', limit: 100 })); setMode('edit'); }
    catch (err) { setError(err.message || 'Could not load saved sets.'); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true); setError('');
    try { await deleteWorkoutHistory(session); setMode(null); onChanged(); }
    catch (err) { setError(err.message || 'Could not delete this workout.'); } finally { setBusy(false); }
  };
  return <div className="mb-4 space-y-2">
    <div className="flex gap-2"><Button variant="outline" disabled={busy} onClick={edit} className="flex-1"><Pencil size={15} />{busy ? 'Please wait…' : 'Edit workout'}</Button><Button variant="outline" disabled={busy} onClick={() => setMode('delete')} className="text-destructive"><Trash2 size={15} />Delete</Button></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {mode === 'edit' && page && <WorkoutHistoryEditor session={session} firstPage={page} onClose={() => setMode(null)} onSaved={() => { setMode(null); onChanged(); }} />}
    {mode === 'delete' && <Dialog open onOpenChange={open => { if (!open && !busy) setMode(null); }}><DialogContent className="record-dialog"><DialogTitle>Delete this workout?</DialogTitle><DialogDescription>The workout and its strength sets will be permanently removed. Any recorded cardio will be kept in Cardio History.</DialogDescription>{error && <p role="alert" className="text-destructive text-sm">{error}</p>}<div className="flex gap-3"><Button variant="outline" disabled={busy} onClick={() => setMode(null)} className="flex-1">Cancel</Button><Button variant="destructive" disabled={busy} onClick={remove} className="flex-1">{busy ? 'Deleting…' : 'Delete workout'}</Button></div></DialogContent></Dialog>}
  </div>;
}