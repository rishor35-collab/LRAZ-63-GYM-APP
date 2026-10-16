import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, EmptyState } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ListChecks, Plus, X, Check, Trash2, Flame } from 'lucide-react';
import { cn, localDateStr } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { getHabitFeedback } from '@/lib/feedbackMessages';

const todayStr = () => localDateStr();

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    try {
      const [h, l] = await Promise.all([
        base44.entities.Habit.list('-created_date', 100),
        base44.entities.HabitLog.list('-date', 120),
      ]);
      setHabits(h || []);
      setLogs(l || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const logsByHabit = useMemo(() => {
    const m = {};
    (logs || []).forEach((log) => {
      if (!m[log.habit_id]) m[log.habit_id] = new Set();
      m[log.habit_id].add(log.date);
    });
    return m;
  }, [logs]);

  const streakFor = (habitId) => {
    const set = logsByHabit[habitId];
    if (!set) return 0;
    let streak = 0;
    const d = new Date();
    // if today not done, start from yesterday so streak isn't broken mid-day
    if (!set.has(localDateStr(d))) d.setDate(d.getDate() - 1);
    while (set.has(localDateStr(d))) { streak++; d.setDate(d.getDate() - 1); }
    return streak;
  };

  const toggle = async (habit) => {
    const today = todayStr();
    const done = logsByHabit[habit.id]?.has(today);
    try {
      if (done) {
        const log = logs.find((l) => l.habit_id === habit.id && l.date === today);
        if (log) { await base44.entities.HabitLog.delete(log.id); setLogs((p) => p.filter((l) => l.id !== log.id)); }
      } else {
        const created = await base44.entities.HabitLog.create({ habit_id: habit.id, date: today, completed: true, created_at: new Date().toISOString() });
        setLogs((p) => [created, ...p]);
        const newStreak = (() => { const set = new Set(logsByHabit[habit.id] || []); set.add(today); let s = 0; const d = new Date(); while (set.has(localDateStr(d))) { s++; d.setDate(d.getDate() - 1); } return s; })();
        const fb = getHabitFeedback({ streak: newStreak, habitName: habit.name });
        if (fb) toast({ title: fb.title, description: fb.message });
      }
    } catch (e) { console.error(e); }
  };

  const remove = async (habit) => {
    try {
      await base44.entities.HabitLog.deleteMany({ habit_id: habit.id });
      await base44.entities.Habit.delete(habit.id);
      setHabits((p) => p.filter((h) => h.id !== habit.id));
    } catch (e) { console.error(e); }
  };

  const completedToday = habits.filter((h) => logsByHabit[h.id]?.has(todayStr())).length;

  if (loading) return <div className="flex justify-center py-20"><div className="w-7 h-7 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen safe-pt px-4 pb-36 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Habits</h1>
          <p className="text-sm text-muted-foreground">{completedToday}/{habits.length} done today</p>
        </div>
        <Button size="sm" className="bg-luxury-blue glow-blue min-h-[40px]" onClick={() => setAdding(true)}><Plus size={16} /> New</Button>
      </div>

      {!habits.length ? (
        <EmptyState icon={ListChecks} title="No habits yet" description="Build daily consistency — add water intake, sleep, mobility, or any habit to track streaks." action={<Button className="bg-luxury-blue glow-blue min-h-[44px] mt-2" onClick={() => setAdding(true)}><Plus size={16} /> Add First Habit</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {habits.map((h) => {
            const done = logsByHabit[h.id]?.has(todayStr());
            const streak = streakFor(h.id);
            return (
              <Card key={h.id} className="flex items-center gap-3">
                <button onClick={() => toggle(h)} className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all min-h-[44px]',
                  done ? 'bg-luxury-blue text-white glow-blue' : 'glass text-muted-foreground border border-border'
                )}>
                  <Check size={22} strokeWidth={done ? 3 : 2} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{h.name}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">{h.description || `${h.target_per_day}× / ${h.frequency}`}{streak > 0 && <><Flame size={11} className="text-luxury-red" /> {streak} day streak</>}</p>
                </div>
                <button onClick={() => remove(h)} className="text-muted-foreground hover:text-luxury-red min-h-[44px] min-w-[40px] flex items-center justify-center"><Trash2 size={15} /></button>
              </Card>
            );
          })}
        </div>
      )}

      {adding && <AddHabitSheet onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}
    </div>
  );
}

function AddHabitSheet({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', description: '', target_per_day: 1, frequency: 'daily' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.Habit.create({ ...form, target_per_day: Number(form.target_per_day) || 1, created_at: new Date().toISOString() });
      onSaved();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong rounded-t-3xl p-5 animate-fade-up safe-pb">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">New Habit</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="min-h-[44px] min-w-[44px] p-2"><X size={18} /></Button>
        </div>
        <div className="space-y-3">
          <Field label="Name"><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Drink 3L Water" /></Field>
          <Field label="Description (optional)"><Input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="e.g. Morning and evening" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target / day"><Input type="number" value={form.target_per_day} onChange={(e) => set('target_per_day', e.target.value)} /></Field>
            <Field label="Frequency">
              <div className="flex gap-2">
                {['daily', 'weekly'].map((f) => (
                  <button key={f} onClick={() => set('frequency', f)} className={cn('flex-1 min-h-[44px] rounded-lg text-xs font-medium capitalize', form.frequency === f ? 'bg-luxury-blue text-white' : 'glass text-muted-foreground')}>{f}</button>
                ))}
              </div>
            </Field>
          </div>
        </div>
        <Button onClick={save} disabled={saving || !form.name} className="w-full mt-4 bg-luxury-blue glow-blue min-h-[44px]">{saving ? 'Saving…' : <><Check size={16} /> Add Habit</>}</Button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div className="flex flex-col gap-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>{children}</div>;
}