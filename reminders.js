// Deterministic reminder engine — no AI, no credits. Computes what the user
// "must do" from their own data and surfaces actionable notifications.
import { base44 } from '@/api/base44Client';
import { sendPush } from '@/lib/pushNotifications';
import { localDateStr } from './utils';

const TODAY = () => localDateStr();
const DAY = 86400000;

// Loads every dataset the reminder engine needs. Shared by the Notifications
// page and the live scheduler so both stay in sync.
export async function loadReminderData() {
  const [goals, sess, nut, sched, recs, meas, habits, habitLogs, cardio] = await Promise.all([
    base44.entities.Goal.filter({ status: 'active' }, '-created_date', 1),
    base44.entities.WorkoutSession.list('-date', 30),
    base44.entities.NutritionLog.list('-date', 100),
    base44.entities.ScheduledWorkout.filter({ date: TODAY(), completed: false }, '-date', 1),
    base44.entities.RecoveryRecord.list('-date', 7),
    base44.entities.BodyMeasurement.list('-date', 30),
    base44.entities.Habit.filter({ active: true }, '-created_date', 50),
    base44.entities.HabitLog.list('-date', 100),
    base44.entities.CardioSession.list('-date', 60),
  ]);
  return { goal: goals[0], sessions: sess, nutrition: nut, scheduled: sched[0], recovery: recs[0], measurements: meas, habits, habitLogs, cardio };
}

export function computeReminders(data) {
  const { goal, sessions, nutrition, scheduled, recovery, measurements, cardio, habits, habitLogs } = data || {};
  const out = [];
  const today = TODAY();
  const hour = new Date().getHours();
  const todayNut = (nutrition || []).filter((n) => n.date === today);

  // 1. Scheduled workout today
  if (scheduled && !scheduled.completed) {
    out.push({ id: 'train-today', priority: 'high', icon: 'Dumbbell', title: scheduled.title || "Today's workout", body: scheduled.focus ? `${scheduled.focus} — your scheduled session is ready.` : 'Tap to start your scheduled session.', action: '/workout/new', cta: 'Start' });
  }

  // 2. No strength workout in 3 days (and nothing scheduled today)
  const lastSession = (sessions || []).find((s) => s.status === 'completed' && s.date);
  const daysSince = lastSession ? Math.floor((Date.now() - new Date(lastSession.date).getTime()) / DAY) : null;
  if (!scheduled && (daysSince == null || daysSince >= 3)) {
    out.push({ id: 'train-soon', priority: 'high', icon: 'Dumbbell', title: daysSince == null ? 'Start training' : `${daysSince} days since last workout`, body: daysSince == null ? 'Log your first workout to begin tracking progress.' : 'A session keeps your momentum and recovery on track.', action: '/workout/new', cta: 'Train' });
  }

  // 3. Fuel: nothing logged today
  if (!todayNut.length) {
    out.push({ id: 'log-fuel', priority: 'high', icon: 'Apple', title: 'Log your fuel', body: 'No meals logged today. Stay on track with your calorie and protein targets.', action: '/nutrition', cta: 'Log Food' });
  } else if (goal && goal.calorie_target && hour >= 14) {
    const cal = todayNut.reduce((a, n) => a + (n.calories || 0), 0);
    if (cal < goal.calorie_target * 0.5) {
      out.push({ id: 'keep-fueling', priority: 'medium', icon: 'Apple', title: 'Keep fueling', body: `Only ${Math.round(cal)} of ${Math.round(goal.calorie_target)} kcal logged — add your remaining meals.`, action: '/nutrition', cta: 'Log Food' });
    }
  }

  // 4. Post-workout meal: completed a session today but no Post-Workout meal logged
  const sessionToday = (sessions || []).some((s) => s.status === 'completed' && (s.date || '').slice(0, 10) === today);
  const hasPostWorkoutMeal = todayNut.some((n) => n.meal === 'Post-Workout');
  if (sessionToday && !hasPostWorkoutMeal) {
    out.push({ id: 'post-workout-meal', priority: 'medium', icon: 'Apple', title: 'Log your post-workout meal', body: 'Refuel with protein and carbs within 1-2 hours of training to support recovery.', action: '/nutrition', cta: 'Log Food' });
  }

  // 5. Recovery check-in overdue (no recovery in 2 days)
  const lastRec = recovery && recovery.date ? new Date(recovery.date) : null;
  const recDays = lastRec ? Math.floor((Date.now() - lastRec.getTime()) / DAY) : null;
  if (recDays == null || recDays >= 2) {
    out.push({ id: 'recovery-checkin', priority: 'medium', icon: 'Heart', title: 'Recovery check-in', body: 'Log sleep, soreness and energy to sharpen your readiness score.', action: '/progress', cta: 'Check In' });
  }

  // 6. Sleep reminder: late evening and no recovery log today
  if (hour >= 22 && recDays == null) {
    out.push({ id: 'sleep-log', priority: 'medium', icon: 'Moon', title: 'Log your sleep', body: "Recording your sleep hours and quality sharpens tomorrow's readiness score.", action: '/progress', cta: 'Log Sleep' });
  }

  // 7. Weight: morning nudge, or overdue reminder
  const weighedToday = (measurements || []).some((m) => (m.date || '').slice(0, 10) === today && m.weight_kg);
  const lastMeas = (measurements || []).find((m) => m.weight_kg);
  const measDays = lastMeas && lastMeas.date ? Math.floor((Date.now() - new Date(lastMeas.date).getTime()) / DAY) : null;
  if (!weighedToday && hour >= 6 && hour <= 11) {
    out.push({ id: 'morning-weigh', priority: 'low', icon: 'Scale', title: 'Morning weigh-in', body: 'Weigh yourself now for the most consistent reading.', action: '/progress', cta: 'Log Weight' });
  } else if (measDays == null || measDays >= 7) {
    out.push({ id: 'log-weight', priority: 'medium', icon: 'Scale', title: measDays == null ? 'Log your weight' : `${measDays} days since last weigh-in`, body: 'Regular weigh-ins keep your progress chart and goal journey accurate.', action: '/progress', cta: 'Log Weight' });
  }

  // 8. No cardio this week
  const weekCardio = (cardio || []).filter((c) => c.date && Date.now() - new Date(c.date).getTime() < 7 * DAY);
  if (!weekCardio.length) {
    out.push({ id: 'cardio-week', priority: 'low', icon: 'Activity', title: 'No cardio this week', body: 'A short session supports recovery and heart health.', action: '/cardio', cta: 'Start Cardio' });
  }

  // 9. Goal setup / target calculation
  if (!goal) {
    out.push({ id: 'setup-goal', priority: 'high', icon: 'Target', title: 'Set your goal', body: 'Define your target so the app can calculate calories, macros and training focus for you.', action: '/profile', cta: 'Set Goal' });
  } else if (!goal.calorie_target) {
    out.push({ id: 'calc-targets', priority: 'medium', icon: 'Brain', title: 'Calculate your targets', body: 'We can compute your daily calorie and macro targets from your goal and weight.', action: '/profile', cta: 'Calculate' });
  }

  // 10. Goal deadline approaching
  if (goal && goal.target_date) {
    const daysLeft = Math.floor((new Date(goal.target_date).getTime() - Date.now()) / DAY);
    if (daysLeft >= 0 && daysLeft <= 14) {
      out.push({ id: 'goal-deadline', priority: 'medium', icon: 'Target', title: `${daysLeft} days to your goal`, body: `Your target date is ${goal.target_date}. Stay consistent to finish strong.`, action: '/goal-journey', cta: 'View Journey' });
    }
  }

  // 11. Deload suggestion: high training frequency + high RPE
  const last7 = (sessions || []).filter((s) => s.status === 'completed' && s.date && Date.now() - new Date(s.date).getTime() < 7 * DAY);
  if (last7.length >= 5) {
    const avgRpe = last7.reduce((a, s) => a + (s.rpe_session || 0), 0) / last7.length;
    if (avgRpe >= 8) {
      out.push({ id: 'deload-week', priority: 'medium', icon: 'Activity', title: 'Consider a deload', body: `You trained ${last7.length}× this week at high intensity (avg RPE ${avgRpe.toFixed(1)}). A lighter week aids recovery.`, action: '/coach', cta: 'View Insights' });
    }
  }

  // 12. Monthly report available at the start of a new month
  const dom = new Date().getDate();
  if (dom === 1 || (dom === 2 && hour < 12)) {
    out.push({ id: 'monthly-report', priority: 'low', icon: 'BarChart3', title: 'Monthly report ready', body: 'Your full deterministic monthly summary is available to review.', action: '/report', cta: 'Open Report' });
  }

  // 13. Habits due today (urgent in the evening)
  const activeHabits = (habits || []).filter((h) => h.active);
  if (activeHabits.length) {
    const doneToday = (habitLogs || []).filter((l) => l.date === today && l.completed).map((l) => l.habit_id);
    const pending = activeHabits.filter((h) => !doneToday.includes(h.id));
    if (pending.length) {
      out.push({ id: 'habits-today', priority: hour >= 20 ? 'high' : 'low', icon: 'Droplet', title: `${pending.length} habit${pending.length > 1 ? 's' : ''} to complete`, body: pending.slice(0, 3).map((h) => h.name).join(' · '), action: '/habits', cta: 'Complete' });
    }
  }

  const order = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => order[a.priority] - order[b.priority]);
}

