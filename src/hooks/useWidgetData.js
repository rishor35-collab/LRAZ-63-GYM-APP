import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { localDateStr } from '@/lib/utils';

const TODAY = localDateStr();

/**
 * Shared data hook for all widget components.
 * Loads goal, nutrition logs, workout sessions, body measurements,
 * today's scheduled workout, and training programs in a single batch.
 * Returns a stable `reload` function so widgets can refresh after mutations.
 */
export function useWidgetData() {
  const { user } = useAuth();
  const [data, setData] = useState({
    goal: null,
    nutrition: [],
    sessions: [],
    measurements: [],
    scheduled: null,
    programs: [],
    loading: true,
  });

  const load = useCallback(async () => {
    try {
      const [goals, nut, sess, meas, sched, progs] = await Promise.all([
        base44.entities.Goal.filter({ status: 'active' }, '-created_date', 1),
        base44.entities.NutritionLog.list('-date', 200),
        base44.entities.WorkoutSession.list('-date', 60),
        base44.entities.BodyMeasurement.list('-date', 30),
        base44.entities.ScheduledWorkout.filter({ date: TODAY, completed: false }, '-date', 1),
        base44.entities.TrainingProgram.list('-created_date', 5),
      ]);
      setData({
        goal: goals?.[0] || null,
        nutrition: nut || [],
        sessions: sess || [],
        measurements: meas || [],
        scheduled: sched?.[0] || null,
        programs: progs || [],
        loading: false,
      });
    } catch (e) {
      console.error('useWidgetData error', e);
      setData((d) => ({ ...d, loading: false }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...data, user, today: TODAY, reload: load };
}