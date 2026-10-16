// Deterministic, rule-based motivational feedback messages.
// No AI, no credits — just predefined professional messages selected by data.
// Each function returns { title, message } or null when there's nothing meaningful to say.

// Deterministic pseudo-random index from arbitrary values. Same inputs → same pick,
// so a given session always shows the same message, but different sessions vary.
function pick(arr, ...seeds) {
  if (!arr || !arr.length) return null;
  let h = 0;
  for (const s of seeds) {
    const str = String(s ?? '');
    for (let i = 0; i < str.length; i++) { h = ((h << 5) - h + str.charCodeAt(i)) | 0; }
  }
  return arr[Math.abs(h) % arr.length];
}

// ── Workout completion ──────────────────────────────────────────────
export function getWorkoutFeedback({ score, volume, prCount, durationMinutes, exerciseCount, completedSets }) {
  const title = prCount > 0 ? 'Outstanding Session' : 'Session Complete';
  let pool;
  if (prCount > 0) {
    pool = [
      'Outstanding — you set a new personal record. That is the result of consistent, focused work.',
      'Excellent session. A new PR shows your training is producing real, measurable progress.',
      'Strong work. Setting a PR today confirms the program is working — keep tracking it.',
    ];
    return { title, message: pick(pool, volume, durationMinutes, prCount) };
  }
  if (score >= 85) {
    pool = [
      'Excellent session. Your training quality was outstanding today — high engagement across the board.',
      'Top-tier effort. Sessions like this are what compound into real strength and physique changes.',
      'Outstanding work. The volume, intensity, and consistency all aligned today.',
    ];
  } else if (score >= 70) {
    pool = [
      'Solid workout. Consistent effort at this level drives steady, reliable progress.',
      'Good session. You hit your targets with quality reps and controlled volume.',
      'Well-executed. Showing up and delivering this level of work is what builds results over time.',
    ];
  } else if (score >= 55) {
    pool = [
      'Good work showing up. Every completed session moves you forward — consistency wins.',
      'Session logged. You put in the work today; recovery and the next session will build on it.',
      'Steady effort. Not every session is a peak — the accumulation is what matters.',
    ];
  } else {
    pool = [
      'Session logged. Recovery and consistency are key — the next one will be stronger.',
      'Workout recorded. Showing up is the first step; build from here next time.',
      'Noted. Every session is data — use it to adjust and come back sharper.',
    ];
  }
  let message = pick(pool, volume, durationMinutes, exerciseCount, completedSets);
  // Add a data-driven note when relevant.
  if (durationMinutes >= 90) message += ` ${durationMinutes} minutes of focused training is a serious investment.`;
  else if (volume >= 5000) message += ` ${Math.round(volume).toLocaleString()} kg of total volume — your work capacity is building well.`;
  return { title, message };
}

// ── Cardio completion ──────────────────────────────────────────────
export function getCardioFeedback({ durationSeconds, calories, distanceKm, activityLabel }) {
  const mins = Math.round((durationSeconds || 0) / 60);
  const title = 'Session Complete';
  let pool;
  if (mins >= 60) {
    pool = [
      'Strong endurance session. Your aerobic base builds with every minute at this duration.',
      'Dedicated cardio work. Sustained efforts like this compound your conditioning over time.',
      'Excellent stamina. Long sessions build the engine that supports everything else.',
    ];
  } else if (calories >= 500) {
    pool = [
      'Excellent energy output. Consistent calorie burn compounds your conditioning week over week.',
      'High-intensity work. That level of output will show in your recovery and performance.',
      'Strong session. Effort like this improves both endurance and metabolic capacity.',
    ];
  } else if (distanceKm && distanceKm >= 5) {
    pool = [
      'Distance covered. Every kilometer builds your aerobic engine.',
      'Solid distance work. Consistent mileage is the foundation of endurance progress.',
      'Good ground covered. Your pacing and distance are building steadily.',
    ];
  } else {
    pool = [
      'Efficient session. Quality work over quantity — well done.',
      'Cardio logged. Consistent tracking builds a clear picture of your conditioning.',
      'Good work. Short, focused sessions still move the needle when done regularly.',
    ];
  }
  let message = pick(pool, mins, calories, distanceKm, activityLabel);
  if (calories > 0) message += ` ${Math.round(calories)} kcal across ${mins} minutes.`;
  return { title, message };
}

