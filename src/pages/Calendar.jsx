import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, Pill } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2, Play, Pencil, X, Dumbbell, Copy } from 'lucide-react';
import { cn, localDateStr } from '@/lib/utils';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Calendar() {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [addMode, setAddMode] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [evs, progs] = await Promise.all([
        base44.entities.ScheduledWorkout.list('-date', 200),
        base44.entities.TrainingProgram.list('-created_date', 50),
      ]);
      setEvents(evs || []);
      setPrograms(progs || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((e) => { (map[e.date] = map[e.date] || []).push(e); });
    return map;
  }, [events]);

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dateStr = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const todayStr = localDateStr();

  const prevMonth = () => setCursor(new Date(year, month - 1, 1));
  const nextMonth = () => setCursor(new Date(year, month + 1, 1));

  const monthEvents = events.filter((e) => e.date?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`));

  const deleteEvent = (event) => {
    setEvents((e) => e.filter((x) => x.id !== event.id));
    const timer = setTimeout(() => {
      base44.entities.ScheduledWorkout.delete(event.id).catch(() => loadAll());
      setPendingDelete(null);
    }, 5000);
    setPendingDelete({ event, timer });
  };
  const undoDelete = () => {
    if (!pendingDelete) return;
    clearTimeout(pendingDelete.timer);
    setEvents((e) => [...e, pendingDelete.event]);
    setPendingDelete(null);
  };

  const createEntry = async (entry) => {
    const tempId = `tmp-${Date.now()}`;
    setEvents((e) => [...e, { ...entry, id: tempId }]);
    setAddMode(null); setSelectedDate(null);
    try {
      const created = await base44.entities.ScheduledWorkout.create(entry);
      const realId = created?.id || created?._id;
      if (realId) setEvents((e) => e.map((x) => x.id === tempId ? { ...x, id: realId } : x));
    }
    catch (e) { loadAll(); console.error(e); }
  };

  const copyWeekForward = async () => {
    if (!selectedDate) return;
    const base = new Date(selectedDate + 'T00:00:00');
    const dow = base.getDay();
    const monday = new Date(base); monday.setDate(base.getDate() - ((dow + 6) % 7));
    const weekEvents = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      const ds = localDateStr(d);
      (eventsByDate[ds] || []).forEach((e) => weekEvents.push(e));
    }
    if (!weekEvents.length) return;
    await Promise.all(weekEvents.map((e) => {
      const nd = new Date(e.date + 'T00:00:00'); nd.setDate(nd.getDate() + 7);
      return base44.entities.ScheduledWorkout.create({ date: localDateStr(nd), title: e.title, program_id: e.program_id, program_day_name: e.program_day_name, day_index: e.day_index, focus: e.focus, notes: e.notes, source: e.source, completed: false });
    }));
    loadAll();
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-36">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/train')} className="min-h-[44px]"><ArrowLeft size={18} /></Button>
          <div>
            <p className="text-xs text-muted-foreground tracking-wider uppercase">Schedule</p>
            <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          </div>
        </div>
        <Button size="sm" className="bg-luxury-blue glow-blue min-h-[44px]" onClick={() => { setSelectedDate(todayStr); setAddMode(null); }}><Plus size={16} /> Add</Button>
      </div>

      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" onClick={prevMonth} className="min-h-[40px]"><ChevronLeft size={18} /></Button>
          <p className="font-semibold">{monthName}</p>
          <Button variant="ghost" size="sm" onClick={nextMonth} className="min-h-[40px]"><ChevronRight size={18} /></Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((w, i) => <span key={i} className="text-[10px] text-muted-foreground uppercase pb-1">{w}</span>)}
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const ds = dateStr(d);
            const dayEvents = eventsByDate[ds] || [];
            return (
              <button key={i} onClick={() => { setSelectedDate(ds); setAddMode(null); }}
                className={cn('aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all relative',
                  ds === todayStr ? 'bg-luxury-blue/15 border border-luxury-blue/40' : 'hover:bg-muted/40',
                  selectedDate === ds && 'ring-1 ring-luxury-blue')}>
                <span className="font-medium">{d}</span>
                {dayEvents.length > 0 && <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-luxury-red" />}
              </button>
            );
          })}
        </div>
      </Card>

      {selectedDate && !addMode && (
        <Card className="mb-4 animate-scale-in">
          <p className="text-sm font-semibold mb-3">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" className="glass min-h-[44px]" onClick={() => setAddMode('program')}><Dumbbell size={14} /> From Program</Button>
            <Button size="sm" variant="outline" className="glass min-h-[44px]" onClick={() => setAddMode('manual')}><Pencil size={14} /> Manual</Button>
          </div>
          <Button size="sm" variant="outline" className="glass min-h-[44px] w-full mt-2" onClick={copyWeekForward}><Copy size={14} /> Copy this week → next week</Button>
          {(eventsByDate[selectedDate] || []).map((e) => (
            <div key={e.id} className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
              <div>
                <p className="text-sm font-medium">{e.title}</p>
                <p className="text-[11px] text-muted-foreground">{e.focus || ''}{e.source === 'program' ? ' · Program' : ' · Manual'}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {e.source === 'program' && e.program_id && e.day_index != null && (
                  <Button size="sm" variant="ghost" className="text-luxury-blue min-h-[40px]" onClick={() => navigate(`/workout/new?programId=${e.program_id}&dayIndex=${e.day_index}`)}><Play size={14} /></Button>
                )}
                <button onClick={() => deleteEvent(e)} className="text-muted-foreground hover:text-luxury-red p-1"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {selectedDate && addMode === 'manual' && (
        <ManualScheduler date={selectedDate} onSave={createEntry} onCancel={() => setAddMode(null)} />
      )}
      {selectedDate && addMode === 'program' && (
        <ProgramScheduler date={selectedDate} programs={programs} onSave={createEntry} onCancel={() => setAddMode(null)} />
      )}

      <div className="space-y-2 mt-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{monthName} Schedule</p>
        {monthEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center glass rounded-xl">No workouts scheduled this month</p>
        ) : monthEvents.map((e) => (
          <Card key={e.id} className="p-3 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">{e.title}</p>
              <p className="text-[11px] text-muted-foreground">{new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}{e.focus ? ` · ${e.focus}` : ''}{e.source === 'program' ? ' · Program' : ''}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {e.source === 'program' && e.program_id && e.day_index != null && (
                <Button size="sm" variant="ghost" className="text-luxury-blue min-h-[40px]" onClick={() => navigate(`/workout/new?programId=${e.program_id}&dayIndex=${e.day_index}`)}><Play size={14} /></Button>
              )}
              <button onClick={() => deleteEvent(e)} className="text-muted-foreground hover:text-luxury-red p-1"><Trash2 size={15} /></button>
            </div>
          </Card>
        ))}
      </div>
      {pendingDelete && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-full px-4 py-2.5 flex items-center gap-3 animate-fade-up">
          <span className="text-xs">Workout deleted</span>
          <button onClick={undoDelete} className="text-xs font-semibold text-luxury-blue">Undo</button>
        </div>
      )}
    </div>
  );
}

function ManualScheduler({ date, onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [focus, setFocus] = useState('');
  const [notes, setNotes] = useState('');
  return (
    <Card className="mb-4 animate-scale-in space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Manual Workout</p>
        <Button variant="ghost" size="sm" onClick={onCancel}><X size={16} /></Button>
      </div>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Workout title e.g. Push Day" className="glass h-9" />
      <Input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Focus e.g. Chest, Shoulders" className="glass h-9" />
      <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="glass h-9" />
      <Button className="w-full bg-luxury-blue glow-blue min-h-[44px]" disabled={!title.trim()} onClick={() => onSave({ date, title: title.trim(), focus, notes, source: 'manual' })}><Plus size={16} /> Schedule</Button>
    </Card>
  );
}

function ProgramScheduler({ date, programs, onSave, onCancel }) {
  const [programId, setProgramId] = useState(programs[0]?.id || '');
  const [dayIndex, setDayIndex] = useState(0);
  const selected = programs.find((p) => p.id === programId);
  const day = selected?.days?.[dayIndex];
  return (
    <Card className="mb-4 animate-scale-in space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">From Program</p>
        <Button variant="ghost" size="sm" onClick={onCancel}><X size={16} /></Button>
      </div>
      {!programs.length ? (
        <p className="text-sm text-muted-foreground">No programs yet. Create one in Train first.</p>
      ) : (
        <>
          <div className="space-y-1.5">
            {programs.map((p) => (
              <button key={p.id} onClick={() => { setProgramId(p.id); setDayIndex(0); }}
                className={cn('w-full text-left p-2.5 rounded-xl border transition-all',
                  programId === p.id ? 'border-luxury-blue bg-luxury-blue/10' : 'border-border glass')}>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">{p.goal} · {p.split}</p>
              </button>
            ))}
          </div>
          {selected?.days?.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {selected.days.map((d, i) => (
                <Pill key={i} active={dayIndex === i} onClick={() => setDayIndex(i)}>{d.day_name || `Day ${i + 1}`}</Pill>
              ))}
            </div>
          )}
          <Button className="w-full bg-luxury-blue glow-blue min-h-[44px]" disabled={!day} onClick={() => onSave({ date, title: day?.day_name || selected.name, program_id: selected.id, program_day_name: day?.day_name, day_index: dayIndex, focus: day?.focus || '', source: 'program' })}>
            <Plus size={16} /> Schedule {day?.day_name || ''}
          </Button>
        </>
      )}
    </Card>
  );
}