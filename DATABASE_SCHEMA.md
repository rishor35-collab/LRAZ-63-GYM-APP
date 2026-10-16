# Database Schema — Supabase Migration

Complete SQL schema for migrating all 28 Base44 entities to Supabase PostgreSQL.

---

## Setup

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 1. User Profiles

Base44's built-in `User` entity maps to Supabase's `auth.users` (managed by Supabase Auth) plus a `user_profiles` table for custom fields.

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  username TEXT UNIQUE,
  age NUMERIC,
  sex TEXT CHECK (sex IN ('male', 'female')),
  height_cm NUMERIC,
  weight_kg NUMERIC,
  goal_weight_kg NUMERIC,
  preferred_units TEXT DEFAULT 'metric' CHECK (preferred_units IN ('metric', 'imperial')),
  activity_level TEXT DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  primary_goal TEXT,
  experience_level TEXT DEFAULT 'Beginner' CHECK (experience_level IN ('Beginner', 'Intermediate', 'Advanced')),
  days_per_week NUMERIC,
  preferred_split TEXT,
  gym_or_home TEXT DEFAULT 'gym' CHECK (gym_or_home IN ('gym', 'home')),
  equipment JSONB DEFAULT '[]',
  session_duration_minutes NUMERIC,
  dietary_preference TEXT,
  allergies JSONB DEFAULT '[]',
  injury_history TEXT,
  medical_notes TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  theme_preference TEXT DEFAULT 'dark',
  notification_preferences JSONB DEFAULT '{}'
);

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

---

## 2. Goals

```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_goal TEXT NOT NULL DEFAULT 'Body Recomposition' CHECK (primary_goal IN ('Fat Loss', 'Muscle Gain', 'Body Recomposition', 'Strength Gain', 'Athletic Performance', 'Endurance', 'General Fitness', 'Maintenance')),
  secondary_goal TEXT,
  target_weight_kg NUMERIC,
  target_body_fat_percent NUMERIC,
  target_date DATE,
  rate_preference TEXT DEFAULT 'Moderate' CHECK (rate_preference IN ('Conservative', 'Moderate', 'Faster')),
  phase TEXT DEFAULT 'Recomposition' CHECK (phase IN ('Foundation', 'Hypertrophy', 'Strength', 'Power', 'Cutting', 'Lean Gaining', 'Recomposition', 'Maintenance', 'Deload', 'Competition Prep', 'Post-Event Recovery', 'Transition')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  starting_weight_kg NUMERIC,
  starting_body_fat_percent NUMERIC,
  calorie_target NUMERIC,
  protein_target_g NUMERIC,
  carb_target_g NUMERIC,
  fat_target_g NUMERIC,
  fiber_target_g NUMERIC,
  water_target_ml NUMERIC,
  step_target NUMERIC DEFAULT 8000,
  progress_percent NUMERIC DEFAULT 0,
  created_at_field TIMESTAMPTZ
);

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner CRUD" ON goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## 3. Training Programs

```sql
CREATE TABLE training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT DEFAULT 'Hypertrophy' CHECK (goal IN ('Muscle Gain', 'Fat Loss', 'Body Recomposition', 'Strength', 'Hypertrophy', 'Athletic Performance', 'Endurance', 'General Fitness', 'Maintenance', 'Beginner Foundation', 'Return-to-Training', 'Competition Preparation')),
  split TEXT NOT NULL DEFAULT 'Upper Lower' CHECK (split IN ('Full Body', 'Upper Lower', 'Push Pull Legs', 'Push Pull', 'Bro Split', 'Arnold Split', 'Powerbuilding', 'Powerlifting', 'Olympic Lifting', 'Hybrid', 'Calisthenics', 'Sport-Specific', 'Home')),
  days_per_week NUMERIC DEFAULT 4,
  session_duration_minutes NUMERIC DEFAULT 60,
  experience_level TEXT DEFAULT 'Intermediate' CHECK (experience_level IN ('Beginner', 'Intermediate', 'Advanced')),
  equipment JSONB DEFAULT '[]',
  duration_weeks NUMERIC DEFAULT 8,
  phase TEXT DEFAULT 'Hypertrophy',
  blocks JSONB DEFAULT '[]',
  is_ai_generated BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false,
  draft BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  schedule_type TEXT DEFAULT 'fixed' CHECK (schedule_type IN ('fixed', 'rotating')),
  weekday_map JSONB DEFAULT '{}',
  start_date DATE,
  days JSONB DEFAULT '[]'
);

