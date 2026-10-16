import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, Ring } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Flame, Dumbbell, TrendingUp, ChevronRight, Trophy, ArrowRight, AlertTriangle, Target, Scale, Plus, Sparkles, Activity, LayoutGrid, Bell, Apple, Droplets } from 'lucide-react';
import { trendDirection } from '@/lib/fitnessScience';
import {
  MUSCLE_GROUPS, computeMuscleRecovery, computeReadiness, computeBestLifts, detectPlateaus,
  detectWeakPoints, computeVolumeByMuscle, computeNutritionTrends, recommendTodaysWorkout,
  generateInsights, computeGoalStatus,
} from '@/lib/performanceAnalytics';
import ReadinessCheckIn from '@/components/recovery/ReadinessCheckIn';
import WeeklyReview from '@/components/recovery/WeeklyReview';
import { cn, localDateStr } from '@/lib/utils';
import PullToRefresh from '@/components/PullToRefresh';
import GoalStatusBadge from '@/components/home/GoalStatusBadge';
import HomeCustomizeSheet from '@/components/home/HomeCustomizeSheet';
import { computeReminders, fireBrowserNotifications } from '@/lib/reminders';
import { getDailySummary } from '@/lib/feedbackMessages';

const TODAY = localDateStr();
const DAY = 86400000;
const INSIGHT_ICONS = { alert: AlertTriangle, flame: Flame, target: Target, trending: TrendingUp, scale: Scale };

