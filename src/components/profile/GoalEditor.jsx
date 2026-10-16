import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionSelect } from '@/components/ui/action-select';
import { Target, RefreshCw, Check, Pencil } from 'lucide-react';
import { recalcGoalTargets } from '@/lib/profileSync';

const GOAL_OPTIONS = ['Fat Loss', 'Muscle Gain', 'Body Recomposition', 'Strength Gain', 'Athletic Performance', 'Endurance', 'General Fitness', 'Maintenance'];
const RATE_OPTIONS = ['Conservative', 'Moderate', 'Faster'];

const EMPTY = {
  primary_goal: 'Body Recomposition', rate_preference: 'Moderate',
  target_weight_kg: '', target_body_fat_percent: '',
  calorie_target: '', protein_target_g: '', carb_target_g: '', fat_target_g: '', fiber_target_g: '', water_target_ml: '',
};

const toForm = (g) => ({
  primary_goal: g.primary_goal || 'Body Recomposition',
  rate_preference: g.rate_preference || 'Moderate',
  target_weight_kg: g.target_weight_kg ?? '',
  target_body_fat_percent: g.target_body_fat_percent ?? '',
  calorie_target: g.calorie_target ?? '',
  protein_target_g: g.protein_target_g ?? '',
  carb_target_g: g.carb_target_g ?? '',
  fat_target_g: g.fat_target_g ?? '',
  fiber_target_g: g.fiber_target_g ?? '',
  water_target_ml: g.water_target_ml ?? '',
});

export default function GoalEditor({ user }) {
  const [goal, setGoal] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => { loadGoal(); }, []);

  const loadGoal = async () => {
    try {
      const goals = await base44.entities.Goal.filter({ status: 'active' }, '-created_date', 1);
      setGoal(goals[0] || null);
      if (goals[0]) setForm(toForm(goals[0]));
    } catch (e) { console.error(e); }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const recalculate = () => {
    if (!user) return;
    const updated = recalcGoalTargets(user, { ...(goal || {}), ...form });
    if (updated) setForm((f) => ({ ...f, ...updated }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const data = { ...form };
      ['target_weight_kg', 'target_body_fat_percent', 'calorie_target', 'protein_target_g', 'carb_target_g', 'fat_target_g', 'fiber_target_g', 'water_target_ml'].forEach((k) => (data[k] = data[k] === '' ? undefined : Number(data[k])));
      if (goal) {
        await base44.entities.Goal.update(goal.id, data);
        setGoal({ ...goal, ...data });
      } else {
        const created = await base44.entities.Goal.create({ ...data, status: 'active', created_at: new Date().toISOString() });
        setGoal(created);
      }
      setEditing(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold flex items-center gap-2"><Target size={15} className="text-luxury-blue" /> Goals & Targets</p>
        <div className="flex gap-1.5">
          {editing && <Button size="sm" variant="ghost" onClick={recalculate} className="text-muted-foreground min-h-[36px]"><RefreshCw size={14} /> Auto</Button>}
          <Button size="sm" variant="ghost" onClick={() => (editing ? save() : setEditing(true))} disabled={saving} className="text-luxury-blue min-h-[36px]">
            {editing ? (saving ? 'Saving…' : <><Check size={14} /> Save</>) : <><Pencil size={14} /> Edit</>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase text-muted-foreground">Primary Goal</Label>
          {editing ? <ActionSelect value={form.primary_goal} options={GOAL_OPTIONS} onChange={(v) => set('primary_goal', v)} />
            : <p className="text-sm font-medium min-h-[44px] flex items-center">{form.primary_goal || '—'}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase text-muted-foreground">Rate</Label>
          {editing ? <ActionSelect value={form.rate_preference} options={RATE_OPTIONS} onChange={(v) => set('rate_preference', v)} />
            : <p className="text-sm font-medium min-h-[44px] flex items-center">{form.rate_preference || '—'}</p>}
        </div>
        <NumField label="Calories" value={form.calorie_target} editing={editing} onChange={(v) => set('calorie_target', v)} />
        <NumField label="Protein (g)" value={form.protein_target_g} editing={editing} onChange={(v) => set('protein_target_g', v)} />
        <NumField label="Carbs (g)" value={form.carb_target_g} editing={editing} onChange={(v) => set('carb_target_g', v)} />
        <NumField label="Fat (g)" value={form.fat_target_g} editing={editing} onChange={(v) => set('fat_target_g', v)} />
        <NumField label="Fiber (g)" value={form.fiber_target_g} editing={editing} onChange={(v) => set('fiber_target_g', v)} />
        <NumField label="Water (ml)" value={form.water_target_ml} editing={editing} onChange={(v) => set('water_target_ml', v)} />
        <NumField label="Target Wt (kg)" value={form.target_weight_kg} editing={editing} onChange={(v) => set('target_weight_kg', v)} />
        <NumField label="Target BF %" value={form.target_body_fat_percent} editing={editing} onChange={(v) => set('target_body_fat_percent', v)} />
      </div>

      {editing && (
        <p className="text-[10px] text-muted-foreground mt-3">Tap <span className="text-luxury-blue font-medium">Auto</span> to recalculate from your current weight, height, age, and goal — then tweak any value manually and Save.</p>
      )}
    </Card>
  );
}

function NumField({ label, value, editing, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[10px] uppercase text-muted-foreground">{label}</Label>
      {editing ? <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="glass h-9 tabular-nums" />
        : <p className="text-sm font-medium min-h-[36px] flex items-center tabular-nums">{value || '—'}</p>}
    </div>
  );
}