CREATE TRIGGER update_training_programs_updated_at BEFORE UPDATE ON training_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner CRUD" ON training_programs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## 4. Workout Sessions

```sql
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES training_programs(id) ON DELETE SET NULL,
  program_day_name TEXT,
  name TEXT NOT NULL,
  focus TEXT,
  date TIMESTAMPTZ NOT NULL,
  duration_minutes NUMERIC,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'skipped')),
  total_volume_kg NUMERIC,
  estimated_1rm_top_set NUMERIC,
  rpe_session NUMERIC,
  pr_count NUMERIC DEFAULT 0,
  notes TEXT,
  synced BOOLEAN DEFAULT true
);

CREATE TRIGGER update_workout_sessions_updated_at BEFORE UPDATE ON workout_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner CRUD" ON workout_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_workout_sessions_user_date ON workout_sessions(user_id, date DESC);
```

---

## 5. Workout Sets

```sql
CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  exercise_id TEXT,
  set_index NUMERIC NOT NULL,
  set_type TEXT DEFAULT 'working' CHECK (set_type IN ('warmup', 'working', 'drop', 'cluster', 'myo', 'giant', 'superset', 'circuit', 'amrap', 'emom')),
  weight_kg NUMERIC,
  weight_lbs NUMERIC,
  reps NUMERIC,
  rpe NUMERIC,
  rir NUMERIC,
  tempo TEXT,
  rest_seconds NUMERIC,
  completed BOOLEAN DEFAULT false,
  is_pr BOOLEAN DEFAULT false,
  estimated_1rm NUMERIC,
  notes TEXT
);

CREATE TRIGGER update_workout_sets_updated_at BEFORE UPDATE ON workout_sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner CRUD" ON workout_sets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_workout_sets_session ON workout_sets(session_id, set_index);
```

---

## 6. Exercises

```sql
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  canonical_id TEXT,
  slug TEXT,
  category TEXT NOT NULL CHECK (category IN ('Resistance', 'Bodybuilding', 'Powerlifting', 'Olympic Weightlifting', 'Strongman', 'Athletic Performance', 'Functional Fitness', 'Calisthenics', 'Endurance', 'Mobility', 'Rehabilitation-Aware', 'Cardio')),
  subcategory TEXT,
  muscle_group TEXT,
  movement_pattern TEXT NOT NULL CHECK (movement_pattern IN ('Horizontal Push', 'Vertical Push', 'Horizontal Pull', 'Vertical Pull', 'Squat', 'Hinge', 'Lunge', 'Hip Extension', 'Knee Extension', 'Knee Flexion', 'Elbow Flexion', 'Elbow Extension', 'Shoulder Abduction', 'Shoulder Flexion', 'Shoulder Extension', 'Calf Raise', 'Core Flexion', 'Core Extension', 'Core Rotation', 'Anti-Rotation', 'Carry', 'Conditioning', 'Other')),
  force_type TEXT CHECK (force_type IN ('Push', 'Pull', 'Hold', 'Carry', 'Cardio', 'Other')),
  laterality TEXT DEFAULT 'Bilateral' CHECK (laterality IN ('Bilateral', 'Unilateral')),
  primary_muscle TEXT NOT NULL,
  secondary_muscles JSONB DEFAULT '[]',
  equipment JSONB DEFAULT '[]',
  difficulty TEXT DEFAULT 'Intermediate' CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  compound BOOLEAN DEFAULT true,
  unilateral BOOLEAN DEFAULT false,
  instructions TEXT,
  setup_instructions TEXT,
  execution_instructions TEXT,
  coaching_cues JSONB DEFAULT '[]',
  common_mistakes JSONB DEFAULT '[]',
  safety_tips JSONB DEFAULT '[]',
  progressions JSONB DEFAULT '[]',
  regressions JSONB DEFAULT '[]',
  alternatives JSONB DEFAULT '[]',
  rep_range_low NUMERIC,
  rep_range_high NUMERIC,
  rest_seconds NUMERIC,
  tracking_type TEXT DEFAULT 'strength' CHECK (tracking_type IN ('strength', 'cardio', 'duration')),
  image_url TEXT,
  video_url TEXT,
  is_custom BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  version NUMERIC DEFAULT 1
);

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner CRUD" ON exercises FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## 7. Scheduled Workouts

```sql
CREATE TABLE scheduled_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  program_id UUID REFERENCES training_programs(id) ON DELETE SET NULL,
  program_day_name TEXT,
  day_index NUMERIC,
  focus TEXT,
  notes TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'program')),
  completed BOOLEAN DEFAULT false
);

