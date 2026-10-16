// Deterministic Goal Journey & contribution analytics. Zero AI.
// All values come from database records + formulas. No causal claims are made.

const DAY = 86400000;
const WEEK = 7 * DAY;

export function weeksBetween(a, b) {
  return Math.max(0.01, (new Date(b) - new Date(a)) / WEEK);
}

// 7-day moving average of the most recent weights (trend weight).
// 7-day moving average of the most recent weigh-ins (trend weight). Measurements
// are sorted newest-first so the average reflects the latest week, not array order.
export function trendWeight(measurements) {
  const pts = (measurements || [])
    .filter((m) => m.weight_kg && m.date)
    .map((m) => ({ w: Number(m.weight_kg), t: new Date(m.date).getTime() }))
    .filter((p) => isFinite(p.w))
    .sort((a, b) => b.t - a.t);
  if (!pts.length) return null;
  const recent = pts.slice(0, 7);
  return +(recent.reduce((a, p) => a + p.w, 0) / recent.length).toFixed(1);
}

// Average weekly rate of weight change (kg/week) over the period, using a 4-week recent window.
// Average weekly rate of weight change (kg/week). Uses two equivalent windows
// (recent vs prior, up to 8 points each) and their midpoint distance so a single
// off-day doesn't dominate. Falls back to first/last when not enough points.
export function weeklyRate(measurements, startDate) {
  const pts = (measurements || [])
    .filter((m) => m.weight_kg && m.date && new Date(m.date) >= new Date(startDate))
    .map((m) => ({ w: Number(m.weight_kg), d: m.date }))
    .filter((p) => isFinite(p.w))
    .sort((a, b) => new Date(a.d) - new Date(b.d));
  if (pts.length < 2) return 0;
  const n = pts.length;
  const half = Math.min(8, Math.floor(n / 2));
  if (n < half * 2 || half < 1) {
    const first = pts[0], last = pts[n - 1];
    const wks = weeksBetween(first.d, last.d);
    if (wks < 0.5) return 0;
    return (last.w - first.w) / wks;
  }
  const recent = pts.slice(n - half, n);
  const prior = pts.slice(n - half * 2, n - half);
  const recentAvg = recent.reduce((a, p) => a + p.w, 0) / half;
  const priorAvg = prior.reduce((a, p) => a + p.w, 0) / half;
  const recentMid = new Date(recent[Math.floor(half / 2)].d).getTime();
  const priorMid = new Date(prior[Math.floor(half / 2)].d).getTime();
  const wks = weeksBetween(new Date(priorMid), new Date(recentMid));
  if (wks < 0.5) return 0;
  return (recentAvg - priorAvg) / wks; // negative = loss
}

function targetRateFor(goal) {
  const pref = goal?.rate_preference || 'Moderate';
  const map = { Conservative: 0.25, Moderate: 0.5, Faster: 0.75 };
  return map[pref] ?? 0.5;
}

