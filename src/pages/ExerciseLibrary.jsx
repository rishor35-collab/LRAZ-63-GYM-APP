import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Pill, EmptyState } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dumbbell, Search, Plus, SlidersHorizontal, X, Check, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAllExercises, searchExercises, clearExerciseCache, EQUIPMENT_OPTIONS, MOVEMENT_PATTERNS, DIFFICULTY_LEVELS } from '@/lib/exerciseDatabase';
import CreateExerciseSheet from '@/components/exercises/CreateExerciseSheet';

const MUSCLE_PILLS = ['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Forearms', 'Full Body', 'Cardio'];

export default function ExerciseLibrary() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [visibleExercises, setVisibleExercises] = useState(40);
  const [muscle, setMuscle] = useState('All');
  const [equipment, setEquipment] = useState('All');
  const [movement, setMovement] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    getAllExercises().then((items) => { if (active) { setExercises(items); setLoading(false); } });
    return () => { active = false; };
  }, [creating]);

  useEffect(() => { setVisibleExercises(40); }, [query, muscle, equipment, movement, difficulty]);

  const exerciseMatches = useMemo(() => searchExercises(deferredQuery, { muscle, equipment, movement, difficulty }, exercises), [deferredQuery, muscle, equipment, movement, difficulty, exercises]);
  const filteredExercises = exerciseMatches.slice(0, visibleExercises);
  const activeFilterCount = [equipment, movement, difficulty].filter((f) => f !== 'All').length;

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-36">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/train')} className="glass rounded-xl w-11 h-11 flex items-center justify-center min-h-[44px] shrink-0"><ArrowLeft size={18} /></button>
        <div>
          <p className="text-xs text-muted-foreground tracking-wider uppercase">Training</p>
          <h1 className="text-3xl font-bold tracking-tight">Exercises</h1>
        </div>
      </div>

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search exercises…" className="pl-9 glass min-h-[48px]" />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
        {MUSCLE_PILLS.map((m) => <Pill key={m} active={muscle === m} onClick={() => setMuscle(m)}>{m}</Pill>)}
      </div>

      <div className="flex items-center justify-between mb-4">
        <Button size="sm" variant="outline" className="glass min-h-[44px]" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal size={14} /> Filters{activeFilterCount > 0 && <span className="ml-1 text-[10px] bg-luxury-blue text-white rounded-full px-1.5 py-0.5">{activeFilterCount}</span>}
        </Button>
        <Button size="sm" variant="outline" className="glass min-h-[44px]" onClick={() => setCreating(true)}><Plus size={14} /> Create</Button>
      </div>

      <LibraryView exercises={filteredExercises} loading={loading} onOpen={(ex) => navigate(`/exercise/${ex.slug || ex.id}`)} totalCount={exerciseMatches.length} />
      {filteredExercises.length < exerciseMatches.length && <Button variant="outline" className="mt-4 w-full min-h-[48px]" onClick={() => setVisibleExercises((count) => count + 40)}>Load more</Button>}

      {creating && <CreateExerciseSheet onClose={() => setCreating(false)} onCreated={() => { clearExerciseCache(); }} />}
      {filtersOpen && (
        <FiltersSheet equipment={equipment} setEquipment={setEquipment} movement={movement} setMovement={setMovement}
          difficulty={difficulty} setDifficulty={setDifficulty} onClose={() => setFiltersOpen(false)} onClear={() => { setEquipment('All'); setMovement('All'); setDifficulty('All'); }} />
      )}
    </div>
  );
}

const ExerciseRow = React.memo(function ExerciseRow({ ex, onOpen }) {
  return (
    <Card className="p-3 hover:border-luxury-blue/40 transition-all cursor-pointer" onClick={() => onOpen(ex)}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{ex.name}{ex.custom && <span className="ml-2 text-[9px] font-bold bg-luxury-gold/15 text-luxury-gold rounded-full px-1.5 py-0.5 align-middle">CUSTOM</span>}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{ex.primary_muscle} · {ex.movement_pattern} · {(ex.equipment || []).join(', ') || '—'}</p>
        </div>
        <span className={cn('text-[10px] px-2 py-0.5 rounded-full shrink-0 ml-2',
          ex.difficulty === 'Beginner' ? 'bg-emerald-500/10 text-emerald-400' :
          ex.difficulty === 'Intermediate' ? 'bg-luxury-gold/10 text-luxury-gold' :
          ex.difficulty === 'Advanced' ? 'bg-orange-500/10 text-orange-400' :
          'bg-luxury-red/10 text-luxury-red')}>{ex.difficulty}</span>
      </div>
    </Card>
  );
});

function LibraryView({ exercises, loading, onOpen, totalCount }) {
  if (loading) return <div className="py-16 text-center text-muted-foreground text-sm">Loading library…</div>;
  if (!exercises.length) return <EmptyState icon={Dumbbell} title="No exercises found" description="Try a different search or filter." />;
  return (
    <>
      <p className="text-[11px] text-muted-foreground mb-2">{exercises.length} of {totalCount} exercises</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {exercises.map((ex) => <ExerciseRow key={ex.slug || ex.id} ex={ex} onOpen={onOpen} />)}
      </div>
    </>
  );
}

function FiltersSheet({ equipment, setEquipment, movement, setMovement, difficulty, setDifficulty, onClose, onClear }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong rounded-t-3xl p-5 pb-32 max-h-[85dvh] overflow-y-auto animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Filters</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClear} className="text-xs min-h-[40px]">Clear</Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="min-h-[44px] min-w-[44px] p-2"><X size={18} /></Button>
          </div>
        </div>
        <FilterGroup label="Equipment" options={EQUIPMENT_OPTIONS} value={equipment} onChange={setEquipment} />
        <FilterGroup label="Movement Pattern" options={MOVEMENT_PATTERNS} value={movement} onChange={setMovement} />
        <FilterGroup label="Difficulty" options={DIFFICULTY_LEVELS} value={difficulty} onChange={setDifficulty} />
        <Button onClick={onClose} className="w-full mt-4 bg-luxury-blue glow-blue min-h-[44px]"><Check size={16} /> Apply</Button>
      </div>
    </div>
  );
}

function FilterGroup({ label, options, value, onChange }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)} className={cn('text-xs px-3 py-1.5 rounded-full border transition-all min-h-[36px]', value === o ? 'border-luxury-blue bg-luxury-blue/15 text-luxury-blue' : 'border-border glass text-muted-foreground')}>{o}</button>
        ))}
      </div>
    </div>
  );
}