function recPct(m) {
  if (!m || m.hoursSince == null) return null;
  return Math.min(98, Math.round((m.hoursSince / 72) * 100));
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [nutrition, setNutrition] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sets, setSets] = useState([]);
  const [recovery, setRecovery] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [scheduled, setScheduled] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [cardio, setCardio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState(false);
  const [review, setReview] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [cardConfig, setCardConfig] = useState(() => {
    const defaults = { readiness: true, insights: true, bestLifts: true, achievements: false };
    try { return { ...defaults, ...(JSON.parse(localStorage.getItem('lraz_home_cards') || '{}')) }; }
    catch (e) { return defaults; }
  });
  const updateCardConfig = (cfg) => { setCardConfig(cfg); try { localStorage.setItem('lraz_home_cards', JSON.stringify(cfg)); } catch (e) {} };
  const cardVisible = (id) => cardConfig[id] !== false;

  useEffect(() => {
    if (user && !user.onboarding_completed) { navigate('/onboarding'); return; }
    loadAll();
  }, [user]);

  const loadAll = async () => {
    try {
      const [goals, meas, nut, sess, st, recs, achs, sched, progs, card] = await Promise.all([
        base44.entities.Goal.filter({ status: 'active' }, '-created_date', 1),
        base44.entities.BodyMeasurement.list('-date', 30),
        base44.entities.NutritionLog.list('-date', 200),
        base44.entities.WorkoutSession.list('-date', 60),
        base44.entities.WorkoutSet.list('-created_date', 300),
        base44.entities.RecoveryRecord.list('-date', 7),
        base44.entities.Achievement.list('-created_date', 6),
        base44.entities.ScheduledWorkout.filter({ date: TODAY, completed: false }, '-date', 1),
        base44.entities.TrainingProgram.list('-created_date', 5),
        base44.entities.CardioSession.list('-date', 60),
      ]);
      setGoal(goals[0] || null);
      setMeasurements(meas || []);
      setNutrition(nut || []);
      setSessions(sess || []);
      setSets(st || []);
      setRecovery(recs?.[0] || null);
      setAchievements(achs || []);
      setScheduled(sched?.[0] || null);
      setPrograms(progs || []);
      setCardio(card || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const weights = useMemo(() => measurements.map((m) => m.weight_kg).filter(Boolean).reverse(), [measurements]);
  const latestWeight = weights[weights.length - 1] || user?.weight_kg;
  const trend = trendDirection(weights);

  const muscleRecovery = useMemo(() => computeMuscleRecovery(sessions, sets, recovery), [sessions, sets, recovery]);
  const readiness = useMemo(() => {
    const r = computeReadiness(recovery, sessions);
    if (r != null) return r;
    const known = MUSCLE_GROUPS.filter((m) => muscleRecovery[m]?.hoursSince != null);
    if (!known.length) return null;
    const ready = known.filter((m) => muscleRecovery[m].status === 'ready').length;
    return Math.round((ready / known.length) * 100);
  }, [recovery, sessions, muscleRecovery]);
  const monthlyVolume = useMemo(() => computeVolumeByMuscle(sessions, sets, 30), [sessions, sets]);
  const weakPoints = useMemo(() => detectWeakPoints(monthlyVolume), [monthlyVolume]);
  const bestLifts = useMemo(() => computeBestLifts(sets), [sets]);
  const plateaus = useMemo(() => detectPlateaus(sessions, sets), [sessions, sets]);
  const nutritionTrends = useMemo(() => computeNutritionTrends(nutrition, goal, 7), [nutrition, goal]);
  const todaysWorkout = useMemo(() => recommendTodaysWorkout({ muscleRecovery, weakPoints, scheduledToday: scheduled, lastWorkout: sessions[0] }), [muscleRecovery, weakPoints, scheduled, sessions]);
  const insights = useMemo(() => generateInsights({ muscleRecovery, nutritionTrends, weakPoints, plateaus, goal, weights }), [muscleRecovery, nutritionTrends, weakPoints, plateaus, goal, weights]);
  const goalStatus = useMemo(() => computeGoalStatus(goal, weights), [goal, weights]);

  const reminders = useMemo(() => computeReminders({ goal, sessions, nutrition, scheduled, recovery, measurements, cardio }), [goal, sessions, nutrition, scheduled, recovery, measurements, cardio]);
  useEffect(() => { fireBrowserNotifications(reminders); }, [reminders]);

  const todayStrength = useMemo(() => sessions.find((s) => s.status === 'completed' && s.date && s.date.slice(0, 10) === TODAY), [sessions]);

  const nutritionTotals = useMemo(() => nutrition.filter((n) => n.date === TODAY).reduce((acc, n) => ({
    calories: acc.calories + (n.calories || 0), protein: acc.protein + (n.protein_g || 0),
    carbs: acc.carbs + (n.carbs_g || 0), fat: acc.fat + (n.fat_g || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [nutrition]);

  const completedThisWeek = useMemo(() => sessions.filter((s) => s.status === 'completed' && Date.now() - new Date(s.date).getTime() < 7 * DAY).length, [sessions]);
  const targetDays = goal?.days_per_week || user?.days_per_week || 4;

  const streak = useMemo(() => {
    const weeks = {};
    sessions.filter((s) => s.status === 'completed' && s.date).forEach((s) => {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${getWeek(d)}`;
      weeks[key] = true;
    });
    let count = 0;
    let cursor = new Date();
    if (weeks[`${cursor.getFullYear()}-${getWeek(cursor)}`]) count++;
    cursor = new Date(cursor.getTime() - 7 * DAY);
    while (weeks[`${cursor.getFullYear()}-${getWeek(cursor)}`]) { count++; cursor = new Date(cursor.getTime() - 7 * DAY); }
    return count;
  }, [sessions]);

  const volumeChange = useMemo(() => {
    const now = Date.now();
    const thisWk = sessions.filter((s) => s.status === 'completed' && s.date && now - new Date(s.date).getTime() < 7 * DAY).reduce((a, s) => a + (s.total_volume_kg || 0), 0);
    const lastWk = sessions.filter((s) => s.status === 'completed' && s.date).filter((s) => { const t = now - new Date(s.date).getTime(); return t >= 7 * DAY && t < 14 * DAY; }).reduce((a, s) => a + (s.total_volume_kg || 0), 0);
    return lastWk ? Math.round(((thisWk - lastWk) / lastWk) * 100) : null;
  }, [sessions]);

  const strengthProgress = useMemo(() => {
    const dates = {};
    sessions.forEach((s) => { if (s.id && s.date) dates[s.id] = new Date(s.date).getTime(); });
    const now = Date.now();
    const recent = {}, older = {};
    sets.forEach((s) => {
      const t = dates[s.session_id]; if (!t || !s.exercise_name) return;
      const w = s.weight_kg || 0;
      if (t >= now - 21 * DAY) recent[s.exercise_name] = Math.max(recent[s.exercise_name] || 0, w);
      else if (t >= now - 63 * DAY) older[s.exercise_name] = Math.max(older[s.exercise_name] || 0, w);
    });
    let best = null;
    Object.keys(recent).forEach((ex) => {
      if (older[ex]) {
        const delta = +(recent[ex] - older[ex]).toFixed(1);
        if (delta > 0 && (!best || delta > best.delta)) best = { exercise: ex, delta, recent: recent[ex], older: older[ex] };
      }
    });
    return best;
  }, [sets, sessions]);

  const todayProgramDay = useMemo(() => {
    if (!scheduled?.program_id) return null;
    const prog = programs.find((p) => p.id === scheduled.program_id);
    if (!prog?.days) return null;
    return prog.days[scheduled.day_index] || null;
  }, [scheduled, programs]);

  const startWorkoutUrl = useMemo(() => {
    if (scheduled?.program_id && scheduled.day_index != null) return `/workout/new?programId=${scheduled.program_id}&dayIndex=${scheduled.day_index}`;
    return '/workout/new';
  }, [scheduled]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>;

  const hasWorkouts = sessions.length > 0;

  return (
    <PullToRefresh onRefresh={loadAll}>
      <div className="max-w-md mx-auto px-4 pt-6 pb-36">
        <Header user={user} onCustomize={() => setCustomize(true)} onNotifications={() => navigate('/notifications')} count={reminders.length} />

        {/* Metrics strip */}
        <div className="grid grid-cols-4 gap-2 mb-4 animate-fade-up">
          <MetricPill icon={Dumbbell} value={`${completedThisWeek}`} sub={`/${targetDays} workouts`} />
          <MetricPill icon={Flame} value={Math.round(nutritionTotals.calories).toLocaleString()} sub="kcal" />
          <MetricPill icon={Scale} value={latestWeight ? `${latestWeight.toFixed(1)}` : '—'} sub="kg" />
          <MetricPill icon={TrendingUp} value={streak ? `${streak}` : '—'} sub="wk streak" />
        </div>

        {/* Daily feedback */}
        {(() => {
          const fb = getDailySummary({ workoutsToday: todayStrength ? 1 : 0, calories: nutritionTotals.calories, calorieTarget: goal?.calorie_target, habitsDone: 0, habitsTotal: 0, streak });
          return fb ? (
            <div className="glass rounded-2xl p-3 mb-4 border-primary/20 flex items-center gap-2.5 animate-fade-up">
              <Sparkles size={16} className="text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold">{fb.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{fb.message}</p>
              </div>
            </div>
          ) : null;
        })()}

        {/* 1 — Today's Focus (Hero) */}
        <Card className="luxury-gradient border border-primary/30 mb-4 animate-fade-up">
          {hasWorkouts || scheduled ? (
            <>
              <p className="text-[11px] text-white/60 uppercase tracking-wider mb-1">{scheduled ? 'Scheduled' : 'Recommended'}</p>
              <h2 className="text-xl font-bold text-white">{todaysWorkout.focus}</h2>
              <p className="text-sm text-white/75 mt-1 leading-relaxed">{todaysWorkout.reason}</p>
              {todayProgramDay && <p className="text-xs text-white/60 mt-2">{todayProgramDay.exercises?.length || 0} exercises · {todayProgramDay.focus || ''}</p>}
              <Button size="lg" className="w-full mt-4 h-12 font-semibold" onClick={() => navigate(startWorkoutUrl)}>
                <Dumbbell size={18} /> Start Workout <ArrowRight size={16} />
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white">Welcome to LRAZ 63</h2>
              <p className="text-sm text-white/75 mt-1 leading-relaxed">Complete your first workout to start tracking strength, recovery and progress.</p>
              <Button size="lg" className="w-full mt-4 h-12 font-semibold" onClick={() => navigate('/workout/new')}>
                <Dumbbell size={18} /> Start First Workout
              </Button>
            </>
          )}
        </Card>

        {/* 2 — Quick Actions */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          <QuickTile icon={Dumbbell} label="Train" onClick={() => navigate('/train')} />
          <QuickTile icon={Apple} label="Fuel" onClick={() => navigate('/nutrition')} />
          <QuickTile icon={Activity} label="Cardio" onClick={() => navigate('/cardio')} />
          <QuickTile icon={Scale} label="Progress" onClick={() => navigate('/progress')} />
        </div>

        {/* 3 — Daily Targets */}
        <SectionLabel action={() => navigate('/nutrition')}>Daily Targets</SectionLabel>
        <Card className="mb-4">
          {goal?.calorie_target ? (
            <>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-2xl font-bold tabular-nums">{Math.round(nutritionTotals.calories).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">/ {Math.round(goal.calorie_target).toLocaleString()} kcal · {Math.max(0, Math.round(goal.calorie_target - nutritionTotals.calories)).toLocaleString()} left</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold tabular-nums text-primary">{Math.round(nutritionTotals.protein)}<span className="text-xs text-muted-foreground">g</span></p>
                  <p className="text-xs text-muted-foreground">/ {Math.round(goal.protein_target_g)}g protein</p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, (nutritionTotals.calories / (goal.calorie_target || 1)) * 100)}%` }} />
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold">Start tracking nutrition</p>
              <p className="text-xs text-muted-foreground mt-1">Set a goal to see daily calorie and macro targets.</p>
              <Button variant="outline" className="w-full mt-3 glass min-h-[44px]" onClick={() => navigate('/nutrition')}><Plus size={16} /> Log Food</Button>
            </>
          )}
        </Card>

        {/* 4 — This Week */}
        <SectionLabel action={() => setReview(true)}>This Week</SectionLabel>
        <Card className="mb-4">
          <div className="grid grid-cols-3 gap-3">
            <WeekStat label="Workouts" value={`${completedThisWeek}`} sub={`/ ${targetDays}`} />
            <WeekStat label="Streak" value={streak ? `${streak}w` : '—'} sub="consistency" />
            <WeekStat label="Volume" value={volumeChange != null ? `${volumeChange > 0 ? '+' : ''}${volumeChange}%` : '—'} sub="vs last week" accent={volumeChange != null ? (volumeChange >= 0 ? 'blue' : 'red') : null} />
          </div>
        </Card>

        {/* Optional: Readiness */}
        {cardVisible('readiness') && (
          <>
            <SectionLabel action={() => navigate('/progress')}>Readiness</SectionLabel>
            <Card className="mb-4">
              <div className="flex items-center gap-4">
                <div className="shrink-0"><Ring value={readiness ?? 0} label="Ready" size={88} color="blue" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{readiness != null ? (readiness >= 70 ? 'Ready to train' : readiness >= 40 ? 'Recovering' : 'Rest recommended') : 'No recovery data yet'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{readiness != null ? 'Based on sleep, soreness, energy and load.' : 'Log recovery or complete workouts to estimate.'}</p>
                  <Button variant="outline" size="sm" className="glass mt-2 min-h-[36px] text-xs" onClick={() => setCheckIn(true)}><Plus size={13} /> Check In</Button>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Optional: Insights */}
        {insights.length > 0 && cardVisible('insights') && (
          <>
            <SectionLabel>Insights</SectionLabel>
            <div className="space-y-2 mb-4">
              {insights.slice(0, 3).map((ins, i) => {
                const Icon = INSIGHT_ICONS[ins.icon] || Sparkles;
                return (
                  <Card key={i} className="flex items-start gap-3 py-3">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', ins.severity === 'warn' ? 'bg-luxury-red/15 text-luxury-red' : 'bg-primary/15 text-primary')}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{ins.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{ins.body}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Optional: Best Lifts */}
        {bestLifts.length > 0 && cardVisible('bestLifts') && (
          <>
            <SectionLabel action={() => navigate('/progress')}>Best Lifts</SectionLabel>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 mb-4">
              {bestLifts.slice(0, 6).map((b, i) => (
                <Card key={i} className="min-w-[130px]">
                  <p className="text-xs font-semibold truncate">{b.exercise}</p>
                  <p className="text-2xl font-bold tabular-nums text-gradient-blue mt-1">{Math.round(b.bestE1RM)}<span className="text-xs text-muted-foreground ml-0.5">kg</span></p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">est 1RM · {Math.round(b.maxWeight)}kg top</p>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Optional: Achievements */}
        {achievements.length > 0 && cardVisible('achievements') && (
          <>
            <SectionLabel action={() => navigate('/progress')}>Achievements</SectionLabel>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 mb-4">
              {achievements.map((a) => (
                <Card key={a.id} className="min-w-[140px] flex flex-col items-center text-center">
                  <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mb-2', a.unlocked ? 'bg-primary/15 text-primary' : 'bg-muted/30 text-muted-foreground')}>
                    <Trophy size={22} />
                  </div>
                  <p className="text-xs font-semibold">{a.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{a.unlocked ? 'Unlocked' : `${Math.round(a.progress_percent || 0)}%`}</p>
                </Card>
              ))}
            </div>
          </>
        )}
        <div className="h-4" />
      </div>
      {checkIn && <ReadinessCheckIn onClose={() => setCheckIn(false)} onSaved={loadAll} />}
      {review && <WeeklyReview onClose={() => setReview(false)} />}
      {customize && <HomeCustomizeSheet config={cardConfig} onChange={updateCardConfig} onClose={() => setCustomize(false)} />}
    </PullToRefresh>
  );
}

function getWeek(d) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function Header({ user, onCustomize, onNotifications, count }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const initials = (user?.full_name || 'A').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="flex items-center justify-between mb-5 animate-fade-up">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full luxury-gradient flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">{initials || 'A'}</span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground tracking-wider uppercase">{greeting}</p>
          <h1 className="text-2xl font-bold tracking-tight">{user?.full_name?.split(' ')[0] || 'Athlete'}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onNotifications} className="relative w-10 h-10 rounded-xl glass flex items-center justify-center min-h-[44px] min-w-[44px]">
          <Bell size={18} className="text-muted-foreground" />
          {count > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-luxury-red text-white text-[9px] font-bold flex items-center justify-center">{count}</span>}
        </button>
        <button onClick={onCustomize} className="w-10 h-10 rounded-xl glass flex items-center justify-center min-h-[44px] min-w-[44px]"><LayoutGrid size={18} className="text-muted-foreground" /></button>
      </div>
    </div>
  );
}

function QuickTile({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="glass rounded-2xl py-3 flex flex-col items-center gap-1.5 hover:border-primary/30 transition-all min-h-[76px]">
      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Icon size={18} /></div>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

function SectionLabel({ children, action }) {
  return (
    <div className="flex items-center justify-between mt-6 mb-3">
      <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{children}</h2>
      {action && (
        <button onClick={action} className="text-xs text-primary flex items-center gap-0.5 hover:gap-1.5 transition-all">
          View <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

function MetricPill({ icon: Icon, value, sub }) {
  return (
    <div className="glass rounded-xl px-2 py-2.5 flex flex-col items-center text-center">
      <Icon size={14} className="text-primary mb-1" />
      <span className="text-base font-bold tabular-nums leading-none">{value}</span>
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{sub}</span>
    </div>
  );
}

function WeekStat({ label, value, sub, accent }) {
  const color = accent === 'red' ? 'text-luxury-red' : accent === 'blue' ? 'text-primary' : 'text-foreground';
  return (
    <div className="flex flex-col items-center text-center">
      <span className={cn('text-xl font-bold tabular-nums', color)}>{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</span>
      <span className="text-[10px] text-muted-foreground">{sub}</span>
    </div>
  );
}