// Fires browser notifications for due reminders, once per reminder per day.
export function fireBrowserNotifications(reminders, userId) {
  if (typeof window === 'undefined') return;
  const today = TODAY();
  const browserOk = ('Notification' in window) && Notification.permission === 'granted';
  reminders.slice(0, 5).forEach((r) => {
    const key = `lraz_notified_${r.id}_${today}`;
    if (localStorage.getItem(key)) return;
    if (browserOk) {
      try { new Notification(`LRAZ 63 · ${r.title}`, { body: r.body }); } catch (e) { /* ignore */ }
    }
    if (userId) sendPush(userId, `LRAZ 63 · ${r.title}`, r.body, r.action || '/');
    localStorage.setItem(key, '1');
  });
}

// Live scheduler: re-checks reminders on load and every 20 minutes while the
// app is open (foreground or background tab) and fires due notifications.
// Returns a cleanup function that clears the interval.
export function startLiveNotificationScheduler() {
  if (typeof window === 'undefined') return () => {};
  const tick = async () => {
    try {
      let me = null;
      try { me = await base44.auth.me(); } catch (e) { /* ignore */ }
      const data = await loadReminderData();
      const r = computeReminders(data);
      fireBrowserNotifications(r, me?.id);
    } catch (e) { /* ignore */ }
  };
  const timeoutId = setTimeout(tick, 10000);
  const intervalId = setInterval(tick, 20 * 60 * 1000);
  return () => { clearTimeout(timeoutId); clearInterval(intervalId); };
}