import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, EmptyState } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ruler, Trash2, Pencil, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MeasurementHistory({ measurements, onRefresh }) {
  const [editing, setEditing] = useState(null);

  if (!measurements.length) return <EmptyState icon={Ruler} title="No measurements yet" description="Log your first measurement to start your history." />;

  return (
    <div>
      <Card>
        <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Ruler size={15} className="text-luxury-blue" /> Measurement History</p>
        <div className="space-y-1">
          {measurements.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2 border-t border-border/40 first:border-t-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium tabular-nums">{m.weight_kg ?? '—'} kg{m.body_fat_percent != null ? ` · ${m.body_fat_percent}% BF` : ''}{m.waist_cm != null ? ` · ${m.waist_cm}cm waist` : ''}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(m.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}{m.body_fat_method ? ` · ${m.body_fat_method}` : ''}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(m)} className="text-muted-foreground hover:text-luxury-blue min-h-[36px] min-w-[36px] flex items-center justify-center"><Pencil size={14} /></button>
                <button onClick={async () => { try { await base44.entities.BodyMeasurement.delete(m.id); onRefresh?.(); } catch (e) { console.error(e); } }} className="text-muted-foreground hover:text-luxury-red min-h-[36px] min-w-[36px] flex items-center justify-center"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {editing && <EditSheet measurement={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onRefresh?.(); }} />}
    </div>
  );
}

function EditSheet({ measurement, onClose, onSaved }) {
  const [form, setForm] = useState({
    weight_kg: measurement.weight_kg ?? '',
    body_fat_percent: measurement.body_fat_percent ?? '',
    waist_cm: measurement.waist_cm ?? '',
    hip_cm: measurement.hip_cm ?? '',
    neck_cm: measurement.neck_cm ?? '',
    notes: measurement.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const data = { ...form };
      ['weight_kg', 'body_fat_percent', 'waist_cm', 'hip_cm', 'neck_cm'].forEach((k) => (data[k] = data[k] === '' ? undefined : Number(data[k])));
      await base44.entities.BodyMeasurement.update(measurement.id, data);
      onSaved();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Edit Measurement</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="min-h-[44px] min-w-[44px] p-2"><X size={18} /></Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Weight (kg)"><Input type="number" value={form.weight_kg} onChange={(e) => set('weight_kg', e.target.value)} /></Field>
          <Field label="Body Fat (%)"><Input type="number" value={form.body_fat_percent} onChange={(e) => set('body_fat_percent', e.target.value)} /></Field>
          <Field label="Waist (cm)"><Input type="number" value={form.waist_cm} onChange={(e) => set('waist_cm', e.target.value)} /></Field>
          <Field label="Neck (cm)"><Input type="number" value={form.neck_cm} onChange={(e) => set('neck_cm', e.target.value)} /></Field>
          <Field label="Hip (cm)"><Input type="number" value={form.hip_cm} onChange={(e) => set('hip_cm', e.target.value)} /></Field>
        </div>
        <Field label="Notes"><Input value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
        <Button onClick={save} disabled={saving} className="w-full mt-4 bg-luxury-blue glow-blue min-h-[44px]">{saving ? 'Saving…' : <><Check size={16} /> Save Changes</>}</Button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div className="flex flex-col gap-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>{children}</div>;
}