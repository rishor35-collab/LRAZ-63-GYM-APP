// Deterministic cardio analytics — formulas, MET values, aggregation, PRs.
// Zero AI / zero credit. All calculations are local and documented.

// Activity catalog: id, label, base MET, metrics to show, icon hint.
// MET values are generalized adult averages (Ainsworth compendium approximations).
export const ACTIVITIES = [
  { id: 'walking', label: 'Outdoor Walking', met: 3.5, metrics: ['distance', 'pace', 'calories'], group: 'Walk' },
  { id: 'treadmill-walking', label: 'Treadmill Walking', met: 3.5, metrics: ['distance', 'speed', 'incline', 'calories'], group: 'Walk' },
  { id: 'incline-walking', label: 'Incline Treadmill Walk', met: 5.3, metrics: ['distance', 'speed', 'incline', 'calories'], group: 'Walk' },
  { id: 'running', label: 'Outdoor Running', met: 9.8, metrics: ['distance', 'pace', 'calories'], group: 'Run' },
  { id: 'treadmill-running', label: 'Treadmill Running', met: 9.8, metrics: ['distance', 'speed', 'calories'], group: 'Run' },
  { id: 'cycling', label: 'Outdoor Cycling', met: 7.5, metrics: ['distance', 'speed', 'calories'], group: 'Bike' },
  { id: 'stationary-bike', label: 'Stationary Bike', met: 7.5, metrics: ['distance', 'resistance', 'speed', 'calories'], group: 'Bike' },
  { id: 'spin-bike', label: 'Spin Bike', met: 8.5, metrics: ['distance', 'resistance', 'speed', 'calories'], group: 'Bike' },
  { id: 'rowing', label: 'Rowing Machine', met: 8.0, metrics: ['distance', 'pace', 'calories'], group: 'Row' },
  { id: 'stair-climber', label: 'Stair Climber', met: 8.8, metrics: ['level', 'floors', 'calories'], group: 'Stair' },
  { id: 'elliptical', label: 'Elliptical', met: 5.0, metrics: ['distance', 'resistance', 'calories'], group: 'Elliptical' },
  { id: 'air-bike', label: 'Air Bike', met: 8.0, metrics: ['calories'], group: 'Bike' },
  { id: 'ski-erg', label: 'Ski Erg', met: 8.5, metrics: ['distance', 'calories'], group: 'Row' },
  { id: 'jump-rope', label: 'Jump Rope', met: 11.0, metrics: ['calories'], group: 'Jump' },
  { id: 'swimming', label: 'Swimming', met: 8.0, metrics: ['distance', 'pace', 'calories'], group: 'Swim' },
  { id: 'hiking', label: 'Hiking', met: 6.0, metrics: ['distance', 'pace', 'calories'], group: 'Walk' },
  { id: 'sled-push', label: 'Sled Push', met: 8.0, metrics: ['distance', 'calories'], group: 'Sled' },
  { id: 'sled-pull', label: 'Sled Pull', met: 7.0, metrics: ['distance', 'calories'], group: 'Sled' },
  { id: 'battle-ropes', label: 'Battle Ropes', met: 10.0, metrics: ['calories'], group: 'Ropes' },
  { id: 'custom', label: 'Custom Cardio', met: 5.0, metrics: ['distance', 'calories'], group: 'Custom' },
];

export const ACTIVITY_MAP = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a]));

export function getActivity(id) { return ACTIVITY_MAP[id] || ACTIVITY_MAP['custom']; }

// MET-based calorie estimation. For incline walking, MET scales with incline.
// Formula: kcal = MET × bodyWeightKg × hours. Returns rounded integer.
export function estimateCalories(activityId, durationSec, weightKg, incline) {
  const act = getActivity(activityId);
  let met = act.met;
  if ((activityId === 'treadmill-walking' || activityId === 'incline-walking') && Number(incline) > 0) {
    met = 3.5 + Number(incline) * 0.15; // incline-adjusted walking MET
  }
  const kg = Number(weightKg) > 0 ? Number(weightKg) : 70;
  const hours = (Number(durationSec) || 0) / 3600;
  if (hours <= 0 || !isFinite(met)) return 0;
  return Math.max(0, Math.round(met * kg * hours));
}

export function computePace(durationSec, distanceKm) {
  if (!distanceKm || distanceKm <= 0 || !durationSec) return null;
  return durationSec / distanceKm; // sec per km
}

