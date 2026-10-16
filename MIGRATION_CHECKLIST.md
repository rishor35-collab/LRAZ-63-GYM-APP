# Migration Checklist

Step-by-step checklist for migrating LRAZ 63 from Base44 to Supabase.

---

## Phase 1: Source Code Export ✅

- [x] Exported complete source code to `lraz63-source-export.zip`
- [x] Documented all 28 entity schemas in `DATABASE_SCHEMA.md`
- [x] Analyzed all Base44 dependencies in `BASE44_DEPENDENCIES.md`
- [x] Created comprehensive migration guide in `MIGRATION_GUIDE.md`
- [x] Verified no backend functions exist (all logic is client-side)
- [x] Verified no agents exist
- [x] Documented the Download Your Data export format for future Import feature

---

## Phase 2: GitHub + StackBlitz Setup

- [ ] Create GitHub repository `lraz63-performance-os`
- [ ] Unzip `lraz63-source-export.zip` and push to the repository
- [ ] Open StackBlitz → Import from GitHub
- [ ] Verify the project loads in StackBlitz (it won't build yet — Base44 packages are missing)

---

## Phase 3: Remove Base44 Packages

- [ ] Run `npm uninstall @base44/sdk @base44/vite-plugin`
- [ ] Update `vite.config.js` — remove `base44()` plugin, keep only `react()`
- [ ] Update `package.json` — confirm `@base44/*` packages are removed
- [ ] Add `@supabase/supabase-js` → `npm install @supabase/supabase-js`
- [ ] Create `.env` file with:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  ```

---

## Phase 4: Supabase Project Setup

- [ ] Create a Supabase project at supabase.com
- [ ] Copy the project URL and anon key into `.env`
- [ ] Open SQL Editor → run the schema from `DATABASE_SCHEMA.md`
- [ ] Verify all 27 tables + `user_profiles` are created
- [ ] Verify all RLS policies are enabled
- [ ] Verify all `updated_at` triggers are created
- [ ] Create storage buckets: `progress-photos` (private), `food-images` (private), `avatars` (public)
- [ ] Run the storage policy SQL from `DATABASE_SCHEMA.md`

---

## Phase 5: Replace SDK Client

- [ ] Rewrite `src/api/base44Client.js` to export a Supabase client
- [ ] Create `src/api/entityAdapter.js` — compatibility layer mapping `base44.entities.X.method()` → `supabase.from('table').method()`
- [ ] Map `filter()` → `select().eq().order().range()`
- [ ] Map `create()` → `insert().select()`
- [ ] Map `update()` → `update().eq().select()`
- [ ] Map `delete()` → `delete().eq()`
- [ ] Map `count()` → `select('*', { count: 'exact', head: true }).eq()`
- [ ] Map `aggregate()` → custom SQL or multiple queries (Supabase doesn't have built-in aggregation)
- [ ] Map `subscribe()` → `supabase.channel().on('postgres_changes').subscribe()`
- [ ] Map `upsert()` → `upsert().select()`
- [ ] Simplify or remove `src/lib/app-params.js` (only needed for Supabase env vars)

---

## Phase 6: Replace Auth

- [ ] Rewrite `src/lib/AuthContext.jsx` to use `supabase.auth.onAuthStateChange()`
- [ ] Update `src/pages/Login.jsx` — replace `loginViaEmailPassword()` with `supabase.auth.signInWithPassword()`
- [ ] Update `src/pages/Login.jsx` — replace `loginWithProvider('google')` with `supabase.auth.signInWithOAuth({ provider: 'google' })`
- [ ] Update `src/pages/Register.jsx` — replace `register()` with `supabase.auth.signUp()`
- [ ] Update `src/pages/Register.jsx` — adjust OTP flow (Supabase sends confirmation email; or enable OTP in Supabase settings)
- [ ] Update `src/pages/ForgotPassword.jsx` — replace `resetPasswordRequest()` with `supabase.auth.resetPasswordForEmail()`
- [ ] Update `src/pages/ResetPassword.jsx` — replace `resetPassword()` with `supabase.auth.updateUser({ password })`
- [ ] Update `src/components/ProtectedRoute.jsx` — use Supabase session check
- [ ] Configure Google OAuth in Supabase Auth settings (needs Google Cloud OAuth client)
- [ ] Configure Apple OAuth if needed (needs Apple Developer account)
- [ ] Set email templates in Supabase Auth settings (confirmation, reset, invite)

---

## Phase 7: Replace File Uploads

- [ ] Search for all `UploadPrivateFile` calls
- [ ] Replace with `supabase.storage.from('progress-photos').upload()`
- [ ] Search for all `CreateFileSignedUrl` calls
- [ ] Replace with `supabase.storage.from('progress-photos').createSignedUrl()`
- [ ] Update `src/components/ui/image.jsx` to use Supabase signed URLs
- [ ] Update `src/components/progress/ProgressPhotos.jsx`
- [ ] Update `src/components/profile/SocialProfileHeader.jsx` (avatar → `avatars` bucket)
- [ ] Update `src/lib/personalDataDownload.js` (photo URL handling)

---

## Phase 8: Replace AI Integrations

- [ ] Search for all `InvokeLLM` calls
- [ ] Create a Supabase Edge Function `ai-coach` that calls OpenAI/Anthropic
- [ ] Set `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`) as a Supabase secret
- [ ] Update `src/pages/Coach.jsx` to call the edge function instead of `InvokeLLM`
- [ ] Update `src/components/FloatingCoach.jsx`
- [ ] Update any nutrition AI estimation features
- [ ] Search for `GenerateImage`, `GenerateSpeech`, `GenerateVideo`, `TranscribeAudio` calls — replace or remove if unused

---

## Phase 9: Replace Email

- [ ] Search for all `SendEmail` calls
- [ ] Create a Supabase Edge Function `send-email` using Resend
- [ ] Set `RESEND_API_KEY` as a Supabase secret
- [ ] Update all calling files to invoke the edge function
- [ ] Test email delivery

---

## Phase 10: Replace Push Notifications

- [ ] Decide: web push (browser Push API) or native push (requires Capacitor/React Native build)
- [ ] If web push: set up VAPID keys, create a service worker, create an edge function to send push via web-push library
- [ ] Update `src/lib/pushNotifications.js`
- [ ] Update `src/lib/reminders.js`
- [ ] Search for `SendPushNotification` calls and replace

---

## Phase 11: Replace Analytics

- [ ] Search for `base44.analytics.track` calls
- [ ] Choose: PostHog, Google Analytics, Plausible, or remove
- [ ] If keeping: install the chosen SDK and update calls
- [ ] If removing: delete the analytics calls

---

## Phase 12: Replace User Invitations

- [ ] Search for `base44.users.inviteUser` calls
- [ ] Replace with `supabase.auth.admin.inviteUserByEmail()` (requires service role key — use edge function)
- [ ] Or build custom invitation flow via email + signup link

---

## Phase 13: Data Import Feature

- [ ] Create a new page `src/pages/ImportData.jsx`
- [ ] Add route in `src/App.jsx`
- [ ] Add link in Profile/Settings page
- [ ] Implement file upload (accept JSON)
- [ ] Parse the JSON (matching the Download Your Data format from `MIGRATION_GUIDE.md`)
- [ ] Map `created_by_id` to current user's ID
- [ ] Insert records into each Supabase table
- [ ] Handle progress photos: prompt user to re-upload (URLs are omitted in export)
- [ ] Show progress bar during import
- [ ] Show success/error summary
- [ ] Test with a real export file

---

## Phase 14: Testing

- [ ] Test login (email/password)
- [ ] Test registration (email confirmation)
- [ ] Test password reset
- [ ] Test Google OAuth
- [ ] Test workout logging (create session → add sets → complete)
- [ ] Test exercise library (browse → detail → favorite)
- [ ] Test nutrition logging (add food → edit → delete)
- [ ] Test cardio session (start → log → save)
- [ ] Test body measurements (add → view history)
- [ ] Test progress photos (upload → view)
- [ ] Test recovery check-in
- [ ] Test coach AI conversation
- [ ] Test calendar scheduling
- [ ] Test program builder
- [ ] Test community feed
- [ ] Test messaging
- [ ] Test data export (Download Your Data)
- [ ] Test data import (Import My Data)
- [ ] Test all 10 themes
- [ ] Test custom accent color
- [ ] Test mobile layout (bottom nav)
- [ ] Test desktop layout (sidebar)
- [ ] Test offline workout logging + sync

---

## Phase 15: Deployment

- [ ] Choose hosting: Vercel, Netlify, or Cloudflare Pages
- [ ] Set environment variables in hosting platform
- [ ] Build and deploy
- [ ] Test production URL
- [ ] Set up custom domain (optional)
- [ ] Configure Supabase Auth redirect URLs to production domain

---

## What Cannot Be Migrated

| Item | Status | Workaround |
|---|---|---|
| Existing user data in Base44 | Cannot export (privacy) | Users use Download Your Data, then Import My Data in the new app |
| Progress photo files | Cannot export (private) | Users re-upload photos in the new app |
| Base44 OAuth client secrets | Cannot export | Register new OAuth apps (Google, Apple) |
| Base44 AI credits | Platform-specific | Set up own OpenAI/Anthropic account |
| Base44 email service | Platform-specific | Set up Resend/SendGrid |
| Base44 push notifications | Platform-specific | Set up FCM/APNs or web push |

---

## Estimated Effort

| Phase | Effort | Notes |
|---|---|---|
| 1-3: Setup & cleanup | 2-4 hours | Mechanical |
| 4: Supabase schema | 1-2 hours | Run SQL, verify |
| 5: SDK adapter | 8-16 hours | Most complex — mapping all entity methods |
| 6: Auth | 4-8 hours | 6 files to update |
| 7: File uploads | 4-6 hours | ~5 files |
| 8: AI | 4-8 hours | Edge function + client updates |
| 9: Email | 2-4 hours | Edge function + updates |
| 10: Push | 4-8 hours | Depends on web vs native |
| 11: Analytics | 1-2 hours | Optional |
| 12: Invitations | 1-2 hours | Edge function |
| 13: Import feature | 4-8 hours | New page + logic |
| 14: Testing | 8-16 hours | Full regression |
| 15: Deployment | 2-4 hours | |
| **Total** | **45-88 hours** | ~1-2 weeks full-time |