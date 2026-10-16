import { base44 } from '@/api/base44Client';

const TABLES = [
  ['BodyMeasurement', 'body_measurements', 'body measurements'], ['WorkoutSession', 'workout_sessions', 'workouts'],
  ['WorkoutSet', 'workout_sets', 'workout sets'], ['NutritionLog', 'nutrition_logs', 'nutrition logs'],
  ['CardioSession', 'cardio_sessions', 'cardio sessions'], ['Goal', 'goals', 'goals'],
  ['TrainingProgram', 'training_programs', 'training programs'], ['ScheduledWorkout', 'scheduled_workouts', 'scheduled workouts'],
  ['RecoveryRecord', 'recovery_records', 'recovery records'], ['Achievement', 'achievements', 'achievements'],
  ['ProgressPhoto', 'progress_photos', 'photo details'], ['FoodItem', 'food_items', 'custom foods'],
  ['SavedMeal', 'saved_meals', 'saved meals'], ['Habit', 'habits', 'habits'], ['HabitLog', 'habit_logs', 'habit history'],
  ['Favorite', 'favorites', 'favorites'], ['CoachMessage', 'coaching_history', 'coaching history'], ['Exercise', 'custom_exercises', 'custom exercises'],
];
const PROFILE_FIELDS = ['id', 'email', 'full_name', 'username', 'age', 'sex', 'height_cm', 'weight_kg', 'goal_weight_kg', 'preferred_units', 'activity_level', 'primary_goal', 'experience_level', 'days_per_week', 'preferred_split', 'gym_or_home', 'equipment', 'session_duration_minutes', 'dietary_preference', 'allergies', 'injury_history', 'medical_notes', 'onboarding_completed', 'theme_preference', 'notification_preferences', 'accent_color', 'oled_mode', 'profile_private', 'push_enabled'];
const csvCell = (value) => {
  let text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (typeof value === 'string' && /^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export async function downloadPersonalData(user, format, onProgress) {
  if (!user?.id) throw new Error('Please sign in before downloading your data.');
  const currentUser = await base44.auth.me();
  if (currentUser.id !== user.id) throw new Error('Your account changed. Please reopen Settings and try again.');
  const payload = { exported_at: new Date().toISOString(), app: 'LRAZ 63 Performance OS', profile: Object.fromEntries(PROFILE_FIELDS.filter((key) => currentUser[key] !== undefined).map((key) => [key, currentUser[key]])) };
  for (const [entity, key, label] of TABLES) {
    const records = []; let cursor;
    do {
      onProgress(`Preparing ${label}… ${records.length} records`);
      const page = await base44.entities[entity].filter({ created_by_id: user.id }, { sort: '-created_date', limit: 200, cursor });
      records.push(...page.items.map((record) => entity === 'ProgressPhoto' ? { ...record, photo_url: '[private photo omitted]' } : record));
      cursor = page.has_more ? page.next_cursor : undefined;
      await new Promise((resolve) => setTimeout(resolve, 0));
    } while (cursor);
    payload[key] = records;
  }
  onProgress('Preparing your download…');
  const csv = format === 'csv' ? '\uFEFF' + [['profile', [payload.profile]], ...TABLES.map(([, key]) => [key, payload[key]])].map(([key, rows]) => {
    const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    return `# ${key}\r\n${columns.map(csvCell).join(',')}\r\n${rows.map((row) => columns.map((column) => csvCell(row[column])).join(',')).join('\r\n')}`;
  }).join('\r\n\r\n') : null;
  const blob = new Blob([csv ?? JSON.stringify(payload, null, 2)], { type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = `lraz63-my-data-${new Date().toISOString().slice(0, 10)}.${format}`;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}