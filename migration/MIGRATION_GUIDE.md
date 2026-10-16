# LRAZ 63 Performance OS — Migration Guide

**From:** Base44 → Independent React + Supabase
**Date:** 2026-10-16
**Goal:** Reproduce the current application with identical design, features, and UX, without Base44 dependencies.

---

## 1. What Was Exported

A complete source-code ZIP (`lraz63-source-export.zip`) has been generated containing:

| Category | Count | Location |
|---|---|---|
| React pages | 48 | `src/pages/` |
| React components | 130+ | `src/components/` |
| Custom hooks | 17 | `src/hooks/` |
| Utility/logic libraries | 30+ | `src/lib/` |
| Entity schemas (JSON) | 28 | `base44/entities/` |
| shadcn/ui components | 40+ | `src/components/ui/` |
| Static assets | 3 | `public/` |
| Config files | 8 | root |
| CSS theme system | 1 | `src/index.css` |
| Full source dump (text) | 1 | `LARZ63_FULL_SOURCE.txt` |

**No backend functions exist** — `base44/functions/` is empty. All app logic is client-side.
**No agents exist** — `base44/agents/` is empty.

---

## 2. What Cannot Be Exported

| Item | Reason | Replacement |
|---|---|---|
| User database records | Private data — cannot be extracted | Use the app's built-in **Download Your Data** feature (JSON/CSV), then build an **Import My Data** feature in the new app |
| Base44 auth tokens/sessions | Platform-managed secrets | Supabase Auth |
| OAuth client secrets | Platform-managed | Register your own OAuth apps (Google, Apple) |
| `@base44/sdk` package | Proprietary platform SDK | Supabase JS client |
| `@base44/vite-plugin` | Build-time platform injection | Remove from `vite.config.js` |
| Realtime subscriptions | Base44 platform feature | Supabase Realtime |
| Row-Level Security (RLS) rules | Base44 platform enforcement | Supabase RLS policies (PostgreSQL) |
| InvokeLLM / AI integrations | Base44 platform credits | OpenAI/Anthropic API with your own key |
| UploadPrivateFile / UploadPublicFile | Base44 storage | Supabase Storage buckets |
| SendEmail | Base44 email service | Resend, SendGrid, or Supabase Edge Functions + SMTP |
| Push notifications | Base44 mobile push | Firebase Cloud Messaging + APNs |

---

## 3. Architecture Overview

### Current (Base44)
```
React SPA → @base44/sdk → Base44 API → MongoDB + Auth + Storage + AI
```

### Target (Independent)
```
React SPA → @supabase/supabase-js → Supabase (PostgreSQL + Auth + Storage + Realtime)
                   ↘ OpenAI/Anthropic API (for AI coach features)
                   ↘ Resend/SendGrid (for email)
```

---

## 4. Migration Steps (Summary)

### Phase 1: Project Setup (StackBlitz + GitHub)
1. Create a new GitHub repository `lraz63-performance-os`
2. Open StackBlitz → "Import from GitHub" → paste repo URL
3. Upload the contents of `lraz63-source-export.zip` to the repo
4. Remove Base44-specific packages: `npm uninstall @base44/sdk @base44/vite-plugin`
5. Install Supabase: `npm install @supabase/supabase-js`
6. Update `vite.config.js` — remove the `base44()` plugin, keep only `react()`
7. Update `package.json` — remove `@base44/*` from dependencies

### Phase 2: Supabase Setup
1. Create a Supabase project at supabase.com (free tier works)
2. Run the SQL schema from `DATABASE_SCHEMA.md` in the SQL editor
3. Enable Email auth + any OAuth providers (Google, Apple) in Auth settings
4. Create storage buckets: `progress-photos` (private), `food-images` (private), `avatars` (public)
5. Copy the Supabase URL and anon key into a `.env` file

### Phase 3: Replace the SDK Client
The single file `src/api/base44Client.js` is the **only** file that initializes the Base44 SDK. Replace it with a Supabase client:

```js
// src/api/base44Client.js (NEW)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true }
});
```

Then create a compatibility layer (`src/api/entityAdapter.js`) that maps `base44.entities.X.filter()` / `.create()` / `.update()` / `.delete()` calls to Supabase queries. This lets you keep all 270 source files unchanged while swapping the backend.

### Phase 4: Replace Auth
The auth system lives in:
- `src/lib/AuthContext.jsx` — auth state provider
- `src/pages/Login.jsx` — login page
- `src/pages/Register.jsx` — register + OTP flow
- `src/pages/ForgotPassword.jsx` — password reset request
- `src/pages/ResetPassword.jsx` — password reset
- `src/components/ProtectedRoute.jsx` — route guard

