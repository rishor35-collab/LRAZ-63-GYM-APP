import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Check, Timer, Dumbbell, Search, ChevronDown, Trash2, Zap, Flame, Activity, Trophy, AlertTriangle, StickyNote, Shield, Info } from 'lucide-react';
import { estimate1RM } from '@/lib/fitnessScience';
import { cn } from '@/lib/utils';
import ExerciseDetailSheet from '@/components/exercises/ExerciseDetailSheet';
import { getAllExercises } from '@/lib/exerciseDatabase';
import SessionQualitySheet from '@/components/workout/SessionQualitySheet';
import WarmupPlanner from '@/components/workout/WarmupPlanner';
import SubstitutionSheet from '@/components/workout/SubstitutionSheet';
import { computeSessionQuality, suggestProgression, muscleGroupForExercise } from '@/lib/performanceAnalytics';
import { estimateCalories } from '@/lib/cardioAnalytics';
import WorkoutCardioBlock from '@/components/workout/WorkoutCardioBlock';
import CardioPickerSheet from '@/components/workout/CardioPickerSheet';
import { createPost, refreshMyTrainingStats } from '@/lib/activityFeed';
import { toast } from '@/components/ui/use-toast';
import { getPRFeedback, getEncouragement } from '@/lib/feedbackMessages';
import RestCountdown from '@/components/workout/RestCountdown';
import WorkoutSetGrid from '@/components/workout/WorkoutSetGrid';
import useLatestCallback from '@/hooks/useLatestCallback';
import useWorkoutDraft from '@/hooks/useWorkoutDraft';
import { clearWorkoutCache } from '@/lib/workoutData';
import { queryClientInstance } from '@/lib/query-client';
import { useAuth } from '@/lib/AuthContext';

const FOCUS_OPTIONS = ['Push (Chest/Shoulders/Triceps)', 'Pull (Back/Biceps)', 'Legs', 'Upper', 'Lower', 'Full Body', 'Core', 'Cardio'];

// Set types matching the WorkoutSet schema enum. Persisted on save.
const SET_TYPES = [
  { id: 'working', label: 'Working' }, { id: 'warmup', label: 'Warm-up' }, { id: 'drop', label: 'Drop' },
  { id: 'amrap', label: 'AMRAP' }, { id: 'cluster', label: 'Cluster' }, { id: 'superset', label: 'Superset' },
  { id: 'circuit', label: 'Circuit' }, { id: 'myo', label: 'Rest-Pause' }, { id: 'emom', label: 'EMOM' }, { id: 'giant', label: 'Giant' },
];

