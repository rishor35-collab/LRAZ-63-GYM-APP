import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Pencil, Trash2, Save } from 'lucide-react';
import { parseQty } from '@/lib/foodDatabase';
import MobileSheet from '@/components/nutrition/MobileSheet';

const NUTRIENT_FIELDS = [
  { key: 'calories_per_serving', label: 'Cal', ph: 'kcal' },
  { key: 'protein_g', label: 'Protein', ph: 'P g' },
  { key: 'carbs_g', label: 'Carbs', ph: 'C g' },
  { key: 'fat_g', label: 'Fat', ph: 'F g' },
  { key: 'fiber_g', label: 'Fiber', ph: 'F g' },
  { key: 'sugar_g', label: 'Sugar', ph: 'S g' },
  { key: 'sodium_mg', label: 'Sodium', ph: 'Na mg' },
];

function emptyForm() {
  return { name: '', calories_per_serving: '', protein_g: '', carbs_g: '', fat_g: '', fiber_g: '', sugar_g: '', sodium_mg: '' };
}

export default function MyFoodsSheet({ onClose, onChanged }) {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | existing record
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const items = await base44.entities.FoodItem.filter({ is_custom: true }, '-created_date', 200);
      setFoods(items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const startNew = () => { setForm(emptyForm()); setEditing('new'); };
  const startEdit = (f) => {
    setForm({
      name: f.name || '', calories_per_serving: f.calories_per_serving ?? '',
      protein_g: f.protein_g ?? '', carbs_g: f.carbs_g ?? '', fat_g: f.fat_g ?? '',
      fiber_g: f.fiber_g ?? '', sugar_g: f.sugar_g ?? '', sodium_mg: f.sodium_mg ?? '',
    });
    setEditing(f);
  };

  const save = async () => {
    if (!form.name.trim() || form.calories_per_serving === '') return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      serving_size: 100, serving_unit: 'g',
      calories_per_serving: parseQty(form.calories_per_serving),
      protein_g: parseQty(form.protein_g),
      carbs_g: parseQty(form.carbs_g),
      fat_g: parseQty(form.fat_g),
      fiber_g: parseQty(form.fiber_g),
      sugar_g: parseQty(form.sugar_g),
      sodium_mg: parseQty(form.sodium_mg),
      category: 'Custom',
      is_custom: true,
    };
    try {
      if (editing === 'new') {
        await base44.entities.FoodItem.create(payload);
      } else {
        await base44.entities.FoodItem.update(editing.id, payload);
      }
      setEditing(null); setForm(emptyForm()); load(); onChanged && onChanged();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    try { await base44.entities.FoodItem.delete(id); load(); onChanged && onChanged(); } catch (e) { console.error(e); }
  };

  return (
    <MobileSheet onClose={onClose}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">My Foods</h3>
          <p className="text-[11px] text-muted-foreground">Custom foods saved per 100g — appear in your search automatically.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}><X size={18} /></Button>
      </div>

      {!editing && (
        <Button className="w-full mb-3 bg-luxury-blue glow-blue min-h-[44px]" onClick={startNew}><Plus size={15} /> Create Custom Food</Button>
      )}

      {editing && (
        <Card className="mb-3 p-3 animate-scale-in">
          <p className="text-sm font-semibold mb-1">{editing === 'new' ? 'New Custom Food' : 'Edit Custom Food'}</p>
          <p className="text-[10px] text-muted-foreground mb-2">All nutrition values are per 100g. Use '.' or ',' for decimals.</p>
          <div className="space-y-2">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Food name" className="glass h-10" />
            <div className="grid grid-cols-4 gap-2">
              {NUTRIENT_FIELDS.map((n) => (
                <div key={n.key}>
                  <Label className="text-[9px] uppercase text-muted-foreground">{n.label}</Label>
                  <Input type="text" inputMode="decimal" value={form[n.key]} onChange={(e) => setForm({ ...form, [n.key]: e.target.value })} placeholder={n.ph} className="glass h-10 text-center text-xs tabular-nums" />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-luxury-blue glow-blue min-h-[40px]" onClick={save} disabled={saving || !form.name.trim() || form.calories_per_serving === ''}><Save size={14} /> {saving ? 'Saving…' : 'Save'}</Button>
              <Button size="sm" variant="outline" className="glass min-h-[40px]" onClick={() => { setEditing(null); setForm(emptyForm()); }}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {loading && <p className="text-center text-sm text-muted-foreground py-4">Loading…</p>}
        {!loading && foods.length === 0 && !editing && <p className="text-center text-sm text-muted-foreground py-4">No custom foods yet. Create one to add it to your search.</p>}
        {foods.map((f) => (
          <Card key={f.id} className="p-2.5 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" dir="auto">{f.name}</p>
              <p className="text-[11px] text-muted-foreground" dir="ltr">Per 100g · {Math.round(f.calories_per_serving || 0)} kcal · P{f.protein_g || 0} C{f.carbs_g || 0} F{f.fat_g || 0}</p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0 ml-2">
              <button onClick={() => startEdit(f)} className="text-muted-foreground hover:text-luxury-blue p-1.5 tap-min"><Pencil size={14} /></button>
              <button onClick={() => remove(f.id)} className="text-muted-foreground hover:text-luxury-red p-1.5 tap-min"><Trash2 size={14} /></button>
            </div>
          </Card>
        ))}
      </div>
    </MobileSheet>
  );
}