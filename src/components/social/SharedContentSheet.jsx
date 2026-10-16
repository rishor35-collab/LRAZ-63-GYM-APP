import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Dumbbell, Apple, Activity, Image as ImageIcon, AlertTriangle, Copy, Check } from 'lucide-react';

// Views a shared content attachment. Tries to load the original by id/type
// (respecting RLS — only loads if the receiver has access); if the original is
// missing, deleted, or private, falls back to the snapshot stored in the
// message so the receiver always sees what was shared. Offers copy-to-account
// actions where the receiver can't open the sender's original directly.
export default function SharedContentSheet({ attachment, open, onClose }) {
  const navigate = useNavigate();
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !attachment) return;
    setLive(null); setCopied(false); setLoading(true);
    (async () => {
      try {
        const { type, id } = attachment;
        let r = null;
        if (type === 'program') r = await base44.entities.TrainingProgram.get(id);
        else if (type === 'meal') r = await base44.entities.SavedMeal.get(id);
        else if (type === 'exercise') r = await base44.entities.Exercise.get(id);
        else if (type === 'workout') r = await base44.entities.WorkoutSession.get(id);
        else if (type === 'photo') r = await base44.entities.ProgressPhoto.get(id);
        setLive(r);
      } catch (e) { setLive(null); }
      finally { setLoading(false); }
    })();
  }, [open, attachment]);

  if (!attachment) return null;
  const s = attachment.snapshot || {};
  const Icon = { program: Dumbbell, meal: Apple, exercise: Dumbbell, workout: Activity, photo: ImageIcon }[attachment.type] || Dumbbell;
  const typeLabel = { program: 'Training Program', meal: 'Saved Meal', exercise: 'Exercise', workout: 'Workout', photo: 'Progress Photo' }[attachment.type] || 'Content';

  const copyProgram = async () => {
    if (!live) return;
    try {
      const { id, created_date, updated_date, created_by_id, archived, draft, active, ...rest } = live;
      await base44.entities.TrainingProgram.create({ ...rest, name: `${live.name} (Copy)`, active: false, draft: false });
      setCopied(true);
    } catch (e) { console.error(e); }
  };
  const copyMeal = async () => {
    if (!live) return;
    try {
      const { id, created_date, updated_date, created_by_id, ...rest } = live;
      await base44.entities.SavedMeal.create({ ...rest, name: `${live.name} (Copy)` });
      setCopied(true);
    } catch (e) { console.error(e); }
  };
  const copyExercise = async () => {
    if (!live) return;
    try {
      const { id, created_date, updated_date, created_by_id, ...rest } = live;
      await base44.entities.Exercise.create({ ...rest, name: `${live.name} (Copy)`, is_custom: true });
      setCopied(true);
    } catch (e) { console.error(e); }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Icon size={16} /> Shared {typeLabel}</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6 space-y-3">
          <div className="glass rounded-xl p-3">
            <p className="font-semibold">{attachment.name}</p>
            {attachment.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{attachment.subtitle}</p>}
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-4 text-sm">Loading…</p>
          ) : !live ? (
            <div className="glass rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle size={16} className="text-luxury-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Original no longer available</p>
                <p className="text-[11px] text-muted-foreground">This content may have been deleted or is private. Showing the shared snapshot instead.</p>
              </div>
            </div>
          ) : null}

          {attachment.type === 'program' && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Goal" value={s.goal || live?.goal || '—'} />
                <Stat label="Split" value={s.split || live?.split || '—'} />
                <Stat label="Days/wk" value={s.days_per_week ?? live?.days_per_week ?? '—'} />
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mt-2">Days</p>
              {(s.days || live?.days || []).map((d, i) => (
                <div key={i} className="glass rounded-xl p-3">
                  <p className="text-sm font-medium">{d.day_name || `Day ${i + 1}`}</p>
                  <p className="text-[11px] text-muted-foreground">{d.focus || ''} · {d.exercises ?? (d.exercises || []).length ?? 0} exercises</p>
                </div>
              ))}
              {live ? (
                <Button className="w-full bg-luxury-blue min-h-[44px]" onClick={() => { onClose(); navigate(`/program/${live.id}`); }}>Open Program</Button>
              ) : (
                <Button className="w-full bg-luxury-blue min-h-[44px]" onClick={copyProgram} disabled={copied}>
                  {copied ? <><Check size={16} /> Copied to my programs</> : <><Copy size={16} /> Copy to my programs</>}
                </Button>
              )}
            </div>
          )}

          {attachment.type === 'meal' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-center">
                <Stat label="Calories" value={`${s.total_calories ?? live?.total_calories ?? 0}`} />
                <Stat label="Protein" value={`${s.total_protein_g ?? live?.total_protein_g ?? 0}g`} />
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mt-2">Items</p>
              {(s.items || live?.items || []).map((it, i) => (
                <div key={i} className="glass rounded-xl p-3 flex justify-between">
                  <div><p className="text-sm font-medium">{it.food_name}</p><p className="text-[11px] text-muted-foreground">{it.quantity} {it.unit || ''}</p></div>
                  <p className="text-sm tabular-nums">{it.calories || 0} kcal</p>
                </div>
              ))}
              {live && (
                <Button className="w-full bg-luxury-blue min-h-[44px]" onClick={copyMeal} disabled={copied}>
                  {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy to my meals</>}
                </Button>
              )}
            </div>
          )}

          {attachment.type === 'exercise' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-center">
                <Stat label="Muscle" value={s.primary_muscle || live?.primary_muscle || '—'} />
                <Stat label="Category" value={s.category || live?.category || '—'} />
              </div>
              {(s.instructions || live?.instructions) && <p className="text-sm text-muted-foreground">{s.instructions || live.instructions}</p>}
              {(s.coaching_cues || live?.coaching_cues)?.length ? (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Cues</p>
                  <ul className="text-sm space-y-1">{(s.coaching_cues || live.coaching_cues).map((c, i) => <li key={i}>• {c}</li>)}</ul>
                </div>
              ) : null}
              {live && (
                <Button className="w-full bg-luxury-blue min-h-[44px]" onClick={copyExercise} disabled={copied}>
                  {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Add to my exercises</>}
                </Button>
              )}
            </div>
          )}

          {attachment.type === 'workout' && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Date" value={live ? new Date(live.date).toLocaleDateString() : new Date(s.date).toLocaleDateString()} />
                <Stat label="Volume" value={`${Math.round(s.total_volume_kg ?? live?.total_volume_kg ?? 0)}kg`} />
                <Stat label="Duration" value={`${s.duration_minutes ?? live?.duration_minutes ?? 0}m`} />
              </div>
              <p className="text-xs text-muted-foreground">Workouts are view-only summaries of a completed session.</p>
            </div>
          )}

          {attachment.type === 'photo' && (
            (s.photo_url || live?.photo_url) ? (
              <img src={s.photo_url || live.photo_url} alt="" className="w-full rounded-xl object-cover max-h-[50vh]" />
            ) : <p className="text-sm text-muted-foreground">Photo unavailable.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value }) {
  return (
    <div className="glass rounded-xl py-2">
      <p className="text-sm font-bold truncate">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}