CREATE TRIGGER update_scheduled_workouts_updated_at BEFORE UPDATE ON scheduled_workouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE scheduled_workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner CRUD" ON scheduled_workouts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_scheduled_workouts_user_date ON scheduled_workouts(user_id, date);
```

---

## 8. Cardio Sessions

```sql
CREATE TABLE cardio_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  activity TEXT NOT NULL,
  activity_label TEXT,
  duration_seconds NUMERIC NOT NULL,
  distance_km NUMERIC,
  calories NUMERIC,
  calorie_source TEXT DEFAULT 'Estimated' CHECK (calorie_source IN ('Estimated', 'Recorded', 'Manual')),
  avg_speed_kmh NUMERIC,
  avg_pace_sec_per_km NUMERIC,
  incline_percent NUMERIC,
  resistance_level NUMERIC,
  steps NUMERIC,
  floors NUMERIC,
  heart_rate_avg NUMERIC,
  rpe NUMERIC,
  energy NUMERIC,
  performance TEXT,
  soreness NUMERIC,
  notes TEXT,
  session_type TEXT DEFAULT 'standalone' CHECK (session_type IN ('standalone', 'within_workout')),
  workout_session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
  interval_config JSONB
);

CREATE TRIGGER update_cardio_sessions_updated_at BEFORE UPDATE ON cardio_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE cardio_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner CRUD" ON cardio_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_cardio_sessions_user_date ON cardio_sessions(user_id, date DESC);
```

---

## 9. Body Measurements

```sql
CREATE TABLE body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  weight_kg NUMERIC,
  weight_lbs NUMERIC,
  body_fat_percent NUMERIC,
  body_fat_method TEXT CHECK (body_fat_method IN ('DEXA', 'Bod Pod', 'Hydrostatic', 'Calipers', 'BIA', 'Circumference Estimate', 'Visual Estimate', 'User Entered')),
  body_fat_confidence TEXT DEFAULT 'Moderate' CHECK (body_fat_confidence IN ('High', 'Moderate', 'Low', 'Insufficient Data')),
  body_fat_is_estimate BOOLEAN DEFAULT true,
  waist_cm NUMERIC,
  hip_cm NUMERIC,
  neck_cm NUMERIC,
  chest_cm NUMERIC,
  shoulder_cm NUMERIC,
  arm_cm NUMERIC,
  forearm_cm NUMERIC,
  thigh_cm NUMERIC,
  calf_cm NUMERIC,
  resting_hr NUMERIC,
  lean_mass_kg NUMERIC,
  fat_mass_kg NUMERIC,
  measurement_conditions TEXT,
  notes TEXT,
  flagged_inconsistent BOOLEAN DEFAULT false
);

CREATE TRIGGER update_body_measurements_updated_at BEFORE UPDATE ON body_measurements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner CRUD" ON body_measurements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_body_measurements_user_date ON body_measurements(user_id, date DESC);
```

---

## 10. Progress Photos

```sql
CREATE TABLE progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  view TEXT NOT NULL DEFAULT 'Front' CHECK (view IN ('Front', 'Side', 'Back')),
  pose TEXT DEFAULT 'Relaxed' CHECK (pose IN ('Relaxed', 'Flexed')),
  photo_url TEXT NOT NULL,
  weight_kg NUMERIC,
  height_cm NUMERIC,
  notes TEXT,
  is_private BOOLEAN DEFAULT true
);

