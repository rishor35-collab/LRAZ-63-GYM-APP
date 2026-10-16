import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dumbbell, Apple, Activity, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'program', label: 'Programs', icon: Dumbbell },
  { id: 'meal', label: 'Meals', icon: Apple },
  { id: 'exercise', label: 'Exercises', icon: Dumbbell },
  { id: 'workout', label: 'Workouts', icon: Activity },
  { id: 'photo', label: 'Photos', icon: ImageIcon },
];

export default function ShareContentSheet({ open, onClose, onShare }) {
  const [tab, setTab] = useState('program');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      let list = [];
      try {
        if (tab === 'program') list = await base44.entities.TrainingProgram.list('-created_date', 50);
        else if (tab === 'meal') list = await base44.entities.SavedMeal.list('-created_date', 50);
        else if (tab === 'exercise') list = await base44.entities.Exercise.list('name', 50);
        else if (tab === 'workout') list = await base44.entities.WorkoutSession.list('-date', 50);
        else if (tab === 'photo') list = await base44.entities.ProgressPhoto.list('-date', 30);
      } catch (e) { console.error(e); }
      setItems(list || []);
      setLoading(false);
    })();
  }, [open, tab]);

  if (!open) return null;

  const pick = (item) => {
    let att;
    if (tab === 'program') att = { type: 'program', id: item.id, name: item.name, subtitle: [item.goal, item.split].filter(Boolean).join(' · '), snapshot: { goal: item.goal, split: item.split, days_per_week: item.days_per_week, duration_weeks: item.duration_weeks, days: (item.days || []).map((d) => ({ day_name: d.day_name, focus: d.focus, exercises: (d.exercises || []).length })) } };
    else if (tab === 'meal') att = { type: 'meal', id: item.id, name: item.name, subtitle: `${item.total_calories || 0} kcal`, snapshot: { total_calories: item.total_calories, total_protein_g: item.total_protein_g, items: (item.items || []).map((i) => ({ food_name: i.food_name, quantity: i.quantity, unit: i.unit, calories: i.calories, protein_g: i.protein_g })) } };
    else if (tab === 'exercise') att = { type: 'exercise', id: item.id, name: item.name, subtitle: item.primary_muscle || item.category || '', snapshot: { primary_muscle: item.primary_muscle, category: item.category, equipment: item.equipment, instructions: item.instructions, coaching_cues: item.coaching_cues } };
    else if (tab === 'workout') att = { type: 'workout', id: item.id, name: item.name, subtitle: new Date(item.date).toLocaleDateString(), snapshot: { date: item.date, focus: item.focus, total_volume_kg: item.total_volume_kg, duration_minutes: item.duration_minutes, status: item.status } };
    else if (tab === 'photo') att = { type: 'photo', id: item.id, name: `${item.view || 'Front'} ${item.pose || ''}`.trim(), subtitle: new Date(item.date).toLocaleDateString(), image_url: item.photo_url, snapshot: { view: item.view, pose: item.pose, photo_url: item.photo_url, date: item.date } };
    onShare(att);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md glass-strong rounded-t-3xl border-t border-border max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <p className="font-semibold">Share content</p>
          <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground"><X size={20} /></button>
        </div>
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto no-scrollbar shrink-0">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn('px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap min-h-[40px] flex items-center gap-1', tab === t.id ? 'bg-luxury-blue text-white' : 'glass text-muted-foreground')}>
                <Icon size={13} /> {t.label}
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
          {loading ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Nothing to share here yet.</p>
          ) : items.map((item) => (
            <button key={item.id} onClick={() => pick(item)} className="w-full glass rounded-xl p-3 flex items-center gap-3 text-left active:scale-[0.99]">
              {item.photo_url ? (
                <img src={item.photo_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-luxury-blue/15 text-luxury-blue flex items-center justify-center shrink-0"><Dumbbell size={16} /></div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{item.name || (tab === 'photo' ? `${item.view || 'Front'} ${item.pose || ''}`.trim() : 'Untitled')}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {tab === 'meal' ? `${item.total_calories || 0} kcal` : tab === 'workout' ? new Date(item.date).toLocaleDateString() : tab === 'photo' ? new Date(item.date).toLocaleDateString() : [item.goal, item.split, item.primary_muscle].filter(Boolean).join(' · ')}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}