import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, LogOut, Database, Shield, Bell, RefreshCw, Trash2, AlertTriangle, Share2, UserCircle, SlidersHorizontal, Lock, EyeOff, Users, MessageCircle } from 'lucide-react';
import { cn, localDateStr } from '@/lib/utils';
import { ActionSelect } from '@/components/ui/action-select';
import { Switch } from '@/components/ui/switch';
import GoalEditor from '@/components/profile/GoalEditor';
import AppearanceSettings from '@/components/profile/AppearanceSettings';
import DownloadDataCard from '@/components/profile/DownloadDataCard';
import SocialProfileHeader from '@/components/profile/SocialProfileHeader';
import * as social from '@/lib/social';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';

const TABS = [
  { id: 'profile', label: 'Profile', icon: UserCircle },
  { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
  { id: 'account', label: 'Account', icon: Lock },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [seeding, setSeeding] = useState(false);
  const [tab, setTab] = useState('profile');
  const [stats, setStats] = useState({ workouts: 0, prs: 0, streak: 0 });

  useEffect(() => {
    if (user) setForm({
      username: user.username || '', age: user.age || '', sex: user.sex || 'male',
      height_cm: user.height_cm || '', weight_kg: user.weight_kg || '',
      goal_weight_kg: user.goal_weight_kg || '', experience_level: user.experience_level || 'Beginner',
      primary_goal: user.primary_goal || '', preferred_units: user.preferred_units || 'metric',
      theme_preference: user.theme_preference || 'dark',
      profile_private: user.profile_private || false,
      push_enabled: user.push_enabled !== false,
    });
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        const [sessions, recovery] = await Promise.all([
          base44.entities.WorkoutSession.list('-date', 500).catch(() => []),
          base44.entities.RecoveryRecord.list('-date', 60).catch(() => []),
        ]);
        const workouts = (sessions || []).filter((s) => s.status === 'completed').length;
        const prs = (sessions || []).reduce((sum, s) => sum + (s.pr_count || 0), 0);
        // streak: consecutive days with a recovery check-in
        const days = new Set((recovery || []).map((r) => r.date));
        let streak = 0;
        const d = new Date();
        while (days.has(localDateStr(d))) { streak++; d.setDate(d.getDate() - 1); }
        setStats({ workouts, prs, streak });
      } catch (e) { console.error(e); }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const data = { ...form };
      ['age', 'height_cm', 'weight_kg', 'goal_weight_kg'].forEach((k) => (data[k] = data[k] ? Number(data[k]) : undefined));
      await base44.auth.updateMe(data);
      await social.syncMyProfile({ username: form.username, avatar_url: user?.avatar_url || '' }).catch(() => {});
      setEditing(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const seedLibrary = async () => {
    setSeeding(true);
    try {
      const seed = [
        { name: 'Barbell Back Squat', category: 'Powerlifting', movement_pattern: 'Knee Dominant', primary_muscle: 'Quadriceps', secondary_muscles: ['Glutes', 'Hamstrings', 'Core'], equipment: ['Barbell'], difficulty: 'Intermediate', compound: true, instructions: 'Set bar on upper traps, brace, descend to depth, drive up.', coaching_cues: ['Brace core', 'Knees track over toes', 'Chest up'], common_mistakes: ['Knee cave', 'Good morning'], safety_tips: ['Use rack with safeties'], rep_range_low: 3, rep_range_high: 8, rest_seconds: 180 },
        { name: 'Bench Press', category: 'Powerlifting', movement_pattern: 'Horizontal Push', primary_muscle: 'Chest', secondary_muscles: ['Triceps', 'Front Delts'], equipment: ['Barbell'], difficulty: 'Intermediate', compound: true, instructions: 'Grip slightly wider than shoulder, lower to chest, press up.', coaching_cues: ['Retract scapulae', 'Feet planted', 'Control descent'], common_mistakes: ['Bouncing bar', 'Flaring elbows'], safety_tips: ['Use spotter or safeties'], rep_range_low: 3, rep_range_high: 10, rest_seconds: 150 },
        { name: 'Conventional Deadlift', category: 'Powerlifting', movement_pattern: 'Hip Dominant', primary_muscle: 'Hamstrings', secondary_muscles: ['Glutes', 'Back', 'Traps'], equipment: ['Barbell'], difficulty: 'Advanced', compound: true, instructions: 'Hip hinge, grip bar, drive through floor, lock out hips.', coaching_cues: ['Neutral spine', 'Lats tight', 'Push floor away'], common_mistakes: ['Rounded back', 'Hips shooting up'], safety_tips: ['Warm up thoroughly'], rep_range_low: 1, rep_range_high: 6, rest_seconds: 240 },
        { name: 'Pull-up', category: 'Calisthenics', movement_pattern: 'Vertical Pull', primary_muscle: 'Back', secondary_muscles: ['Biceps', 'Forearms'], equipment: ['Bodyweight'], difficulty: 'Intermediate', compound: true, instructions: 'Hang from bar, pull chest to bar, lower controlled.', coaching_cues: ['Initiate with lats', 'Full hang start', 'No swinging'], rep_range_low: 5, rep_range_high: 12, rest_seconds: 120 },
        { name: 'Overhead Press', category: 'Powerlifting', movement_pattern: 'Vertical Push', primary_muscle: 'Shoulders', secondary_muscles: ['Triceps', 'Upper Chest'], equipment: ['Barbell'], difficulty: 'Intermediate', compound: true, instructions: 'Press bar from shoulders overhead to lockout.', coaching_cues: ['Brace hard', 'Glutes squeezed', 'Bar path vertical'], rep_range_low: 3, rep_range_high: 8, rest_seconds: 150 },
        { name: 'Barbell Row', category: 'Bodybuilding', movement_pattern: 'Horizontal Pull', primary_muscle: 'Back', secondary_muscles: ['Biceps', 'Rear Delts'], equipment: ['Barbell'], difficulty: 'Intermediate', compound: true, instructions: 'Hinge forward, row bar to lower ribs, control descent.', coaching_cues: ['Neutral spine', 'Drive elbows back', 'Squeeze lats'], rep_range_low: 6, rep_range_high: 12, rest_seconds: 120 },
        { name: 'Dumbbell Curl', category: 'Bodybuilding', movement_pattern: 'Isolation', primary_muscle: 'Biceps', secondary_muscles: ['Forearms'], equipment: ['Dumbbells'], difficulty: 'Beginner', compound: false, instructions: 'Curl dumbbells up, supinate, lower controlled.', coaching_cues: ['Elbows pinned', 'No swinging', 'Full extension'], rep_range_low: 8, rep_range_high: 15, rest_seconds: 60 },
        { name: 'Romanian Deadlift', category: 'Bodybuilding', movement_pattern: 'Hip Dominant', primary_muscle: 'Hamstrings', secondary_muscles: ['Glutes', 'Lower Back'], equipment: ['Barbell'], difficulty: 'Intermediate', compound: true, instructions: 'Hip hinge with soft knees, lower bar along legs, drive hips forward.', coaching_cues: ['Long spine', 'Feel hamstring stretch', 'Hips back'], rep_range_low: 6, rep_range_high: 12, rest_seconds: 120 },
        { name: 'Push-up', category: 'Calisthenics', movement_pattern: 'Horizontal Push', primary_muscle: 'Chest', secondary_muscles: ['Triceps', 'Core'], equipment: ['Bodyweight'], difficulty: 'Beginner', compound: true, instructions: 'Hands shoulder-width, lower chest to floor, press up.', coaching_cues: ['Body straight', 'Elbows ~45°', 'Full range'], rep_range_low: 8, rep_range_high: 20, rest_seconds: 60 },
        { name: 'Lat Pulldown', category: 'Bodybuilding', movement_pattern: 'Vertical Pull', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: ['Cables'], difficulty: 'Beginner', compound: true, instructions: 'Pull bar to upper chest, control ascent.', coaching_cues: ['Depress scapula', 'Lead with elbows', 'No leaning back'], rep_range_low: 8, rep_range_high: 15, rest_seconds: 90 },
      ];
      await base44.entities.Exercise.bulkCreate(seed);
      // Seed a starter program
      await base44.entities.TrainingProgram.create({
        name: 'KAI Foundation Hypertrophy', description: 'AI-generated 4-day upper/lower for your goal.',
        goal: 'Hypertrophy', split: 'Upper Lower', days_per_week: 4, session_duration_minutes: 60,
        experience_level: 'Beginner', equipment: ['Barbell', 'Dumbbells'], duration_weeks: 8,
        phase: 'Hypertrophy', is_ai_generated: true,
        days: [
          { day_name: 'Upper A', focus: 'Chest/Back', exercises: [{ exercise_name: 'Bench Press', sets: 4, reps_low: 6, reps_high: 8, rir_target: 2, rest_seconds: 150 }, { exercise_name: 'Barbell Row', sets: 3, reps_low: 8, reps_high: 12, rir_target: 2, rest_seconds: 120 }] },
          { day_name: 'Lower A', focus: 'Quads/Hams', exercises: [{ exercise_name: 'Barbell Back Squat', sets: 4, reps_low: 5, reps_high: 8, rir_target: 2, rest_seconds: 180 }, { exercise_name: 'Romanian Deadlift', sets: 3, reps_low: 8, reps_high: 12, rir_target: 2, rest_seconds: 120 }] },
        ],
      });
      // Seed achievements
      await base44.entities.Achievement.bulkCreate([
        { achievement_id: 'first_workout', category: 'Consistency', title: 'First Workout', description: 'Log your first workout', requirement: '1 workout', xp_reward: 50, icon: 'Dumbbell', progress_percent: 0, unlocked: false },
        { achievement_id: 'ten_workouts', category: 'Consistency', title: '10 Workouts', description: 'Complete 10 workouts', requirement: '10 workouts', xp_reward: 100, icon: 'Flame', progress_percent: 0, unlocked: false },
        { achievement_id: 'first_pr', category: 'Strength', title: 'First PR', description: 'Hit your first personal record', requirement: '1 PR', xp_reward: 75, icon: 'Trophy', progress_percent: 0, unlocked: false },
        { achievement_id: 'first_measurement', category: 'Body Composition', title: 'First Measurement', description: 'Log your first body measurement', requirement: '1 measurement', xp_reward: 25, icon: 'Ruler', progress_percent: 0, unlocked: false },
        { achievement_id: 'protein_streak_7', category: 'Nutrition', title: 'Protein Streak', description: 'Hit protein target 7 days', requirement: '7 days', xp_reward: 100, icon: 'Apple', progress_percent: 0, unlocked: false },
      ]);
    } catch (e) { console.error(e); }
    finally { setSeeding(false); }
  };

  return (
    <div className="max-w-md mx-auto pb-36">
      <SocialProfileHeader
        user={user}
        form={form}
        stats={stats}
        editing={editing}
        saving={saving}
        isPrivate={form.profile_private}
        onEditToggle={() => setEditing(true)}
        onSave={save}
        onShare={() => navigate('/share')}
      />

      {/* Tab bar */}
      <div className="sticky top-0 z-20 flex border-b border-border bg-background/80 backdrop-blur-xl px-4">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors min-h-[44px] border-b-2',
                tab === t.id ? 'border-luxury-blue text-luxury-blue' : 'border-transparent text-muted-foreground'
              )}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="px-4 pt-4">
        {tab === 'profile' && (
          <>
            <Card className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">About</p>
                {!editing && (
                  <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="text-luxury-blue min-h-[40px]">Edit</Button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Field label="Username" editing={editing} value={form.username} onChange={(v) => setForm({ ...form, username: v })} />
                <Field label="Age" editing={editing} value={form.age} onChange={(v) => setForm({ ...form, age: v })} />
                <Field label="Height (cm)" editing={editing} value={form.height_cm} onChange={(v) => setForm({ ...form, height_cm: v })} />
                <Field label="Weight (kg)" editing={editing} value={form.weight_kg} onChange={(v) => setForm({ ...form, weight_kg: v })} />
                <Field label="Goal Weight" editing={editing} value={form.goal_weight_kg} onChange={(v) => setForm({ ...form, goal_weight_kg: v })} />
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Sex</Label>
                  {editing ? (
                    <ActionSelect value={form.sex} options={['male', 'female']} onChange={(v) => setForm({ ...form, sex: v })} />
                  ) : <p className="text-sm font-medium min-h-[44px] flex items-center capitalize">{form.sex || '—'}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Experience</Label>
                  {editing ? (
                    <ActionSelect value={form.experience_level} options={['Beginner', 'Intermediate', 'Advanced']} onChange={(v) => setForm({ ...form, experience_level: v })} />
                  ) : <p className="text-sm font-medium min-h-[44px] flex items-center">{form.experience_level}</p>}
                </div>
              </div>
            </Card>

            <SocialCard user={user} />

            <GoalEditor user={user} />
          </>
        )}

        {tab === 'settings' && (
          <>
            <AppearanceSettings />
            <Card className="mb-4">
              <p className="text-sm font-semibold mb-3">Preferences</p>
              <div className="space-y-3">
                <Row icon={Settings} label="Units" value={form.preferred_units === 'metric' ? 'Metric' : 'Imperial'} />
                <Row icon={Bell} label="Notifications" value="On" />
              </div>
            </Card>
            <Card className="mb-4">
              <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Database size={15} className="text-luxury-blue" /> Data & Setup</p>
              <Button variant="outline" className="w-full glass justify-start" onClick={seedLibrary} disabled={seeding}>
                <RefreshCw size={15} className={cn(seeding && 'animate-spin')} /> {seeding ? 'Seeding…' : 'Seed Exercise Library & Demo Program'}
              </Button>
              <p className="text-[10px] text-muted-foreground mt-2">Adds 10 exercises, a starter program, and achievement definitions so you can explore the app immediately.</p>
            </Card>
            <DownloadDataCard />
          </>
        )}

        {tab === 'account' && (
          <>
            <Card className="mb-4 border-luxury-blue/30 bg-luxury-blue/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-luxury-blue/15 text-luxury-blue flex items-center justify-center shrink-0"><Share2 size={18} /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Share My Profile</p>
                  <p className="text-[11px] text-muted-foreground">Generate a shareable athlete profile card to post.</p>
                </div>
                <Button size="sm" className="bg-luxury-blue glow-blue min-h-[40px]" onClick={() => navigate('/share')}>Open</Button>
              </div>
            </Card>

            <Card className="mb-4 border-luxury-blue/30">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-luxury-blue/15 text-luxury-blue flex items-center justify-center shrink-0"><EyeOff size={18} /></div>
                  <div>
                    <p className="text-sm font-semibold">Private Profile</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">Hide your stats and bio from the shareable profile card. Only your name remains visible.</p>
                  </div>
                </div>
                <Switch
                  checked={!!form.profile_private}
                  onCheckedChange={(v) => {
                    const next = { ...form, profile_private: v };
                    setForm(next);
                    base44.auth.updateMe({ profile_private: v }).catch((e) => console.error(e));
                  }}
                />
              </div>
            </Card>

            <Card className="mb-4 border-luxury-blue/30">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-luxury-blue/15 text-luxury-blue flex items-center justify-center shrink-0"><Bell size={18} /></div>
                  <div>
                    <p className="text-sm font-semibold">Push Notifications</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">Receive follows, messages, and reminders on your device, even when the app is closed. Requires the native app with notifications allowed.</p>
                  </div>
                </div>
                <Switch
                  checked={!!form.push_enabled}
                  onCheckedChange={(v) => {
                    setForm({ ...form, push_enabled: v });
                    base44.auth.updateMe({ push_enabled: v }).catch((e) => console.error(e));
                  }}
                />
              </div>
            </Card>

            <Card className="mb-4 border-luxury-red/20">
              <p className="text-sm font-semibold mb-2 flex items-center gap-2"><Shield size={15} className="text-luxury-red" /> Privacy & Safety</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Body measurements, progress photos, and health data are sensitive. LRAZ 63 stores them privately by default. Body-fat and metabolic values are estimates unless measured by a validated device. This app provides fitness coaching, not medical advice — consult a qualified professional for health concerns.
              </p>
            </Card>

            <Card className="mb-4 border-luxury-red/30 bg-luxury-red/5">
              <p className="text-sm font-semibold mb-2 flex items-center gap-2 text-luxury-red"><Trash2 size={15} /> Danger Zone</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                Permanently delete your account and all associated data — workouts, measurements, nutrition logs, programs, photos, and coaching history. This action is irreversible.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full border-luxury-red/40 text-luxury-red hover:bg-luxury-red/10 min-h-[44px]">
                    <Trash2 size={15} /> Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-luxury-red"><AlertTriangle size={18} /> Delete Account Permanently?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently erase all your data from LRAZ 63 — training programs, workout sessions, body measurements, nutrition logs, progress photos, recovery records, goals, and coaching history. This cannot be undone. Type DELETE to confirm.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <ConfirmDelete user={user} onDone={() => logout()} />
                </AlertDialogContent>
              </AlertDialog>
            </Card>

            <Button variant="ghost" className="w-full text-muted-foreground hover:text-luxury-red min-h-[44px]" onClick={() => logout()}>
              <LogOut size={16} /> Sign Out
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function ConfirmDelete({ user, onDone }) {
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const doDelete = async () => {
    setDeleting(true); setError('');
    try {
      const entities = ['WorkoutSet', 'WorkoutSession', 'TrainingProgram', 'BodyMeasurement', 'NutritionLog', 'RecoveryRecord', 'ProgressPhoto', 'Goal', 'CoachMessage', 'FoodItem'];
      for (const name of entities) {
        try { await base44.entities[name].deleteMany({}); } catch (e) { /* entity may not exist or be empty */ }
      }
      onDone();
    } catch (e) { setError(e.message || 'Deletion failed'); }
    finally { setDeleting(false); }
  };

  return (
    <AlertDialogFooter className="flex-col gap-2">
      <Input
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Type DELETE"
        className="glass"
      />
      {error && <p className="text-xs text-luxury-red text-center">{error}</p>}
      <div className="flex gap-2 w-full">
        <AlertDialogCancel className="flex-1 min-h-[44px]" disabled={deleting}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          className="flex-1 min-h-[44px] bg-luxury-red text-white hover:bg-luxury-red/90"
          disabled={deleting || confirm !== 'DELETE'}
          onClick={(e) => { e.preventDefault(); doDelete(); }}
        >
          {deleting ? 'Deleting…' : 'Delete Forever'}
        </AlertDialogAction>
      </div>
    </AlertDialogFooter>
  );
}

function Field({ label, editing, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {editing ? <Input value={value || ''} onChange={(e) => onChange(e.target.value)} className="glass" /> : <p className="text-sm font-medium">{value || '—'}</p>}
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2"><Icon size={15} className="text-muted-foreground" /><span className="text-sm">{label}</span></div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function SocialCard({ user }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  const onAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.SocialProfile.update(profile.id, { avatar_url: file_url });
      setProfile((p) => (p ? { ...p, avatar_url: file_url } : p));
      await base44.auth.updateMe({ avatar_url: file_url }).catch(() => {});
    } catch (err) { console.error(err); }
  };

  const load = async () => {
    try {
      const p = await social.ensureMyProfile();
      setProfile(p);
      if (p) {
        const [fols, fing] = await Promise.all([social.listFollowers(p.user_id), social.listFollowing(p.user_id)]);
        setFollowers((fols || []).length);
        setFollowing((fing || []).length);
      }
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const togglePrivate = async (v) => {
    if (!profile) return;
    setProfile((p) => (p ? { ...p, is_private: v } : p));
    await base44.entities.SocialProfile.update(profile.id, { is_private: v }).catch(() => {});
  };

  if (!profile) return null;
  return (
    <Card className="mb-4">
      <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Users size={15} className="text-luxury-blue" /> Social</p>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-14 h-14 rounded-full luxury-gradient flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : (profile.display_name || '?')[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{profile.display_name}</p>
          <p className="text-[11px] text-muted-foreground truncate">@{profile.username || '—'}</p>
        </div>
        <label className="text-[11px] text-luxury-blue px-2 py-1 rounded-lg glass cursor-pointer min-h-[36px] flex items-center">
          Photo
          <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
        </label>
      </div>
      <div className="flex justify-around mb-3">
        <button onClick={() => navigate(`/social/${user?.id}/followers`)} className="text-center">
          <p className="text-lg font-bold">{followers}</p>
          <p className="text-[10px] uppercase text-muted-foreground">Followers</p>
        </button>
        <button onClick={() => navigate(`/social/${user?.id}/following`)} className="text-center">
          <p className="text-lg font-bold">{following}</p>
          <p className="text-[10px] uppercase text-muted-foreground">Following</p>
        </button>
        <button onClick={() => navigate('/community')} className="text-center">
          <p className="text-lg font-bold flex justify-center"><MessageCircle size={18} /></p>
          <p className="text-[10px] uppercase text-muted-foreground">Community</p>
        </button>
      </div>
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
        <div>
          <p className="text-sm font-medium">Private social profile</p>
          <p className="text-[11px] text-muted-foreground">Require approval for new followers.</p>
        </div>
        <Switch checked={!!profile.is_private} onCheckedChange={togglePrivate} />
      </div>
    </Card>
  );
}