export function computeJourney({ goal, measurements, workouts, sets, cardio, nutrition, scheduled, programDaysPerWeek }) {
  if (!goal) return null;
  const start = goal.created_at ? new Date(goal.created_at) : new Date(Date.now() - 30 * DAY);
  const now = new Date();
  const weeksElapsed = weeksBetween(start, now);
  const totalDays = Math.max(1, Math.round((now - start) / DAY));

  const isLoss = goal.primary_goal === 'Fat Loss' || (goal.target_weight_kg && goal.starting_weight_kg && goal.target_weight_kg < goal.starting_weight_kg);
  const isGain = goal.primary_goal === 'Muscle Gain' || (goal.target_weight_kg && goal.starting_weight_kg && goal.target_weight_kg > goal.starting_weight_kg);

  // Weight points in period
  const weightPts = (measurements || [])
    .filter((m) => m.weight_kg && new Date(m.date) >= start)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const startWeight = goal.starting_weight_kg || weightPts[0]?.weight_kg || null;
  const currentWeight = weightPts[weightPts.length - 1]?.weight_kg || null;
  const targetWeight = goal.target_weight_kg || null;

  let progressPct = 0;
  if (startWeight != null && currentWeight != null && targetWeight != null && startWeight !== targetWeight) {
    if (isLoss) progressPct = ((startWeight - currentWeight) / (startWeight - targetWeight)) * 100;
    else progressPct = ((currentWeight - startWeight) / (targetWeight - startWeight)) * 100;
    progressPct = Math.max(0, Math.min(100, progressPct));
  }

  const change = (startWeight != null && currentWeight != null) ? (currentWeight - startWeight) : null;
  const remaining = (currentWeight != null && targetWeight != null) ? Math.abs(currentWeight - targetWeight) : null;

  // Rate + projection
  const rate = weeklyRate(measurements, start); // kg/week (negative = loss)
  const absRate = Math.abs(rate);
  let projectedDate = null;
  if (remaining != null && absRate > 0.05) {
    const weeksToGoal = remaining / absRate;
    projectedDate = new Date(now.getTime() + weeksToGoal * WEEK);
  }

  // Status
  const targetRate = targetRateFor(goal);
  const actualRate = isLoss ? -rate : rate; // positive = progressing toward goal
  let status = 'On Track', statusReason = '';
  if (targetWeight != null && startWeight != null) {
    if (actualRate >= targetRate * 1.1) { status = 'Ahead'; statusReason = `Your recent trend (~${Math.abs(rate).toFixed(2)} kg/week) is faster than your ${goal.rate_preference?.toLowerCase() || 'moderate'} target (~${targetRate} kg/week).`; }
    else if (actualRate >= targetRate * 0.9) { status = 'On Track'; statusReason = `Your recent trend (~${Math.abs(rate).toFixed(2)} kg/week) is close to your ${goal.rate_preference?.toLowerCase() || 'moderate'} target (~${targetRate} kg/week).`; }
    else if (actualRate >= targetRate * 0.5) { status = 'Slightly Behind'; statusReason = `Your recent trend (~${Math.abs(rate).toFixed(2)} kg/week) is below your target (~${targetRate} kg/week).`; }
    else { status = 'Needs Attention'; statusReason = actualRate <= 0 ? `Weight is not yet moving toward your target over the recent window.` : `Your recent trend (~${Math.abs(rate).toFixed(2)} kg/week) is well below your target (~${targetRate} kg/week).`; }
  }

  // ---- Cardio contributors ----
  const cardioIn = (cardio || []).filter((c) => new Date(c.date) >= start);
  const cardioSeconds = cardioIn.reduce((a, c) => a + (c.duration_seconds || 0), 0);
  const cardioDistance = cardioIn.reduce((a, c) => a + (c.distance_km || 0), 0);
  const cardioCalories = cardioIn.reduce((a, c) => a + (c.calories || 0), 0);
  const cardioEst = cardioIn.filter((c) => c.calorie_source === 'Estimated').reduce((a, c) => a + (c.calories || 0), 0);
  const cardioRec = cardioIn.filter((c) => c.calorie_source !== 'Estimated').reduce((a, c) => a + (c.calories || 0), 0);

  // ---- Strength contributors ----
  const workoutsIn = (workouts || []).filter((w) => new Date(w.date) >= start);
  const completedWorkouts = workoutsIn.filter((w) => w.status === 'completed' || w.status === 'in_progress');
  const setsIn = (sets || []).filter((s) => new Date(s.created_date) >= start);
  const totalSets = setsIn.length;
  const exercisesCompleted = new Set(setsIn.map((s) => s.exercise_name?.toLowerCase()).filter(Boolean)).size;
  const totalVolume = setsIn.reduce((a, s) => a + ((s.weight_kg || 0) * (s.reps || 0)), 0);
  const prs = setsIn.filter((s) => s.is_pr).length + workoutsIn.reduce((a, w) => a + (w.pr_count || 0), 0);

  // Training adherence
  const scheduledIn = (scheduled || []).filter((s) => new Date(s.date) >= start && new Date(s.date) <= now);
  let adherence = null, plannedWorkouts = 0;
  if (scheduledIn.length > 0) {
    plannedWorkouts = scheduledIn.length;
    adherence = scheduledIn.filter((s) => s.completed).length / plannedWorkouts;
  } else {
    const freq = programDaysPerWeek || 3;
    plannedWorkouts = Math.round(freq * weeksElapsed);
    adherence = plannedWorkouts > 0 ? Math.min(1, completedWorkouts.length / plannedWorkouts) : 0;
  }

  // ---- Nutrition contributors ----
  const byDay = {};
  (nutrition || []).forEach((n) => {
    if (!n.date) return;
    const d = n.date.slice(0, 10);
    if (new Date(d) < start) return;
    if (!byDay[d]) byDay[d] = { calories: 0, protein: 0 };
    byDay[d].calories += n.calories || 0;
    byDay[d].protein += n.protein_g || 0;
  });
  const loggingDays = Object.keys(byDay).length;
  const dailyVals = Object.values(byDay);
  const avgCalories = dailyVals.length ? dailyVals.reduce((a, d) => a + d.calories, 0) / dailyVals.length : 0;
  const avgProtein = dailyVals.length ? dailyVals.reduce((a, d) => a + d.protein, 0) / dailyVals.length : 0;
  const proteinTarget = goal.protein_target_g || 0;
  const proteinGoalDays = proteinTarget ? dailyVals.filter((d) => d.protein >= proteinTarget * 0.9).length : 0;
  const calorieTarget = goal.calorie_target || 0;
  const calorieGoalDays = calorieTarget ? dailyVals.filter((d) => d.calories >= calorieTarget * 0.85 && d.calories <= calorieTarget * 1.15).length : 0;
  const nutritionAdherence = loggingDays ? proteinGoalDays / loggingDays : 0;

  const measurementCount = weightPts.length;

  return {
    goal, start, now, weeksElapsed, totalDays,
    isLoss, isGain,
    startWeight, currentWeight, targetWeight,
    progressPct, change, remaining,
    weightTimeline: weightPts,
    trendWt: trendWeight(measurements),
    rate, projectedDate, status, statusReason,
    cardio: { sessions: cardioIn.length, totalSeconds: cardioSeconds, distance: cardioDistance, calories: cardioCalories, est: cardioEst, rec: cardioRec, avgPerWeek: cardioIn.length / weeksElapsed },
    strength: { workouts: completedWorkouts.length, exercises: exercisesCompleted, sets: totalSets, volume: totalVolume, prs, adherence, planned: plannedWorkouts },
    nutrition: { avgCalories, avgProtein, loggingDays, proteinGoalDays, calorieGoalDays, adherence: nutritionAdherence, proteinTarget, calorieTarget },
    body: { start: startWeight, finish: currentWeight, change, entries: measurementCount },
    habits: {
      strengthSessions: completedWorkouts.length,
      cardioSessions: cardioIn.length,
      nutritionTracking: { done: loggingDays, total: totalDays },
      proteinGoal: { done: proteinGoalDays, total: totalDays },
      weightLogs: measurementCount,
    },
  };
}

export function fmtKg(v) { return v == null ? '—' : `${(Math.round(v * 10) / 10).toFixed(1)} kg`; }
export function fmtDur(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
export function fmtDate(d) { return new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }); }