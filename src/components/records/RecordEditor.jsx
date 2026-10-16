import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import RecordField from '@/components/records/RecordField';
import { fieldValue, recordPatch, updateRecord, syncLatestMeasurement } from '@/lib/recordEditing';
import { useAuth } from '@/lib/AuthContext';

export default function RecordEditor({ entity, record, fields, title, onClose, onSaved }) {
  const { user, checkUserAuth } = useAuth();
  const [form, setForm] = useState(() => Object.fromEntries(fields.map(field => [field.key, fieldValue(record, field)])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submit = async event => {
    event.preventDefault(); setSaving(true); setError('');
    try { await updateRecord(entity, record, recordPatch(record, fields, form)); if (entity === 'BodyMeasurement' && await syncLatestMeasurement(user)) await checkUserAuth(); await onSaved?.(); onClose(); }
    catch (err) { setError(err.message || 'Your changes could not be saved. Please try again.'); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}>
      <DialogContent className="record-dialog" onInteractOutside={e => { if (saving) e.preventDefault(); }}>
        <DialogTitle className="font-heading text-xl pr-8">{title}</DialogTitle>
        <DialogDescription>Update your saved information. Other details stay unchanged.</DialogDescription>
        <form onSubmit={submit} className="space-y-5">
          <fieldset disabled={saving} className="grid grid-cols-2 gap-4">
            {fields.map(field => <RecordField key={field.key} field={field} value={form[field.key]} onChange={value => setForm(prev => ({ ...prev, [field.key]: value }))} />)}
          </fieldset>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="sticky bottom-0 flex gap-3 bg-background py-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Saving…' : 'Save changes'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}