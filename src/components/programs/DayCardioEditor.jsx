import React from 'react';
import { Input } from '@/components/ui/input';
import { Activity, Plus, Trash2 } from 'lucide-react';
import { ACTIVITIES } from '@/lib/cardioAnalytics';
import { ActionSelect } from '@/components/ui/action-select';

// Editor for planned cardio blocks attached to a training day. Reuses the same
// activity catalog as the standalone Cardio Session feature.
export default function DayCardioEditor({ day, onChange }) {
  const cardio = day.cardio || [];

  const addCardio = () => {
    const a = ACTIVITIES[0];
    onChange({ ...day, cardio: [...cardio, { activity: a.id, activity_label: a.label, target_duration_minutes: 10, target_distance_km: '', target_calories: '', intensity: '', notes: '' }] });
  };
  const updateCardio = (i, field, value) => onChange({ ...day, cardio: cardio.map((c, j) => (j === i ? { ...c, [field]: value } : c)) });
  const removeCardio = (i) => onChange({ ...day, cardio: cardio.filter((_, j) => j !== i) });
  const pickActivity = (i, label) => {
    const a = ACTIVITIES.find((x) => x.label === label) || ACTIVITIES[0];
    updateCardio(i, 'activity', a.id);
    updateCardio(i, 'activity_label', a.label);
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Activity size={12} className="text-luxury-red" /> Cardio</p>
        <button onClick={addCardio} className="text-[11px] text-luxury-blue flex items-center gap-1 min-h-[36px]"><Plus size={13} /> Add</button>
      </div>
      <div className="space-y-2">
        {cardio.map((c, i) => (
          <div key={i} className="rounded-xl glass p-2.5">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={13} className="text-luxury-red shrink-0" />
              <div className="flex-1 min-w-0">
                <ActionSelect value={c.activity_label} options={ACTIVITIES.map((a) => a.label)} onChange={(v) => pickActivity(i, v)} />
              </div>
              <button onClick={() => removeCardio(i)} className="text-muted-foreground hover:text-luxury-red min-h-[40px] min-w-[36px] flex items-center justify-center"><Trash2 size={13} /></button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Target min</span>
                <Input type="number" inputMode="numeric" value={c.target_duration_minutes ?? ''} onChange={(e) => updateCardio(i, 'target_duration_minutes', Number(e.target.value) || 0)} className="glass h-10 text-xs text-center tabular-nums" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Target km</span>
                <Input type="number" inputMode="decimal" value={c.target_distance_km ?? ''} onChange={(e) => updateCardio(i, 'target_distance_km', e.target.value)} className="glass h-10 text-xs text-center tabular-nums" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Calories</span>
                <Input type="number" inputMode="numeric" value={c.target_calories ?? ''} onChange={(e) => updateCardio(i, 'target_calories', e.target.value ? Number(e.target.value) : '')} placeholder="kcal" className="glass h-10 text-xs text-center tabular-nums" />
              </div>
            </div>
            <Input value={c.intensity || ''} onChange={(e) => updateCardio(i, 'intensity', e.target.value)} placeholder="Intensity / HR zone (optional)" className="glass h-8 text-xs mt-2 mb-1" />
            <Input value={c.notes || ''} onChange={(e) => updateCardio(i, 'notes', e.target.value)} placeholder="Notes (tempo, cues…)" className="glass h-8 text-xs" />
          </div>
        ))}
      </div>
    </div>
  );
}