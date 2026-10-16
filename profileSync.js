import { base44 } from '@/api/base44Client';
import { calcBMR, calcTDEE, calcCalorieTarget, calcMacros } from './fitnessScience';

// Recompute nutrition targets from the user's current stats + goal.
export function recalcGoalTargets(user, goal) {
  if (!user || !goal) return null;
  const weightKg = user.weight_kg;
  if (!weightKg || !user.height_cm || !user.age) return null;
  const bmr = calcBMR({ weightKg, heightCm: user.height_cm, age: user.age, sex: user.sex });
  if (!bmr) return null;
  const tdee = calcTDEE(bmr, user.activity_level || 'moderate');
  const calorieTarget = calcCalorieTarget(tdee, goal.primary_goal, goal.rate_preference);
  const macros = calcMacros({ weightKg, calorieTarget, goal: goal.primary_goal });
  if (!calorieTarget || !macros) return null;
  return {
    calorie_target: calorieTarget,
    protein_target_g: macros.proteinG,
    carb_target_g: macros.carbG,
    fat_target_g: macros.fatG,
    fiber_target_g: macros.fiberG,
    water_target_ml: macros.waterMl,
  };
}

// After a new body measurement, sync the user's weight and auto-recalc goal targets.
// Loads the active goal if not provided so callers only need the measurement + user.
export async function syncProfileFromMeasurement(measurement, user, goal) {
  if (!measurement?.weight_kg) return null;
  if (user) {
    try { await base44.auth.updateMe({ weight_kg: measurement.weight_kg }); } catch (e) { console.error(e); }
  }
  let activeGoal = goal;
  if (!activeGoal) {
    try {
      const goals = await base44.entities.Goal.filter({ status: 'active' }, '-created_date', 1);
      activeGoal = goals[0];
    } catch (e) { console.error(e); }
  }
  if (!activeGoal || !user) return null;
  const newTargets = recalcGoalTargets({ ...user, weight_kg: measurement.weight_kg }, activeGoal);
  if (!newTargets) return null;
  try { await base44.entities.Goal.update(activeGoal.id, newTargets); } catch (e) { console.error(e); }
  return newTargets;
}