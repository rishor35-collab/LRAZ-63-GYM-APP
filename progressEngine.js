// Consolidated deterministic progress engine — upgrades the app's progress
// calculations with input validation, rolling/smoothed averages, equivalent-
// period comparisons, and explicit sufficient-data rules. No AI, no credits.
// Every value is reproducible from stored records with a clear formula; when
// there isn't enough data, callers get { sufficient: false, note: 'Not enough data yet' }.
import { smoothedAverage } from './fitnessScience';
import { sessionDateMap, computeBestLifts, computeProgressiveOverload } from './performanceAnalytics';
import { computeCardioProgress, detectCardioPRs, aggregateHistory, rangeCutoff } from './cardioAnalytics';
import { localDateStr, localDayOffset } from './utils';

const DAY = 86400000;
const WEEK = 7 * DAY;
const NOT_ENOUGH = 'Not enough data yet';

// Strength progress over `days`: volume, top e1RM, PR count, weekly frequency,
// consistency, exercises trained, and progressive-overload leaders.
export function computeStrengthProgress(sessions, sets, days = 30) {
  const cutoff = Date.now() - days * DAY;
  const dates = sessionDateMap(sessions);
  const inRange = (sessions || []).filter((s) => s.status === 'completed' && dates[s.id] && dates[s.id] >= cutoff);
  const setsInRange = (sets || []).filter((s) => dates[s.session_id] != null && dates[s.session_id] >= cutoff);
  if (!inRange.length) return { sufficient: false, note: NOT_ENOUGH };

  let totalVolume = 0;
  for (const s of setsInRange) {
    const w = Number(s.weight_kg), r = Number(s.reps);
    if (!isFinite(w) || !isFinite(r) || w < 0 || r < 0) continue; // ignore invalid
    totalVolume += w * r;
  }
  const validSets = setsInRange.filter((s) => {
    const w = Number(s.weight_kg), r = Number(s.reps);
    return isFinite(w) && isFinite(r) && w > 0 && r >= 1 && s.set_type !== 'warmup';
  });
  const bestLifts = computeBestLifts(validSets);
  const topE1RM = bestLifts[0]?.bestE1RM || 0;
  const prCount = setsInRange.filter((s) => s.is_pr).length + inRange.reduce((a, s) => a + (s.pr_count || 0), 0);
  const weeks = days / 7;
  const frequency = +(inRange.length / weeks).toFixed(1);
  // consistency: fraction of weeks that had at least one session
  const weekSet = new Set(inRange.map((s) => Math.floor((dates[s.id] - (Date.now() - days * DAY)) / WEEK)));
  const consistency = inRange.length ? Math.min(100, Math.round((weekSet.size / weeks) * 100)) : 0;
  const overload = computeProgressiveOverload(sessions, sets, { recentN: 4, priorN: 4 });
  return {
    sufficient: true,
    sessions: inRange.length,
    totalVolume: Math.round(totalVolume),
    topE1RM: Math.round(topE1RM),
    prCount,
    frequencyPerWeek: frequency,
    consistencyPct: consistency,
    exercisesTrained: bestLifts.length,
    progressiveOverload: overload.slice(0, 5),
    bestLifts: bestLifts.slice(0, 6),
  };
}

// Body progress: smoothed trend weight, start/current, equivalent-period
// comparison (recent half vs prior half), and weekly rate from the span.
export function computeBodyProgress(measurements, days = 90) {
  const cutoff = Date.now() - days * DAY;
  const pts = (measurements || [])
    .filter((m) => m.weight_kg && m.date && new Date(m.date).getTime() >= cutoff)
    .map((m) => ({ w: Number(m.weight_kg), t: new Date(m.date).getTime() }))
    .filter((p) => isFinite(p.w))
    .sort((a, b) => a.t - b.t);
  if (pts.length < 2) return { sufficient: false, note: NOT_ENOUGH };
  const weights = pts.map((p) => p.w);
  const trend = smoothedAverage(weights, 7);
  const half = Math.floor(pts.length / 2);
  const recentW = pts.slice(half);
  const priorW = pts.slice(0, half);
  const recentAvg = recentW.reduce((a, p) => a + p.w, 0) / recentW.length;
  const priorAvg = priorW.length ? priorW.reduce((a, p) => a + p.w, 0) / priorW.length : null;
  const change = priorAvg != null ? +(recentAvg - priorAvg).toFixed(1) : null;
  const first = pts[0], last = pts[pts.length - 1];
  const spanWeeks = (last.t - first.t) / WEEK;
  return {
    sufficient: true,
    count: pts.length,
    trendWeight: trend,
    startWeight: first.w,
    currentWeight: last.w,
    recentAvg: +recentAvg.toFixed(1),
    priorAvg: priorAvg != null ? +priorAvg.toFixed(1) : null,
    change,
    weeklyRate: change != null && spanWeeks > 0 ? +((last.w - first.w) / spanWeeks).toFixed(2) : null,
  };
}