// ── Nutrition logging ───────────────────────────────────────────────
export function getNutritionFeedback({ calories, calorieTarget, protein, proteinTarget }) {
  const calPct = calorieTarget ? (calories / calorieTarget) * 100 : 0;
  const proPct = proteinTarget ? (protein / proteinTarget) * 100 : 0;
  let pool;
  if (calPct >= 100) {
    pool = [
      'Meal logged. You have reached your calorie target for today.',
      'Logged. Calorie target met — consistent tracking keeps you accountable.',
      'Meal added. You are at your daily calorie goal.',
    ];
  } else if (proPct >= 100 && calPct >= 85) {
    pool = [
      'Meal logged. Protein target met and calories are on track — solid fueling.',
      'Logged. Your protein intake is dialed in for recovery today.',
      'Meal added. Protein is covered — that supports the work you are putting in.',
    ];
  } else if (calPct >= 85) {
    pool = [
      'Meal logged. You are close to your daily calorie target.',
      'Logged. Nearly at your target — a balanced day of fueling.',
      'Meal added. You are on track to hit your nutrition goals today.',
    ];
  } else if (proPct >= 100) {
    pool = [
      'Meal logged. Protein target met — recovery fuel is covered.',
      'Logged. Strong protein intake for the day.',
      'Meal added. Your protein is dialed in; keep an eye on total calories.',
    ];
  } else {
    pool = [
      'Meal logged. Consistent tracking builds awareness over time.',
      'Logged. Every entry sharpens your nutrition picture.',
      'Meal added. Keep logging — the data adds up.',
    ];
  }
  const title = 'Meal Logged';
  return { title, message: pick(pool, Math.round(calories), Math.round(protein), calPct) };
}

// ── Habit completion ────────────────────────────────────────────────
export function getHabitFeedback({ streak, habitName }) {
  const title = 'Habit Complete';
  let pool;
  if (!streak || streak === 0) {
    pool = [
      'Habit completed. The first step builds the streak.',
      'Done. Consistency starts with one day — well begun.',
      'Checked off. Showing up today is what starts the momentum.',
    ];
  } else if (streak < 7) {
    pool = [
      `Habit done. ${streak}-day streak — consistency is building.`,
      `Completed. ${streak} days in a row — keep the chain going.`,
      `Done. A ${streak}-day streak is real progress.`,
    ];
  } else if (streak < 14) {
    pool = [
      `One full week. ${streak}-day streak — excellent consistency.`,
      `Habit complete. ${streak} days straight — this is becoming routine.`,
      `Done. A ${streak}-day streak shows real commitment.`,
    ];
  } else if (streak < 30) {
    pool = [
      `Outstanding. ${streak}-day streak — this is becoming part of who you are.`,
      `Habit complete. ${streak} days of consistency is transforming your results.`,
      `Done. A ${streak}-day streak is the kind of discipline that compounds.`,
    ];
  } else {
    pool = [
      `Remarkable discipline. ${streak}-day streak — habits at this level transform outcomes.`,
      `Habit complete. ${streak} days straight — this is elite-level consistency.`,
      `Done. A ${streak}-day streak is what separates good from great.`,
    ];
  }
  return { title, message: pick(pool, streak, habitName) };
}

