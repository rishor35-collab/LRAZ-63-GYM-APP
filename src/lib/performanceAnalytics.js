// Performance Analytics engine — computes real, data-driven insights from the
// user's actual training, nutrition, recovery, and body data. Pure functions;
// no medical claims. All recovery/plateau/weak-point outputs are estimates.
import { estimate1RM } from './fitnessScience';
import { localDateStr, localDayOffset } from './utils';

export const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'];

// Ordered rules — first match wins. Specific muscles before broad ones.
const RULES = [
  { muscle: 'Biceps', kw: ['bicep', 'curl'] },
  { muscle: 'Triceps', kw: ['tricep', 'pushdown', 'skull', 'tricep extension'] },
  { muscle: 'Core', kw: ['leg raise', 'hanging leg', 'crunch', 'sit up', 'situp', 'plank', 'core', 'abs'] },
  { muscle: 'Hamstrings', kw: ['leg curl', 'romanian', 'rdl', 'hamstring', 'good morning'] },
  { muscle: 'Glutes', kw: ['glute', 'hip thrust', 'hip raise'] },
  { muscle: 'Calves', kw: ['calf'] },
  { muscle: 'Shoulders', kw: ['overhead', 'shoulder', 'lateral', 'raise', 'shrug', 'arnold'] },
  { muscle: 'Quads', kw: ['squat', 'leg press', 'leg extension', 'lunge', 'quad', 'bulgarian', 'goblet', 'split squat'] },
  { muscle: 'Chest', kw: ['bench', 'chest', 'fly', 'dip', 'push-up', 'push up', 'pushup', 'crossover'] },
  { muscle: 'Back', kw: ['row', 'pull', 'pulldown', 'chin', 'deadlift', 'face pull'] },
];

export function muscleGroupForExercise(name) {
  if (!name) return null;
  const n = name.toLowerCase();
  for (const r of RULES) {
    if (r.kw.some((k) => n.includes(k))) return r.muscle;
  }
  return null;
}

export function sessionDateMap(sessions) {
  const map = {};
  for (const s of sessions) {
    if (s?.id && s?.date) map[s.id] = new Date(s.date).getTime();
  }
  return map;
}

// Volume + set count per muscle over the last `days` days.
export function computeVolumeByMuscle(sessions, sets, days = 7) {
  const cutoff = Date.now() - days * 86400000;
  const dates = sessionDateMap(sessions);
  const vol = {};
  for (const s of sets) {
    if (!s) continue;
    const t = dates[s.session_id];
    if (!t || t < cutoff) continue;
    const w = Number(s.weight_kg), r = Number(s.reps);
    if (!isFinite(w) || !isFinite(r) || w < 0 || r < 0) continue; // ignore invalid records
    const m = muscleGroupForExercise(s.exercise_name);
    if (!m) continue;
    if (!vol[m]) vol[m] = { volume: 0, sets: 0 };
    vol[m].volume += w * r;
    vol[m].sets += 1;
  }
  return vol;
}

// Per-muscle recovery estimate from time since last trained + volume + soreness.
export function computeMuscleRecovery(sessions, sets, recovery) {
  const dates = sessionDateMap(sessions);
  const now = Date.now();
  const lastTrained = {};
  for (const s of sets) {
    const t = dates[s.session_id];
    if (!t) continue;
    const m = muscleGroupForExercise(s.exercise_name);
    if (!m) continue;
    if (!lastTrained[m] || t > lastTrained[m]) lastTrained[m] = t;
  }
  const weekly = computeVolumeByMuscle(sessions, sets, 7);
  const result = {};
  for (const m of MUSCLE_GROUPS) {
    const lt = lastTrained[m];
    const hoursSince = lt ? (now - lt) / 3600000 : null;
    const wv = weekly[m]?.volume || 0;
    let status = 'unknown';
    if (hoursSince != null) {
      if (hoursSince < 24) status = 'needs';
      else if (hoursSince < 48) status = 'partial';
      else if (hoursSince < 72) status = wv > 5000 ? 'partial' : 'ready';
      else status = 'ready';
      if (recovery?.soreness_level >= 7 && hoursSince < 48) status = 'needs';
    }
    result[m] = {
      status,
      hoursSince: hoursSince != null ? Math.round(hoursSince) : null,
      lastTrained: lt,
      weeklyVolume: Math.round(wv),
      weeklySets: weekly[m]?.sets || 0,
    };
  }
  return result;
}

