import { fitnessRecordQuery, fitnessSummaryQuery } from '@/lib/fitnessDataCache';
import { widgetTrainingQuery } from '@/lib/widgetTrainingStats';

const firstTotal = result => result.rows[0] || {};
function waterTotal(result) {
  if (result.truncated) throw new Error('Water totals could not be completed.');
  const units = { ml: 1, milliliter: 1, milliliters: 1, l: 1000, liter: 1000, liters: 1000, oz: 29.5735295625, 'fl oz': 29.5735295625, cup: 236.5882365, cups: 236.5882365, g: 1 };
  return result.rows.reduce((sum, row) => {
    const unit = (row.unit || 'ml').trim().toLowerCase();
    if (!units[unit]) throw new Error('A water entry has an unsupported unit. Edit it in Nutrition to use ml, l, cups or oz.');
    return sum + (row.sum_quantity || 0) * units[unit];
  }, 0);
}
export default function widgetQueries(type, userId, today) {
  const goal = { name: 'goal', ...fitnessRecordQuery('Goal', userId, { status: 'active' }, { sort: '-created_date', limit: 1 }) };
  const query = { date: today };
  switch (type) {
    case 'nutrition': return [goal, { name: 'totals', ...fitnessSummaryQuery('NutritionLog', userId, { query: { ...query, food_name: { $ne: 'Water' } }, sum: ['calories', 'protein_g', 'carbs_g', 'fat_g'] }), select: firstTotal }];
    case 'water': return [goal, { name: 'waterMl', ...fitnessSummaryQuery('NutritionLog', userId, { query: { ...query, food_name: 'Water' }, groupBy: 'unit', sum: 'quantity' }), select: waterTotal }];
    case 'weight': return [goal,
      { name: 'latest', ...fitnessRecordQuery('BodyMeasurement', userId, { weight_kg: { $gt: 0 } }, { sort: '-date', limit: 1, fields: ['date', 'weight_kg'] }) },
      { name: 'first', ...fitnessRecordQuery('BodyMeasurement', userId, { weight_kg: { $gt: 0 } }, { sort: 'date', limit: 1, fields: ['date', 'weight_kg'] }) }];
    case 'streak': return [{ name: 'training', ...widgetTrainingQuery(userId, today) }];
    case 'workout': return [{ name: 'scheduled', ...fitnessRecordQuery('ScheduledWorkout', userId, { date: today, completed: false }, { sort: 'created_date', limit: 1 }) }];
    default: return [];
  }
}