// ── Goal progress ───────────────────────────────────────────────────
export function getGoalFeedback({ progressPct, status }) {
  const p = Math.round(progressPct || 0);
  let pool;
  if (p >= 100) {
    pool = [
      'Goal achieved. This is what consistent effort produces.',
      'Target reached. Your discipline turned a goal into a result.',
      'Goal complete. Every logged workout, meal, and measurement brought you here.',
    ];
  } else if (p >= 75) {
    pool = [
      'Almost there. Stay the course — the finish line is within reach.',
      'Strong progress. You are in the final stretch; consistency now seals it.',
      'Nearly at your goal. The work you have put in is about to pay off.',
    ];
  } else if (p >= 50) {
    pool = [
      'Over halfway. Your consistency is turning this goal into reality.',
      'Past the midpoint. The momentum you have built will carry you through.',
      'Solid progress. Halfway there — keep doing what is working.',
    ];
  } else if (p >= 10) {
    pool = [
      'Steady progress. You are moving in the right direction.',
      'Making headway. Each data point confirms you are on track.',
      'Good momentum. The early stages are where habits solidify.',
    ];
  } else {
    pool = [
      'Journey started. Every data point brings clarity to your path.',
      'Goal set and tracking. The first measurements are the foundation.',
      'Underway. Awareness is the first step toward lasting change.',
    ];
  }
  return { title: 'Goal Progress', message: pick(pool, p, status) };
}

// ── Personal record (during training) ───────────────────────────────
export function getPRFeedback(prs) {
  if (!prs || !prs.length) return null;
  const pool = [
    'Personal record. That is the result of showing up and putting in the work.',
    'New PR. Your strength is progressing — keep tracking it.',
    'PR set. This is what progressive overload produces over time.',
    'Personal best. Consistency just paid off — well earned.',
  ];
  const detail = prs.map((p) => `${p.exercise} ${p.type === 'weight' ? p.value + 'kg' : 'e1rm ' + Math.round(p.value) + 'kg'}`).join(' · ');
  return { title: prs.length > 1 ? `${prs.length} New PRs` : 'New PR', message: pick(pool, detail, prs.length) + ` (${detail})` };
}

// ── During-training encouragement at set milestones ─────────────────
// Returns a short message at every 5 completed sets, or null otherwise.
export function getEncouragement(completedSets) {
  if (!completedSets || completedSets < 5 || completedSets % 5 !== 0) return null;
  const pool = [
    `${completedSets} sets in. Building momentum.`,
    `${completedSets} sets done. Solid pace.`,
    `${completedSets} sets complete. Keep the focus.`,
    `${completedSets} sets logged. Quality work.`,
  ];
  return pick(pool, completedSets);
}

// ── Daily / weekly target summary ──────────────────────────────────
export function getDailySummary({ workoutsToday, calories, calorieTarget, habitsDone, habitsTotal, streak }) {
  const parts = [];
  if (workoutsToday > 0) parts.push(`${workoutsToday} workout${workoutsToday > 1 ? 's' : ''} logged`);
  if (calorieTarget && calories >= calorieTarget) parts.push('nutrition target met');
  if (habitsTotal > 0 && habitsDone === habitsTotal) parts.push('all habits complete');
  if (streak >= 7) parts.push(`${streak}-day streak`);

  if (!parts.length) return null;

  let pool;
  if (parts.length >= 3) {
    pool = [
      'Strong day across the board. This is what a complete performance day looks like.',
      'Excellent — you covered training, nutrition, and habits today.',
      'Full-spectrum day. Consistency like this is what drives real change.',
    ];
  } else if (parts.length === 2) {
    pool = [
      'Productive day. You are building real momentum across your routines.',
      'Good work today. Multiple targets hit — keep stacking these days.',
      'Solid day. The consistency is showing.',
    ];
  } else {
    pool = [
      'Good work today. Every logged action moves you forward.',
      'One target down. Build on it tomorrow.',
      'Noted and tracked. Consistency compounds.',
    ];
  }
  return { title: 'Daily Summary', message: pick(pool, parts.join(','), streak) + ` ${parts.join(' · ')}.` };
}