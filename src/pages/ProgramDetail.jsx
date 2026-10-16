import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, EmptyState } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Dumbbell, Play, Trash2, Pencil, Copy, Archive, ArchiveRestore, Check, X, Plus, ChevronUp, ChevronDown, Bookmark, Activity } from 'lucide-react';
import ExerciseVideo from '@/components/exercises/ExerciseVideo';
import DayEditor from '@/components/programs/DayEditor';
import ProgramProgress from '@/components/programs/ProgramProgress';
import { recordsChanged } from '@/lib/recordEditing';
import { useAuth } from '@/lib/AuthContext';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export default function ProgramDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    base44.entities.TrainingProgram.get(id)
      .then(setProgram).catch(() => setProgram(null)).finally(() => setLoading(false));
  }, [id]);

  const startEdit = () => { setDraft(JSON.parse(JSON.stringify(program))); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setDraft(null); };

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.TrainingProgram.update(id, { name: draft.name, description: draft.description, days: draft.days });
      recordsChanged('TrainingProgram');
      setProgram({ ...program, name: draft.name, description: draft.description, days: draft.days });
      setEditing(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  // Day management
  const updateDay = (i, day) => setDraft({ ...draft, days: draft.days.map((d, j) => j === i ? day : d) });
  const addDay = () => setDraft({ ...draft, days: [...(draft.days || []), { day_name: `Day ${(draft.days?.length || 0) + 1}`, focus: '', exercises: [] }] });
  const removeDay = (i) => setDraft({ ...draft, days: draft.days.filter((_, j) => j !== i) });
  const moveDay = (i, dir) => {
    const arr = [...draft.days]; const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setDraft({ ...draft, days: arr });
  };
  const duplicateDay = (i) => {
    const arr = [...draft.days];
    const copy = JSON.parse(JSON.stringify(arr[i])); copy.day_name = `${arr[i].day_name} Copy`;
    arr.splice(i + 1, 0, copy);
    setDraft({ ...draft, days: arr });
  };

  // Program actions
  const duplicate = async () => {
    setBusy(true);
    try {
      const { id: _omit, created_date: _c, updated_date: _u, created_by_id: _cb, ...rest } = program;
      await base44.entities.TrainingProgram.create({ ...rest, name: `${program.name} Copy`, active: false, archived: false, draft: false, start_date: undefined });
      recordsChanged('TrainingProgram');
      navigate('/train');
    } catch (e) { console.error(e); } finally { setBusy(false); }
  };
  const saveAsTemplate = async () => {
    setBusy(true);
    try {
      const { id: _omit, created_date: _c, updated_date: _u, created_by_id: _cb, ...rest } = program;
      await base44.entities.TrainingProgram.create({ ...rest, name: `Template: ${program.name}`, is_template: true, active: false, archived: false, draft: false, start_date: undefined });
      recordsChanged('TrainingProgram');
    } catch (e) { console.error(e); } finally { setBusy(false); }
  };
  const toggleArchive = async () => {
    setBusy(true);
    try {
      const archived = !program.archived;
      await base44.entities.TrainingProgram.update(id, { archived, active: archived ? false : program.active });
      recordsChanged('TrainingProgram');
      setProgram({ ...program, archived, active: archived ? false : program.active });
    } catch (e) { console.error(e); } finally { setBusy(false); }
  };
  const activate = async () => {
    setBusy(true);
    try {
      let result;
      do {
        result = await base44.entities.TrainingProgram.updateMany({ created_by_id: user.id, id: { $ne: id }, active: true }, { $set: { active: false } });
      } while (result.has_more);
      await base44.entities.TrainingProgram.update(id, { active: true, archived: false, draft: false });
      recordsChanged('TrainingProgram');
      setProgram({ ...program, active: true, archived: false, draft: false });
    } catch (e) { console.error(e); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try { await base44.entities.TrainingProgram.delete(id); recordsChanged('TrainingProgram'); navigate('/train'); }
    catch (e) { console.error(e); } finally { setBusy(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>;

  if (!program) return (
    <div className="max-w-md mx-auto px-4 pt-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/train')} className="min-h-[44px] mb-4"><ArrowLeft size={18} /> Train</Button>
      <EmptyState icon={Dumbbell} title="Program not found" description="This program may have been deleted." action={<Button className="bg-luxury-blue glow-blue mt-4 min-h-[44px]" onClick={() => navigate('/train')}>Back to Train</Button>} />
    </div>
  );

  const p = editing ? draft : program;

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-36">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <Button variant="ghost" size="sm" onClick={() => navigate('/train')} className="min-h-[44px]"><ArrowLeft size={18} /> Train</Button>
        {!editing && (
          <div className="flex flex-wrap gap-1">
            <Button variant="ghost" size="sm" onClick={startEdit} className="min-h-[44px] min-w-[44px] p-2"><Pencil size={16} /></Button>
            <Button variant="ghost" size="sm" onClick={duplicate} disabled={busy} className="min-h-[44px] min-w-[44px] p-2"><Copy size={16} /></Button>
            <Button variant="ghost" size="sm" onClick={saveAsTemplate} disabled={busy} className="min-h-[44px] min-w-[44px] p-2" title="Save as template"><Bookmark size={16} /></Button>
            <Button variant="ghost" size="sm" onClick={toggleArchive} disabled={busy} className="min-h-[44px] min-w-[44px] p-2">{program.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-luxury-red min-h-[44px] min-w-[44px] p-2"><Trash2 size={16} /></Button></AlertDialogTrigger>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete program?</AlertDialogTitle>
                  <AlertDialogDescription>This removes the program. Completed workouts keep their original values and are not affected.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-luxury-red text-white hover:bg-luxury-red/90 min-h-[44px]" disabled={busy} onClick={(e) => { e.preventDefault(); remove(); }}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Header card */}
      <Card className="luxury-gradient border border-luxury-blue/30 mb-4">
        {editing ? (
          <>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="glass h-10 text-base font-bold mb-2" />
            <Input value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Description" className="glass h-10 text-xs mb-2" />
          </>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/60 tracking-wider uppercase">Program</p>
                <h1 className="text-xl font-bold text-white">{program.name}</h1>
              </div>
              <div className="flex gap-1">
                {program.active && <span className="text-[9px] font-bold bg-luxury-blue text-white rounded-full px-2 py-0.5">ACTIVE</span>}
                {program.archived && <span className="text-[9px] font-bold bg-muted text-muted-foreground rounded-full px-2 py-0.5">ARCHIVED</span>}
              </div>
            </div>
            {program.description && <p className="text-xs text-white/70 mt-2 leading-relaxed">{program.description}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {[program.goal, program.split, `${program.days_per_week}d/wk`, `${program.duration_weeks}w`, program.experience_level, program.phase].filter(Boolean).map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white">{t}</span>
              ))}
            </div>
          </>
        )}
      </Card>

      {!editing && !program.archived && (
        <Button className="w-full bg-luxury-blue glow-blue min-h-[44px] mb-4" onClick={() => navigate(program.days?.length ? `/workout/new?programId=${program.id}&dayIndex=0` : '/workout/new')}>
          <Play size={16} /> Start Workout
        </Button>
      )}

      {!editing && !program.active && !program.archived && (
        <Button variant="outline" className="w-full glass min-h-[44px] mb-4" onClick={activate} disabled={busy}><Check size={16} /> Set as Active Program</Button>
      )}

      {!editing && <ProgramProgress program={program} />}

      {/* Days */}
      {editing ? (
        <>
          <div className="space-y-3">
            {(draft.days || []).map((d, i) => (
              <div key={i}>
                <div className="flex items-center gap-1 mb-1.5 px-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex-1">Day {i + 1}</span>
                  <button onClick={() => moveDay(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 min-h-[40px] min-w-[36px] flex items-center justify-center"><ChevronUp size={14} /></button>
                  <button onClick={() => moveDay(i, 1)} disabled={i === (draft.days.length - 1)} className="text-muted-foreground hover:text-foreground disabled:opacity-30 min-h-[40px] min-w-[36px] flex items-center justify-center"><ChevronDown size={14} /></button>
                  <button onClick={() => duplicateDay(i)} className="text-muted-foreground hover:text-luxury-blue min-h-[40px] min-w-[36px] flex items-center justify-center"><Copy size={13} /></button>
                </div>
                <DayEditor day={d} onChange={(day) => updateDay(i, day)} onRemove={draft.days.length > 1 ? () => removeDay(i) : null} index={i} />
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full glass border-dashed min-h-[44px] mt-3 mb-4" onClick={addDay}><Plus size={15} /> Add Day</Button>
          <div className="flex gap-2 sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-4 bg-background py-2">
            <Button variant="outline" className="flex-1 glass min-h-[44px]" onClick={cancelEdit}><X size={16} /> Cancel</Button>
            <Button className="flex-1 bg-luxury-blue glow-blue min-h-[44px]" onClick={save} disabled={saving}>{saving ? 'Saving…' : <><Check size={16} /> Save</>}</Button>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(program.days || []).map((d, i) => (
            <Card key={i}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold">{d.day_name}</p>
                  {d.focus && <p className="text-[11px] text-muted-foreground">{d.focus}</p>}
                </div>
                <Button size="sm" className="bg-luxury-blue glow-blue min-h-[36px]" onClick={() => navigate(`/workout/new?programId=${program.id}&dayIndex=${i}`)}><Play size={13} /> Start</Button>
              </div>
              <div className="space-y-0">
                {(d.exercises || []).map((ex, j) => (
                  <div key={j} className="flex items-center gap-2.5 text-xs py-2 border-t border-border/40 first:border-t-0">
                    <ExerciseVideo name={ex.exercise_name} compact />
                    <span className="font-medium flex-1">{ex.exercise_name}{ex.optional && <span className="text-[9px] text-muted-foreground ml-1">(opt)</span>}</span>
                    <span className="text-muted-foreground tabular-nums whitespace-nowrap">{ex.sets}×{ex.reps_low}-{ex.reps_high}{ex.rir_target != null ? ` @${ex.rir_target}RIR` : ''}</span>
                  </div>
                ))}
                {!d.exercises?.length && <p className="text-xs text-muted-foreground py-2">No exercises defined</p>}
                {d.cardio?.length > 0 && (
                  <div className="pt-2 mt-1 border-t border-border/40">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><Activity size={11} className="text-luxury-red" /> Cardio</p>
                    {d.cardio.map((c, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs py-1">
                        <span className="font-medium flex-1">{c.activity_label}</span>
                        <span className="text-muted-foreground tabular-nums whitespace-nowrap">{c.target_duration_minutes ? `${c.target_duration_minutes}min` : ''}{c.target_distance_km ? ` · ${c.target_distance_km}km` : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
          {!program.days?.length && <EmptyState icon={Dumbbell} title="No training days" description="Tap the edit icon to add days and exercises." />}
        </div>
      )}
    </div>
  );
}