Replace Base44 auth SDK calls (`base44.auth.me()`, `base44.auth.isAuthenticated()`, `base44.auth.logout()`, `loginViaEmailPassword()`, `register()`, `verifyOtp()`, `resetPassword()`, `resetPasswordRequest()`) with Supabase Auth equivalents (`supabase.auth.signInWithPassword()`, `supabase.auth.signUp()`, `supabase.auth.verifyOtp()`, `supabase.auth.resetPasswordForEmail()`, `supabase.auth.updateUser()`, `supabase.auth.getSession()`, `supabase.auth.signOut()`).

### Phase 5: Replace File Uploads
Search for `UploadPrivateFile` and `UploadPublicFile` calls across the codebase. Replace with Supabase Storage:

```js
// Private upload (progress photos, body measurements)
const { data, error } = await supabase.storage
  .from('progress-photos')
  .upload(`${user.id}/${filename}`, file, { upsert: false });
const { data: { publicUrl } } = supabase.storage
  .from('progress-photos')
  .getPublicUrl(data.path); // or createSignedUrl for private access
```

### Phase 6: Replace AI Integrations
Search for `base44.integrations.Core.InvokeLLM` calls (primarily in Coach features). Replace with direct OpenAI/Anthropic API calls via Supabase Edge Functions (to protect your API key — never call directly from the client).

### Phase 7: Replace Email
Search for `base44.integrations.Core.SendEmail` calls. Replace with Resend or SendGrid, called from Supabase Edge Functions.

### Phase 8: Data Import Feature
Build an **Import My Data** page that:
1. Accepts a JSON file (the output of the existing Download Your Data feature)
2. Parses the profile + all entity arrays
3. Inserts records into Supabase tables, mapping `created_by_id` to the authenticated user's ID
4. Uploads progress photos to Supabase Storage (if the user re-uploads them separately, since the export omits photo URLs for privacy)

---

## 5. File Inventory by Module

### Training & Workouts
- `src/pages/Train.jsx`, `src/pages/WorkoutLogger.jsx`, `src/pages/TrainHistoryPage.jsx`
- `src/components/train/` (12 components: LiveTraining, WorkoutSetEditor, WorkoutHistoryViewer, etc.)
- `src/components/workout/` (6 components: WorkoutSetGrid, RestCountdown, WarmupPlanner, etc.)
- `src/lib/workoutData.js`, `src/lib/workoutHistoryEditing.js`, `src/lib/widgetTrainingStats.js`
- Entities: `WorkoutSession`, `WorkoutSet`, `TrainingProgram`, `ScheduledWorkout`

### Exercise Library
- `src/pages/ExerciseLibrary.jsx`, `src/pages/ExerciseDetail.jsx`, `src/pages/ExerciseHistory.jsx`
- `src/components/exercises/` (14 components: ExerciseDetailSheet, AnatomyFigure, MuscleActivation, etc.)
- `src/lib/exerciseDatabase.js`, `src/lib/exerciseImages.js`, `src/lib/exercises/` (9 category files)
- Entity: `Exercise`

### Nutrition
- `src/pages/Nutrition.jsx`, `src/pages/NutritionHistory.jsx`
- `src/components/nutrition/` (14 components: AddFoodPage, BarcodeScanner, MealBuilder, etc.)
- `src/lib/foodDatabase.js`
- Entities: `NutritionLog`, `FoodItem`, `SavedMeal`, `Favorite`

### Cardio
- `src/pages/Cardio.jsx`, `src/pages/CardioSession.jsx`, `src/pages/CardioHistory.jsx`
- `src/components/cardio/CardioLivePanel.jsx`
- `src/lib/cardioAnalytics.js`, `src/lib/cardioSessionClock.js`
- Entity: `CardioSession`

### Progress & Body
- `src/pages/Progress.jsx`, `src/pages/GoalJourney.jsx`
- `src/components/progress/` (3 components: MeasurementHistory, PRTimeline, ProgressPhotos)
- `src/lib/progressEngine.js`, `src/lib/goalJourney.js`
- Entities: `BodyMeasurement`, `ProgressPhoto`, `Goal`, `Achievement`

### Recovery
- `src/pages/HRZones.jsx`
- `src/components/recovery/` (3 components: ReadinessCheckIn, WeeklyReview, MuscleRecoveryMap)
- Entity: `RecoveryRecord`

### Coach (AI)
- `src/pages/Coach.jsx`
- `src/components/coach/` (8 components: TrainingDistribution, RecoveryHistory, ProgressionSuggestions, etc.)
- `src/components/FloatingCoach.jsx`
- Entity: `CoachMessage`

### Calendar & Planning
- `src/pages/Calendar.jsx`, `src/pages/WeeklyPlan.jsx`, `src/pages/Programs.jsx`, `src/pages/ProgramBuilder.jsx`, `src/pages/ProgramDetail.jsx`
- `src/components/programs/` (5 components: DayEditor, MesocycleEditor, ExercisePicker, etc.)
- `src/lib/programTemplates.js`

