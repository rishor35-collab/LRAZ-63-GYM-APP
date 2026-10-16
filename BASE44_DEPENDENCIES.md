# Base44 Dependencies — Complete Analysis

Every Base44-specific dependency in LRAZ 63, the files that use it, and what's needed to replace it.

---

## 1. Base44 SDK Client (`@base44/sdk`)

**Purpose:** Initializes the connection to Base44 backend (auth, database, storage, integrations).
**Files:**
- `src/api/base44Client.js` — creates and exports the `base44` client
- `src/lib/app-params.js` — extracts `appId`, `token`, `functionsVersion` from URL/localStorage/env

**Usage pattern:** Every file that accesses data imports `{ base44 }` from `@/api/base44Client` and calls:
- `base44.entities.<Entity>.filter()` / `.list()` / `.get()` / `.create()` / `.bulkCreate()` / `.update()` / `.bulkUpdate()` / `.updateMany()` / `.delete()` / `.deleteMany()` / `.count()` / `.aggregate()` / `.upsert()` / `.subscribe()`
- `base44.auth.me()` / `.isAuthenticated()` / `.logout()` / `.updateMe()` / `.redirectToLogin()`
- `base44.users.inviteUser()`
- `base44.integrations.Core.InvokeLLM()` / `.SendEmail()` / `.UploadPrivateFile()` / `.UploadPublicFile()` / `.GenerateImage()` / `.GenerateSpeech()` / `.GenerateVideo()` / `.TranscribeAudio()` / `.ExtractDataFromUploadedFile()` / `.CreateFileSignedUrl()`
- `base44.analytics.track()`

**Replacement:** `@supabase/supabase-js` — create a Supabase client and a compatibility adapter that maps the above method signatures to Supabase queries.

**Files affected:** ~120+ files across `src/pages/`, `src/components/`, `src/hooks/`, `src/lib/`

---

## 2. Base44 Vite Plugin (`@base44/vite-plugin`)

**Purpose:** Build-time plugin that injects platform features (HMR notifier, navigation tracking, analytics, visual editing).
**Files:**
- `vite.config.js` — imports and configures the plugin

**Replacement:** Remove the `base44()` plugin from `vite.config.js`, keep only `@vitejs/plugin-react`. Remove `@base44/vite-plugin` from `package.json`.

---

## 3. Authentication

**Purpose:** Email/password login, registration with OTP verification, password reset, Google OAuth, Apple OAuth, session management.
**Files:**
- `src/lib/AuthContext.jsx` — auth state provider, wraps the entire app
- `src/pages/Login.jsx` — `loginViaEmailPassword()`, `loginWithProvider('google')`
- `src/pages/Register.jsx` — `register()` → OTP → `verifyOtp()` → `setToken()` → redirect
- `src/pages/ForgotPassword.jsx` — `resetPasswordRequest()`
- `src/pages/ResetPassword.jsx` — `resetPassword({ resetToken, newPassword })`
- `src/components/ProtectedRoute.jsx` — checks `isAuthenticated()`
- `src/components/UserNotRegisteredError.jsx` — handles unregistered-user error
- `src/pages/OAuthConsent.jsx` — OAuth consent screen
- `src/components/AuthLayout.jsx` — shared auth page layout

**Replacement:** Supabase Auth:
- `supabase.auth.signInWithPassword({ email, password })`
- `supabase.auth.signUp({ email, password })` — Supabase sends confirmation email (replaces OTP flow)
- `supabase.auth.verifyOtp({ email, token, type: 'email' })`
- `supabase.auth.resetPasswordForEmail(email)` — sends reset link
- `supabase.auth.updateUser({ password })` — sets new password
- `supabase.auth.signInWithOAuth({ provider: 'google' })`
- `supabase.auth.getSession()` — check session
- `supabase.auth.signOut()`
- `supabase.auth.onAuthStateChange()` — replaces AuthContext polling

