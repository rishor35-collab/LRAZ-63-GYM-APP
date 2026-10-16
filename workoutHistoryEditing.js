import { base44 } from '@/api/base44Client';
import { estimate1RM } from '@/lib/fitnessScience';
import { recordPatch, recordsChanged } from '@/lib/recordEditing';
import { workoutFields } from '@/lib/recordFields';

export async function saveWorkoutHistory(session, originalSets, sets, removed, form) {
  const deleted = originalSets.filter(set => removed.includes(set.id));
  const changed = sets.filter(set => !removed.includes(set.id) && JSON.stringify(set) !== JSON.stringify(originalSets.find(original => original.id === set.id)));
  for (let index = 0; index < changed.length; index += 500) await base44.entities.WorkoutSet.bulkUpdate(changed.slice(index, index + 500).map(set => ({ id: set.id, exercise_name: set.exercise_name.trim(), weight_kg: Number(set.weight_kg) || 0, weight_lbs: (Number(set.weight_kg) || 0) * 2.2046226218, reps: Number(set.reps) || 0, rpe: set.rpe === '' ? null : Number(set.rpe) || null, rir: set.rir === '' ? null : Number(set.rir), rest_seconds: Number(set.rest_seconds) || 0, set_type: set.set_type, notes: set.notes || '', is_pr: !!set.is_pr, estimated_1rm: estimate1RM(Number(set.weight_kg), Number(set.reps)) || 0 })));
  if (deleted.length) await base44.entities.WorkoutSet.deleteMany({ session_id: session.id, id: { $in: deleted.map(set => set.id) } });
  const remaining = sets.filter(set => !removed.includes(set.id) && set.completed);
  const { data, unset } = recordPatch(session, workoutFields, form);
  await base44.entities.WorkoutSession.update(session.id, { ...data, total_volume_kg: remaining.reduce((total, set) => total + (Number(set.weight_kg) || 0) * (Number(set.reps) || 0), 0), estimated_1rm_top_set: Math.max(0, ...remaining.map(set => estimate1RM(Number(set.weight_kg), Number(set.reps)) || 0)), pr_count: remaining.filter(set => set.is_pr).length });
  if (Object.keys(unset).length) await base44.entities.WorkoutSession.updateMany({ id: session.id }, { $unset: unset });
  if (data.date) await base44.entities.CardioSession.updateMany({ workout_session_id: session.id }, { $set: { date: data.date } });
  recordsChanged('WorkoutSession');
}
export async function deleteWorkoutHistory(session) {
  await base44.entities.CardioSession.updateMany({ workout_session_id: session.id }, { $set: { session_type: 'standalone' }, $unset: { workout_session_id: '' } });
  await base44.entities.WorkoutSet.deleteMany({ session_id: session.id });
  await base44.entities.WorkoutSession.delete(session.id);
  recordsChanged('WorkoutSession');
}