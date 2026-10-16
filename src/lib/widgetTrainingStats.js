import { base44 } from '@/api/base44Client';
import { localDateStr } from '@/lib/utils';

export function weekStart(value) {
  const date = new Date(value); date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (date.getDay() + 6) % 7);
  return date;
}
export default async function widgetTrainingStats(userId, today) {
  const current = weekStart(`${today}T12:00:00`);
  const previous = new Date(current); previous.setDate(previous.getDate() - 7);
  const next = new Date(current); next.setDate(next.getDate() + 7);
  const weeks = new Set();
  let before = next.toISOString(), thisWeek = 0, volume = 0, previousVolume = 0;
  while (true) {
    const result = await base44.entities.WorkoutSession.aggregate({ query: { created_by_id: userId, status: 'completed', date: { $lt: before } }, groupBy: 'date', sum: 'total_volume_kg', sort: '-date', limit: 1000 });
    result.rows.forEach(row => {
      const date = new Date(row.date);
      if (!Number.isFinite(date.getTime())) return;
      weeks.add(localDateStr(weekStart(date)));
      if (date >= current && date < next) { thisWeek += row.count; volume += row.sum_total_volume_kg || 0; }
      else if (date >= previous && date < current) previousVolume += row.sum_total_volume_kg || 0;
    });
    let cursor = new Date(current), streak = 0;
    if (!weeks.has(localDateStr(cursor))) cursor.setDate(cursor.getDate() - 7);
    while (weeks.has(localDateStr(cursor))) { streak++; cursor.setDate(cursor.getDate() - 7); }
    const oldest = result.rows.at(-1)?.date;
    if (!result.truncated || !oldest || (new Date(oldest) < previous && cursor > weekStart(oldest))) {
      return { streak, thisWeek, volumeChange: previousVolume ? Math.round((volume - previousVolume) / previousVolume * 100) : null };
    }
    before = oldest;
  }
}
export const widgetTrainingQuery = (userId, today) => ({ queryKey: ['widget-training', userId, today], queryFn: () => widgetTrainingStats(userId, today), staleTime: 60000, refetchOnWindowFocus: true });