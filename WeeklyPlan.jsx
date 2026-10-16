import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, EmptyState } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, X, Check, Calendar, Dumbbell, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn, localDateStr } from '@/lib/utils';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dateStr = (d) => localDateStr(d);

export default function WeeklyPlan() {
  const navigate = useNavigate();
  const [week, setWeek] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingFor, setAddingFor] = useState(null); // date string

  const load = async () => {
    try {
      const [progs, sched] = await Promise.all([
        base44.entities.TrainingProgram.list('-created_date', 50),
        base44.entities.ScheduledWorkout.list('-date', 100),
      ]);
      setScheduled(sched || []);
      setProgram((progs || []).find((p) => p.active && !p.archived) || null);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
    setWeek(days);
  }, []);

  const byDate = useMemo(() => {
    const m = {};
    (scheduled || []).forEach((s) => { (m[s.date] = m[s.date] || []).push(s); });
    return m;
  }, [scheduled]);

  const toggleDone = async (s) => {
    try {
      const updated = await base44.entities.ScheduledWorkout.update(s.id, { completed: !s.completed });
      setScheduled((p) => p.map((x) => (x.id === s.id ? updated : x)));
    } catch (e) { console.error(e); }
  };

  const remove = async (s) => {
    try { await base44.entities.ScheduledWorkout.delete(s.id); setScheduled((p) => p.filter((x) => x.id !== s.id)); } catch (e) { console.error(e); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-7 h-7 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen safe-pt px-4 pb-36 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"><ArrowLeft size={22} /></button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">This Week</h1>
            <p className="text-[11px] text-muted-foreground">Plan your next 7 days</p>
          </div>
        </div>
      </div>

      {program && <Card className="mb-3 border-luxury-blue/20 bg-luxury-blue/5"><p className="text-[11px] text-muted-foreground">Active Program</p><p className="text-sm font-semibold">{program.name}</p></Card>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {week.map((d) => {
          const ds = dateStr(d);
          const items = byDate[ds] || [];
          const isToday = ds === dateStr(new Date());
          return (
            <div key={ds}>
              <div className="flex items-center justify-between mb-1.5 px-1">
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs font-bold uppercase w-9 text-center py-1 rounded-lg', isToday ? 'bg-luxury-blue text-white' : 'glass text-muted-foreground')}>{dayNames[d.getDay()]}</span>
                  <span className="text-sm font-medium">{d.toLocaleDateString('en', { month: 'short', day: 'numeric' })}{isToday && <span className="text-[10px] text-luxury-blue ml-1">Today</span>}</span>
                </div>
                <button onClick={() => setAddingFor(ds)} className="text-muted-foreground hover:text-luxury-blue min-h-[36px] min-w-[36px] flex items-center justify-center"><Plus size={18} /></button>
              </div>
              {items.length === 0 ? (
                <button onClick={() => setAddingFor(ds)} className="w-full glass rounded-xl py-3 text-xs text-muted-foreground hover:text-foreground min-h-[44px]">+ Schedule a workout</button>
              ) : (
                <div className="space-y-1.5">
                  {items.map((s) => (
                    <Card key={s.id} className="flex items-center gap-2.5 py-2.5">
                      <button onClick={() => toggleDone(s)} className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0 min-h-[36px]', s.completed ? 'bg-luxury-blue text-white' : 'glass border border-border text-muted-foreground')}><Check size={16} strokeWidth={s.completed ? 3 : 2} /></button>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-semibold truncate', s.completed && 'line-through text-muted-foreground')}>{s.title}</p>
                        {s.focus && <p className="text-[11px] text-muted-foreground">{s.focus}</p>}
                      </div>
                      <button onClick={() => remove(s)} className="text-muted-foreground hover:text-luxury-red min-h-[36px] min-w-[32px] flex items-center justify-center"><X size={14} /></button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {addingFor && <AddSheet date={addingFor} program={program} onClose={() => setAddingFor(null)} onSaved={() => { setAddingFor(null); load(); }} />}
    </div>
  );
}

function AddSheet({ date, program, onClose, onSaved }) {
  const [title, setTitle] = useState('');
  const [focus, setFocus] = useState('');
  const [dayIdx, setDayIdx] = useState(-1);
  const [saving, setSaving] = useState(false);

  const pickProgramDay = (idx) => {
    setDayIdx(idx);
    const day = program?.days?.[idx];
    if (day) { setTitle(day.day_name || `${program.name} — Day ${idx + 1}`); setFocus(day.focus || ''); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { date, title: title || 'Workout', focus, completed: false, source: dayIdx >= 0 ? 'program' : 'manual' };
      if (dayIdx >= 0 && program) { payload.program_id = program.id; payload.day_index = dayIdx; payload.program_day_name = program.days[dayIdx]?.day_name; }
      await base44.entities.ScheduledWorkout.create(payload);
      onSaved();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong rounded-t-3xl p-5 animate-fade-up safe-pb max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Schedule for {new Date(date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="min-h-[44px] min-w-[44px] p-2"><X size={18} /></Button>
        </div>

        {program?.days?.length > 0 && (
          <div className="mb-4">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">From {program.name}</Label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {program.days.map((d, i) => (
                <button key={i} onClick={() => pickProgramDay(i)} className={cn('px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap min-h-[40px]', dayIdx === i ? 'bg-luxury-blue text-white' : 'glass text-muted-foreground')}>{d.day_name || `Day ${i + 1}`}</button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-col gap-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Push Day" /></div>
          <div className="flex flex-col gap-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Focus (optional)</Label><Input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. Chest, Shoulders, Triceps" /></div>
        </div>
        <Button onClick={save} disabled={saving || !title} className="w-full mt-4 bg-luxury-blue glow-blue min-h-[44px]">{saving ? 'Saving…' : <><Calendar size={16} /> Schedule</>}</Button>
      </div>
    </div>
  );
}