CREATE TRIGGER update_progress_photos_updated_at BEFORE UPDATE ON progress_photos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner CRUD" ON progress_photos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## 11. Recovery Records

```sql
CREATE TABLE recovery_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sleep_hours NUMERIC,
  sleep_quality NUMERIC,
  hrv NUMERIC,
  resting_hr NUMERIC,
  stress_level NUMERIC,
  soreness_level NUMERIC,
  fatigue_level NUMERIC,
  mood NUMERIC,
  energy NUMERIC,
  steps NUMERIC,
  readiness_score NUMERIC,
  recovery_score NUMERIC,
  source TEXT DEFAULT 'Manual' CHECK (source IN ('Manual', 'Wearable', 'Apple Health', 'Health Connect', 'Garmin', 'WHOOP', 'Oura', 'Fitbit', 'Polar'))
);

CREATE TRIGGER update_recovery_records_updated_at BEFORE UPDATE ON recovery_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE recovery_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner CRUD" ON recovery_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_recovery_records_user_date ON recovery_records(user_id, date DESC);
```

---

## 12. Nutrition Logs

```sql
CREATE TABLE nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal TEXT DEFAULT 'Snack' CHECK (meal IN ('Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout')),
  food_name TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT DEFAULT 'serving',
  calories NUMERIC NOT NULL,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  fiber_g NUMERIC,
  sugar_g NUMERIC,
  sodium_mg NUMERIC,
  source TEXT DEFAULT 'Database' CHECK (source IN ('Database', 'User Entered', 'AI Estimated', 'Barcode', 'Recipe')),
  is_ai_estimated BOOLEAN DEFAULT false,
  logged_at TIMESTAMPTZ
);

CREATE TRIGGER update_nutrition_logs_updated_at BEFORE UPDATE ON nutrition_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner CRUD" ON nutrition_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_nutrition_logs_user_date ON nutrition_logs(user_id, date);
```

---

## 13. Food Items

```sql
CREATE TABLE food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  serving_size NUMERIC,
  serving_unit TEXT DEFAULT 'g',
  calories_per_serving NUMERIC NOT NULL,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  fiber_g NUMERIC,
  sodium_mg NUMERIC,
  sugar_g NUMERIC,
  category TEXT,
  is_custom BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false
);

CREATE TRIGGER update_food_items_updated_at BEFORE UPDATE ON food_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner CRUD" ON food_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## 14. Saved Meals

```sql
CREATE TABLE saved_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal_type TEXT DEFAULT 'Snack' CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout')),
  items JSONB DEFAULT '[]',
  total_calories NUMERIC,
  total_protein_g NUMERIC
);

CREATE TRIGGER update_saved_meals_updated_at BEFORE UPDATE ON saved_meals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE saved_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner CRUD" ON saved_meals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## 15. Favorites

```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('exercise', 'food')),
  ref_id TEXT NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT,
  created_at_field TIMESTAMPTZ
);

CREATE TRIGGER update_favorites_updated_at BEFORE UPDATE ON favorites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner CRUD" ON favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## 16. Habits

```sql
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_per_day NUMERIC DEFAULT 1,
  icon TEXT DEFAULT 'Check',
  color TEXT DEFAULT 'blue',
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
  active BOOLEAN DEFAULT true,
  created_at_field TIMESTAMPTZ
);

CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner CRUD" ON habits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## 17. Habit Logs

```sql
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT true,
  created_at_field TIMESTAMPTZ
);

CREATE TRIGGER update_habit_logs_updated_at BEFORE UPDATE ON habit_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner CRUD" ON habit_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, date);
```

---

## 18. Achievements

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  category TEXT DEFAULT 'Consistency' CHECK (category IN ('Consistency', 'Strength', 'Body Composition', 'Nutrition', 'Recovery', 'Goal', 'Milestone')),
  title TEXT NOT NULL,
  description TEXT,
  requirement TEXT,
  xp_reward NUMERIC DEFAULT 50,
  icon TEXT,
  progress_percent NUMERIC DEFAULT 0,
  unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  verification_source TEXT
);

CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner CRUD" ON achievements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## 19. Coach Messages

```sql
CREATE TABLE coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  context_type TEXT DEFAULT 'general' CHECK (context_type IN ('general', 'workout', 'nutrition', 'recovery', 'body_composition', 'form_analysis', 'supplement', 'programming')),
  structured_output JSONB,
  created_at_field TIMESTAMPTZ
);

CREATE TRIGGER update_coach_messages_updated_at BEFORE UPDATE ON coach_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner CRUD" ON coach_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## 20. Social Profiles (Public Read)

```sql
CREATE TABLE social_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_private BOOLEAN DEFAULT false,
  share_training_stats BOOLEAN DEFAULT false,
  share_to_feed BOOLEAN DEFAULT false,
  public_workout_count NUMERIC DEFAULT 0,
  public_total_volume NUMERIC DEFAULT 0,
  public_pr_count NUMERIC DEFAULT 0,
  public_cardio_count NUMERIC DEFAULT 0,
  public_streak NUMERIC DEFAULT 0,
  public_goal TEXT
);

CREATE TRIGGER update_social_profiles_updated_at BEFORE UPDATE ON social_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE social_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON social_profiles FOR SELECT USING (true);
CREATE POLICY "Owner insert" ON social_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update" ON social_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner delete" ON social_profiles FOR DELETE USING (auth.uid() = user_id);
```

---

## 21. Activity Posts (Public Read)

```sql
CREATE TABLE activity_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  avatar_url TEXT,
  type TEXT DEFAULT 'workout' CHECK (type IN ('workout', 'pr', 'achievement', 'cardio', 'milestone', 'challenge')),
  title TEXT NOT NULL,
  body TEXT,
  entity_type TEXT,
  entity_id TEXT,
  snapshot JSONB,
  likes JSONB DEFAULT '[]',
  comment_count NUMERIC DEFAULT 0
);

CREATE TRIGGER update_activity_posts_updated_at BEFORE UPDATE ON activity_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE activity_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON activity_posts FOR SELECT USING (true);
CREATE POLICY "Owner insert" ON activity_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update" ON activity_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner delete" ON activity_posts FOR DELETE USING (auth.uid() = user_id);
```

---

## 22. Activity Comments (Public Read)

```sql
CREATE TABLE activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES activity_posts(id) ON DELETE CASCADE,
  user_name TEXT,
  avatar_url TEXT,
  content TEXT NOT NULL
);

CREATE TRIGGER update_activity_comments_updated_at BEFORE UPDATE ON activity_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON activity_comments FOR SELECT USING (true);
CREATE POLICY "Owner insert" ON activity_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update" ON activity_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner delete" ON activity_comments FOR DELETE USING (auth.uid() = user_id);
```

---

## 23. Follows (Public Read)

```sql
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follower_name TEXT,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_name TEXT,
  status TEXT DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'declined')),
  acted_at TIMESTAMPTZ
);

CREATE TRIGGER update_follows_updated_at BEFORE UPDATE ON follows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON follows FOR SELECT USING (true);
CREATE POLICY "Self insert" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Following update" ON follows FOR UPDATE USING (auth.uid() = following_id);
CREATE POLICY "Either delete" ON follows FOR DELETE USING (auth.uid() = follower_id OR auth.uid() = following_id);
```

---

## 24. Conversations

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  participant_ids JSONB NOT NULL,
  participant_names JSONB DEFAULT '[]',
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT
);

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participant read" ON conversations FOR SELECT USING (auth.uid() = ANY(ARRAY(SELECT jsonb_array_elements_text(participant_ids))));
CREATE POLICY "Participant insert" ON conversations FOR INSERT WITH CHECK (auth.uid() = ANY(ARRAY(SELECT jsonb_array_elements_text(participant_ids))));
CREATE POLICY "Participant update" ON conversations FOR UPDATE USING (auth.uid() = ANY(ARRAY(SELECT jsonb_array_elements_text(participant_ids))));
CREATE POLICY "Participant delete" ON conversations FOR DELETE USING (auth.uid() = ANY(ARRAY(SELECT jsonb_array_elements_text(participant_ids))));
```

