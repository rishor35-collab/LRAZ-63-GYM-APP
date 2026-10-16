import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Dumbbell, Pencil, X, Star, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAllExercises, MUSCLE_GROUPS, EQUIPMENT_OPTIONS } from '@/lib/exerciseDatabase';

// Pick an exercise from the shared 500+ library OR enter a custom name manually.
// Uses the SAME exercise source as Search, WorkoutLogger, SubstitutionSheet, etc.
export default function ExercisePicker({ onPick }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customName, setCustomName] = useState('');
  const [mode, setMode] = useState('library');
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [equipFilter, setEquipFilter] = useState('All');
  const [favs, setFavs] = useState({});

  // Load shared library + favorites when the picker opens
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    getAllExercises().then((all) => { if (active) { setExercises(all); setLoading(false); } });
    base44.entities.Favorite.list('-created_date', 500).then((f) => {
      if (!active) return;
      const m = {};
      (f || []).forEach((x) => { if (x.type === 'exercise') m[x.ref_id] = x; });
      setFavs(m);
    }).catch(() => {});
    return () => { active = false; };
  }, [open]);

  // Hide the floating coach button while the picker is open
  useEffect(() => {
    if (open) {
      document.body.classList.add('exercise-picker-open');
      return () => document.body.classList.remove('exercise-picker-open');
    }
  }, [open]);

  const toggleFav = async (ex) => {
    const key = ex.slug || ex.id;
    if (favs[key]) {
      try { await base44.entities.Favorite.delete(favs[key].id); setFavs((p) => { const n = { ...p }; delete n[key]; return n; }); } catch (e) {}
    } else {
      try {
        const created = await base44.entities.Favorite.create({ type: 'exercise', ref_id: key, name: ex.name, subtitle: ex.primary_muscle, created_at: new Date().toISOString() });
        setFavs((p) => ({ ...p, [key]: created }));
      } catch (e) {}
    }
  };

  const filtered = useMemo(() => {
    let list = exercises;
    if (muscleFilter !== 'All') list = list.filter((e) => e.muscle_group === muscleFilter || e.primary_muscle === muscleFilter);
    if (equipFilter !== 'All') list = list.filter((e) => (e.equipment || []).includes(equipFilter));
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((e) => `${e.name} ${e.primary_muscle} ${e.muscle_group} ${(e.equipment || []).join(' ')}`.toLowerCase().includes(q));
    }
    return list.slice(0, 200);
  }, [exercises, query, muscleFilter, equipFilter]);

  const favList = useMemo(() => exercises.filter((e) => favs[e.slug || e.id]).slice(0, 100), [exercises, favs]);

  const pickLibrary = (ex) => {
    onPick({ name: ex.name });
    setOpen(false); setQuery(''); setMuscleFilter('All'); setEquipFilter('All');
  };

  const pickCustom = () => {
    if (!customName.trim()) return;
    onPick({ name: customName.trim() });
    setCustomName(''); setOpen(false);
  };

  if (!open) {
    return (
      <Button variant="ghost" size="sm" className="w-full mt-2 text-xs glass" onClick={() => setOpen(true)}>
        <Plus size={13} /> Add Exercise
      </Button>
    );
  }

  return (
    <div
      className="exercise-picker-screen fixed inset-0 z-[100] bg-background flex flex-col h-[100dvh] !pb-0 md:z-50 md:h-auto md:flex-row md:items-end md:justify-center md:bg-black/60 md:backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="relative flex min-h-0 min-w-0 flex-col h-full md:h-auto md:max-h-[85dvh] md:max-w-xl md:w-full md:glass-strong md:rounded-t-3xl">
        {/* Header + tabs */}
        <div className="shrink-0 p-4 pb-2">
          <div className="flex items-center gap-1 mb-3">
            <button onClick={() => setOpen(false)} className="text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 md:hidden">
              <ArrowLeft size={22} />
            </button>
            <h3 className="font-semibold text-lg flex-1 md:flex-none">Add Exercise</h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center hidden md:flex">
              <X size={18} />
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMode('library')} className={cn('flex-1 text-xs py-2 rounded-lg flex items-center justify-center gap-1 min-h-[40px]', mode === 'library' ? 'bg-luxury-blue text-white' : 'glass text-muted-foreground')}>
              <Search size={13} /> Library
            </button>
            <button onClick={() => setMode('favorites')} className={cn('flex-1 text-xs py-2 rounded-lg flex items-center justify-center gap-1 min-h-[40px]', mode === 'favorites' ? 'bg-luxury-blue text-white' : 'glass text-muted-foreground')}>
              <Star size={13} /> Favorites
            </button>
            <button onClick={() => setMode('custom')} className={cn('flex-1 text-xs py-2 rounded-lg flex items-center justify-center gap-1 min-h-[40px]', mode === 'custom' ? 'bg-luxury-blue text-white' : 'glass text-muted-foreground')}>
              <Pencil size={13} /> Custom
            </button>
          </div>
        </div>

        {/* Library filters — stay visible while list scrolls */}
        {mode === 'library' && (
          <div className="shrink-0 px-4 pb-2">
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search 500+ exercises…" className="pl-8 h-10 glass" />
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-2 -mx-1 px-1">
              {MUSCLE_GROUPS.map((m) => (
                <button key={m} onClick={() => setMuscleFilter(m)} className={cn('px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap min-h-[32px]', muscleFilter === m ? 'bg-luxury-blue text-white' : 'glass text-muted-foreground')}>{m}</button>
              ))}
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-1 -mx-1 px-1">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button key={eq} onClick={() => setEquipFilter(eq)} className={cn('px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap min-h-[32px]', equipFilter === eq ? 'bg-luxury-red text-white' : 'glass text-muted-foreground')}>{eq}</button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mb-1 px-1">{loading ? 'Loading library…' : `${filtered.length} exercise${filtered.length === 1 ? '' : 's'}`}</p>
          </div>
        )}

        {/* Scrollable exercise list — independent vertical scrolling */}
        {mode === 'library' && (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <div className="space-y-1">
              {filtered.map((ex) => (
                <ExerciseRow key={ex.slug || ex.id} ex={ex} fav={!!favs[ex.slug || ex.id]} onPick={pickLibrary} onToggleFav={toggleFav} />
              ))}
              {!loading && !filtered.length && <p className="text-center text-xs text-muted-foreground py-6">No matches. Try different filters or use the Custom tab.</p>}
            </div>
          </div>
        )}

        {mode === 'favorites' && (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <div className="space-y-1">
              {favList.map((ex) => (
                <ExerciseRow key={ex.slug || ex.id} ex={ex} fav onPick={pickLibrary} onToggleFav={toggleFav} />
              ))}
              {!favList.length && <p className="text-center text-xs text-muted-foreground py-6">No favorite exercises yet. Tap the star next to any exercise in the Library tab.</p>}
            </div>
          </div>
        )}

        {mode === 'custom' && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <div className="space-y-3">
              <Input autoFocus value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Type any exercise name…" className="glass h-10" onKeyDown={(e) => e.key === 'Enter' && pickCustom()} />
              <Button size="sm" className="w-full bg-luxury-blue glow-blue" onClick={pickCustom} disabled={!customName.trim()}><Plus size={14} /> Add Custom Exercise</Button>
              <p className="text-[10px] text-muted-foreground text-center">Manual exercises are saved by name and work in the workout logger.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ExerciseRow({ ex, fav, onPick, onToggleFav }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/40 transition-all">
      <button onClick={() => onPick(ex)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
        <Dumbbell size={14} className="text-luxury-blue shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium truncate">{ex.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{ex.primary_muscle} · {(ex.equipment || []).join(', ') || '—'}</p>
          {ex.instructions && <p className="text-[10px] text-muted-foreground/70 truncate">{ex.instructions}</p>}
        </div>
      </button>
      <button onClick={() => onToggleFav(ex)} className="shrink-0 min-h-[40px] min-w-[36px] flex items-center justify-center">
        <Star size={15} className={cn(fav ? 'fill-luxury-gold text-luxury-gold' : 'text-muted-foreground')} />
      </button>
    </div>
  );
}