import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Heart, Plus, ChevronRight, MoreHorizontal,
} from 'lucide-react';
import { getAllExercises, getSubstitutions, EXERCISES, normalizeName } from '@/lib/exerciseDatabase';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';
import ExerciseOverviewTab from '@/components/exercises/ExerciseOverviewTab';
import ExerciseMusclesTab from '@/components/exercises/ExerciseMusclesTab';
import ExerciseTechniqueTab from '@/components/exercises/ExerciseTechniqueTab';
import ExerciseHeroImage from '@/components/exercises/ExerciseHeroImage';
import useExerciseHistoryData from '@/hooks/useExerciseHistoryData';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'muscles', label: 'Muscles' },
  { id: 'technique', label: 'Technique' },
];

function normalizeExercise(ex) {
  if (!ex) return null;
  return {
    ...ex,
    instructions: ex.instructions || ex.execution_instructions || '',
    setup: ex.setup_instructions || '',
    mistakes: ex.mistakes || ex.common_mistakes || [],
    safety: ex.safety || ex.safety_tips || [],
    coaching_cues: ex.coaching_cues || [],
    progressions: ex.progressions || [],
    regressions: ex.regressions || [],
    alternatives: ex.alternatives || [],
    rep_low: ex.rep_low ?? ex.rep_range_low,
    rep_high: ex.rep_high ?? ex.rep_range_high,
    rest: ex.rest ?? ex.rest_seconds,
  };
}

