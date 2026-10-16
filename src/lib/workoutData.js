// Shared workout data loader + deterministic analysis helpers.
// NO AI. Pure calculations from actual user data.
import { base44 } from '@/api/base44Client';
import { localDateStr } from '@/lib/utils';

let _cache = null;
let _promise = null;
let _ts = 0;
const TTL = 60_000; // 1 minute cache to avoid duplicate fetches across tabs

export async function loadWorkoutData(force = false) {
  const stale = Date.now() - _ts > TTL;
  if (_cache && !force && !stale) return _cache;
  if (_promise && !force) return _promise;
  _promise = (async () => {
    const [sessions, sets, cardio, scheduled] = await Promise.all([
      base44.entities.WorkoutSession.list('-date', 500),
      base44.entities.WorkoutSet.list('-created_date', 3000),
      base44.entities.CardioSession.list('-date', 500),
      base44.entities.ScheduledWorkout.list('-date', 200),
    ]);
    _cache = {
      sessions: (sessions || []).filter((s) => s.status === 'completed'),
      sets: sets || [],
      cardio: (cardio || []),
      scheduled: scheduled || [],
      allSessions: sessions || [],
    };
    _ts = Date.now();
    _promise = null;
    return _cache;
  })();
  const pending = _promise;
  try { return await pending; }
  finally { if (_promise === pending) _promise = null; }
}

export function clearWorkoutCache() { _cache = null; _promise = null; _ts = 0; }

// Group sets by session_id for quick lookup
export function groupSetsBySession(sets) {
  const map = {};
  for (const s of sets) {
    if (!map[s.session_id]) map[s.session_id] = [];
    map[s.session_id].push(s);
  }
  return map;
}

// Compute per-session summary from sets
export function sessionSummary(session, sets) {
  const completed = sets.filter((s) => s.completed);
  const volume = completed.reduce((a, s) => a + (Number(s.weight_kg) || 0) * (Number(s.reps) || 0), 0);
  const exerciseNames = [...new Set(completed.map((s) => s.exercise_name))];
  const prCount = completed.filter((s) => s.is_pr).length;
  const totalSets = completed.length;
  const totalReps = completed.reduce((a, s) => a + (Number(s.reps) || 0), 0);
  return {
    volume: Math.round(volume),
    exerciseCount: exerciseNames.length,
    prCount,
    totalSets,
    totalReps,
    exercises: exerciseNames,
  };
}

// Muscle-group volume distribution from sets + exercise lookup
export function muscleGroupVolume(sets, exerciseMap) {
  const map = {};
  for (const s of sets) {
    if (!s.completed) continue;
    const ex = exerciseMap[s.exercise_name];
    const group = ex?.muscle_group || ex?.primary_muscle || 'Other';
    const vol = (Number(s.weight_kg) || 0) * (Number(s.reps) || 0);
    map[group] = (map[group] || 0) + vol;
  }
  return Object.entries(map)
    .map(([group, volume]) => ({ group, volume: Math.round(volume) }))
    .sort((a, b) => b.volume - a.volume);
}

// Weekly volume trend (last 12 weeks)
export function weeklyVolumeTrend(sessions, setsBySession) {
  const now = new Date();
  const weeks = [];
  for (let i = 11; i >= 0; i--) {
    const end = new Date(now); end.setDate(now.getDate() - i * 7);
    const start = new Date(end); start.setDate(end.getDate() - 6);
    const sStart = localDateStr(start);
    const sEnd = localDateStr(end);
    const weekSessions = sessions.filter((s) => {
      const d = (s.date || '').slice(0, 10);
      return d >= sStart && d <= sEnd;
    });
    let vol = 0;
    let duration = 0;
    for (const ws of weekSessions) {
      const ss = setsBySession[ws.id] || [];
      vol += ss.filter((x) => x.completed).reduce((a, x) => a + (Number(x.weight_kg) || 0) * (Number(x.reps) || 0), 0);
      duration += ws.duration_minutes || 0;
    }
    weeks.push({
      label: `${start.getMonth() + 1}/${start.getDate()}`,
      volume: Math.round(vol),
      sessions: weekSessions.length,
      duration: Math.round(duration),
    });
  }
  return weeks;
}

// Top exercises by total volume
export function topExercisesByVolume(sets, limit = 8) {
  const map = {};
  for (const s of sets) {
    if (!s.completed) continue;
    const vol = (Number(s.weight_kg) || 0) * (Number(s.reps) || 0);
    if (!map[s.exercise_name]) map[s.exercise_name] = { name: s.exercise_name, volume: 0, sets: 0 };
    map[s.exercise_name].volume += vol;
    map[s.exercise_name].sets += 1;
  }
  return Object.values(map)
    .map((e) => ({ ...e, volume: Math.round(e.volume) }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit);
}

// Workout frequency: sessions per week for last 8 weeks
export function workoutFrequency(sessions) {
  const now = new Date();
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const end = new Date(now); end.setDate(now.getDate() - i * 7);
    const start = new Date(end); start.setDate(end.getDate() - 6);
    const sStart = localDateStr(start);
    const sEnd = localDateStr(end);
    const count = sessions.filter((s) => {
      const d = (s.date || '').slice(0, 10);
      return d >= sStart && d <= sEnd;
    }).length;
    weeks.push({ label: `${start.getMonth() + 1}/${start.getDate()}`, sessions: count });
  }
  return weeks;
}

// Training consistency: current streak + total days trained
export function trainingConsistency(sessions) {
  const dates = new Set(sessions.map((s) => (s.date || '').slice(0, 10)));
  let streak = 0;
  const cur = new Date();
  // Allow today or yesterday to start streak
  let check = new Date(cur);
  if (!dates.has(localDateStr(check))) {
    check.setDate(check.getDate() - 1);
    if (!dates.has(localDateStr(check))) {
      return { streak: 0, totalDays: dates.size };
    }
  }
  while (dates.has(localDateStr(check))) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  return { streak, totalDays: dates.size };
}

// PR progression: all PR sets chronologically
export function prProgression(sets, sessionsMap) {
  return sets
    .filter((s) => s.is_pr && s.completed)
    .map((s) => {
      const sess = sessionsMap[s.session_id];
      return {
        date: (sess?.date || s.created_date || '').slice(0, 10),
        exercise: s.exercise_name,
        weight: s.weight_kg,
        reps: s.reps,
        e1rm: s.estimated_1rm || 0,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Duration trend
export function durationTrend(sessions) {
  return sessions
    .filter((s) => s.duration_minutes)
    .map((s) => ({ date: (s.date || '').slice(0, 10), duration: s.duration_minutes }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-20);
}

// Cardio vs training: weekly cardio duration vs training duration
export function cardioVsTraining(sessions, cardio) {
  const now = new Date();
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const end = new Date(now); end.setDate(now.getDate() - i * 7);
    const start = new Date(end); start.setDate(end.getDate() - 6);
    const sStart = localDateStr(start);
    const sEnd = localDateStr(end);
    const trainMin = sessions
      .filter((s) => { const d = (s.date || '').slice(0, 10); return d >= sStart && d <= sEnd; })
      .reduce((a, s) => a + (s.duration_minutes || 0), 0);
    const cardioSec = cardio
      .filter((c) => { const d = (c.date || '').slice(0, 10); return d >= sStart && d <= sEnd; })
      .reduce((a, c) => a + (c.duration_seconds || 0), 0);
    weeks.push({
      label: `${start.getMonth() + 1}/${start.getDate()}`,
      training: Math.round(trainMin),
      cardio: Math.round(cardioSec / 60),
    });
  }
  return weeks;
}