export function computeSpeed(distanceKm, durationSec) {
  if (!durationSec || durationSec <= 0) return null;
  return (distanceKm || 0) / (durationSec / 3600); // km/h
}

export function formatDuration(totalSec) {
  const s = Math.max(0, Math.floor(totalSec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function formatPace(secPerKm) {
  if (secPerKm == null || !isFinite(secPerKm)) return '—';
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatDistance(km) {
  if (km == null) return '—';
  return (Math.round(km * 100) / 100).toFixed(2);
}

// Range → milliseconds cutoff from now.
export function rangeCutoff(range) {
  const now = Date.now();
  const day = 86400000;
  switch (range) {
    case 'today': return now - day; // include today
    case 'week': return now - 7 * day;
    case 'month': return now - 30 * day;
    case '3m': return now - 90 * day;
    case '6m': return now - 182 * day;
    case '1y': return now - 365 * day;
    default: return 0;
  }
}

export function aggregateHistory(sessions, range) {
  const cutoff = rangeCutoff(range);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const inRange = (sessions || []).filter((s) => {
    if (!s.date) return false;
    const t = new Date(s.date).getTime();
    if (range === 'today') return t >= todayStart.getTime();
    return t >= cutoff;
  });
  const totalSeconds = inRange.reduce((a, s) => a + (s.duration_seconds || 0), 0);
  const totalDistance = inRange.reduce((a, s) => a + (s.distance_km || 0), 0);
  const totalCalories = inRange.reduce((a, s) => a + (s.calories || 0), 0);
  const estCal = inRange.filter((s) => s.calorie_source === 'Estimated').reduce((a, s) => a + (s.calories || 0), 0);
  const recCal = inRange.filter((s) => s.calorie_source !== 'Estimated').reduce((a, s) => a + (s.calories || 0), 0);

  const breakdownMap = {};
  inRange.forEach((s) => {
    const key = s.activity;
    if (!breakdownMap[key]) breakdownMap[key] = { activity: s.activity, label: s.activity_label || getActivity(s.activity).label, sessions: 0, seconds: 0, distance: 0, calories: 0 };
    breakdownMap[key].sessions++;
    breakdownMap[key].seconds += s.duration_seconds || 0;
    breakdownMap[key].distance += s.distance_km || 0;
    breakdownMap[key].calories += s.calories || 0;
  });
  const breakdown = Object.values(breakdownMap).sort((a, b) => b.seconds - a.seconds);

  const paced = inRange.filter((s) => s.distance_km > 0.2 && s.duration_seconds > 0);
  const avgPace = paced.length ? paced.reduce((a, s) => a + (s.duration_seconds / s.distance_km), 0) / paced.length : null;
  const avgSpeed = totalSeconds > 0 ? (totalDistance / (totalSeconds / 3600)) : null;
  const workload = inRange.reduce((a, s) => a + (getActivity(s.activity).met || 0) * ((Number(s.duration_seconds) || 0) / 3600), 0); // MET-hours
  return {
    sessions: inRange.length,
    totalSeconds,
    totalDistance,
    totalCalories,
    estimatedCalories: estCal,
    recordedCalories: recCal,
    avgDuration: inRange.length ? totalSeconds / inRange.length : 0,
    avgDistance: inRange.length ? totalDistance / inRange.length : 0,
    avgPace,
    avgSpeed,
    workload: +workload.toFixed(1),
    breakdown,
    inRange,
  };
}

// Weekly aggregates for charts: last numWeeks weeks (Mon start).
export function weeklyAggregates(sessions, numWeeks = 12) {
  const day = 86400000;
  const getWeekStart = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.getTime(); };
  const thisWeekStart = getWeekStart(new Date());
  const weeks = [];
  for (let i = numWeeks - 1; i >= 0; i--) {
    const start = thisWeekStart - i * 7 * day;
    weeks.push({ weekStart: start, label: new Date(start).toLocaleDateString('en', { month: 'short', day: 'numeric' }), seconds: 0, distance: 0, calories: 0, sessions: 0 });
  }
  const weekByStart = Object.fromEntries(weeks.map((w) => [w.weekStart, w]));
  (sessions || []).forEach((s) => {
    if (!s.date) return;
    const ws = getWeekStart(new Date(s.date));
    const w = weekByStart[ws];
    if (!w) return;
    w.seconds += s.duration_seconds || 0;
    w.distance += s.distance_km || 0;
    w.calories += s.calories || 0;
    w.sessions += 1;
  });
  return weeks;
}

// Deterministic cardio personal records.
export function detectCardioPRs(sessions) {
  const list = sessions || [];
  if (!list.length) return [];
  const prs = [];
  const running = list.filter((s) => s.activity.includes('running'));
  const walking = list.filter((s) => ['walking', 'treadmill-walking', 'incline-walking', 'hiking'].includes(s.activity));
  const cycling = list.filter((s) => ['cycling', 'stationary-bike', 'spin-bike', 'air-bike'].includes(s.activity));

  // Fastest pace (sec/km) among distance sessions
  const paced = list.filter((s) => s.distance_km > 0.2 && s.duration_seconds > 0);
  if (paced.length) {
    let best = paced[0], bestPace = best.duration_seconds / best.distance_km;
    paced.forEach((s) => { const p = s.duration_seconds / s.distance_km; if (p < bestPace) { bestPace = p; best = s; } });
    prs.push({ id: 'fastest-pace', label: 'Fastest Pace', value: bestPace, display: `${formatPace(bestPace)} /km`, date: best.date, activity: best.activity_label });
  }
  // Fastest 5K (running, distance >= 4.9)
  const fiveK = running.filter((s) => s.distance_km >= 4.9 && s.duration_seconds > 0);
  if (fiveK.length) {
    let best = fiveK[0], bestTime = best.duration_seconds * (5 / best.distance_km);
    fiveK.forEach((s) => { const t = s.duration_seconds * (5 / s.distance_km); if (t < bestTime) { bestTime = t; best = s; } });
    prs.push({ id: 'fastest-5k', label: 'Fastest 5K', value: bestTime, display: formatDuration(bestTime), date: best.date, activity: best.activity_label });
  }
  if (running.length) {
    const longest = running.reduce((a, s) => (s.distance_km > a.distance_km ? s : a));
    prs.push({ id: 'longest-run', label: 'Longest Run', value: longest.distance_km, display: `${formatDistance(longest.distance_km)} km`, date: longest.date, activity: longest.activity_label });
  }
  if (walking.length) {
    const longest = walking.reduce((a, s) => (s.distance_km > a.distance_km ? s : a));
    if (longest.distance_km > 0) prs.push({ id: 'longest-walk', label: 'Longest Walk', value: longest.distance_km, display: `${formatDistance(longest.distance_km)} km`, date: longest.date, activity: longest.activity_label });
  }
  if (cycling.length) {
    const longest = cycling.reduce((a, s) => (s.distance_km > a.distance_km ? s : a));
    if (longest.distance_km > 0) prs.push({ id: 'longest-ride', label: 'Longest Ride', value: longest.distance_km, display: `${formatDistance(longest.distance_km)} km`, date: longest.date, activity: longest.activity_label });
  }
  // Highest distance any
  const distSessions = list.filter((s) => s.distance_km > 0);
  if (distSessions.length) {
    const top = distSessions.reduce((a, s) => (s.distance_km > a.distance_km ? s : a));
    prs.push({ id: 'highest-distance', label: 'Highest Distance', value: top.distance_km, display: `${formatDistance(top.distance_km)} km`, date: top.date, activity: top.activity_label });
  }
  // Longest session
  const longestSession = list.reduce((a, s) => (s.duration_seconds > a.duration_seconds ? s : a));
  prs.push({ id: 'longest-session', label: 'Longest Cardio Session', value: longestSession.duration_seconds, display: formatDuration(longestSession.duration_seconds), date: longestSession.date, activity: longestSession.activity_label });

  // Most cardio minutes in one week / highest weekly distance
  const weeks = weeklyAggregates(list, 200);
  const activeWeeks = weeks.filter((w) => w.sessions > 0);
  if (activeWeeks.length) {
    const bestMin = activeWeeks.reduce((a, w) => (w.seconds > a.seconds ? w : a));
    prs.push({ id: 'most-weekly-minutes', label: 'Most Cardio Minutes / Week', value: bestMin.seconds, display: formatDuration(bestMin.seconds), date: new Date(bestMin.weekStart).toISOString() });
    const distWeeks = activeWeeks.filter((w) => w.distance > 0);
    if (distWeeks.length) {
      const bestDist = distWeeks.reduce((a, w) => (w.distance > a.distance ? w : a));
      prs.push({ id: 'highest-weekly-distance', label: 'Highest Weekly Distance', value: bestDist.distance, display: `${formatDistance(bestDist.distance)} km`, date: new Date(bestDist.weekStart).toISOString() });
    }
  }
  return prs;
}

// Performance comparison for a specific activity (first vs current), distance-paced activities.
export function performanceComparison(sessions, activityId) {
  const act = getActivity(activityId);
  if (!act.metrics.includes('pace') && !act.metrics.includes('speed')) return null;
  const ofAct = (sessions || []).filter((s) => s.activity === activityId && s.distance_km > 0.2 && s.duration_seconds > 0).sort((a, b) => new Date(a.date) - new Date(b.date));
  if (ofAct.length < 2) return null;
  const first = ofAct[0];
  const current = ofAct[ofAct.length - 1];
  const firstPace = first.duration_seconds / first.distance_km;
  const currentPace = current.duration_seconds / current.distance_km;
  const improvement = firstPace - currentPace; // positive = faster
  return {
    firstPace, currentPace, improvement,
    firstDuration: first.duration_seconds, firstDistance: first.distance_km,
    currentDuration: current.duration_seconds, currentDistance: current.distance_km,
    firstDate: first.date, currentDate: current.date,
    faster: improvement > 0,
  };
}

// Time in HR zones 1-5 from sessions with heart_rate_avg. Zones calculated from estimated HR max (220 - age).
// Clearly a calculated estimate, not a medical measurement.
export function computeTimeInZone(sessions, age) {
  const hrMax = age ? 220 - age : 190;
  const zones = [
    { zone: 1, label: 'Z1 Recovery', min: 0.5, max: 0.6, seconds: 0 },
    { zone: 2, label: 'Z2 Base', min: 0.6, max: 0.7, seconds: 0 },
    { zone: 3, label: 'Z3 Tempo', min: 0.7, max: 0.8, seconds: 0 },
    { zone: 4, label: 'Z4 Threshold', min: 0.8, max: 0.9, seconds: 0 },
    { zone: 5, label: 'Z5 Max', min: 0.9, max: 1.01, seconds: 0 },
  ];
  let total = 0;
  (sessions || []).forEach((s) => {
    const hr = Number(s.heart_rate_avg), dur = Number(s.duration_seconds);
    if (!isFinite(hr) || hr <= 0 || !isFinite(dur) || dur <= 0) return; // ignore invalid
    if (hr < 30 || hr > 240) return; // implausible HR — skip
    const ratio = hr / hrMax;
    const z = zones.find((z) => ratio >= z.min && ratio < z.max) || zones[zones.length - 1];
    z.seconds += dur; total += dur;
  });
  return { zones, total, hrMax, calculated: true };
}

// Cardio progress over a range: compares recent vs prior equivalent window for
// pace, distance, duration, and calories. Includes workload (MET-hours). Returns
// sufficient=false with a note when there isn't enough data to compare.
export function computeCardioProgress(sessions, range = 'month') {
  const cutoff = rangeCutoff(range);
  const span = Date.now() - cutoff;
  const midCutoff = Date.now() - span / 2;
  const all = (sessions || []).filter((s) => s.date && new Date(s.date).getTime() >= cutoff);
  const recent = all.filter((s) => new Date(s.date).getTime() >= midCutoff);
  const prior = all.filter((s) => new Date(s.date).getTime() < midCutoff);
  const sum = (arr, k) => arr.reduce((a, s) => a + (Number(s[k]) || 0), 0);
  const avgPace = (arr) => {
    const p = arr.filter((s) => s.distance_km > 0.2 && s.duration_seconds > 0);
    return p.length ? p.reduce((a, s) => a + (s.duration_seconds / s.distance_km), 0) / p.length : null;
  };
  const r = {
    sufficient: recent.length >= 2 && prior.length >= 2,
    sessions: recent.length,
    priorSessions: prior.length,
    totalDistance: +sum(recent, 'distance_km').toFixed(2),
    priorDistance: +sum(prior, 'distance_km').toFixed(2),
    totalSeconds: sum(recent, 'duration_seconds'),
    priorSeconds: sum(prior, 'duration_seconds'),
    totalCalories: Math.round(sum(recent, 'calories')),
    priorCalories: Math.round(sum(prior, 'calories')),
    avgPace: avgPace(recent),
    priorPace: avgPace(prior),
  };
  r.distanceDelta = +(r.totalDistance - r.priorDistance).toFixed(2);
  r.durationDelta = r.totalSeconds - r.priorSeconds;
  r.paceDelta = (r.avgPace != null && r.priorPace != null) ? +(r.avgPace - r.priorPace).toFixed(1) : null; // negative = faster
  return r;
}