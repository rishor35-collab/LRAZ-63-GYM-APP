import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { recordsChanged, cancelFitnessChanges } from '@/lib/fitnessInvalidation';

const ENTITIES = ['Goal', 'BodyMeasurement', 'NutritionLog', 'WorkoutSession', 'WorkoutSet', 'CardioSession', 'RecoveryRecord', 'Achievement', 'ScheduledWorkout', 'TrainingProgram', 'Habit', 'HabitLog', 'Favorite', 'FoodItem', 'SavedMeal'];
export default function FitnessDataSync() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const subscriptions = ENTITIES.map(entity => base44.entities[entity].subscribe(event => {
      if (event.data?.created_by_id && event.data.created_by_id !== user.id) return;
      recordsChanged(entity);
    }));
    return () => { subscriptions.forEach(unsubscribe => unsubscribe()); cancelFitnessChanges(); };
  }, [user?.id]);
  return null;
}