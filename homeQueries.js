import { fitnessRecordQuery, fitnessSummaryQuery } from '@/lib/fitnessDataCache';
import { WIDGET_BY_ID } from '@/lib/dashboardWidgets';
import { widgetTrainingQuery } from '@/lib/widgetTrainingStats';
import { localDateStr } from '@/lib/utils';

const nutritionFields = ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g'];
function nutritionRows(result) {
  if (result.truncated) throw new Error('Nutrition totals could not be completed.');
  return result.rows.map(row => ({ date: row.date, meal: row.meal, ...Object.fromEntries(nutritionFields.map(key => [key, row[`sum_${key}`] || 0])) }));
}
function cardioRows(result) {
  if (result.truncated) throw new Error('Cardio totals could not be completed.');
  return result.rows.map(row => ({ date: row.date, count: row.count, duration_seconds: row.sum_duration_seconds || 0, calories: row.sum_calories || 0, distance_km: row.sum_distance_km || 0 }));
}
export default function homeQueries(userId, today, visible) {
  const needs = new Set(visible.flatMap(id => WIDGET_BY_ID[id]?.resources || []));
  if (visible.includes('summary')) ['goal', 'nutrition', 'sessions', 'training'].forEach(name => needs.add(name));
  const start = new Date(`${today}T12:00:00`); start.setDate(start.getDate() - 7);
  const cardioStart = new Date(`${localDateStr(start)}T00:00:00`);
  const definitions = [
    { name: 'goal', ...fitnessRecordQuery('Goal', userId, { status: 'active' }, { sort: '-created_date', limit: 1 }) },
    { name: 'measurements', ...fitnessRecordQuery('BodyMeasurement', userId, {}, { limit: 30 }) },
    { name: 'nutrition', ...fitnessSummaryQuery('NutritionLog', userId, { query: { date: { $gte: localDateStr(start), $lte: today } }, groupBy: ['date', 'meal'], sum: nutritionFields, limit: 100 }), select: nutritionRows },
    { name: 'sessions', ...fitnessRecordQuery('WorkoutSession', userId, {}, { limit: 60 }) },
    { name: 'sets', ...fitnessRecordQuery('WorkoutSet', userId, {}, { sort: '-created_date', limit: 300 }) },
    { name: 'recovery', ...fitnessRecordQuery('RecoveryRecord', userId, {}, { limit: 7 }) },
    { name: 'achievements', ...fitnessRecordQuery('Achievement', userId, {}, { sort: '-created_date', limit: 6 }) },
    { name: 'scheduled', ...fitnessRecordQuery('ScheduledWorkout', userId, { date: today, completed: false }, { sort: 'created_date', limit: 1 }) },
    { name: 'cardio', ...fitnessSummaryQuery('CardioSession', userId, { query: { date: { $gte: cardioStart.toISOString() } }, groupBy: 'date', sum: ['duration_seconds', 'calories', 'distance_km'], limit: 1000 }), select: cardioRows },
    { name: 'training', ...widgetTrainingQuery(userId, today) },
  ];
  return definitions.filter(definition => needs.has(definition.name));
}