### Habits
- `src/pages/Habits.jsx`
- `src/components/habits/HabitLogHistory.jsx`
- Entities: `Habit`, `HabitLog`

### Community & Social
- `src/pages/Community.jsx`, `src/pages/UserProfile.jsx`, `src/pages/Messages.jsx`, `src/pages/Chat.jsx`, `src/pages/FollowList.jsx`
- `src/components/community/` (2 components), `src/components/social/` (2 components)
- `src/lib/social.js`, `src/lib/activityFeed.js`
- Entities: `SocialProfile`, `ActivityPost`, `ActivityComment`, `Follow`, `Conversation`, `Message`, `AppNotification`, `Challenge`

### Profile & Settings
- `src/pages/Profile.jsx`, `src/pages/More.jsx`, `src/pages/Privacy.jsx`, `src/pages/ShareProfile.jsx`
- `src/components/profile/` (4 components: AppearanceSettings, DownloadDataCard, GoalEditor, SocialProfileHeader)
- `src/lib/ThemeContext.jsx`, `src/lib/profileSync.js`, `src/lib/personalDataDownload.js`

### Navigation & Layout
- `src/App.jsx` (router), `src/components/AppLayout.jsx`, `src/components/BottomNav.jsx`, `src/components/DesktopSidebar.jsx`
- `src/components/ProtectedRoute.jsx`, `src/components/ScrollToTop.jsx`

### Core Utilities
- `src/lib/utils.js` — `cn()`, `localDateStr()`, `localDayOffset()`
- `src/lib/fitnessScience.js` — evidence-based fitness calculations
- `src/lib/performanceAnalytics.js` — readiness, recovery, volume, plateau detection
- `src/lib/chartTheme.js` — theme-aware chart colors
- `src/lib/fitnessDataCache.js`, `src/lib/fitnessInvalidation.js` — data caching
- `src/hooks/` — 17 custom hooks for data fetching

### Theming
- `src/index.css` — complete token-driven theme system (10 themes: obsidian, midnight, graphite, carbon, frost, slate, rose, onyx, porcelain, + accent overrides)
- `tailwind.config.js` — token-to-Tailwind mapping
- `src/lib/ThemeContext.jsx` — theme provider with persistence

---

## 6. Key Technical Notes

### Date Handling
The app standardized on `localDateStr()` and `localDayOffset()` (in `src/lib/utils.js`) to avoid timezone off-by-one errors. All date queries use local date strings (YYYY-MM-DD), not UTC. Preserve this in the Supabase migration — use `date` columns, not `timestamptz`, for date-only fields.

### Offline-First Workout Tracking
`WorkoutLogger.jsx` and related components support offline session creation with a `synced` flag on `WorkoutSession`. The Supabase migration should preserve this pattern — queue sessions locally and sync when connectivity returns.

### Theme System
The CSS in `src/index.css` is entirely token-driven via CSS custom properties. No changes needed for migration — it works independently of Base44. The `ThemeContext` persists preferences to the user entity (`base44.auth.updateMe()`), which maps to Supabase's `auth.users` metadata or a `user_profiles` table.

### Responsive Design
The app uses a mobile-first layout with `max-w-md.mx-auto` that widens on desktop via media queries in `src/index.css`. Bottom nav on mobile, sidebar on desktop. This is pure CSS — no migration needed.

### Entity SDK Pattern
All data access uses `base44.entities.EntityName.filter()`, `.create()`, `.update()`, `.delete()`, `.count()`, `.aggregate()`. The compatibility adapter (Phase 3) should map these to Supabase's `supabase.from('table').select().eq().order()` pattern.

### Built-in Fields
Every Base44 entity record has `id`, `created_date`, `updated_date`, `created_by_id` automatically. In Supabase, these map to:
- `id` → `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `created_date` → `created_at TIMESTAMPTZ DEFAULT now()`
- `updated_date` → `updated_at TIMESTAMPTZ DEFAULT now()`
- `created_by_id` → `user_id UUID REFERENCES auth.users(id)` (or use Supabase's automatic `auth.uid()`)

---

## 7. Cost Comparison

| Feature | Base44 | Independent (Supabase) |
|---|---|---|
| Database | Included | Free tier: 500MB, 50k rows |
| Auth | Included | Free tier: 50k monthly users |
| Storage | Included | Free tier: 1GB |
| AI (InvokeLLM) | Integration credits | OpenAI: pay per call (~$0.01-0.05 each) |
| Email | Included (paid plan) | Resend: 3k/month free |
| Hosting | Included | Vercel/Netlify: free for hobby |
| Realtime | Included | Supabase: free tier included |

**Estimated independent cost:** $0-25/month for a single user, scaling with usage.