// Nutrition progress: calorie/macro averages and adherence from logged days.
export function computeNutritionProgress(logs, goal, days = 30) {
  const cutoff = localDayOffset(-days);
  const byDate = {};
  for (const l of logs || []) {
    if (!l || !l.date || l.date < cutoff) continue;
    if (!byDate[l.date]) byDate[l.date] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    byDate[l.date].calories += Number.isFinite(l.calories) ? l.calories : 0;
    byDate[l.date].protein += Number.isFinite(l.protein_g) ? l.protein_g : 0;
    byDate[l.date].carbs += Number.isFinite(l.carbs_g) ? l.carbs_g : 0;
    byDate[l.date].fat += Number.isFinite(l.fat_g) ? l.fat_g : 0;
    byDate[l.date].fiber += Number.isFinite(l.fiber_g) ? l.fiber_g : 0;
  }
  const entries = Object.values(byDate);
  if (entries.length < 3) return { sufficient: false, note: NOT_ENOUGH, daysLogged: entries.length };
  const avg = (k) => Math.round(entries.reduce((a, e) => a + e[k], 0) / entries.length);
  const proTarget = goal?.protein_target_g || 0;
  const calTarget = goal?.calorie_target || 0;
  const proteinDaysHit = proTarget ? entries.filter((e) => e.protein >= proTarget * 0.9).length : 0;
  const calorieDaysHit = calTarget ? entries.filter((e) => e.calories >= calTarget * 0.85 && e.calories <= calTarget * 1.15).length : 0;
  return {
    sufficient: true,
    daysLogged: entries.length,
    avgCalories: avg('calories'),
    avgProtein: avg('protein'),
    avgCarbs: avg('carbs'),
    avgFat: avg('fat'),
    avgFiber: avg('fiber'),
    proteinAdherence: proTarget ? Math.round((proteinDaysHit / entries.length) * 100) : null,
    calorieAdherence: calTarget ? Math.round((calorieDaysHit / entries.length) * 100) : null,
  };
}

// Recovery progress: logging completion rate, current streak, and smoothed
// averages of sleep, readiness, soreness, and energy over the window.
export function computeRecoveryProgress(records, days = 30) {
  const cutoff = Date.now() - days * DAY;
  const inRange = (records || [])
    .filter((r) => r.date && new Date(r.date).getTime() >= cutoff)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  if (!inRange.length) return { sufficient: false, note: NOT_ENOUGH };
  const dayKeys = new Set(inRange.map((r) => localDateStr(r.date)));
  const completionRate = Math.min(100, Math.round((dayKeys.size / days) * 100));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let streak = 0;
  for (let i = 0; i < days; i++) {
    const k = localDateStr(new Date(today.getTime() - i * DAY));
    if (dayKeys.has(k)) streak++;
    else if (i > 0) break; // allow today missing, break on a prior missing day
  }
  const avg = (k) => {
    const v = inRange.map((r) => Number(r[k])).filter((x) => isFinite(x));
    return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : null;
  };
  return {
    sufficient: true,
    entries: inRange.length,
    daysLogged: dayKeys.size,
    completionRate,
    currentStreak: streak,
    avgSleep: avg('sleep_hours'),
    avgReadiness: avg('readiness_score'),
    avgSoreness: avg('soreness_level'),
    avgEnergy: avg('energy'),
  };
}

// Habit progress: per-habit completion count, completion rate, and current streak.
export function computeHabitProgress(habits, habitLogs, days = 30) {
  const cutoff = localDayOffset(-days);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const active = (habits || []).filter((h) => h.active);
  if (!active.length) return { sufficient: false, note: NOT_ENOUGH, habits: [] };
  const logsByHabit = {};
  (habitLogs || []).forEach((l) => {
    if (!l || !l.habit_id || !l.date || l.date < cutoff || !l.completed) return;
    (logsByHabit[l.habit_id] ||= new Set()).add(l.date);
  });
  const habitsOut = active.map((h) => {
    const doneSet = logsByHabit[h.id] || new Set();
    const doneCount = doneSet.size;
    const completionRate = Math.min(100, Math.round((doneCount / days) * 100));
    let streak = 0;
    for (let i = 0; i < days; i++) {
      const k = localDateStr(new Date(today.getTime() - i * DAY));
      if (doneSet.has(k)) streak++;
      else if (i > 0) break;
    }
    return { id: h.id, name: h.name, doneCount, completionRate, currentStreak: streak };
  });
  return { sufficient: true, habits: habitsOut };
}

// Re-export the cardio helpers so callers can import all progress calcs from one place.
export { computeCardioProgress, detectCardioPRs, aggregateHistory, rangeCutoff };