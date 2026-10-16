import { useQuery } from '@tanstack/react-query';
import { fitnessRecords, fitnessSummary } from '@/lib/fitnessDataCache';
import { queryClientInstance } from '@/lib/query-client';

const EMPTY = { measurements: [], workouts: [], achievements: [], cardio: [], sets: [], workoutTotals: {}, cardioTotals: {} };
const ENTITIES = { body: ['BodyMeasurement'], performance: ['WorkoutSession', 'WorkoutSet'], awards: ['Achievement'], cardio: ['CardioSession'], photos: [] };
export default function useProgressData(user, tab) {
  const result = useQuery({ queryKey: ['progress-data', user?.id, tab], enabled: !!user,
    queryFn: async () => {
      const id = user.id;
      if (tab === 'body') return { measurements: await fitnessRecords('BodyMeasurement', id, {}, { limit: 200 }) };
      if (tab === 'awards') return { achievements: await fitnessRecords('Achievement', id, {}, { sort: '-created_date', limit: 50 }) };
      if (tab === 'performance') {
        const [workouts, sets, summary] = await Promise.all([
          fitnessRecords('WorkoutSession', id, {}, { limit: 60 }),
          fitnessRecords('WorkoutSet', id, {}, { sort: '-created_date', limit: 500 }),
          fitnessSummary('WorkoutSession', id, { query: { status: 'completed' }, sum: ['total_volume_kg', 'pr_count'], max: 'estimated_1rm_top_set' }),
        ]);
        return { workouts, sets, workoutTotals: summary.rows[0] || {} };
      }
      if (tab === 'cardio') {
        const [cardio, summary] = await Promise.all([
          fitnessRecords('CardioSession', id, {}, { limit: 200 }),
          fitnessSummary('CardioSession', id, { sum: ['duration_seconds', 'calories'] }),
        ]);
        return { cardio, cardioTotals: summary.rows[0] || {} };
      }
      return {};
    } });
  const reload = async () => {
    await queryClientInstance.invalidateQueries({ predicate: (query) => ['fitness-records', 'fitness-summary'].includes(query.queryKey[0]) && query.queryKey[2] === user?.id && ENTITIES[tab].includes(query.queryKey[1]), refetchType: 'none' });
    return result.refetch();
  };
  return { ...EMPTY, ...result.data, loading: result.isLoading, error: result.error, reload };
}