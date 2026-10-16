// Deterministic program templates — zero AI / zero credits.
// Builds a real, periodized-style program from fixed templates scaled by experience.

const clone = (d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e })) });

function scaleDay(day, level, idx) {
  const d = clone(day);
  d.exercises.forEach((e) => {
    if (level === 'Beginner') { e.sets = Math.max(2, e.sets - 1); e.rir_target = Math.min(3, (e.rir_target || 2) + 1); e.rest_seconds = (e.rest_seconds || 90) + 15; }
    else if (level === 'Advanced') { e.sets = e.sets + 1; e.rir_target = Math.max(0, (e.rir_target || 2) - 1); }
  });
  return d;
}

const UPPER_A = { day_name: 'Upper A', focus: 'Chest · Back · Shoulders', exercises: [
  { exercise_name: 'Barbell Bench Press', sets: 4, reps_low: 6, reps_high: 8, rir_target: 2, rest_seconds: 150 },
  { exercise_name: 'Barbell Row', sets: 4, reps_low: 6, reps_high: 8, rir_target: 2, rest_seconds: 120 },
  { exercise_name: 'Incline Dumbbell Press', sets: 3, reps_low: 8, reps_high: 12, rir_target: 2, rest_seconds: 90 },
  { exercise_name: 'Lat Pulldown', sets: 3, reps_low: 8, reps_high: 12, rir_target: 2, rest_seconds: 90 },
  { exercise_name: 'Dumbbell Lateral Raise', sets: 3, reps_low: 12, reps_high: 15, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Cable Pushdown', sets: 3, reps_low: 10, reps_high: 15, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Barbell Curl', sets: 3, reps_low: 10, reps_high: 12, rir_target: 1, rest_seconds: 60 },
] };
const LOWER_A = { day_name: 'Lower A', focus: 'Quads · Hamstrings · Calves', exercises: [
  { exercise_name: 'Back Squat', sets: 4, reps_low: 5, reps_high: 8, rir_target: 2, rest_seconds: 180 },
  { exercise_name: 'Romanian Deadlift', sets: 3, reps_low: 8, reps_high: 12, rir_target: 2, rest_seconds: 120 },
  { exercise_name: 'Leg Press', sets: 3, reps_low: 10, reps_high: 15, rir_target: 2, rest_seconds: 120 },
  { exercise_name: 'Lying Leg Curl', sets: 3, reps_low: 10, reps_high: 15, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Bulgarian Split Squat', sets: 3, reps_low: 8, reps_high: 12, rir_target: 1, rest_seconds: 90 },
  { exercise_name: 'Standing Calf Raise', sets: 4, reps_low: 12, reps_high: 20, rir_target: 1, rest_seconds: 45 },
] };
const UPPER_B = { day_name: 'Upper B', focus: 'Back · Chest · Arms', exercises: [
  { exercise_name: 'Overhead Press', sets: 4, reps_low: 6, reps_high: 8, rir_target: 2, rest_seconds: 120 },
  { exercise_name: 'Pull-Up', sets: 4, reps_low: 6, reps_high: 10, rir_target: 2, rest_seconds: 120 },
  { exercise_name: 'Cable Chest Press', sets: 3, reps_low: 10, reps_high: 12, rir_target: 2, rest_seconds: 90 },
  { exercise_name: 'Seated Cable Row', sets: 3, reps_low: 10, reps_high: 12, rir_target: 2, rest_seconds: 90 },
  { exercise_name: 'Reverse Dumbbell Fly', sets: 3, reps_low: 12, reps_high: 15, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Incline Dumbbell Curl', sets: 3, reps_low: 10, reps_high: 12, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Skull Crusher', sets: 3, reps_low: 10, reps_high: 15, rir_target: 1, rest_seconds: 60 },
] };
const LOWER_B = { day_name: 'Lower B', focus: 'Hamstrings · Glutes · Quads', exercises: [
  { exercise_name: 'Front Squat', sets: 4, reps_low: 5, reps_high: 8, rir_target: 2, rest_seconds: 180 },
  { exercise_name: 'Barbell Hip Thrust', sets: 4, reps_low: 8, reps_high: 12, rir_target: 2, rest_seconds: 120 },
  { exercise_name: 'Walking Lunge', sets: 3, reps_low: 10, reps_high: 16, rir_target: 1, rest_seconds: 90 },
  { exercise_name: 'Seated Leg Curl', sets: 3, reps_low: 10, reps_high: 15, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Leg Extension', sets: 3, reps_low: 12, reps_high: 15, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Seated Calf Raise', sets: 4, reps_low: 15, reps_high: 20, rir_target: 1, rest_seconds: 45 },
] };

const PUSH = { day_name: 'Push', focus: 'Chest · Shoulders · Triceps', exercises: [
  { exercise_name: 'Barbell Bench Press', sets: 4, reps_low: 6, reps_high: 8, rir_target: 2, rest_seconds: 150 },
  { exercise_name: 'Dumbbell Shoulder Press', sets: 3, reps_low: 8, reps_high: 12, rir_target: 2, rest_seconds: 90 },
  { exercise_name: 'Incline Dumbbell Press', sets: 3, reps_low: 8, reps_high: 12, rir_target: 2, rest_seconds: 90 },
  { exercise_name: 'Dumbbell Lateral Raise', sets: 3, reps_low: 12, reps_high: 15, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Cable Pushdown', sets: 3, reps_low: 10, reps_high: 15, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Overhead Cable Extension', sets: 3, reps_low: 10, reps_high: 15, rir_target: 1, rest_seconds: 60 },
] };
const PULL = { day_name: 'Pull', focus: 'Back · Biceps · Rear Delts', exercises: [
  { exercise_name: 'Pull-Up', sets: 4, reps_low: 6, reps_high: 10, rir_target: 2, rest_seconds: 120 },
  { exercise_name: 'Barbell Row', sets: 3, reps_low: 8, reps_high: 12, rir_target: 2, rest_seconds: 90 },
  { exercise_name: 'Lat Pulldown', sets: 3, reps_low: 10, reps_high: 12, rir_target: 2, rest_seconds: 90 },
  { exercise_name: 'Face Pull', sets: 3, reps_low: 12, reps_high: 20, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Barbell Curl', sets: 3, reps_low: 10, reps_high: 12, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Hammer Curl', sets: 3, reps_low: 10, reps_high: 15, rir_target: 1, rest_seconds: 60 },
] };
const LEGS = { day_name: 'Legs', focus: 'Quads · Hamstrings · Calves', exercises: [
  { exercise_name: 'Back Squat', sets: 4, reps_low: 5, reps_high: 8, rir_target: 2, rest_seconds: 180 },
  { exercise_name: 'Romanian Deadlift', sets: 3, reps_low: 8, reps_high: 12, rir_target: 2, rest_seconds: 120 },
  { exercise_name: 'Leg Press', sets: 3, reps_low: 10, reps_high: 15, rir_target: 2, rest_seconds: 120 },
  { exercise_name: 'Lying Leg Curl', sets: 3, reps_low: 10, reps_high: 15, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Standing Calf Raise', sets: 4, reps_low: 12, reps_high: 20, rir_target: 1, rest_seconds: 45 },
] };

const FULL_A = { day_name: 'Full Body A', focus: 'Full Body', exercises: [
  { exercise_name: 'Back Squat', sets: 4, reps_low: 5, reps_high: 8, rir_target: 2, rest_seconds: 180 },
  { exercise_name: 'Barbell Bench Press', sets: 3, reps_low: 6, reps_high: 10, rir_target: 2, rest_seconds: 120 },
  { exercise_name: 'Barbell Row', sets: 3, reps_low: 8, reps_high: 12, rir_target: 2, rest_seconds: 90 },
  { exercise_name: 'Dumbbell Lateral Raise', sets: 3, reps_low: 12, reps_high: 15, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Barbell Curl', sets: 2, reps_low: 10, reps_high: 12, rir_target: 1, rest_seconds: 60 },
] };
const FULL_B = { day_name: 'Full Body B', focus: 'Full Body', exercises: [
  { exercise_name: 'Deadlift', sets: 3, reps_low: 5, reps_high: 5, rir_target: 2, rest_seconds: 180 },
  { exercise_name: 'Overhead Press', sets: 3, reps_low: 6, reps_high: 10, rir_target: 2, rest_seconds: 120 },
  { exercise_name: 'Lat Pulldown', sets: 3, reps_low: 8, reps_high: 12, rir_target: 2, rest_seconds: 90 },
  { exercise_name: 'Bulgarian Split Squat', sets: 3, reps_low: 8, reps_high: 12, rir_target: 1, rest_seconds: 90 },
  { exercise_name: 'Cable Pushdown', sets: 2, reps_low: 10, reps_high: 15, rir_target: 1, rest_seconds: 60 },
] };
const FULL_C = { day_name: 'Full Body C', focus: 'Full Body', exercises: [
  { exercise_name: 'Front Squat', sets: 3, reps_low: 6, reps_high: 8, rir_target: 2, rest_seconds: 150 },
  { exercise_name: 'Incline Dumbbell Press', sets: 3, reps_low: 8, reps_high: 12, rir_target: 2, rest_seconds: 90 },
  { exercise_name: 'Seated Cable Row', sets: 3, reps_low: 10, reps_high: 12, rir_target: 2, rest_seconds: 90 },
  { exercise_name: 'Romanian Deadlift', sets: 3, reps_low: 8, reps_high: 12, rir_target: 2, rest_seconds: 120 },
  { exercise_name: 'Standing Calf Raise', sets: 3, reps_low: 12, reps_high: 20, rir_target: 1, rest_seconds: 45 },
] };

const PUSH_A = { day_name: 'Push A', focus: 'Chest · Shoulders · Triceps', exercises: PUSH.exercises };
const PULL_A = { day_name: 'Pull A', focus: 'Back · Biceps · Rear Delts', exercises: PULL.exercises };
const PUSH_B = { day_name: 'Push B', focus: 'Chest · Shoulders · Triceps', exercises: [
  { exercise_name: 'Incline Barbell Bench Press', sets: 4, reps_low: 6, reps_high: 10, rir_target: 2, rest_seconds: 120 },
  { exercise_name: 'Dumbbell Shoulder Press', sets: 3, reps_low: 8, reps_high: 12, rir_target: 2, rest_seconds: 90 },
  { exercise_name: 'Dumbbell Bench Press', sets: 3, reps_low: 8, reps_high: 12, rir_target: 2, rest_seconds: 90 },
  { exercise_name: 'Cable Lateral Raise', sets: 3, reps_low: 12, reps_high: 15, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Skull Crusher', sets: 3, reps_low: 10, reps_high: 15, rir_target: 1, rest_seconds: 60 },
] };
const PULL_B = { day_name: 'Pull B', focus: 'Back · Biceps · Rear Delts', exercises: [
  { exercise_name: 'Barbell Row', sets: 4, reps_low: 6, reps_high: 8, rir_target: 2, rest_seconds: 120 },
  { exercise_name: 'Lat Pulldown', sets: 3, reps_low: 8, reps_high: 12, rir_target: 2, rest_seconds: 90 },
  { exercise_name: 'Cable Pullover', sets: 3, reps_low: 10, reps_high: 15, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Reverse Dumbbell Fly', sets: 3, reps_low: 12, reps_high: 15, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Incline Dumbbell Curl', sets: 3, reps_low: 10, reps_high: 12, rir_target: 1, rest_seconds: 60 },
] };

const CHEST_DAY = { day_name: 'Chest', focus: 'Chest', exercises: [
  { exercise_name: 'Barbell Bench Press', sets: 4, reps_low: 6, reps_high: 8, rir_target: 2, rest_seconds: 150 },
  { exercise_name: 'Incline Dumbbell Press', sets: 4, reps_low: 8, reps_high: 12, rir_target: 2, rest_seconds: 90 },
  { exercise_name: 'Cable Fly', sets: 3, reps_low: 12, reps_high: 15, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Machine Pec Deck', sets: 3, reps_low: 12, reps_high: 15, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Push-Up', sets: 3, reps_low: 15, reps_high: 25, rir_target: 1, rest_seconds: 45 },
] };
const BACK_DAY = { day_name: 'Back', focus: 'Back', exercises: [
  { exercise_name: 'Conventional Deadlift', sets: 3, reps_low: 5, reps_high: 5, rir_target: 2, rest_seconds: 180 },
  { exercise_name: 'Pull-Up', sets: 4, reps_low: 6, reps_high: 10, rir_target: 2, rest_seconds: 120 },
  { exercise_name: 'Barbell Row', sets: 4, reps_low: 8, reps_high: 12, rir_target: 2, rest_seconds: 90 },
  { exercise_name: 'Seated Cable Row', sets: 3, reps_low: 10, reps_high: 12, rir_target: 2, rest_seconds: 90 },
  { exercise_name: 'Dumbbell Pullover', sets: 3, reps_low: 10, reps_high: 15, rir_target: 1, rest_seconds: 60 },
] };
const LEG_DAY = { day_name: 'Legs', focus: 'Legs', exercises: LEGS.exercises };
const SHOULDER_DAY = { day_name: 'Shoulders', focus: 'Shoulders', exercises: [
  { exercise_name: 'Overhead Press', sets: 4, reps_low: 6, reps_high: 8, rir_target: 2, rest_seconds: 120 },
  { exercise_name: 'Dumbbell Lateral Raise', sets: 4, reps_low: 12, reps_high: 15, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Cable Lateral Raise', sets: 3, reps_low: 12, reps_high: 15, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Reverse Pec Deck', sets: 4, reps_low: 12, reps_high: 20, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Face Pull', sets: 3, reps_low: 12, reps_high: 20, rir_target: 1, rest_seconds: 60 },
] };
const ARM_DAY = { day_name: 'Arms', focus: 'Biceps · Triceps', exercises: [
  { exercise_name: 'Barbell Curl', sets: 4, reps_low: 8, reps_high: 12, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Skull Crusher', sets: 4, reps_low: 8, reps_high: 12, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Hammer Curl', sets: 3, reps_low: 10, reps_high: 15, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Cable Pushdown', sets: 3, reps_low: 10, reps_high: 15, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Concentration Curl', sets: 3, reps_low: 10, reps_high: 15, rir_target: 1, rest_seconds: 45 },
  { exercise_name: 'Overhead Cable Extension', sets: 3, reps_low: 10, reps_high: 15, rir_target: 1, rest_seconds: 60 },
] };

const UPPER_HEAVY = { day_name: 'Upper Heavy', focus: 'Strength', exercises: [
  { exercise_name: 'Barbell Bench Press', sets: 5, reps_low: 3, reps_high: 5, rir_target: 1, rest_seconds: 180 },
  { exercise_name: 'Barbell Row', sets: 4, reps_low: 5, reps_high: 6, rir_target: 1, rest_seconds: 150 },
  { exercise_name: 'Overhead Press', sets: 3, reps_low: 5, reps_high: 8, rir_target: 2, rest_seconds: 120 },
  { exercise_name: 'Barbell Curl', sets: 3, reps_low: 8, reps_high: 10, rir_target: 1, rest_seconds: 60 },
] };
const LOWER_HEAVY = { day_name: 'Lower Heavy', focus: 'Strength', exercises: [
  { exercise_name: 'Back Squat', sets: 5, reps_low: 3, reps_high: 5, rir_target: 1, rest_seconds: 210 },
  { exercise_name: 'Conventional Deadlift', sets: 3, reps_low: 3, reps_high: 5, rir_target: 1, rest_seconds: 180 },
  { exercise_name: 'Romanian Deadlift', sets: 3, reps_low: 6, reps_high: 8, rir_target: 2, rest_seconds: 120 },
  { exercise_name: 'Standing Calf Raise', sets: 4, reps_low: 10, reps_high: 15, rir_target: 1, rest_seconds: 60 },
] };

const HOME_A = { day_name: 'Home Full Body A', focus: 'Full Body', exercises: [
  { exercise_name: 'Push-Up', sets: 4, reps_low: 8, reps_high: 20, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Bodyweight Squat', sets: 4, reps_low: 12, reps_high: 20, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Inverted Row', sets: 3, reps_low: 8, reps_high: 15, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Plank', sets: 3, reps_low: 30, reps_high: 60, rir_target: 0, rest_seconds: 45 },
] };
const HOME_B = { day_name: 'Home Full Body B', focus: 'Full Body', exercises: [
  { exercise_name: 'Bulgarian Split Squat', sets: 3, reps_low: 8, reps_high: 12, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Pike Push-Up', sets: 3, reps_low: 8, reps_high: 12, rir_target: 1, rest_seconds: 60 },
  { exercise_name: 'Glute Bridge', sets: 3, reps_low: 12, reps_high: 20, rir_target: 1, rest_seconds: 45 },
  { exercise_name: 'Hanging Leg Raise', sets: 3, reps_low: 8, reps_high: 15, rir_target: 1, rest_seconds: 60 },
] };

export const DAY_TEMPLATES = {
  'Upper Lower': [UPPER_A, LOWER_A, UPPER_B, LOWER_B],
  'Push Pull Legs': [PUSH, PULL, LEGS],
  'Full Body': [FULL_A, FULL_B, FULL_C],
  'Push Pull': [PUSH_A, PULL_A, PUSH_B, PULL_B],
  'Bro Split': [CHEST_DAY, BACK_DAY, LEG_DAY, SHOULDER_DAY, ARM_DAY],
  'Powerbuilding': [UPPER_HEAVY, LOWER_HEAVY, UPPER_A, LOWER_A],
  'Hybrid': [UPPER_A, LOWER_A, PUSH, PULL, LEGS],
  'Home': [HOME_A, HOME_B],
};

const GOAL_MAP = { 'Strength Gain': 'Strength', 'Fat Loss': 'Fat Loss', 'Muscle Gain': 'Muscle Gain', 'Body Recomposition': 'Body Recomposition', 'Athletic Performance': 'Athletic Performance', 'Endurance': 'Endurance', 'General Fitness': 'General Fitness', 'Maintenance': 'Maintenance' };

export function generateProgram({ user, goal, preferences }) {
  const prefs = preferences || {};
  const split = prefs.split || 'Upper Lower';
  const daysPerWeek = prefs.days_per_week || 4;
  const level = user?.experience_level || 'Intermediate';
  const template = DAY_TEMPLATES[split] || DAY_TEMPLATES['Upper Lower'];
  const days = [];
  for (let i = 0; i < daysPerWeek; i++) days.push(scaleDay(template[i % template.length], level, i));

  return {
    name: `${split} ${level} Block`,
    description: `A deterministic ${split.toLowerCase()} program built from fixed templates, scaled for a ${level.toLowerCase()} trainee. No AI — fully editable.`,
    goal: (goal && GOAL_MAP[goal.primary_goal]) || 'Hypertrophy',
    split,
    days_per_week: daysPerWeek,
    session_duration_minutes: prefs.session_duration_minutes || 60,
    experience_level: level,
    duration_weeks: prefs.duration_weeks || 8,
    phase: goal?.phase || 'Hypertrophy',
    days,
    is_ai_generated: false,
  };
}

// Deterministic text parser for the "Import Text" flow.
// Parses lines like "Bench Press 4x6-8" into a program. Day headers are short lines
// ending with ":" or containing no digits.
export function parseProgramText(text) {
  const lines = (text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const days = [];
  let current = null;
  const exRe = /(.+?)\s+(\d+)\s*[x×]\s*(\d+)(?:\s*[-–]\s*(\d+))?/i;
  lines.forEach((line) => {
    const isHeader = (line.endsWith(':') && !/\d\s*[x×]/.test(line)) || /^(day|upper|lower|push|pull|legs|chest|back|shoulders?|arms?|full body)/i.test(line) && !exRe.test(line);
    if (isHeader) {
      current = { day_name: line.replace(/:$/, '').trim(), focus: '', exercises: [] };
      days.push(current);
      return;
    }
    const m = line.match(exRe);
    if (!m) return;
    if (!current) { current = { day_name: 'Day 1', focus: '', exercises: [] }; days.push(current); }
    current.exercises.push({
      exercise_name: m[1].trim(),
      sets: parseInt(m[2], 10) || 3,
      reps_low: parseInt(m[3], 10) || 8,
      reps_high: m[4] ? parseInt(m[4], 10) : (parseInt(m[3], 10) || 12),
      rir_target: 2,
      rest_seconds: 90,
      notes: '',
    });
  });
  return { name: 'Imported Program', description: 'Imported from pasted text. Editable.', goal: 'Hypertrophy', split: 'Full Body', days_per_week: Math.max(1, days.length), session_duration_minutes: 60, experience_level: 'Intermediate', duration_weeks: 8, phase: 'Hypertrophy', days: days.length ? days : [{ day_name: 'Day 1', focus: '', exercises: [] }] };
}