import { base44 } from '@/api/base44Client';
import { fitnessRecords, fitnessSummary } from '@/lib/fitnessDataCache';
import { estimate1RM } from '@/lib/fitnessScience';

export default async function monthlyReportData(userId, month) {
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const key = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
  const range = { $gte: key(month), $lt: key(end) };
  const query = { date: range };
  const [training, cardio, nutrition, recovery, first, last, habitCount, logCount, sets] = await Promise.all([
    fitnessSummary('WorkoutSession', userId, { query: { ...query, status: 'completed' }, sum: ['total_volume_kg', 'pr_count'] }),
    fitnessSummary('CardioSession', userId, { query, sum: ['duration_seconds', 'calories'] }),
    fitnessSummary('NutritionLog', userId, { query, groupBy: 'date', sum: ['calories', 'protein_g'], limit: 31 }),
    fitnessSummary('RecoveryRecord', userId, { query, sum: 'readiness_score' }),
    fitnessRecords('BodyMeasurement', userId, query, { sort: 'date', limit: 1, fields: ['date', 'weight_kg'] }),
    fitnessRecords('BodyMeasurement', userId, query, { sort: '-date', limit: 1, fields: ['date', 'weight_kg'] }),
    base44.entities.Habit.count({ created_by_id: userId }),
    base44.entities.HabitLog.count({ created_by_id: userId, ...query }),
    fitnessSummary('WorkoutSet', userId, { query: { created_date: range }, groupBy: ['exercise_name', 'weight_kg', 'reps'], limit: 1000 }),
  ]);
  if ([nutrition, sets].some((result) => result.truncated)) throw new Error('This report has more exercise groups than can be summarized at once. Your records are still saved.');
  const workout = training.rows[0] || {}, aerobic = cardio.rows[0] || {}, rest = recovery.rows[0] || {};
  const daily = nutrition.rows;
  const exercises = new Map();
  sets.rows.forEach((row) => {
    const entry = exercises.get(row.exercise_name) || { name: row.exercise_name, vol: 0, topE1rm: 0 };
    entry.vol += (row.weight_kg || 0) * (row.reps || 0) * row.count;
    entry.topE1rm = Math.max(entry.topE1rm, estimate1RM(row.weight_kg, row.reps) || 0);
    exercises.set(row.exercise_name, entry);
  });
  const firstWeight = first[0]?.weight_kg, lastWeight = last[0]?.weight_kg;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return {
    mWorkouts: workout.count || 0, totalVolume: Math.round(workout.sum_total_volume_kg || 0), prCount: workout.sum_pr_count || 0,
    cardioCount: aerobic.count || 0, cardioMinutes: Math.round((aerobic.sum_duration_seconds || 0) / 60), cardioCals: Math.round(aerobic.sum_calories || 0),
    avgCals: Math.round(daily.reduce((sum, row) => sum + (row.sum_calories || 0), 0) / (daily.length || 1)),
    avgProtein: Math.round(daily.reduce((sum, row) => sum + (row.sum_protein_g || 0), 0) / (daily.length || 1)),
    avgReadiness: rest.count && rest.sum_readiness_score ? Math.round(rest.sum_readiness_score / rest.count) : null,
    weightChange: first[0]?.id !== last[0]?.id && firstWeight != null && lastWeight != null ? lastWeight - firstWeight : null,
    habitRate: habitCount ? Math.min(100, Math.round(logCount / (habitCount * days) * 100)) : null,
    topExercises: [...exercises.values()].sort((a, b) => b.vol - a.vol).slice(0, 5),
  };
}