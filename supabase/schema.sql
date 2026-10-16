-- LRAZ63 initial schema generated from original Base44 entity definitions.
-- Run in Supabase SQL Editor on a NEW project or after reviewing existing tables.
create extension if not exists pgcrypto;

create table if not exists public."achievement" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "achievement_id" text,
  "category" text,
  "title" text,
  "description" text,
  "requirement" text,
  "xp_reward" numeric,
  "icon" text,
  "progress_percent" numeric,
  "unlocked" boolean,
  "unlocked_at" timestamptz,
  "verification_source" text
);
create index if not exists "achievement_owner_idx" on public."achievement"(created_by_id);
alter table public."achievement" enable row level security;
create policy "achievement_owner_select" on public."achievement" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "achievement_owner_insert" on public."achievement" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "achievement_owner_update" on public."achievement" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "achievement_owner_delete" on public."achievement" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."activity_comment" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "post_id" text,
  "user_id" text,
  "user_name" text,
  "avatar_url" text,
  "content" text
);
create index if not exists "activity_comment_owner_idx" on public."activity_comment"(created_by_id);
alter table public."activity_comment" enable row level security;
create policy "activity_comment_owner_select" on public."activity_comment" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "activity_comment_owner_insert" on public."activity_comment" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "activity_comment_owner_update" on public."activity_comment" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "activity_comment_owner_delete" on public."activity_comment" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."activity_post" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "user_id" text,
  "user_name" text,
  "avatar_url" text,
  "type" text,
  "title" text,
  "body" text,
  "entity_type" text,
  "entity_id" text,
  "snapshot" jsonb,
  "likes" jsonb,
  "comment_count" numeric
);
create index if not exists "activity_post_owner_idx" on public."activity_post"(created_by_id);
alter table public."activity_post" enable row level security;
create policy "activity_post_owner_select" on public."activity_post" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "activity_post_owner_insert" on public."activity_post" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "activity_post_owner_update" on public."activity_post" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "activity_post_owner_delete" on public."activity_post" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."app_notification" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "user_id" text,
  "type" text,
  "actor_id" text,
  "actor_name" text,
  "text" text,
  "entity_type" text,
  "entity_id" text,
  "read" boolean
);
create index if not exists "app_notification_owner_idx" on public."app_notification"(created_by_id);
alter table public."app_notification" enable row level security;
create policy "app_notification_owner_select" on public."app_notification" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "app_notification_owner_insert" on public."app_notification" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "app_notification_owner_update" on public."app_notification" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "app_notification_owner_delete" on public."app_notification" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."body_measurement" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "date" timestamptz,
  "weight_kg" numeric,
  "weight_lbs" numeric,
  "body_fat_percent" numeric,
  "body_fat_method" text,
  "body_fat_confidence" text,
  "body_fat_is_estimate" boolean,
  "waist_cm" numeric,
  "hip_cm" numeric,
  "neck_cm" numeric,
  "chest_cm" numeric,
  "shoulder_cm" numeric,
  "arm_cm" numeric,
  "forearm_cm" numeric,
  "thigh_cm" numeric,
  "calf_cm" numeric,
  "resting_hr" numeric,
  "lean_mass_kg" numeric,
  "fat_mass_kg" numeric,
  "measurement_conditions" text,
  "notes" text,
  "flagged_inconsistent" boolean
);
create index if not exists "body_measurement_owner_idx" on public."body_measurement"(created_by_id);
alter table public."body_measurement" enable row level security;
create policy "body_measurement_owner_select" on public."body_measurement" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "body_measurement_owner_insert" on public."body_measurement" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "body_measurement_owner_update" on public."body_measurement" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "body_measurement_owner_delete" on public."body_measurement" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."cardio_session" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "date" timestamptz,
  "activity" text,
  "activity_label" text,
  "duration_seconds" numeric,
  "distance_km" numeric,
  "calories" numeric,
  "calorie_source" text,
  "avg_speed_kmh" numeric,
  "avg_pace_sec_per_km" numeric,
  "incline_percent" numeric,
  "resistance_level" numeric,
  "steps" numeric,
  "floors" numeric,
  "heart_rate_avg" numeric,
  "rpe" numeric,
  "energy" numeric,
  "performance" text,
  "soreness" numeric,
  "notes" text,
  "session_type" text,
  "workout_session_id" text,
  "interval_config" jsonb
);
create index if not exists "cardio_session_owner_idx" on public."cardio_session"(created_by_id);
alter table public."cardio_session" enable row level security;
create policy "cardio_session_owner_select" on public."cardio_session" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "cardio_session_owner_insert" on public."cardio_session" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "cardio_session_owner_update" on public."cardio_session" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "cardio_session_owner_delete" on public."cardio_session" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."challenge" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "name" text,
  "description" text,
  "type" text,
  "target_value" numeric,
  "unit" text,
  "start_date" date,
  "end_date" date,
  "creator_id" text,
  "creator_name" text,
  "participant_ids" jsonb,
  "participant_names" jsonb,
  "status" text
);
create index if not exists "challenge_owner_idx" on public."challenge"(created_by_id);
alter table public."challenge" enable row level security;
create policy "challenge_owner_select" on public."challenge" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "challenge_owner_insert" on public."challenge" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "challenge_owner_update" on public."challenge" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "challenge_owner_delete" on public."challenge" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."coach_message" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "role" text,
  "content" text,
  "attachments" jsonb,
  "context_type" text,
  "structured_output" jsonb,
  "created_at" timestamptz
);
create index if not exists "coach_message_owner_idx" on public."coach_message"(created_by_id);
alter table public."coach_message" enable row level security;
create policy "coach_message_owner_select" on public."coach_message" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "coach_message_owner_insert" on public."coach_message" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "coach_message_owner_update" on public."coach_message" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "coach_message_owner_delete" on public."coach_message" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."conversation" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "participant_ids" jsonb,
  "participant_names" jsonb,
  "last_message_at" timestamptz,
  "last_message_preview" text
);
create index if not exists "conversation_owner_idx" on public."conversation"(created_by_id);
alter table public."conversation" enable row level security;
create policy "conversation_owner_select" on public."conversation" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "conversation_owner_insert" on public."conversation" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "conversation_owner_update" on public."conversation" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "conversation_owner_delete" on public."conversation" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."exercise" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "name" text,
  "canonical_id" text,
  "slug" text,
  "category" text,
  "subcategory" text,
  "muscle_group" text,
  "movement_pattern" text,
  "force_type" text,
  "laterality" text,
  "primary_muscle" text,
  "secondary_muscles" jsonb,
  "equipment" jsonb,
  "difficulty" text,
  "compound" boolean,
  "unilateral" boolean,
  "instructions" text,
  "setup_instructions" text,
  "execution_instructions" text,
  "coaching_cues" jsonb,
  "common_mistakes" jsonb,
  "safety_tips" jsonb,
  "progressions" jsonb,
  "regressions" jsonb,
  "alternatives" jsonb,
  "rep_range_low" numeric,
  "rep_range_high" numeric,
  "rest_seconds" numeric,
  "tracking_type" text,
  "image_url" text,
  "video_url" text,
  "is_custom" boolean,
  "active" boolean,
  "version" numeric
);
create index if not exists "exercise_owner_idx" on public."exercise"(created_by_id);
alter table public."exercise" enable row level security;
create policy "exercise_owner_select" on public."exercise" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "exercise_owner_insert" on public."exercise" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "exercise_owner_update" on public."exercise" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "exercise_owner_delete" on public."exercise" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."favorite" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "type" text,
  "ref_id" text,
  "name" text,
  "subtitle" text,
  "created_at" timestamptz
);
create index if not exists "favorite_owner_idx" on public."favorite"(created_by_id);
alter table public."favorite" enable row level security;
create policy "favorite_owner_select" on public."favorite" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "favorite_owner_insert" on public."favorite" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "favorite_owner_update" on public."favorite" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "favorite_owner_delete" on public."favorite" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."follow" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "follower_id" text,
  "follower_name" text,
  "following_id" text,
  "following_name" text,
  "status" text,
  "acted_at" timestamptz
);
create index if not exists "follow_owner_idx" on public."follow"(created_by_id);
alter table public."follow" enable row level security;
create policy "follow_owner_select" on public."follow" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "follow_owner_insert" on public."follow" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "follow_owner_update" on public."follow" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "follow_owner_delete" on public."follow" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."food_item" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "name" text,
  "brand" text,
  "barcode" text,
  "serving_size" numeric,
  "serving_unit" text,
  "calories_per_serving" numeric,
  "protein_g" numeric,
  "carbs_g" numeric,
  "fat_g" numeric,
  "fiber_g" numeric,
  "sodium_mg" numeric,
  "sugar_g" numeric,
  "category" text,
  "is_custom" boolean,
  "is_favorite" boolean
);
create index if not exists "food_item_owner_idx" on public."food_item"(created_by_id);
alter table public."food_item" enable row level security;
create policy "food_item_owner_select" on public."food_item" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "food_item_owner_insert" on public."food_item" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "food_item_owner_update" on public."food_item" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "food_item_owner_delete" on public."food_item" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."goal" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "primary_goal" text,
  "secondary_goal" text,
  "target_weight_kg" numeric,
  "target_body_fat_percent" numeric,
  "target_date" date,
  "rate_preference" text,
  "phase" text,
  "status" text,
  "starting_weight_kg" numeric,
  "starting_body_fat_percent" numeric,
  "calorie_target" numeric,
  "protein_target_g" numeric,
  "carb_target_g" numeric,
  "fat_target_g" numeric,
  "fiber_target_g" numeric,
  "water_target_ml" numeric,
  "step_target" numeric,
  "progress_percent" numeric,
  "created_at" timestamptz
);
create index if not exists "goal_owner_idx" on public."goal"(created_by_id);
alter table public."goal" enable row level security;
create policy "goal_owner_select" on public."goal" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "goal_owner_insert" on public."goal" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "goal_owner_update" on public."goal" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "goal_owner_delete" on public."goal" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."habit" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "name" text,
  "description" text,
  "target_per_day" numeric,
  "icon" text,
  "color" text,
  "frequency" text,
  "active" boolean,
  "created_at" timestamptz
);
create index if not exists "habit_owner_idx" on public."habit"(created_by_id);
alter table public."habit" enable row level security;
create policy "habit_owner_select" on public."habit" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "habit_owner_insert" on public."habit" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "habit_owner_update" on public."habit" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "habit_owner_delete" on public."habit" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."habit_log" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "habit_id" text,
  "date" date,
  "completed" boolean,
  "created_at" timestamptz
);
create index if not exists "habit_log_owner_idx" on public."habit_log"(created_by_id);
alter table public."habit_log" enable row level security;
create policy "habit_log_owner_select" on public."habit_log" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "habit_log_owner_insert" on public."habit_log" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "habit_log_owner_update" on public."habit_log" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "habit_log_owner_delete" on public."habit_log" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."message" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "conversation_id" text,
  "sender_id" text,
  "participant_ids" jsonb,
  "content" text,
  "attachments" jsonb
);
create index if not exists "message_owner_idx" on public."message"(created_by_id);
alter table public."message" enable row level security;
create policy "message_owner_select" on public."message" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "message_owner_insert" on public."message" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "message_owner_update" on public."message" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "message_owner_delete" on public."message" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."nutrition_log" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "date" date,
  "meal" text,
  "food_name" text,
  "quantity" numeric,
  "unit" text,
  "calories" numeric,
  "protein_g" numeric,
  "carbs_g" numeric,
  "fat_g" numeric,
  "fiber_g" numeric,
  "sugar_g" numeric,
  "sodium_mg" numeric,
  "source" text,
  "is_ai_estimated" boolean,
  "logged_at" timestamptz
);
create index if not exists "nutrition_log_owner_idx" on public."nutrition_log"(created_by_id);
alter table public."nutrition_log" enable row level security;
create policy "nutrition_log_owner_select" on public."nutrition_log" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "nutrition_log_owner_insert" on public."nutrition_log" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "nutrition_log_owner_update" on public."nutrition_log" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "nutrition_log_owner_delete" on public."nutrition_log" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."progress_photo" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "date" timestamptz,
  "view" text,
  "pose" text,
  "photo_url" text,
  "weight_kg" numeric,
  "height_cm" numeric,
  "notes" text,
  "is_private" boolean
);
create index if not exists "progress_photo_owner_idx" on public."progress_photo"(created_by_id);
alter table public."progress_photo" enable row level security;
create policy "progress_photo_owner_select" on public."progress_photo" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "progress_photo_owner_insert" on public."progress_photo" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "progress_photo_owner_update" on public."progress_photo" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "progress_photo_owner_delete" on public."progress_photo" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."recovery_record" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "date" date,
  "sleep_hours" numeric,
  "sleep_quality" numeric,
  "hrv" numeric,
  "resting_hr" numeric,
  "stress_level" numeric,
  "soreness_level" numeric,
  "fatigue_level" numeric,
  "mood" numeric,
  "energy" numeric,
  "steps" numeric,
  "readiness_score" numeric,
  "recovery_score" numeric,
  "source" text
);
create index if not exists "recovery_record_owner_idx" on public."recovery_record"(created_by_id);
alter table public."recovery_record" enable row level security;
create policy "recovery_record_owner_select" on public."recovery_record" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "recovery_record_owner_insert" on public."recovery_record" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "recovery_record_owner_update" on public."recovery_record" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "recovery_record_owner_delete" on public."recovery_record" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."saved_meal" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "name" text,
  "meal_type" text,
  "items" jsonb,
  "total_calories" numeric,
  "total_protein_g" numeric
);
create index if not exists "saved_meal_owner_idx" on public."saved_meal"(created_by_id);
alter table public."saved_meal" enable row level security;
create policy "saved_meal_owner_select" on public."saved_meal" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "saved_meal_owner_insert" on public."saved_meal" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "saved_meal_owner_update" on public."saved_meal" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "saved_meal_owner_delete" on public."saved_meal" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."scheduled_workout" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "date" date,
  "title" text,
  "program_id" text,
  "program_day_name" text,
  "day_index" numeric,
  "focus" text,
  "notes" text,
  "source" text,
  "completed" boolean
);
create index if not exists "scheduled_workout_owner_idx" on public."scheduled_workout"(created_by_id);
alter table public."scheduled_workout" enable row level security;
create policy "scheduled_workout_owner_select" on public."scheduled_workout" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "scheduled_workout_owner_insert" on public."scheduled_workout" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "scheduled_workout_owner_update" on public."scheduled_workout" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "scheduled_workout_owner_delete" on public."scheduled_workout" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."social_profile" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "user_id" text,
  "username" text,
  "display_name" text,
  "bio" text,
  "avatar_url" text,
  "is_private" boolean,
  "share_training_stats" boolean,
  "share_to_feed" boolean,
  "public_workout_count" numeric,
  "public_total_volume" numeric,
  "public_pr_count" numeric,
  "public_cardio_count" numeric,
  "public_streak" numeric,
  "public_goal" text
);
create index if not exists "social_profile_owner_idx" on public."social_profile"(created_by_id);
alter table public."social_profile" enable row level security;
create policy "social_profile_owner_select" on public."social_profile" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "social_profile_owner_insert" on public."social_profile" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "social_profile_owner_update" on public."social_profile" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "social_profile_owner_delete" on public."social_profile" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."training_program" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "name" text,
  "description" text,
  "goal" text,
  "split" text,
  "days_per_week" numeric,
  "session_duration_minutes" numeric,
  "experience_level" text,
  "equipment" jsonb,
  "duration_weeks" numeric,
  "phase" text,
  "blocks" jsonb,
  "is_ai_generated" boolean,
  "is_template" boolean,
  "archived" boolean,
  "draft" boolean,
  "active" boolean,
  "schedule_type" text,
  "weekday_map" jsonb,
  "start_date" date,
  "days" jsonb
);
create index if not exists "training_program_owner_idx" on public."training_program"(created_by_id);
alter table public."training_program" enable row level security;
create policy "training_program_owner_select" on public."training_program" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "training_program_owner_insert" on public."training_program" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "training_program_owner_update" on public."training_program" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "training_program_owner_delete" on public."training_program" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."workout_session" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "program_id" text,
  "program_day_name" text,
  "name" text,
  "focus" text,
  "date" timestamptz,
  "duration_minutes" numeric,
  "status" text,
  "total_volume_kg" numeric,
  "estimated_1rm_top_set" numeric,
  "rpe_session" numeric,
  "pr_count" numeric,
  "notes" text,
  "synced" boolean
);
create index if not exists "workout_session_owner_idx" on public."workout_session"(created_by_id);
alter table public."workout_session" enable row level security;
create policy "workout_session_owner_select" on public."workout_session" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "workout_session_owner_insert" on public."workout_session" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "workout_session_owner_update" on public."workout_session" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "workout_session_owner_delete" on public."workout_session" for delete to authenticated using (created_by_id = (select auth.uid()));

create table if not exists public."workout_set" (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null default auth.uid() references auth.users(id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  "session_id" text,
  "exercise_name" text,
  "exercise_id" text,
  "set_index" numeric,
  "set_type" text,
  "weight_kg" numeric,
  "weight_lbs" numeric,
  "reps" numeric,
  "rpe" numeric,
  "rir" numeric,
  "tempo" text,
  "rest_seconds" numeric,
  "completed" boolean,
  "is_pr" boolean,
  "estimated_1rm" numeric,
  "notes" text
);
create index if not exists "workout_set_owner_idx" on public."workout_set"(created_by_id);
alter table public."workout_set" enable row level security;
create policy "workout_set_owner_select" on public."workout_set" for select to authenticated using (created_by_id = (select auth.uid()));
create policy "workout_set_owner_insert" on public."workout_set" for insert to authenticated with check (created_by_id = (select auth.uid()));
create policy "workout_set_owner_update" on public."workout_set" for update to authenticated using (created_by_id = (select auth.uid())) with check (created_by_id = (select auth.uid()));
create policy "workout_set_owner_delete" on public."workout_set" for delete to authenticated using (created_by_id = (select auth.uid()));
