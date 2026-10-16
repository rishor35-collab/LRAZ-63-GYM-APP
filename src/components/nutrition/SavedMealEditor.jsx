import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import RecordField from '@/components/records/RecordField';
import { nutritionFields } from '@/lib/recordFields';
import { recordsChanged } from '@/lib/recordEditing';
const ITEM_FIELDS = nutritionFields.filter(field => !['date', 'meal'].includes(field.key));
const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout'];

export default function SavedMealEditor({ meal, onClose, onSaved }) {
  const [name, setName] = useState(meal.name || '');
  const [type, setType] = useState(meal.meal_type || 'Snack');
  const [items, setItems] = useState(() => (meal.items || []).map(item => ({ ...item })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const values = items.map(item => Object.fromEntries(Object.entries(item).map(([key, value]) => [key, ITEM_FIELDS.some(field => field.key === key && field.type === 'number') ? Number(value) || 0 : value])));
      await base44.entities.SavedMeal.update(meal.id, { name: name.trim(), meal_type: type, items: values, total_calories: Math.round(values.reduce((sum, item) => sum + (item.calories || 0), 0)), total_protein_g: +values.reduce((sum, item) => sum + (item.protein_g || 0), 0).toFixed(1) });
      recordsChanged('SavedMeal'); await onSaved(); onClose();
    } catch (err) { setError(err.message || 'Your meal could not be saved.'); } finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="record-dialog"><DialogTitle>Edit saved meal</DialogTitle><DialogDescription>Correct your saved recipe. Previously logged meals stay unchanged.</DialogDescription>
    <form onSubmit={save} className="space-y-5"><fieldset disabled={busy} className="space-y-4">
      <RecordField field={{ key: 'name', label: 'Meal name', required: true }} value={name} onChange={setName} />
      <RecordField field={{ key: 'meal_type', label: 'Meal', options: MEALS }} value={type} onChange={setType} />
      {items.map((item, index) => <fieldset key={index} className="rounded-2xl border border-border p-3 grid grid-cols-2 gap-3"><legend className="px-1 text-xs text-muted-foreground">Food {index + 1}</legend>{ITEM_FIELDS.map(field => <RecordField key={field.key} field={field} value={item[field.key] ?? ''} onChange={value => setItems(prev => prev.map((row, i) => i === index ? { ...row, [field.key]: value } : row))} />)}</fieldset>)}
    </fieldset>{error && <p role="alert" className="text-destructive text-sm">{error}</p>}<div className="sticky bottom-0 flex gap-3 py-3 bg-background"><Button type="button" variant="outline" disabled={busy} onClick={onClose} className="flex-1">Cancel</Button><Button type="submit" disabled={busy} className="flex-1">{busy ? 'Saving…' : 'Save changes'}</Button></div></form>
  </DialogContent></Dialog>;
}