**Key difference:** Base44 uses a custom OTP flow after registration. Supabase uses email confirmation links by default (can switch to OTP in dashboard settings). The Register page's multi-step flow needs adjustment.

---

## 4. Database Entities (28 entities)

**Purpose:** Data storage with automatic `id`, `created_date`, `updated_date`, `created_by_id` fields, schema validation, and RLS.
**Files:** All 28 schema files in `base44/entities/*.jsonc`

**Replacement:** Supabase PostgreSQL tables. See `DATABASE_SCHEMA.md` for the complete SQL migration.

**Entity list:**
1. `User` (built-in) → `auth.users` + `user_profiles` table
2. `Goal` → `goals`
3. `TrainingProgram` → `training_programs`
4. `WorkoutSession` → `workout_sessions`
5. `WorkoutSet` → `workout_sets`
6. `Exercise` → `exercises`
7. `ScheduledWorkout` → `scheduled_workouts`
8. `CardioSession` → `cardio_sessions`
9. `BodyMeasurement` → `body_measurements`
10. `ProgressPhoto` → `progress_photos`
11. `RecoveryRecord` → `recovery_records`
12. `NutritionLog` → `nutrition_logs`
13. `FoodItem` → `food_items`
14. `SavedMeal` → `saved_meals`
15. `Favorite` → `favorites`
16. `Habit` → `habits`
17. `HabitLog` → `habit_logs`
18. `Achievement` → `achievements`
19. `CoachMessage` → `coach_messages`
20. `SocialProfile` → `social_profiles`
21. `ActivityPost` → `activity_posts`
22. `ActivityComment` → `activity_comments`
23. `Follow` → `follows`
24. `Conversation` → `conversations`
25. `Message` → `messages`
26. `AppNotification` → `app_notifications`
27. `Challenge` → `challenges`

---

## 5. Row-Level Security (RLS)

**Purpose:** Per-entity access control — most entities restrict read/update/delete to `created_by_id === user.id`. Social entities (SocialProfile, ActivityPost, Follow, Challenge) are publicly readable.
**Files:** The `rls` key in each `base44/entities/*.jsonc` file.

**Replacement:** Supabase RLS policies (PostgreSQL). Each table needs:
- `ENABLE ROW LEVEL SECURITY`
- `FOR SELECT USING (user_id = auth.uid())` (for private entities)
- `FOR SELECT USING (true)` (for public entities)
- `FOR INSERT WITH CHECK (user_id = auth.uid())`
- `FOR UPDATE USING (user_id = auth.uid())`
- `FOR DELETE USING (user_id = auth.uid())`

See `DATABASE_SCHEMA.md` for the complete policy SQL.

---

## 6. File Uploads & Storage

**Purpose:** Private file storage for progress photos, food images, avatars. Public storage for shared content.
**Files using `UploadPrivateFile`:**
- `src/components/progress/ProgressPhotos.jsx` — progress photo uploads
- `src/components/profile/SocialProfileHeader.jsx` — avatar uploads
- `src/lib/personalDataDownload.js` — references private photo URLs

**Files using `UploadPublicFile`:**
- Not currently used in the main flow (the app defaults to private)

**Files using `CreateFileSignedUrl`:**
- `src/components/ui/image.jsx` / `src/components/ui/image-helpers.js` — generates signed URLs for private images
- `src/lib/personalDataDownload.js` — references signed URL generation

**Replacement:** Supabase Storage:
- Create buckets: `progress-photos` (private), `avatars` (public)
- Upload: `supabase.storage.from('progress-photos').upload(path, file)`
- Private access: `supabase.storage.from('progress-photos').createSignedUrl(path, 60)`
- Public access: `supabase.storage.from('avatars').getPublicUrl(path)`

---

## 7. AI Integrations (`InvokeLLM`)