export default function WorkoutLogger() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [session, setSession] = useState({
    name: 'Quick Workout',
    focus: 'Full Body',
    date: new Date().toISOString(),
    status: 'in_progress',
  });
  const [blocks, setBlocks] = useState([]); // [{ exercise, sets: [{weight_kg, reps, rpe, completed}] }]
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [restDeadline, setRestDeadline] = useState(null);
  const [defaultRest, setDefaultRest] = useState(90);
  const [sessionId, setSessionId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [showQuality, setShowQuality] = useState(false);
  const [quality, setQuality] = useState(null);
  const [warmup, setWarmup] = useState(null);
  const [resumePrompt, setResumePrompt] = useState(null);
  const [substitution, setSubstitution] = useState(null);
  const [cardioBlocks, setCardioBlocks] = useState([]);
  const [cardioPickerOpen, setCardioPickerOpen] = useState(false);
  const [bodyWeight, setBodyWeight] = useState(null);
  const [cardioCalories, setCardioCalories] = useState(0);
  const [cardioCount, setCardioCount] = useState(0);
  const [historyMap, setHistoryMap] = useState({}); // { exerciseName: { lastWeight, lastReps, targetWeight, targetReps, targetReason } }
  const [bestLifts, setBestLifts] = useState({}); // { exerciseName: { maxWeight, bestE1RM } } for PR detection
  const [sessionStart, setSessionStart] = useState(Date.now());
  const [saveError, setSaveError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(null); // block index pending removal confirmation
  const [prs, setPrs] = useState([]); // [{ exercise, type, value }]
  const [summaryStats, setSummaryStats] = useState(null);
  const [detailExercise, setDetailExercise] = useState(null);
  const openWarmup = useLatestCallback((name, weight) => setWarmup({ name, weight }));
  const cancelRemove = useLatestCallback(() => setConfirmRemove(null));
  const draft = useMemo(() => ({ sessionId, session, blocks, cardioBlocks, notes, sessionStart, restDeadline, prs }), [sessionId, session, blocks, cardioBlocks, notes, sessionStart, restDeadline, prs]);
  const clearDraft = useWorkoutDraft(draft, !!sessionId && !resumePrompt && !showQuality);

  // Lookup map for full exercise metadata (instructions, mistakes, safety) by name.
  const exerciseLookup = useMemo(() => {
    const m = {};
    exercises.forEach((e) => { m[e.name.toLowerCase()] = e; });
    return m;
  }, [exercises]);

  const startFresh = (programId, dayIndex) => {
    const createBlank = () => { setCardioBlocks([]); return base44.entities.WorkoutSession.create({
      name: 'Quick Workout', focus: 'Full Body', date: new Date().toISOString(),
      status: 'in_progress', total_volume_kg: 0, pr_count: 0, synced: navigator.onLine,
    }).then((s) => setSessionId(s.id)).catch(() => {}); };
    if (programId) {
      base44.entities.TrainingProgram.get(programId).then((prog) => {
        const day = prog.days?.[Number(dayIndex)];
        const preBlocks = (day?.exercises || []).map((ex) => ({
          exercise: { name: ex.exercise_name, id: ex.exercise_id, primary_muscle: '', equipment: [] },
          target: `${ex.sets || 1}×${ex.reps_low || ''}${ex.reps_high ? `-${ex.reps_high}` : ''}${ex.rir_target != null ? ` @${ex.rir_target}RIR` : ''}`,
          sets: Array.from({ length: ex.sets || 1 }, () => ({ weight_kg: '', reps: '', rpe: '', completed: false })),
        }));
        setBlocks(preBlocks);
        const preCardio = (day?.cardio || []).map((c) => ({ activity: c.activity, activity_label: c.activity_label, target_duration_minutes: c.target_duration_minutes, target_distance_km: c.target_distance_km, notes: c.notes || '', actual: { duration_min: c.target_duration_minutes ? String(c.target_duration_minutes) : '', distance: c.target_distance_km ? String(c.target_distance_km) : '', calSource: c.target_calories ? 'Manual' : 'Estimated', calories: c.target_calories ? String(c.target_calories) : '', avgHr: '', notes: '', completed: false } }));
        setCardioBlocks(preCardio);
        const sessionName = day?.day_name || prog.name;
        const focus = day?.focus || '';
        setSession((s) => ({ ...s, name: sessionName, focus, program_id: prog.id, program_day_name: day?.day_name }));
        base44.entities.WorkoutSession.create({
          name: sessionName, focus, date: new Date().toISOString(), program_id: prog.id,
          program_day_name: day?.day_name, status: 'in_progress', total_volume_kg: 0, pr_count: 0, synced: navigator.onLine,
        }).then((s) => setSessionId(s.id)).catch(() => {});
      }).catch(() => { createBlank(); });
    } else {
      createBlank();
    }
  };

  useEffect(() => {
    getAllExercises().then(setExercises).catch(() => {});
    (async () => {
      let w = null;
      try { const m = await base44.entities.BodyMeasurement.list('-date', 1); if (m?.[0]?.weight_kg) w = m[0].weight_kg; } catch (e) {}
      if (!w) w = user?.weight_kg || null;
      setBodyWeight(w);
    })();
    // Load workout history for previous-performance display, progressive-overload targets, and PR detection.
    (async () => {
      try {
        const [sessions, sets] = await Promise.all([
          base44.entities.WorkoutSession.list('-date', 50),
          base44.entities.WorkoutSet.list('-created_date', 300),
        ]);
        const completed = (sessions || []).filter((s) => s.status === 'completed');
        const dates = {}; (sessions || []).forEach((s) => { if (s?.id && s?.date) dates[s.id] = new Date(s.date).getTime(); });
        // Historical best lifts per exercise for PR detection.
        const best = {};
        (sets || []).forEach((s) => {
          if (!s || !s.exercise_name || s.set_type === 'warmup') return;
          const w = Number(s.weight_kg), r = Number(s.reps);
          if (!isFinite(w) || !isFinite(r) || w <= 0 || r < 1) return;
          const e1rm = estimate1RM(w, r) || 0;
          const cur = best[s.exercise_name] || { maxWeight: 0, bestE1RM: 0 };
          cur.maxWeight = Math.max(cur.maxWeight, w);
          cur.bestE1RM = Math.max(cur.bestE1RM, e1rm);
          best[s.exercise_name] = cur;
        });
        setBestLifts(best);
        // Last performance + rule-based progression target per exercise (most recent completed session first).
        const byDate = completed.sort((a, b) => dates[b.id] - dates[a.id]);
        const setsBySession = {};
        (sets || []).forEach((set) => { if (set.exercise_name && set.set_type !== 'warmup') (setsBySession[set.session_id] ||= []).push(set); });
        const map = {};
        for (const sess of byDate) {
          const exSets = setsBySession[sess.id] || [];
          const grouped = {};
          exSets.forEach((s) => { (grouped[s.exercise_name] ||= []).push(s); });
          for (const [name, arr] of Object.entries(grouped)) {
            if (map[name]) continue;
            const top = arr.reduce((a, s) => (estimate1RM(s.weight_kg, s.reps) || 0) > (estimate1RM(a.weight_kg, a.reps) || 0) ? s : a, arr[0]);
            const sug = suggestProgression(arr, 'double', {});
            map[name] = { lastWeight: top.weight_kg, lastReps: top.reps, targetWeight: sug?.newWeight, targetReps: sug?.newReps, targetReason: sug?.reason };
          }
        }
        setHistoryMap(map);
      } catch (e) { /* history optional — logging still works */ }
    })();
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const programId = params.get('programId');
      const dayIndex = params.get('dayIndex');
      // Resume an in-progress workout if one was saved before the app closed.
      try {
        const saved = JSON.parse(localStorage.getItem('lraz_active_workout') || 'null');
        if (saved && saved.sessionId) {
          const s = await base44.entities.WorkoutSession.get(saved.sessionId).catch(() => null);
          if (!s || s.status === 'in_progress') { setResumePrompt(saved); return; }
          localStorage.removeItem('lraz_active_workout');
        }
      } catch (e) {}
      startFresh(programId, dayIndex);
      // Pick up an exercise staged by the Exercise Detail page ("Add to Workout").
      const pending = localStorage.getItem('lraz_pending_exercise');
      if (pending) {
        try { const ex = JSON.parse(pending); if (ex?.name) setTimeout(() => addExercise(ex), 300); } catch (e) {}
        localStorage.removeItem('lraz_pending_exercise');
      }
    })();
  }, []);

  // Only the countdown component ticks; the exercise tree stays still.
  const startRest = useLatestCallback((seconds) => setRestDeadline(Date.now() + seconds * 1000));

  const continueWorkout = () => {
    const saved = resumePrompt;
    if (saved) {
      setSessionId(saved.sessionId);
      setSession(saved.session);
      setBlocks(saved.blocks || []);
      setCardioBlocks(saved.cardioBlocks || []);
      setNotes(saved.notes || '');
      setSessionStart(saved.sessionStart || Date.parse(saved.session?.date) || Date.now());
      setRestDeadline(saved.restDeadline || null);
      setPrs(saved.prs || []);
      const pending = localStorage.getItem('lraz_pending_exercise');
      if (pending) { const exercise = JSON.parse(pending); if (exercise?.name) addExercise(exercise); localStorage.removeItem('lraz_pending_exercise'); }
    }
    setResumePrompt(null);
  };

  const discardAndStartNew = async () => {
    const saved = resumePrompt;
    setResumePrompt(null);
    if (saved?.sessionId) { await base44.entities.WorkoutSession.delete(saved.sessionId).catch(() => {}); }
    clearDraft();
    setSessionId(null);
    setBlocks([]);
    setNotes('');
    setPrs([]);
    setRestDeadline(null);
    setSessionStart(Date.now());
    const params = new URLSearchParams(window.location.search);
    startFresh(params.get('programId'), params.get('dayIndex'));
  };

  const filteredExercises = useMemo(() => {
    if (!search) return exercises.slice(0, 20);
    return exercises.filter((e) => e.name.toLowerCase().includes(search.toLowerCase())).slice(0, 20);
  }, [exercises, search]);

  const addExercise = (ex) => {
    const hist = historyMap[ex.name];
    let firstSet = { weight_kg: '', reps: '', rpe: '', rir: '', completed: false };
    if (hist?.lastWeight != null) {
      firstSet = { weight_kg: String(hist.lastWeight), reps: String(hist.lastReps), rpe: '', rir: '', completed: false };
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem(`lastSet:${ex.name}`) || 'null');
        if (stored) firstSet = { weight_kg: stored.weight_kg ?? '', reps: stored.reps ?? '', rpe: '', rir: '', completed: false };
      } catch (e) {}
    }
    setBlocks((b) => [...b, { exercise: ex, set_type: 'working', sets: [firstSet] }]);
    setSearchOpen(false); setSearch('');
  };

  const addCustomExercise = () => {
    if (!search.trim()) return;
    addExercise({ name: search.trim(), primary_muscle: 'Custom', equipment: [] });
  };

  const updateSet = useLatestCallback((bi, si, field, value) => {
    setBlocks((blocks) => blocks.map((b, i) => i === bi ? { ...b, sets: b.sets.map((s, j) => j === si ? { ...s, [field]: value } : s) } : b));
  });

  const updateSetType = useLatestCallback((bi, set_type) => setBlocks((blocks) => blocks.map((b, i) => (i === bi ? { ...b, set_type } : b))));
  const updateBlockRest = useLatestCallback((bi, restSeconds) => setBlocks((bs) => bs.map((b, i) => (i === bi ? { ...b, restSeconds: restSeconds ? Number(restSeconds) : null } : b))));
  const updateBlockNotes = useLatestCallback((bi, value) => setBlocks((bs) => bs.map((b, i) => (i === bi ? { ...b, notes: value } : b))));
  const openSubstitutes = useLatestCallback((ex) => setSubstitution(ex));

  const updateCardioActual = (ci, field, value) => setCardioBlocks((bs) => bs.map((b, i) => (i === ci ? { ...b, actual: { ...b.actual, [field]: value } } : b)));
  const completeCardio = (ci) => setCardioBlocks((bs) => bs.map((b, i) => (i === ci ? { ...b, actual: { ...b.actual, completed: !b.actual.completed } } : b)));
  const removeCardio = (ci) => setCardioBlocks((bs) => bs.filter((_, i) => i !== ci));
  const addCardioBlock = (act) => { setCardioBlocks((bs) => [...bs, { activity: act.id, activity_label: act.label, target_duration_minutes: '', target_distance_km: '', notes: '', actual: { duration_min: '10', distance: '', calSource: 'Estimated', calories: '', avgHr: '', notes: '', completed: false } }]); setCardioPickerOpen(false); };

  const addSet = useLatestCallback((bi) => {
    setBlocks((blocks) => blocks.map((b, i) => {
      if (i !== bi) return b;
      const last = b.sets[b.sets.length - 1];
      const next = last ? { weight_kg: last.weight_kg, reps: last.reps, rpe: last.rpe, rir: last.rir, completed: false } : { weight_kg: '', reps: '', rpe: '', rir: '', completed: false };
      return { ...b, sets: [...b.sets, next] };
    }));
  });

  const removeSet = useLatestCallback((bi, si) => {
    setBlocks((blocks) => blocks.map((b, i) => i === bi ? { ...b, sets: b.sets.filter((_, j) => j !== si) } : b));
  });

  // Removes the exercise from the current session only — never deletes it from the library or program.
  const removeBlock = useLatestCallback((bi) => {
    setBlocks((blocks) => blocks.filter((_, i) => i !== bi));
    setConfirmRemove(null);
  });

  const completeSet = useLatestCallback((bi, si) => {
    const block = blocks[bi]; const set = block?.sets?.[si];
    if (set && !set.completed && set.weight_kg !== '' && set.reps !== '') {
      try { localStorage.setItem(`lastSet:${block.exercise.name}`, JSON.stringify({ weight_kg: set.weight_kg, reps: set.reps })); } catch (e) {}
      // Automatic PR detection against historical best lifts.
      const w = Number(set.weight_kg), r = Number(set.reps);
      const hist = bestLifts[block.exercise.name] || { maxWeight: 0, bestE1RM: 0 };
      const e1rm = estimate1RM(w, r) || 0;
      if (w > hist.maxWeight || e1rm > hist.bestE1RM) {
        const newPr = { exercise: block.exercise.name, type: w > hist.maxWeight ? 'weight' : 'e1rm', value: w > hist.maxWeight ? w : e1rm };
        setPrs((p) => [...p, newPr]);
        const prFb = getPRFeedback([newPr]);
        if (prFb) toast({ title: prFb.title, description: prFb.message });
      }
      const enc = getEncouragement(completedSets + 1);
      if (enc) toast({ description: enc });
    }
    setBlocks((blocks) => blocks.map((b, i) => {
      if (i !== bi) return b;
      return { ...b, sets: b.sets.map((s, j) => j === si ? { ...s, completed: !s.completed } : s) };
    }));
    if (set && !set.completed) startRest(block?.restSeconds || defaultRest);
  });

  const totalVolume = useMemo(() => blocks.reduce((acc, b) => acc + b.sets.reduce((a, s) => a + (s.completed ? (Number(s.weight_kg) || 0) * (Number(s.reps) || 0) : 0), 0), 0), [blocks]);
  const completedSets = useMemo(() => blocks.reduce((a, b) => a + b.sets.filter((s) => s.completed).length, 0), [blocks]);
  const topE1RM = useMemo(() => {
    let best = 0;
    blocks.forEach((b) => b.sets.forEach((s) => { if (s.completed) { const e = estimate1RM(Number(s.weight_kg), Number(s.reps)); if (e > best) best = e; } }));
    return best;
  }, [blocks]);

  const finish = async () => {
    if (!sessionId || saving || showQuality) return;
    setSaveError('');
    setSaving(true);
    try {
      // Determine which exercises hit a PR so the matching sets are flagged on save.
      const prExercises = new Set(prs.map((p) => p.exercise));
      // Save all sets
      const allSets = [];
      blocks.forEach((b) => b.sets.forEach((s, si) => {
        if (s.completed) allSets.push({
          session_id: sessionId, exercise_name: b.exercise.name, exercise_id: b.exercise.id,
          set_index: si, set_type: b.set_type || 'working', weight_kg: Number(s.weight_kg) || 0,
          reps: Number(s.reps) || 0, rpe: Number(s.rpe) || null, rir: Number(s.rir) || null,
          completed: true, is_pr: prExercises.has(b.exercise.name),
          estimated_1rm: estimate1RM(Number(s.weight_kg), Number(s.reps)) || null,
          notes: b.notes || null,
        });
      }));
      if (allSets.length) await base44.entities.WorkoutSet.bulkCreate(allSets);
      // Save completed cardio blocks as within-workout CardioSession records.
      // Each activity is one record — counted once across Cardio History / Progress / Reports.
      const cardioToSave = cardioBlocks.filter((b) => b.actual.completed);
      let _cardioCalories = 0;
      for (const b of cardioToSave) {
        const dur = Math.round((Number(b.actual.duration_min) || 0) * 60);
        const est = estimateCalories(b.activity, dur, bodyWeight, null);
        const calories = b.actual.calSource === 'Estimated' ? est : (b.actual.calories ? Number(b.actual.calories) : 0);
        _cardioCalories += calories;
        try {
          await base44.entities.CardioSession.create({
            date: new Date().toISOString(), activity: b.activity, activity_label: b.activity_label,
            duration_seconds: dur, distance_km: b.actual.distance ? Number(b.actual.distance) : undefined,
            calories, calorie_source: b.actual.calSource,
            heart_rate_avg: b.actual.avgHr ? Number(b.actual.avgHr) : undefined,
            notes: b.actual.notes || undefined, session_type: 'within_workout', workout_session_id: sessionId,
          });
        } catch (e) { console.error(e); }
      }
      setCardioCalories(_cardioCalories);
      setCardioCount(cardioToSave.length);
      const durationMinutes = Math.max(1, Math.round((Date.now() - sessionStart) / 60000));
      const prCount = prs.length;
      if (sessionId) await base44.entities.WorkoutSession.update(sessionId, {
        status: 'completed', total_volume_kg: totalVolume, estimated_1rm_top_set: topE1RM,
        duration_minutes: durationMinutes, pr_count: prCount, synced: true, notes,
      });
      clearDraft();
      clearWorkoutCache();
      queryClientInstance.invalidateQueries();
      // Post to community feed + refresh public training stats (deterministic, no AI).
      const sessionLabel = session.name && session.name !== 'Quick Workout' ? session.name : 'Workout';
      createPost('workout', `Completed ${sessionLabel}`,
        `${blocks.length} exercises · ${completedSets} sets · ${Math.round(totalVolume)}kg volume${prCount > 0 ? ` · ${prCount} PR${prCount > 1 ? 's' : ''}` : ''}`,
        { summary: [{ label: 'Exercises', value: blocks.length }, { label: 'Sets', value: completedSets }, { label: 'Volume kg', value: Math.round(totalVolume) }] },
      ).catch(() => {});
      if (prCount > 0 && prs.length) {
        createPost('pr', `New PR${prCount > 1 ? 's' : ''}`,
          prs.map((p) => `${p.exercise}: ${p.type === 'weight' ? p.value + 'kg' : 'e1rm ' + Math.round(p.value)}`).join(' · '),
        ).catch(() => {});
      }
      refreshMyTrainingStats().catch(() => {});
      const q = computeSessionQuality({ blocks, totalVolume, completedSets, totalSets: blocks.reduce((a, b) => a + b.sets.length, 0) });
      // End-session summary: duration, exercises, sets, reps, volume, muscles trained, PRs.
      const totalReps = blocks.reduce((a, b) => a + b.sets.reduce((x, s) => x + (s.completed ? Number(s.reps) || 0 : 0), 0), 0);
      const muscles = new Set();
      blocks.forEach((b) => { const m = muscleGroupForExercise(b.exercise.name); if (m) muscles.add(m); });
      setQuality(q);
      setSummaryStats({ durationMinutes, exerciseCount: blocks.length, totalReps, muscles: [...muscles], prCount, prs });
      setShowQuality(true);
    } catch (e) { setSaveError('Your workout could not be saved. Your local draft is still available.'); }
    finally { setSaving(false); }
  };

  const finishDone = () => navigate('/');

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-36">
      {resumePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
          <Card className="w-full max-w-sm animate-scale-in">
            <p className="text-base font-semibold mb-1">Continue your workout?</p>
            <p className="text-xs text-muted-foreground mb-4">You have a session in progress with {(resumePrompt.blocks || []).reduce((a, b) => a + (b.sets || []).filter((s) => s.completed).length, 0)} sets done. Resume where you stopped, or start fresh.</p>
            <div className="space-y-2">
              <Button onClick={continueWorkout} className="w-full bg-luxury-blue glow-blue min-h-[48px]"><Check size={18} /> Continue Workout</Button>
              <Button variant="outline" onClick={discardAndStartNew} className="w-full min-h-[44px]">Start New Workout</Button>
            </div>
          </Card>
        </div>
      )}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-muted-foreground tracking-wider uppercase">Live Session</p>
          <h1 className="text-2xl font-bold tracking-tight">{session.name && session.name !== 'Quick Workout' ? session.name : 'Workout Logger'}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/train')}><X size={18} /></Button>
      </div>

      <Card className="luxury-gradient border border-luxury-blue/30 mb-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="text-2xl font-bold text-white tabular-nums">{completedSets}</p><p className="text-[10px] text-white/60 uppercase">Sets Done</p></div>
          <div><p className="text-2xl font-bold text-white tabular-nums">{Math.round(totalVolume)}</p><p className="text-[10px] text-white/60 uppercase">Volume kg</p></div>
          <div><p className="text-2xl font-bold text-white tabular-nums">{Math.round(topE1RM)}</p><p className="text-[10px] text-white/60 uppercase">Top e1RM</p></div>
        </div>
      </Card>

      <RestCountdown deadline={restDeadline} onSkip={() => setRestDeadline(null)} />

      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar items-center">
        <span className="text-[10px] text-muted-foreground shrink-0">Rest:</span>
        {[60, 90, 120, 180].map((s) => (
          <button key={s} onClick={() => { setDefaultRest(s); startRest(s); }} className={cn('shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold min-h-[36px]', defaultRest === s ? 'bg-luxury-blue text-white' : 'glass text-muted-foreground')}>{s}s</button>
        ))}
      </div>

      <div className="grid min-w-0 grid-cols-1 xl:grid-cols-2 items-start gap-4">
        {blocks.map((block, bi) => (
          <ExerciseBlock key={bi} block={block} bi={bi}
            updateSet={updateSet} addSet={addSet} removeSet={removeSet} completeSet={completeSet}
            onWarmup={openWarmup} onSetType={updateSetType} onRestChange={updateBlockRest} onNotesChange={updateBlockNotes} onSubstitute={openSubstitutes}
            onRemove={setConfirmRemove} onConfirmRemove={removeBlock} onCancelRemove={cancelRemove} confirmRemove={confirmRemove === bi}
            prev={historyMap[block.exercise.name]} isPr={prs.some((p) => p.exercise === block.exercise.name)}
            exerciseLookup={exerciseLookup} onOpenDetail={setDetailExercise} />
        ))}
        {cardioBlocks.map((cb, ci) => (
          <WorkoutCardioBlock key={`cardio-${ci}`} block={cb} ci={ci} bodyWeight={bodyWeight}
            onUpdate={updateCardioActual} onComplete={completeCardio} onRemove={removeCardio} />
        ))}
      </div>

      {searchOpen ? (
        <Card className="mt-4">
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercises…" className="pl-9" />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1.5">
            {filteredExercises.map((ex) => (
              <button key={ex.id} onClick={() => addExercise(ex)} className="w-full text-left p-2.5 rounded-xl hover:bg-muted/40 transition-all">
                <p className="text-sm font-medium">{ex.name}</p>
                <p className="text-[11px] text-muted-foreground">{ex.primary_muscle} · {ex.equipment?.join(', ') || '—'}</p>
              </button>
            ))}
            {!filteredExercises.length && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">No library match for "{search}"</p>
                <Button size="sm" className="bg-luxury-blue glow-blue" onClick={addCustomExercise}><Plus size={14} /> Add "{search}" as custom</Button>
              </div>
            )}
            {filteredExercises.length > 0 && search && !filteredExercises.some((e) => e.name.toLowerCase() === search.toLowerCase()) && (
              <button onClick={addCustomExercise} className="w-full text-left p-2.5 rounded-xl hover:bg-muted/40 transition-all border-t border-border mt-1">
                <p className="text-sm font-medium text-luxury-blue">+ Use "{search}" as custom exercise</p>
              </button>
            )}
          </div>
        </Card>
      ) : (
        <Button variant="outline" className="w-full mt-4 glass border-dashed" onClick={() => setSearchOpen(true)}>
          <Plus size={16} /> Add Exercise
        </Button>
      )}

      <Button variant="outline" className="w-full mt-2 glass border-dashed border-luxury-red/30 text-luxury-red" onClick={() => setCardioPickerOpen(true)}>
        <Activity size={16} /> Add Cardio
      </Button>
      <CardioPickerSheet open={cardioPickerOpen} onClose={() => setCardioPickerOpen(false)} onPick={addCardioBlock} />

      {(blocks.length > 0 || cardioBlocks.length > 0) && (
        <Card className="mt-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Session Notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? What did you notice?"
            className="w-full glass rounded-xl p-3 text-sm outline-none min-h-[80px] resize-none focus:border-luxury-blue/50"
          />
        </Card>
      )}

      {saveError && <p role="alert" className="mt-3 text-sm text-destructive">{saveError}</p>}
      {(blocks.length > 0 || cardioBlocks.length > 0) && (
        <Button onClick={finish} disabled={saving || !sessionId || showQuality} className="w-full mt-4 bg-luxury-red hover:bg-luxury-red/90 glow-red">
          {saving ? 'Saving…' : <>Finish Workout <Check size={18} /></>}
        </Button>
      )}

      {quality && (
        <SessionQualitySheet open={showQuality} quality={quality} stats={{ completedSets, totalVolume, topE1RM, cardioCalories, cardioCount, ...(summaryStats || {}) }} onDone={finishDone} />
      )}
      {warmup && (
        <WarmupPlanner open onClose={() => setWarmup(null)} exerciseName={warmup.name} suggestedWeight={warmup.weight} />
      )}
      {substitution && (
        <SubstitutionSheet open exercise={substitution} allExercises={exercises} equipmentProfile={null} onClose={() => setSubstitution(null)} onAdd={addExercise} />
      )}
      {detailExercise && (
        <ExerciseDetailSheet exercise={detailExercise} onClose={() => setDetailExercise(null)} availableEquipment={null} onSwitch={(ex) => setDetailExercise(ex)} />
      )}
    </div>
  );
}