// Readiness 0-100. Uses stored score if present, else estimates from signals.
export function computeReadiness(recovery, recentSessions) {
  if (recovery?.readiness_score != null) return Math.round(recovery.readiness_score);
  if (!recovery) return null;
  const sleepScore = Math.min(100, ((recovery.sleep_hours || 0) / 8) * 100);
  const sorenessScore = 100 - (recovery.soreness_level || 0) * 10;
  const energyScore = (recovery.energy || 5) * 10;
  const stressScore = 100 - (recovery.stress_level || 0) * 10;
  const score = sleepScore * 0.3 + sorenessScore * 0.25 + energyScore * 0.25 + stressScore * 0.2;
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Best lifts: top estimated 1RM, max weight, max reps per exercise.
export function computeBestLifts(sets) {
  const byEx = {};
  for (const s of sets) {
    if (!s || !s.exercise_name) continue;
    if (s.set_type === 'warmup') continue; // warm-ups aren't performance lifts
    const w = Number(s.weight_kg), r = Number(s.reps);
    if (!isFinite(w) || !isFinite(r) || w <= 0 || r < 1) continue; // ignore invalid/incomplete
    const e1rm = estimate1RM(w, r);
    const cur = byEx[s.exercise_name] || { exercise: s.exercise_name, maxWeight: 0, bestE1RM: 0, maxReps: 0 };
    cur.maxWeight = Math.max(cur.maxWeight, w);
    cur.bestE1RM = Math.max(cur.bestE1RM, e1rm || 0);
    cur.maxReps = Math.max(cur.maxReps, r);
    byEx[s.exercise_name] = cur;
  }
  return Object.values(byEx).sort((a, b) => b.bestE1RM - a.bestE1RM);
}

// Plateau detection: flat e1RM across last 5+ sessions of an exercise.
export function detectPlateaus(sessions, sets) {
  const dates = sessionDateMap(sessions);
  const byEx = {};
  for (const s of sets) {
    const t = dates[s.session_id];
    if (!t || !s.exercise_name) continue;
    const e1rm = estimate1RM(s.weight_kg, s.reps);
    if (!e1rm) continue;
    if (!byEx[s.exercise_name]) byEx[s.exercise_name] = {};
    byEx[s.exercise_name][t] = Math.max(byEx[s.exercise_name][t] || 0, e1rm);
  }
  const plateaus = [];
  for (const [ex, byDate] of Object.entries(byEx)) {
    const vals = Object.keys(byDate).sort().map((k) => byDate[k]);
    if (vals.length < 5) continue;
    const last5 = vals.slice(-5);
    const avg = last5.reduce((a, b) => a + b, 0) / last5.length;
    const range = Math.max(...last5) - Math.min(...last5);
    if (range < avg * 0.04 && last5[last5.length - 1] <= last5[0]) {
      plateaus.push({ exercise: ex, weeks: 5, e1rm: +avg.toFixed(1) });
    }
  }
  return plateaus;
}

// Weak points: muscles with < 50% of the max muscle's monthly volume.
export function detectWeakPoints(monthlyVolume) {
  const entries = MUSCLE_GROUPS.map((m) => ({ muscle: m, volume: monthlyVolume[m]?.volume || 0 }));
  const max = Math.max(...entries.map((e) => e.volume));
  if (!max) return [];
  return entries.filter((e) => e.volume < max * 0.5).map((e) => e.muscle);
}

// Nutrition trends over last `days` days.
export function computeNutritionTrends(logs, goal, days = 7) {
  const byDate = {};
  const add = (d, l) => {
    if (!byDate[d]) byDate[d] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    byDate[d].calories += Number.isFinite(l.calories) ? l.calories : 0;
    byDate[d].protein += Number.isFinite(l.protein_g) ? l.protein_g : 0;
    byDate[d].carbs += Number.isFinite(l.carbs_g) ? l.carbs_g : 0;
    byDate[d].fat += Number.isFinite(l.fat_g) ? l.fat_g : 0;
    byDate[d].fiber += Number.isFinite(l.fiber_g) ? l.fiber_g : 0;
  };
  for (const l of logs || []) {
    if (!l || !l.date) continue;
    add(l.date, l);
  }
  const cutoff = localDayOffset(-days);
  const recent = Object.entries(byDate).filter(([d]) => d >= cutoff).sort();
  const daysLogged = recent.length;
  const empty = { daysLogged: 0, avgCalories: null, avgProtein: null, avgCarbs: null, avgFat: null, avgFiber: null, proteinAdherence: null, proteinDaysHit: 0, calorieAdherence: null, calorieDaysHit: 0, sufficient: false, todayCalories: 0, todayProtein: 0 };
  if (!daysLogged) return empty;
  const sum = (k) => recent.reduce((a, [, v]) => a + v[k], 0);
  const avgCalories = Math.round(sum('calories') / daysLogged);
  const avgProtein = Math.round(sum('protein') / daysLogged);
  const avgCarbs = Math.round(sum('carbs') / daysLogged);
  const avgFat = Math.round(sum('fat') / daysLogged);
  const avgFiber = Math.round(sum('fiber') / daysLogged);
  const proTarget = goal?.protein_target_g || 0;
  const calTarget = goal?.calorie_target || 0;
  const proteinDaysHit = proTarget ? recent.filter(([, v]) => v.protein >= proTarget).length : 0;
  const proteinAdherence = proTarget ? proteinDaysHit / daysLogged : null;
  const calorieDaysHit = calTarget ? recent.filter(([, v]) => v.calories >= calTarget * 0.85 && v.calories <= calTarget * 1.15).length : 0;
  const calorieAdherence = calTarget ? calorieDaysHit / daysLogged : null;
  const today = localDateStr();
  const tv = byDate[today] || { calories: 0, protein: 0 };
  return { daysLogged, avgCalories, avgProtein, avgCarbs, avgFat, avgFiber, proteinAdherence, proteinDaysHit, calorieAdherence, calorieDaysHit, sufficient: daysLogged >= 3, todayCalories: Math.round(tv.calories), todayProtein: Math.round(tv.protein) };
}

// Performance DNA — estimated 0-100 scores from accumulated data.
export function computePerformanceDNA({ bestLifts, measurements, sessions, recovery, goal }) {
  const latestWeight = [...measurements].reverse().find((m) => m.weight_kg)?.weight_kg;
  const topE1RM = bestLifts[0]?.bestE1RM || 0;
  const strengthRatio = latestWeight ? topE1RM / latestWeight : 0;
  const strength = Math.min(100, Math.round(strengthRatio * 50));
  const workouts30 = sessions.filter((s) => s.status === 'completed' && Date.now() - new Date(s.date).getTime() < 30 * 86400000).length;
  const targetSessions = (goal?.days_per_week || 4) * 4;
  const consistency = Math.min(100, Math.round((workouts30 / targetSessions) * 100));
  const recoveryScore = recovery?.readiness_score ?? 70;
  const hypertrophy = Math.min(100, Math.round((bestLifts.length / 6) * 100));
  return { strength, hypertrophy, recovery: Math.round(recoveryScore), consistency };
}

// Today's workout recommendation from recovery + weak points + schedule.
export function recommendTodaysWorkout({ muscleRecovery, weakPoints, scheduledToday, lastWorkout }) {
  if (scheduledToday) return { focus: scheduledToday.title || scheduledToday.focus || 'Scheduled workout', reason: 'Pulled from your training schedule.', scheduled: true };
  const ready = MUSCLE_GROUPS.filter((m) => muscleRecovery[m]?.status === 'ready');
  const readyWeak = ready.filter((m) => weakPoints.includes(m));
  if (readyWeak.length) return { focus: `${readyWeak[0]} Focus`, reason: `${readyWeak[0]} is recovered and a current weak point — ideal time to bring it up.` };
  if (ready.length) return { focus: `${ready[0]} Focus`, reason: `${ready[0]} is fully recovered and ready to train.` };
  const needs = MUSCLE_GROUPS.filter((m) => muscleRecovery[m]?.status === 'needs');
  if (needs.length >= 6) return { focus: 'Rest Day', reason: 'Most muscle groups are still recovering. A rest day protects your progress.' };
  return { focus: 'Light Recovery', reason: 'No muscle is fully recovered yet — light technique work is fine.' };
}

// Data-driven insight generation. Returns up to `limit` insights.
export function generateInsights({ muscleRecovery, nutritionTrends, weakPoints, plateaus, goal, weights, weeklyRate }) {
  const out = [];
  const neglected = MUSCLE_GROUPS.filter((m) => (muscleRecovery[m]?.hoursSince != null && muscleRecovery[m].hoursSince > 7 * 24) || muscleRecovery[m]?.status === 'unknown');
  if (neglected.length) out.push({ icon: 'alert', title: `${neglected[0]} not trained this week`, body: `You haven't trained ${neglected[0]} in over 7 days. Consider scheduling a session this week.`, severity: 'warn' });

  if (nutritionTrends.proteinAdherence != null && nutritionTrends.proteinAdherence < 0.7 && nutritionTrends.daysLogged >= 3) {
    out.push({ icon: 'flame', title: 'Protein below target', body: `You hit your protein target on ${nutritionTrends.proteinDaysHit} of ${nutritionTrends.daysLogged} recent days. Aim for ${Math.round(goal?.protein_target_g || 0)}g daily.`, severity: 'warn' });
  }

  if (weakPoints.length) out.push({ icon: 'target', title: `Weak point: ${weakPoints[0]}`, body: `${weakPoints[0]} volume is well below your most-trained muscle. Add a set or session this week.`, severity: 'info' });

  if (plateaus.length) out.push({ icon: 'trending', title: `${plateaus[0].exercise} plateau`, body: `Estimated 1RM has been flat for ~${plateaus[0].weeks} weeks. Consider a deload or a rep-range change.`, severity: 'info' });

  if (goal && weeklyRate != null && weights.length >= 7) {
    if (goal.primary_goal === 'Fat Loss' && weeklyRate >= 0) out.push({ icon: 'scale', title: 'Weight not dropping', body: 'Average weight is stable while cutting. KAI suggests a small calorie review.', severity: 'warn' });
    if ((goal.primary_goal === 'Muscle Gain' || goal.primary_goal === 'Strength Gain') && weeklyRate <= 0) out.push({ icon: 'scale', title: 'Weight not rising', body: 'Weight is flat during a gaining phase. Consider +150–200 kcal/day.', severity: 'warn' });
  }

  return out.slice(0, 4);
}

// Readiness from raw check-in inputs (sleep, soreness, energy, stress, mood).
export function computeReadinessFromInputs(i) {
  const sleepScore = Math.min(100, ((i.sleep_hours || 0) / 8) * 100);
  const sorenessScore = 100 - (i.soreness_level || 0) * 10;
  const energyScore = (i.energy || 5) * 10;
  const stressScore = 100 - (i.stress_level || 0) * 10;
  const moodScore = (i.mood || 5) * 10;
  const score = sleepScore * 0.3 + sorenessScore * 0.2 + energyScore * 0.2 + stressScore * 0.15 + moodScore * 0.15;
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Deload recommendation from volume trend + recovery signals. Deterministic.
export function detectDeload({ weeklyVolumes, recovery }) {
  const reasons = [];
  let severity = 'none';
  const vols = (weeklyVolumes || []).slice(-4).map((w) => w.volume || 0);
  if (vols.length >= 4 && vols.every((v, i) => i === 0 || v >= vols[i - 1] * 0.97)) {
    reasons.push('Training volume has climbed for 4+ straight weeks — a deload reduces accumulated fatigue.');
    severity = 'recommended';
  }
  if (recovery?.readiness_score != null && recovery.readiness_score < 40) {
    reasons.push('Readiness is low — your body may benefit from lighter loading.');
    if (severity === 'none') severity = 'recommended';
  }
  if (recovery?.soreness_level >= 8) {
    reasons.push('Soreness is very high — a lighter week supports recovery.');
    if (severity === 'none') severity = 'suggested';
  }
  if (recovery?.sleep_quality != null && recovery.sleep_quality <= 3 && recovery?.sleep_hours < 6) {
    reasons.push('Sleep has been poor — recovery is compromised.');
    if (severity === 'none') severity = 'suggested';
  }
  return { recommended: reasons.length > 0, reasons, severity };
}

// Per-muscle volume landmarks (MEV/MAV/MRV) in weekly sets. Heuristic ranges.
export function volumeLandmarks(weeklyVolumeByMuscle) {
  const ranges = {
    'Chest': { mev: 6, mav: 14, mrv: 20 }, 'Back': { mev: 8, mav: 16, mrv: 22 }, 'Shoulders': { mev: 6, mav: 12, mrv: 16 },
    'Biceps': { mev: 4, mav: 8, mrv: 12 }, 'Triceps': { mev: 4, mav: 8, mrv: 12 }, 'Quads': { mev: 6, mav: 14, mrv: 20 },
    'Hamstrings': { mev: 4, mav: 8, mrv: 12 }, 'Glutes': { mev: 4, mav: 10, mrv: 16 }, 'Calves': { mev: 4, mav: 8, mrv: 12 }, 'Core': { mev: 4, mav: 8, mrv: 12 },
  };
  const out = {};
  for (const m of MUSCLE_GROUPS) {
    const r = ranges[m] || { mev: 6, mav: 12, mrv: 18 };
    const sets = weeklyVolumeByMuscle[m]?.sets || 0;
    let status = 'Undertrained';
    if (sets >= r.mrv) status = 'Overreaching';
    else if (sets >= r.mav) status = 'Optimal';
    else if (sets >= r.mev) status = 'Maintenance';
    out[m] = { ...r, sets, status };
  }
  return out;
}

// Push / pull classifier from exercise name keywords.
const PUSH_KW = ['bench', 'press', 'push', 'dip', 'fly', 'crossover', 'extension', 'pushdown', 'skull', 'lateral', 'raise', 'shrug', 'squat', 'lunge', 'leg press', 'leg extension', 'calf'];
const PULL_KW = ['row', 'pull', 'pulldown', 'chin', 'curl', 'deadlift', 'face pull', 'leg curl', 'hamstring', 'good morning', 'hip thrust'];
export function forceTypeForExercise(name) {
  if (!name) return null;
  const n = name.toLowerCase();
  if (PULL_KW.some((k) => n.includes(k))) return 'Pull';
  if (PUSH_KW.some((k) => n.includes(k))) return 'Push';
  return null;
}

// Training distribution across paired muscle groups. Deterministic volume balance.
export function computeTrainingDistribution(sessions, sets, days = 30) {
  const cutoff = Date.now() - days * 86400000;
  const dates = sessionDateMap(sessions);
  const vol = (test) => {
    let v = 0, s = 0;
    for (const set of sets) {
      const t = dates[set.session_id];
      if (!t || t < cutoff) continue;
      if (!test(set)) continue;
      v += (set.weight_kg || 0) * (set.reps || 0);
      s += 1;
    }
    return { volume: Math.round(v), sets: s };
  };
  const group = (g) => vol((set) => muscleGroupForExercise(set.exercise_name) === g);
  const push = vol((set) => forceTypeForExercise(set.exercise_name) === 'Push');
  const pull = vol((set) => forceTypeForExercise(set.exercise_name) === 'Pull');
  const chest = group('Chest'); const back = group('Back');
  const quads = group('Quads'); const hams = group('Hamstrings');
  const biceps = group('Biceps'); const triceps = group('Triceps');
  const upperGroups = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'];
  const lowerGroups = ['Quads', 'Hamstrings', 'Glutes', 'Calves'];
  const upper = vol((set) => upperGroups.includes(muscleGroupForExercise(set.exercise_name)));
  const lower = vol((set) => lowerGroups.includes(muscleGroupForExercise(set.exercise_name)));
  const frontDelt = vol((set) => { const n = (set.exercise_name || '').toLowerCase(); return n.includes('overhead') || n.includes('shoulder press') || n.includes('military') || n.includes('arnold') || n.includes('push press'); });
  const rearDelt = vol((set) => { const n = (set.exercise_name || '').toLowerCase(); return n.includes('face pull') || n.includes('rear delt') || n.includes('reverse fly') || n.includes('reverse pec'); });
  const pairs = [
    { name: 'Push / Pull', a: push, b: pull },
    { name: 'Chest / Back', a: chest, b: back },
    { name: 'Quads / Hamstrings', a: quads, b: hams },
    { name: 'Biceps / Triceps', a: biceps, b: triceps },
    { name: 'Upper / Lower', a: upper, b: lower },
    { name: 'Front / Rear Delts', a: frontDelt, b: rearDelt },
  ];
  const result = pairs.map((p) => {
    const total = p.a.volume + p.b.volume;
    const minor = Math.min(p.a.volume, p.b.volume);
    const major = Math.max(p.a.volume, p.b.volume);
    let balance = 'No data';
    if (total > 0) {
      const r = major ? minor / major : 0;
      balance = r >= 0.8 ? 'Balanced' : r >= 0.6 ? 'Slightly Imbalanced' : 'Imbalanced';
    }
    const ratio = total ? `${Math.round((p.a.volume / total) * 100)} / ${Math.round((p.b.volume / total) * 100)}` : '—';
    return { name: p.name, a: p.a, b: p.b, total, ratio, balance };
  });
  return { pairs: result, days };
}

// Post-workout Session Quality 0-100 — only measurable completion, sets, reps, RPE/RIR, volume.
export function computeSessionQuality({ blocks, totalVolume, completedSets, totalSets }) {
  const entered = totalSets || blocks.reduce((a, b) => a + b.sets.length, 0);
  const done = completedSets || blocks.reduce((a, b) => a + b.sets.filter((s) => s.completed).length, 0);
  const completion = entered ? Math.round((done / entered) * 100) : 0;
  let rpeLogged = 0;
  blocks.forEach((b) => b.sets.forEach((s) => { if (s.completed && (s.rpe || s.rir)) rpeLogged++; }));
  const rpeRatio = done ? Math.round((rpeLogged / done) * 100) : 0;
  const density = Math.min(100, Math.round((done / 6) * 100));
  const volScore = totalVolume > 0 ? 100 : 0;
  const score = Math.round(completion * 0.5 + rpeRatio * 0.2 + density * 0.2 + volScore * 0.1);
  const grade = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Fair' : 'Needs Work';
  const breakdown = [
    { label: 'Set completion', value: `${completion}%`, weight: '50%', detail: `${done} of ${entered} entered sets completed` },
    { label: 'RPE/RIR logging', value: `${rpeRatio}%`, weight: '20%', detail: `${rpeLogged} of ${done} completed sets logged an RPE/RIR` },
    { label: 'Working-set density', value: `${density}%`, weight: '20%', detail: `${done} completed sets (target ~6+ for a full session)` },
    { label: 'Volume recorded', value: totalVolume > 0 ? 'Yes' : 'No', weight: '10%', detail: `${Math.round(totalVolume)} kg total volume` },
  ];
  return { score, grade, breakdown };
}

// Weekly strength volume (weight × reps) for the last numWeeks weeks (Mon start).
export function computeWeeklyVolume(sessions, sets, numWeeks = 8) {
  const day = 86400000;
  const getWeekStart = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.getTime(); };
  const thisWeekStart = getWeekStart(new Date());
  const dates = sessionDateMap(sessions);
  const weeks = [];
  for (let i = numWeeks - 1; i >= 0; i--) { const start = thisWeekStart - i * 7 * day; weeks.push({ weekStart: start, volume: 0, sets: 0 }); }
  const byStart = Object.fromEntries(weeks.map((w) => [w.weekStart, w]));
  sets.forEach((s) => {
    const t = dates[s.session_id]; if (!t) return;
    const ws = getWeekStart(t); const w = byStart[ws]; if (!w) return;
    w.volume += (s.weight_kg || 0) * (s.reps || 0); w.sets += 1;
  });
  return weeks;
}

// Deterministic progression suggestion from a lifter's last completed sets for an exercise.
export function suggestProgression(lastSets, method = 'double', config = {}) {
  if (!lastSets || !lastSets.length) return null;
  const top = lastSets.reduce((a, s) => (estimate1RM(s.weight_kg, s.reps) || 0) > (estimate1RM(a.weight_kg, a.reps) || 0) ? s : a, lastSets[0]);
  const weight = top.weight_kg || 0;
  const reps = top.reps || 0;
  const inc = config.incrementKg || 2.5;
  const repLow = config.repLow || 8;
  const repHigh = config.repHigh || 12;
  switch (method) {
    case 'fixed':
      if (reps >= repHigh) return { method, action: 'increase-weight', newWeight: +(weight + inc).toFixed(1), newReps: repLow, reason: `Top set hit ${reps} reps (upper target ${repHigh}) — add ${inc} kg next session.` };
      return { method, action: 'add-reps', newWeight: weight, newReps: reps + 1, reason: `Top set ${reps} reps is below upper target ${repHigh} — add 1 rep next session.` };
    case 'percentage':
      if (reps >= repHigh) { const nw = +(weight * 1.025).toFixed(1); return { method, action: 'increase-weight', newWeight: nw, newReps: repLow, reason: `Top set hit ${repHigh} reps — +2.5% → ${nw} kg next session.` }; }
      return { method, action: 'add-reps', newWeight: weight, newReps: reps + 1, reason: `Below upper target — add 1 rep next session.` };
    case 'reps':
      return { method, action: 'add-reps', newWeight: weight, newReps: reps + 1, reason: `Rep-focused progression: add 1 rep at ${weight} kg.` };
    case 'rir':
      return { method, action: 'reduce-rir', newWeight: weight, newReps: reps, newRir: Math.max(0, (config.rirTarget || 2) - 1), reason: `Reduce target RIR by 1 next session to push closer to failure.` };
    case 'double':
    default:
      if (reps >= repHigh) return { method, action: 'increase-weight', newWeight: +(weight + inc).toFixed(1), newReps: repLow, reason: `Double progression: top set reached ${reps} reps (upper target ${repHigh}) — increase weight ${inc} kg and drop reps to ${repLow}.` };
      return { method, action: 'add-reps', newWeight: weight, newReps: reps + 1, reason: `Double progression: ${reps} reps below upper target ${repHigh} — add 1 rep before increasing weight.` };
  }
}

// Next-time progression suggestions per exercise from the most recent completed session.
export function computeProgressionSuggestions(sessions, sets, limit = 6) {
  const dates = sessionDateMap(sessions);
  const completed = sessions.filter((s) => s.status === 'completed' && dates[s.id]).sort((a, b) => dates[b.id] - dates[a.id]);
  if (!completed.length) return [];
  const last = completed[0];
  const byEx = {};
  sets.filter((s) => s.session_id === last.id && s.exercise_name).forEach((s) => { (byEx[s.exercise_name] ||= []).push(s); });
  const out = [];
  Object.entries(byEx).forEach(([ex, exSets]) => {
    const sug = suggestProgression(exSets, 'double', {});
    if (sug) out.push({ exercise: ex, lastWeight: exSets[0].weight_kg, lastReps: exSets[0].reps, ...sug });
  });
  return out.slice(0, limit);
}

// Rep-range distribution over the last `days` days. Buckets: 1-5, 6-8, 9-12, 13-20, 21+.
export function computeRepRangeDistribution(sets, sessions, days = 90) {
  const cutoff = Date.now() - days * 86400000;
  const dates = sessionDateMap(sessions);
  const buckets = { '1-5': 0, '6-8': 0, '9-12': 0, '13-20': 0, '21+': 0 };
  let total = 0;
  sets.forEach((s) => {
    const t = dates[s.session_id]; if (!t || t < cutoff) return;
    const r = s.reps; if (!r) return;
    const b = r <= 5 ? '1-5' : r <= 8 ? '6-8' : r <= 12 ? '9-12' : r <= 20 ? '13-20' : '21+';
    buckets[b]++; total++;
  });
  return { buckets, total };
}

// Muscle training frequency: sessions per muscle averaged over N weeks.
export function computeMuscleFrequency(sessions, sets, weeks) {
  const cutoff = Date.now() - weeks * 7 * 86400000;
  const dates = sessionDateMap(sessions);
  const counts = {};
  MUSCLE_GROUPS.forEach((m) => (counts[m] = 0));
  const seen = new Set();
  sets.forEach((s) => {
    const t = dates[s.session_id]; if (!t || t < cutoff) return;
    const m = muscleGroupForExercise(s.exercise_name); if (!m) return;
    const key = s.session_id + '|' + m; if (seen.has(key)) return;
    seen.add(key); counts[m]++;
  });
  const out = {};
  MUSCLE_GROUPS.forEach((m) => { out[m] = { sessions: counts[m], perWeek: +(counts[m] / weeks).toFixed(1) }; });
  return out;
}

// Goal status from weight trend vs goal direction. Deterministic thresholds.
export function computeGoalStatus(goal, weights) {
  if (!goal) return null;
  const w = (weights || []).filter((x) => x != null && isFinite(x));
  if (w.length < 2) return { status: 'Needs Attention', label: 'Not enough data', detail: 'Log more weigh-ins to assess progress.' };
  const recent = w.slice(-7), prior = w.slice(-14, -7);
  if (!prior.length) return { status: 'On Track', label: 'Tracking started', detail: 'Keep logging to measure your trend.' };
  const rAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const pAvg = prior.reduce((a, b) => a + b, 0) / prior.length;
  const weeklyRate = +(rAvg - pAvg).toFixed(2);
  const target = goal.target_weight_kg;
  const start = goal.starting_weight_kg || weights[0];
  const goalDir = target && start ? (target > start ? 1 : -1) : (goal.primary_goal === 'Fat Loss' ? -1 : 1);
  const actualDir = Math.sign(weeklyRate) || 0;
  let status, label, detail;
  if (actualDir === goalDir && Math.abs(weeklyRate) >= 0.5) { status = 'Ahead'; label = `${weeklyRate > 0 ? '+' : ''}${weeklyRate} kg/week`; detail = 'Progressing faster than the moderate target rate.'; }
  else if (actualDir === goalDir && Math.abs(weeklyRate) >= 0.2) { status = 'On Track'; label = `${weeklyRate > 0 ? '+' : ''}${weeklyRate} kg/week`; detail = 'Moving in the right direction at a healthy rate.'; }
  else if (Math.abs(weeklyRate) < 0.2) { status = 'Slightly Behind'; label = 'Stalling'; detail = 'Weight trend is flat — review nutrition or training.'; }
  else { status = 'Needs Attention'; label = 'Wrong direction'; detail = 'Trend is moving against your goal — adjust calories or activity.'; }
  return { status, label, detail, weeklyRate };
}

// Unified Personal Best timeline across strength, cardio, and weight.
export function computePersonalBestTimeline(sessions, sets, measurements, cardioSessions) {
  const events = [];
  const dates = sessionDateMap(sessions);
  const maxByEx = {};
  sets.forEach((s) => {
    const t = dates[s.session_id]; if (!t || !s.exercise_name) return;
    const w = s.weight_kg || 0;
    if (w > (maxByEx[s.exercise_name] || 0)) { maxByEx[s.exercise_name] = w; events.push({ type: 'strength', date: new Date(t).toISOString(), label: s.exercise_name, value: `${w} kg`, sort: t }); }
  });
  (cardioSessions || []).forEach((s) => { if (s.distance_km > 0) events.push({ type: 'cardio', date: s.date, label: s.activity_label || 'Cardio', value: `${s.distance_km} km`, sort: new Date(s.date).getTime() }); });
  (measurements || []).forEach((m) => { if (m.weight_kg) events.push({ type: 'weight', date: m.date, label: 'Weigh-in', value: `${m.weight_kg} kg`, sort: new Date(m.date).getTime() }); });
  return events.sort((a, b) => b.sort - a.sort).slice(0, 50);
}

// Recovery history aggregation over a range (7d / 30d / 3m / 6m). Deterministic averages.
export function computeRecoveryHistory(records, range) {
  const days = { '7d': 7, '30d': 30, '3m': 90, '6m': 182 }[range] || 30;
  const cutoff = Date.now() - days * 86400000;
  const inRange = (records || []).filter((r) => r.date && new Date(r.date).getTime() >= cutoff);
  if (!inRange.length) return { count: 0, avgSleep: null, avgReadiness: null, avgRestingHr: null, avgSoreness: null };
  const avg = (arr) => { const v = arr.filter(Boolean); return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : null; };
  return {
    count: inRange.length,
    avgSleep: avg(inRange.map((r) => r.sleep_hours)),
    avgReadiness: avg(inRange.map((r) => r.readiness_score)),
    avgRestingHr: avg(inRange.map((r) => r.resting_hr)),
    avgSoreness: avg(inRange.map((r) => r.soreness_level)),
  };
}

// Current vs previous comparable completed session. Deterministic deltas.
export function compareLastSessions(sessions, sets) {
  const dates = sessionDateMap(sessions);
  const completed = sessions.filter((s) => s.status === 'completed' && dates[s.id]).sort((a, b) => dates[b.id] - dates[a.id]);
  if (completed.length < 2) return null;
  const prev = completed[1], curr = completed[0];
  const setsOf = (sid) => sets.filter((s) => s.session_id === sid);
  const vol = (sid) => setsOf(sid).reduce((a, s) => a + (s.weight_kg || 0) * (s.reps || 0), 0);
  const topE = (sid) => setsOf(sid).reduce((a, s) => Math.max(a, estimate1RM(s.weight_kg, s.reps) || 0), 0);
  const cv = vol(curr.id), pv = vol(prev.id);
  return {
    curr: { name: curr.name, date: curr.date, volume: Math.round(cv), sets: setsOf(curr.id).length, topE1RM: Math.round(topE(curr.id)) },
    prev: { name: prev.name, date: prev.date, volume: Math.round(pv), sets: setsOf(prev.id).length, topE1RM: Math.round(topE(prev.id)) },
    volumeDelta: Math.round(cv - pv),
    setsDelta: setsOf(curr.id).length - setsOf(prev.id).length,
    e1rmDelta: Math.round(topE(curr.id) - topE(prev.id)),
  };
}

// Equipment-based substitutions: exercises matching the same movement pattern + primary muscle,
// optionally filtered to those whose equipment is available in the user's profile.
export function findSubstitutions(exercise, allExercises, equipmentProfile) {
  if (!exercise || !allExercises) return [];
  const same = allExercises.filter((e) => e.id !== exercise.id && e.movement_pattern === exercise.movement_pattern && e.primary_muscle === exercise.primary_muscle);
  let pool = same;
  if (equipmentProfile && equipmentProfile.length) {
    const matches = same.filter((e) => !e.equipment?.length || e.equipment.some((eq) => equipmentProfile.includes(eq)));
    pool = matches.length ? matches : same;
  }
  return pool.slice(0, 6);
}

// Historical progressive-overload metric per exercise: compares the average
// top-set e1RM of the recent `recentN` sessions vs the prior `priorN` sessions.
// Returns [] when there isn't enough data. Deterministic from logged sets.
export function computeProgressiveOverload(sessions, sets, { recentN = 4, priorN = 4 } = {}) {
  const dates = sessionDateMap(sessions);
  const byEx = {};
  for (const s of sets) {
    if (!s || !s.exercise_name || s.set_type === 'warmup') continue;
    const t = dates[s.session_id];
    if (!t) continue;
    const w = Number(s.weight_kg), r = Number(s.reps);
    if (!isFinite(w) || !isFinite(r) || w <= 0 || r < 1) continue;
    const e1rm = estimate1RM(w, r);
    if (!e1rm) continue;
    (byEx[s.exercise_name] ||= []).push({ t, e1rm });
  }
  const out = [];
  for (const [ex, arr] of Object.entries(byEx)) {
    const perSession = {};
    arr.forEach((p) => { perSession[p.t] = Math.max(perSession[p.t] || 0, p.e1rm); });
    const vals = Object.keys(perSession).sort((a, b) => Number(a) - Number(b)).map((k) => perSession[k]);
    if (vals.length < recentN + priorN) continue;
    const recent = vals.slice(-recentN);
    const prior = vals.slice(-(recentN + priorN), -recentN);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const priorAvg = prior.reduce((a, b) => a + b, 0) / prior.length;
    const delta = +(recentAvg - priorAvg).toFixed(1);
    const pct = priorAvg ? +((delta / priorAvg) * 100).toFixed(1) : null;
    out.push({ exercise: ex, recentAvg: +recentAvg.toFixed(1), priorAvg: +priorAvg.toFixed(1), delta, pct, sessions: vals.length });
  }
  return out.sort((a, b) => (b.pct || 0) - (a.pct || 0));
}

// Per-exercise trend series (best e1RM + total volume by session date) for charting.
export function computeExerciseTrends(sessions, sets, exerciseName) {
  if (!exerciseName) return [];
  const dates = sessionDateMap(sessions);
  const rows = [];
  for (const s of sets) {
    if (!s || s.exercise_name !== exerciseName || s.set_type === 'warmup') continue;
    const t = dates[s.session_id];
    if (!t) continue;
    const w = Number(s.weight_kg), r = Number(s.reps);
    if (!isFinite(w) || !isFinite(r) || w <= 0 || r < 1) continue;
    rows.push({ t, e1rm: estimate1RM(w, r) || 0, volume: w * r });
  }
  rows.sort((a, b) => a.t - b.t);
  const bySession = {};
  rows.forEach((row) => {
    if (!bySession[row.t]) bySession[row.t] = { date: new Date(row.t).toISOString(), e1rm: 0, volume: 0 };
    bySession[row.t].e1rm = Math.max(bySession[row.t].e1rm, row.e1rm);
    bySession[row.t].volume += row.volume;
  });
  return Object.values(bySession);
}