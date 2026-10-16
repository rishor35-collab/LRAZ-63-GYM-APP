import { queryClientInstance as client } from '@/lib/query-client';
import { clearWorkoutCache } from '@/lib/workoutData';

const QUERY_ENTITIES = {
  'widget-training': ['WorkoutSession'], 'workout-data': ['WorkoutSession', 'WorkoutSet', 'CardioSession', 'ScheduledWorkout'],
  'home-data': ['Goal', 'BodyMeasurement', 'NutritionLog', 'WorkoutSession', 'WorkoutSet', 'RecoveryRecord', 'Achievement', 'ScheduledWorkout', 'TrainingProgram', 'CardioSession'],
  'widget-data': ['Goal', 'BodyMeasurement', 'NutritionLog', 'WorkoutSession', 'ScheduledWorkout', 'TrainingProgram'],
  'progress-data': ['BodyMeasurement', 'WorkoutSession', 'WorkoutSet', 'Achievement', 'CardioSession'],
  'monthly-report': ['BodyMeasurement', 'WorkoutSession', 'WorkoutSet', 'NutritionLog', 'RecoveryRecord', 'CardioSession', 'Habit', 'HabitLog'],
  'measurement-history': ['BodyMeasurement'], 'recovery-records': ['RecoveryRecord'], 'training-calendar': ['ScheduledWorkout', 'WorkoutSession', 'CardioSession'],
  'workout-history': ['WorkoutSession'], 'workout-history-count': ['WorkoutSession'], 'workout-history-sets': ['WorkoutSet'],
  'workout-search-sets': ['WorkoutSet'], 'exercise-history': ['WorkoutSet', 'WorkoutSession'], 'exercise-history-summary': ['WorkoutSet'],
  'cardio-history': ['CardioSession'], 'cardio-summary': ['CardioSession'],
  'nutrition-history-summary': ['NutritionLog'], 'nutrition-history-day': ['NutritionLog'], 'habit-history': ['HabitLog', 'Habit'],
};
const pending = new Set();
let timer;
export function flushFitnessChanges() {
  clearTimeout(timer); timer = undefined;
  if (!pending.size) return;
  clearWorkoutCache();
  const entities = [...pending]; pending.clear();
  const affected = new Set(entities.flatMap(entity => entity === 'WorkoutSession' ? ['WorkoutSession', 'WorkoutSet', 'CardioSession'] : entity === 'BodyMeasurement' ? ['BodyMeasurement', 'Goal'] : [entity]));
  const predicate = query => {
    const [kind, entity] = query.queryKey;
    if (['fitness-records', 'fitness-summary', 'fitness-count'].includes(kind)) return affected.has(entity);
    return QUERY_ENTITIES[kind]?.some(name => affected.has(name)) || false;
  };
  client.cancelQueries({ predicate }, { silent: true });
  client.invalidateQueries({ predicate, refetchType: 'active' });
  entities.forEach(entity => window.dispatchEvent(new CustomEvent('fitness-records-changed', { detail: { entity } })));
}
export function recordsChanged(entity) {
  pending.add(entity);
  clearTimeout(timer); timer = setTimeout(flushFitnessChanges, 100);
}
export function cancelFitnessChanges() { clearTimeout(timer); timer = undefined; pending.clear(); }