export default function ExerciseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [isFavorite, setIsFavorite] = useState(false);
  const performance = useExerciseHistoryData(exercise?.name, 12);
  const history = performance.points;
  const historyLoading = performance.loading;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setTab('overview');
    const builtIn = EXERCISES.find((item) => item.slug === slug || item.canonical_id === slug);
    if (builtIn) { setExercise(normalizeExercise(builtIn)); setLoading(false); return; }
    (async () => {
      try {
        const all = await getAllExercises();
        if (!active) return;
        const found = all.find((e) => e.slug === slug || e.canonical_id === slug || String(e.id) === slug);
        setExercise(normalizeExercise(found));
      } catch (e) { console.error(e); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [slug]);



  useEffect(() => {
    if (!exercise) return;
    let active = true;
    (async () => {
      try {
        const favs = await base44.entities.Favorite.filter({ type: 'exercise', $or: [{ ref_id: exercise.slug }, { name: exercise.name }] }, { limit: 1, fields: ['ref_id', 'name'] });
        if (!active) return;
        setIsFavorite(favs.items.length > 0);
      } catch (e) {}
    })();
    return () => { active = false; };
  }, [exercise]);

  const toggleFavorite = async () => {
    if (!exercise) return;
    try {
      if (isFavorite) {
        const favs = await base44.entities.Favorite.filter({ type: 'exercise', $or: [{ ref_id: exercise.slug }, { name: exercise.name }] }, { limit: 1 });
        const match = favs.items[0];
        if (match) await base44.entities.Favorite.delete(match.id);
        setIsFavorite(false);
      } else {
        await base44.entities.Favorite.create({ type: 'exercise', ref_id: exercise.slug, name: exercise.name, subtitle: exercise.primary_muscle });
        setIsFavorite(true);
      }
    } catch (e) { console.error(e); }
  };

  const addToWorkout = () => {
    try { localStorage.setItem('lraz_pending_exercise', JSON.stringify(exercise)); } catch (e) {}
    navigate('/workout/new');
  };

  const subs = useMemo(() => getSubstitutions(exercise, user?.equipment), [exercise, user]);
  const altExercises = useMemo(() => (exercise?.alternatives || []).map((n) => EXERCISES.find((e) => normalizeName(e.name) === normalizeName(n))).filter(Boolean), [exercise]);

  const bestE1rm = performance.bestE1rm;
  const totalVolume = performance.shownVolume;
  const prCount = performance.prCount;
  const lastSession = history[0];

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!exercise) return (
    <div className="max-w-md mx-auto px-4 pt-10 text-center">
      <p className="text-muted-foreground mb-4">Exercise not found.</p>
      <Button onClick={() => navigate('/train')}><ArrowLeft size={16} /> Back to Training</Button>
    </div>
  );

  return (
    <div className="exercise-detail force-porcelain mx-auto w-full min-w-0 max-w-[480px] pb-[calc(7rem+env(safe-area-inset-bottom))] md:max-w-3xl">
      {/* Header — back, centered serif title, favorite + menu */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md px-3 py-2.5 flex items-center justify-between safe-pt">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2" aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="min-w-0 flex-1 px-2 text-center font-serif-display text-lg font-semibold tracking-tight [overflow-wrap:anywhere]">{exercise.name}</h1>
        <div className="flex items-center">
          <button onClick={toggleFavorite} className="min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Favorite">
            <Heart size={20} className={cn(isFavorite && 'fill-luxury-red text-luxury-red')} />
          </button>
          <button onClick={() => navigate('/train')} className="min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2" aria-label="More">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Hero image */}
      <div className="px-4 mt-3">
        <ExerciseHeroImage exercise={exercise} className="aspect-[16/10]" />
        <p className="mt-2 text-[11px] text-muted-foreground uppercase tracking-wider">{exercise.muscle_group} · {exercise.movement_pattern}</p>
      </div>

      {/* Tabs — pill container */}
      <div className="px-4 mt-4">
        <div className="flex gap-1 p-1 rounded-full bg-muted">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors min-h-[44px] min-w-0',
                tab === t.id ? 'btn-gold text-primary-foreground' : 'text-muted-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 mt-5">
        {tab === 'overview' && (
          <ExerciseOverviewTab
            exercise={exercise}
            history={history}
            historyLoading={historyLoading}
            bestE1rm={bestE1rm}
            totalVolume={totalVolume}
            prCount={prCount}
            lastSession={lastSession}
            onViewHistory={() => navigate(`/exercise-history?name=${encodeURIComponent(exercise.name)}`)}
          />
        )}
        {tab === 'muscles' && <ExerciseMusclesTab exercise={exercise} />}
        {tab === 'technique' && <ExerciseTechniqueTab exercise={exercise} />}
      </div>

      {/* Alternatives & substitutions */}
      {(altExercises.length > 0 || subs.length > 0) && (
        <div className="px-4 mt-5 space-y-4">
          {altExercises.length > 0 && (
            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Alternatives</p>
              <div className="space-y-1.5">
                {altExercises.map((a) => (
                  <button key={a.slug} onClick={() => navigate(`/exercise/${a.slug}`)} className="w-full text-left p-2.5 rounded-xl glass hover:bg-muted/30 flex items-center justify-between min-h-[44px]">
                    <span className="text-sm font-medium">{a.name}</span>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}
          {subs.length > 0 && (
            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Smart Substitutions</p>
              <p className="text-[11px] text-muted-foreground mb-2">Same primary muscle and movement pattern.</p>
              <div className="space-y-1.5">
                {subs.slice(0, 5).map((s) => (
                  <button key={s.slug} onClick={() => navigate(`/exercise/${s.slug}`)} className="w-full text-left p-2.5 rounded-xl glass hover:bg-muted/30 flex items-center justify-between min-h-[44px]">
                    <div className="min-w-0"><p className="text-sm font-medium truncate">{s.name}</p><p className="text-[11px] text-muted-foreground">{(s.equipment || []).join(' · ')}</p></div>
                    <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sticky Add to Workout */}
      <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 bg-background border-t border-border/50">
        <div className="mx-auto w-full max-w-[448px] md:max-w-3xl">
          <Button onClick={addToWorkout} className="w-full btn-gold min-h-[52px] text-base font-semibold">
            <Plus size={18} /> Add to Workout
          </Button>
        </div>
      </div>
    </div>
  );
}