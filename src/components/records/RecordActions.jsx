import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import RecordEditor from '@/components/records/RecordEditor';
import { recordsChanged, syncLatestMeasurement } from '@/lib/recordEditing';
import { useAuth } from '@/lib/AuthContext';

export default function RecordActions({ entity, record, fields, title, onChanged, onDelete, onEdit }) {
  const { user, checkUserAuth } = useAuth();
  const [mode, setMode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const remove = async () => {
    setBusy(true); setError('');
    try { if (onDelete) await onDelete(record); else await base44.entities[entity].delete(record.id); recordsChanged(entity); if (entity === 'BodyMeasurement' && await syncLatestMeasurement(user)) await checkUserAuth(); await onChanged?.(); setMode(null); }
    catch (err) { setError(err.message || 'Could not delete this record.'); }
    finally { setBusy(false); }
  };
  return (
    <div className="flex items-center shrink-0" onClick={e => e.stopPropagation()}>
      <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${title}`} onClick={() => onEdit ? onEdit(record) : setMode('edit')}><Pencil size={16} /></Button>
      <Button type="button" variant="ghost" size="icon" aria-label={`Delete ${title}`} onClick={() => setMode('delete')}><Trash2 size={16} className="text-destructive" /></Button>
      {mode === 'edit' && <RecordEditor entity={entity} record={record} fields={fields} title={`Edit ${title}`} onClose={() => setMode(null)} onSaved={onChanged} />}
      {mode === 'delete' && <Dialog open onOpenChange={open => { if (!open && !busy) setMode(null); }}>
        <DialogContent className="record-dialog"><DialogTitle>Delete {title}?</DialogTitle><DialogDescription>This permanently removes only this saved record. This cannot be undone.</DialogDescription>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3"><Button variant="outline" disabled={busy} onClick={() => setMode(null)} className="flex-1">Cancel</Button><Button variant="destructive" disabled={busy} onClick={remove} className="flex-1">{busy ? 'Deleting…' : 'Delete'}</Button></div>
        </DialogContent>
      </Dialog>}
    </div>
  );
}