import { base44 } from '@/api/base44Client';
import { queryClientInstance } from '@/lib/query-client';
import { localDateStr } from '@/lib/utils';

// Session-only, user-scoped cache. No health records are persisted to browser storage.
export function fitnessRecordQuery(entity, userId, query = {}, options = {}) {
  const filter = { ...query, created_by_id: userId };
  const pageOptions = { sort: '-date', limit: 50, ...options };
  return { queryKey: ['fitness-records', entity, userId, filter, pageOptions],
    queryFn: async () => (await base44.entities[entity].filter(filter, pageOptions)).items };
}
export function fitnessRecords(entity, userId, query = {}, options = {}) {
  if (!userId) throw new Error('Please sign in to load your data.');
  return queryClientInstance.fetchQuery(fitnessRecordQuery(entity, userId, query, options));
}

export function fitnessSummaryQuery(entity, userId, config = {}) {
  const settings = { ...config, query: { ...config.query, created_by_id: userId } };
  return { queryKey: ['fitness-summary', entity, userId, settings], staleTime: 300000,
    queryFn: () => base44.entities[entity].aggregate(settings) };
}
export function fitnessSummary(entity, userId, config = {}) {
  if (!userId) throw new Error('Please sign in to load your data.');
  return queryClientInstance.fetchQuery(fitnessSummaryQuery(entity, userId, config));
}

export async function nutritionTrendRecords(userId, today = localDateStr()) {
  const start = new Date(`${today}T12:00:00`); start.setDate(start.getDate() - 7);
  const fields = ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g'];
  const result = await fitnessSummary('NutritionLog', userId, { query: { date: { $gte: localDateStr(start), $lte: today } }, groupBy: ['date', 'meal'], sum: fields, limit: 100 });
  if (result.truncated) throw new Error('The nutrition summary could not be completed. Your records are still saved.');
  return result.rows.map((row) => ({ date: row.date, meal: row.meal, ...Object.fromEntries(fields.map((key) => [key, row[`sum_${key}`] || 0])) }));
}

export async function recentCardioTotals(userId, today = localDateStr()) {
  const start = new Date(`${today}T00:00:00`); start.setDate(start.getDate() - 7);
  const result = await fitnessSummary('CardioSession', userId, { query: { date: { $gte: start.toISOString() } }, groupBy: 'date', sum: ['duration_seconds', 'calories', 'distance_km'], limit: 1000 });
  if (result.truncated) throw new Error('The cardio summary could not be completed. Your records are still saved.');
  return result.rows.map((row) => ({ date: row.date, count: row.count, duration_seconds: row.sum_duration_seconds || 0, calories: row.sum_calories || 0, distance_km: row.sum_distance_km || 0 }));
}