const ExerciseBlock = React.memo(function ExerciseBlock({ block, bi, updateSet, addSet, removeSet, completeSet, onWarmup, onSetType, onRestChange, onNotesChange, onSubstitute, onRemove, onConfirmRemove, onCancelRemove, confirmRemove, prev, isPr, exerciseLookup, onOpenDetail }) {
  const [expanded, setExpanded] = useState(true);
  const [liveTab, setLiveTab] = useState('log');
  const [notesOpen, setNotesOpen] = useState(false);
  const lastDone = block.sets.filter((s) => s.completed && s.weight_kg !== '').pop();
  const setType = block.set_type || 'working';
  const blockVolume = block.sets.reduce((a, s) => a + (s.completed ? (Number(s.weight_kg) || 0) * (Number(s.reps) || 0) : 0), 0);
  const blockReps = block.sets.reduce((a, s) => a + (s.completed ? Number(s.reps) || 0 : 0), 0);
  const fullExercise = exerciseLookup?.[block.exercise.name?.toLowerCase()] || block.exercise;
  const instructions = fullExercise.instructions || fullExercise.execution_instructions || '';
  const mistakes = fullExercise.mistakes || fullExercise.common_mistakes || [];
  const safety = fullExercise.safety || fullExercise.safety_tips || [];
  const secondary = fullExercise.secondary_muscles || [];
  const LIVE_TABS = [{ id: 'log', label: 'Log' }, { id: 'history', label: 'History' }, { id: 'tips', label: 'Tips' }];
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Dumbbell size={15} className="text-luxury-blue shrink-0" />
            <p className="min-w-0 text-sm font-semibold [overflow-wrap:anywhere]">{block.exercise.name}</p>
            {isPr && <Trophy size={13} className="text-luxury-gold shrink-0" />}
            {setType !== 'working' && <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-luxury-blue/15 text-luxury-blue shrink-0">{setType}</span>}
          </div>
          {block.target && <p className="text-[10px] text-muted-foreground mt-0.5 ml-5">{block.target}</p>}
          {prev && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 ml-5 mt-1 text-[10px]">
              <span className="text-muted-foreground">Last: <span className="text-foreground font-semibold tabular-nums">{prev.lastWeight}kg × {prev.lastReps}</span></span>
              {prev.targetWeight != null && <span className="text-luxury-blue">Target: <span className="font-semibold tabular-nums">{prev.targetWeight}kg × {prev.targetReps}</span></span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onRemove(bi)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-luxury-red" aria-label="Remove exercise"><Trash2 size={16} /></button>
          <button onClick={() => setExpanded(!expanded)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground" aria-label="Collapse"><ChevronDown size={18} className={cn('transition-transform', expanded && 'rotate-180')} /></button>
        </div>
      </div>
      {confirmRemove && (
        <div className="glass rounded-xl p-3 mb-3 border border-luxury-red/30 animate-scale-in">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle size={16} className="text-luxury-red shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">Remove <span className="text-foreground font-semibold">{block.exercise.name}</span> from this session? This won't delete it from your library or program.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" className="flex-1 min-h-[40px]" onClick={() => onConfirmRemove(bi)}>Remove</Button>
            <Button size="sm" variant="ghost" className="flex-1 min-h-[40px]" onClick={onCancelRemove}>Cancel</Button>
          </div>
        </div>
      )}
      {expanded && !confirmRemove && (
        <>
          <div className="flex gap-1 p-0.5 rounded-full glass mb-3">
            {LIVE_TABS.map((t) => (
              <button key={t.id} onClick={() => setLiveTab(t.id)} className={cn('flex-1 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[36px]', liveTab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{t.label}</button>
            ))}
          </div>

          {liveTab === 'log' && (
            <>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-1">
                {SET_TYPES.map((t) => <button key={t.id} onClick={() => onSetType(bi, t.id)} className={cn('shrink-0 px-3.5 py-2 rounded-full text-xs font-medium transition-all min-h-[36px] border', setType === t.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:text-foreground')}>{t.label}</button>)}
              </div>
              <button onClick={() => onOpenDetail(fullExercise)} className="w-full flex items-center gap-2.5 rounded-xl border border-border p-2.5 mb-3 hover:bg-muted/30 transition-all">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Dumbbell size={15} /></div>
                <span className="text-xs text-muted-foreground">How to do {block.exercise.name}</span>
              </button>
              <WorkoutSetGrid block={block} bi={bi} updateSet={updateSet} completeSet={completeSet} removeSet={removeSet} isPr={isPr} />
              <div className="flex flex-wrap items-center gap-2 mt-2 px-1 text-[10px] text-muted-foreground">
                <span>Block volume: <span className="text-foreground font-semibold tabular-nums">{Math.round(blockVolume)} kg</span></span>
                <span>·</span>
                <span>Reps: <span className="text-foreground font-semibold tabular-nums">{blockReps}</span></span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Button variant="ghost" size="sm" className="flex-1 text-xs min-h-[44px] glass" onClick={() => onWarmup(block.exercise.name, lastDone ? Number(lastDone.weight_kg) : '')}><Flame size={14} /> Warm-up</Button>
                <Button variant="ghost" size="sm" className="flex-1 text-xs min-h-[44px] glass" onClick={() => onSubstitute(block.exercise)}><Zap size={14} /> Substitutes</Button>
                <Button variant="ghost" size="sm" className="flex-1 text-xs min-h-[44px] glass" onClick={() => setNotesOpen((v) => !v)}><StickyNote size={14} /> Notes</Button>
                <button onClick={() => addSet(bi)} className="shrink-0 w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-all" aria-label="Add set"><Plus size={18} /></button>
              </div>
              {notesOpen && (
                <textarea
                  value={block.notes || ''}
                  onChange={(e) => onNotesChange(bi, e.target.value)}
                  placeholder="Exercise notes…"
                  className="w-full glass rounded-xl p-3 text-sm outline-none min-h-[64px] resize-none mt-2 focus:border-luxury-blue/50"
                />
              )}
              <div className="flex items-center gap-2 mt-2 px-1">
                <Timer size={13} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Rest</span>
                <Input type="number" inputMode="numeric" className="h-9 w-20 text-center tabular-nums glass" placeholder="auto" value={block.restSeconds ?? ''} onChange={(e) => onRestChange(bi, e.target.value)} />
                <span className="text-[10px] text-muted-foreground">sec · overrides preset</span>
              </div>
            </>
          )}

          {liveTab === 'history' && (
            <div className="space-y-3">
              {prev ? (
                <div className="rounded-xl glass p-3 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Last performance</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div><p className="text-lg font-bold tabular-nums">{prev.lastWeight}kg</p><p className="text-[10px] text-muted-foreground">Weight</p></div>
                    <div><p className="text-lg font-bold tabular-nums">{prev.lastReps}</p><p className="text-[10px] text-muted-foreground">Reps</p></div>
                  </div>
                  {prev.targetWeight != null && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Progression target</p>
                      <p className="text-sm font-semibold text-luxury-blue">{prev.targetWeight}kg × {prev.targetReps}</p>
                      {prev.targetReason && <p className="text-[11px] text-muted-foreground mt-0.5">{prev.targetReason}</p>}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No previous performance for this exercise yet.</p>
              )}
              <Button variant="outline" size="sm" className="w-full glass min-h-[40px]" onClick={() => { const n = encodeURIComponent(block.exercise.name); window.location.href = `/exercise-history?name=${n}`; }}>View full exercise history</Button>
            </div>
          )}

          {liveTab === 'tips' && (
            <div className="space-y-3">
              {fullExercise.primary_muscle && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-primary/15 text-primary">Primary · {fullExercise.primary_muscle}</span>
                  {secondary.map((m) => <span key={m} className="text-[10px] px-2.5 py-1 rounded-full bg-primary/5 text-primary/70">Secondary · {m}</span>)}
                </div>
              )}
              {instructions && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">How to perform</p>
                  <p className="min-w-0 whitespace-pre-line text-sm text-foreground/80 leading-relaxed [overflow-wrap:anywhere]">{instructions}</p>
                </div>
              )}
              {mistakes.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><AlertTriangle size={11} className="text-luxury-red" /> Common mistakes</p>
                  <ul className="space-y-1">{mistakes.map((m, i) => <li key={i} className="min-w-0 text-xs leading-relaxed text-foreground/80 flex gap-1.5"><span className="text-luxury-red shrink-0">✕</span><span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{m}</span></li>)}</ul>
                </div>
              )}
              {safety.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><Shield size={11} className="text-primary" /> Safety</p>
                  <ul className="space-y-1">{safety.map((s, i) => <li key={i} className="min-w-0 text-xs leading-relaxed text-foreground/80 flex gap-1.5"><span className="text-primary shrink-0">✓</span><span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{s}</span></li>)}</ul>
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full btn-gold min-h-[44px]" onClick={() => onOpenDetail(fullExercise)}><Info size={14} /> Open full detail page</Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
});