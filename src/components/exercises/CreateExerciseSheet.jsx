import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MUSCLE_GROUPS, EQUIPMENT_OPTIONS, MOVEMENT_PATTERNS, CATEGORIES, DIFFICULTY_LEVELS } from '@/lib/exerciseDatabase';

function slugify(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function CreateExerciseSheet({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', muscle_group: 'Chest', primary_muscle: '', secondary_muscles: '', equipment: [], category: 'Resistance', movement_pattern: 'Horizontal Push', difficulty: 'Beginner', instructions: '' });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleEquip = (eq) => setForm((f) => ({ ...f, equipment: f.equipment.includes(eq) ? f.equipment.filter((x) => x !== eq) : [...f.equipment, eq] }));

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const record = {
        name: form.name.trim(),
        canonical_id: `custom-${slugify(form.name)}-${Date.now().toString(36)}`,
        category: form.category,
        subcategory: form.muscle_group,
        movement_pattern: form.movement_pattern,
        primary_muscle: form.primary_muscle || form.muscle_group,
        secondary_muscles: form.secondary_muscles.split(',').map((s) => s.trim()).filter(Boolean),
        equipment: form.equipment,
        difficulty: form.difficulty,
        unilateral: false,
        instructions: form.instructions,
        is_custom: true,
        active: true,
        version: 1,
      };
      await base44.entities.Exercise.create(record);
      setDone(true);
      setTimeout(() => { onCreated(); onClose(); }, 600);
    } catch (e) { console.error(e); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Create Exercise</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="min-h-[44px] min-w-[44px] p-2"><X size={18} /></Button>
        </div>

        <Field label="Exercise Name"><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Cable Wood Chop" autoFocus /></Field>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Muscle Group">
            <select value={form.muscle_group} onChange={(e) => set('muscle_group', e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm glass">
              {MUSCLE_GROUPS.filter((m) => m !== 'All').map((m) => <option key={m} value={m} className="bg-card">{m}</option>)}
            </select>
          </Field>
          <Field label="Primary Muscle"><Input value={form.primary_muscle} onChange={(e) => set('primary_muscle', e.target.value)} placeholder="e.g. Obliques" /></Field>
        </div>

        <Field label="Secondary Muscles (comma separated)" className="mt-3"><Input value={form.secondary_muscles} onChange={(e) => set('secondary_muscles', e.target.value)} placeholder="e.g. Abs, Shoulders" /></Field>

        <div className="mt-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Equipment</Label>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {EQUIPMENT_OPTIONS.filter((e) => e !== 'All').map((eq) => (
              <button key={eq} onClick={() => toggleEquip(eq)} className={cn('text-xs px-2.5 py-1.5 rounded-full border transition-all min-h-[36px]', form.equipment.includes(eq) ? 'border-luxury-blue bg-luxury-blue/15 text-luxury-blue' : 'border-border glass text-muted-foreground')}>{eq}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Category">
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm glass">
              {CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c} value={c} className="bg-card">{c}</option>)}
            </select>
          </Field>
          <Field label="Movement Pattern">
            <select value={form.movement_pattern} onChange={(e) => set('movement_pattern', e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm glass">
              {MOVEMENT_PATTERNS.filter((m) => m !== 'All').map((m) => <option key={m} value={m} className="bg-card">{m}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Difficulty" className="mt-3">
          <div className="flex gap-1.5 flex-wrap">
            {DIFFICULTY_LEVELS.filter((d) => d !== 'All').map((d) => (
              <button key={d} onClick={() => set('difficulty', d)} className={cn('text-xs px-3 py-1.5 rounded-full border transition-all min-h-[36px]', form.difficulty === d ? 'border-luxury-blue bg-luxury-blue/15 text-luxury-blue' : 'border-border glass text-muted-foreground')}>{d}</button>
            ))}
          </div>
        </Field>

        <Field label="Notes / Instructions" className="mt-3"><Input value={form.instructions} onChange={(e) => set('instructions', e.target.value)} placeholder="Brief execution notes" /></Field>

        <p className="text-[10px] text-muted-foreground mt-3">Custom exercises are saved to your account and never overwritten by library updates.</p>

        <Button onClick={save} disabled={saving || done || !form.name.trim()} className="w-full mt-4 bg-luxury-blue glow-blue min-h-[44px]">
          {done ? <><Check size={16} /> Saved</> : saving ? 'Saving…' : <><Plus size={16} /> Create Exercise</>}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children, className }) {
  return (<div className={cn('flex flex-col gap-1.5', className)}><Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>{children}</div>);
}