**Purpose:** AI-powered coaching advice, nutrition estimation, exercise form analysis.
**Files:**
- `src/pages/Coach.jsx` — main AI coach conversation
- `src/components/FloatingCoach.jsx` — floating coach widget
- `src/lib/feedbackMessages.js` — may use LLM for daily summary generation
- Any file calling `base44.integrations.Core.InvokeLLM`

**Replacement:** OpenAI or Anthropic API, called from Supabase Edge Functions (to protect API keys). Create an edge function `ai-coach` that:
1. Receives the user's message + context (workout history, nutrition, recovery)
2. Calls OpenAI/Anthropic with a system prompt
3. Returns the response to the client

**Cost note:** Base44 includes AI in integration credits. Independent: OpenAI GPT-4o-mini ~$0.15/1M input tokens, or Claude Sonnet ~$3/1M input tokens. A typical coach conversation costs $0.01-0.05.

---

## 8. Email (`SendEmail`)

**Purpose:** Sending emails to users (invitations, notifications, coaching summaries).
**Files:**
- Search for `base44.integrations.Core.SendEmail` across the codebase
- `src/lib/reminders.js` — may trigger email notifications
- `src/components/profile/DownloadDataCard.jsx` — data export (client-side, no email)

**Replacement:** Resend (resend.com) — 3,000 emails/month free, then $20/month for 50k. Or SendGrid. Called from Supabase Edge Functions.

---

## 9. Push Notifications (`SendPushNotification`)

**Purpose:** Mobile push notifications (iOS/Android) for reminders and alerts.
**Files:**
- `src/lib/pushNotifications.js` — push notification registration and handling
- `src/lib/reminders.js` — triggers notifications

**Replacement:** Firebase Cloud Messaging (FCM) for Android + Apple Push Notification service (APNs) for iOS. Requires a native build (Capacitor or React Native) — not applicable if staying as a web app. For web push, use the browser Push API + a service worker + a push service (e.g., Vapid keys via web-push library on a Supabase Edge Function).

---

## 10. Analytics (`base44.analytics.track`)

**Purpose:** Custom event tracking.
**Files:**
- Search for `base44.analytics.track` across the codebase

**Replacement:** PostHog (open-source, free tier), Google Analytics, or Plausible. Or remove if analytics aren't needed.

---

## 11. Realtime Subscriptions

**Purpose:** Live updates when data changes (e.g., community feed, messages, notifications).
**Files:**
- Search for `.subscribe(` across the codebase — any component using `base44.entities.X.subscribe()`

**Replacement:** Supabase Realtime:
```js
supabase.channel('table-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, callback)
  .subscribe()
```

---

## 12. User Invitations

**Purpose:** Invite users to the app with a specific role.
**Files:**
- Search for `base44.users.inviteUser` across the codebase

**Replacement:** Supabase Auth Admin API:
```js
supabase.auth.admin.inviteUserByEmail(email, { redirectTo: window.location.origin })
```
Or send a custom invitation email via Resend with a signup link.

---

## 13. Data Export (Download Your Data)

**Purpose:** Lets users export all their data as JSON or CSV.
**Files:**
- `src/lib/personalDataDownload.js` — the export logic
- `src/components/profile/DownloadDataCard.jsx` — the UI

**Current behavior:** Iterates 18 entity tables, fetches all user records with cursor pagination, assembles a JSON/CSV payload, triggers a browser download. Progress photos are omitted (URLs replaced with `[private photo omitted]`).

**Replacement:** This is client-side logic that works with any backend. Only the `base44.entities.X.filter()` calls need to map to Supabase queries. The export format (JSON structure) should be preserved exactly so the future **Import My Data** feature can read it.

---

## 14. App Configuration

**Purpose:** App ID, token, function version, base URL.
**Files:**
- `src/lib/app-params.js` — extracts from URL params, localStorage, or env vars
- `base44/config.jsonc` — build/serve commands

**Replacement:** Supabase environment variables:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
Remove `app-params.js` or simplify it to read only Supabase env vars.