---

## 25. Messages

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_ids JSONB NOT NULL,
  content TEXT,
  attachments JSONB DEFAULT '[]'
);

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participant read" ON messages FOR SELECT USING (auth.uid() = ANY(ARRAY(SELECT jsonb_array_elements_text(participant_ids))));
CREATE POLICY "Sender insert" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND auth.uid() = ANY(ARRAY(SELECT jsonb_array_elements_text(participant_ids))));
CREATE POLICY "Sender update" ON messages FOR UPDATE USING (auth.uid() = sender_id);
CREATE POLICY "Sender delete" ON messages FOR DELETE USING (auth.uid() = sender_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
```

---

## 26. App Notifications

```sql
CREATE TABLE app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'social' CHECK (type IN ('follow', 'follow_request', 'follow_accepted', 'message', 'social')),
  actor_id UUID,
  actor_name TEXT,
  text TEXT,
  entity_type TEXT,
  entity_id TEXT,
  read BOOLEAN DEFAULT false
);

CREATE TRIGGER update_app_notifications_updated_at BEFORE UPDATE ON app_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner read" ON app_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone insert" ON app_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Owner update" ON app_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner delete" ON app_notifications FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_notifications_user ON app_notifications(user_id, created_at DESC);
```

---

## 27. Challenges (Public Read)

```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'workout_count' CHECK (type IN ('workout_count', 'volume', 'cardio_distance', 'calories_burned', 'streak', 'custom')),
  target_value NUMERIC,
  unit TEXT,
  start_date DATE,
  end_date DATE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_name TEXT,
  participant_ids JSONB DEFAULT '[]',
  participant_names JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled'))
);

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON challenges FOR SELECT USING (true);
CREATE POLICY "Creator insert" ON challenges FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Anyone update" ON challenges FOR UPDATE USING (true);
CREATE POLICY "Creator delete" ON challenges FOR DELETE USING (auth.uid() = creator_id);
```

---

## Storage Buckets

```sql
-- Private bucket for progress photos
INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', false);

-- Private bucket for food images
INSERT INTO storage.buckets (id, name, public) VALUES ('food-images', 'food-images', false);

-- Public bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies
CREATE POLICY "Users can upload own progress photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can read own progress photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own progress photos" ON storage.objects FOR DELETE
  USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own food images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can read own food images" ON storage.objects FOR SELECT
  USING (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Data Import Format

The existing **Download Your Data** feature produces JSON with this structure:

```json
{
  "exported_at": "2026-10-16T12:00:00.000Z",
  "app": "LRAZ 63 Performance OS",
  "profile": { "id": "...", "email": "...", "username": "...", "age": 30, ... },
  "body_measurements": [ { "id": "...", "date": "...", "weight_kg": 80, ... } ],
  "workout_sessions": [ ... ],
  "workout_sets": [ ... ],
  "nutrition_logs": [ ... ],
  "cardio_sessions": [ ... ],
  "goals": [ ... ],
  "training_programs": [ ... ],
  "scheduled_workouts": [ ... ],
  "recovery_records": [ ... ],
  "achievements": [ ... ],
  "progress_photos": [ { "...", "photo_url": "[private photo omitted]" } ],
  "food_items": [ ... ],
  "saved_meals": [ ... ],
  "habits": [ ... ],
  "habit_logs": [ ... ],
  "favorites": [ ... ],
  "coaching_history": [ ... ],
  "custom_exercises": [ ... ]
}
```

To build the **Import My Data** feature:
1. Parse the JSON file
2. For each table array, map `created_by_id` → current user's `auth.uid()`
3. Strip the original `id` (let Supabase generate new UUIDs) or keep it if no conflict
4. Insert into the corresponding Supabase table
5. For progress photos: the `photo_url` is `[private photo omitted]` — prompt the user to re-upload photos separately