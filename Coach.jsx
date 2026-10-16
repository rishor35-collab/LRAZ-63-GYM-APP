import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, EmptyState } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Trophy, Flame, Target, AlertTriangle, Scale, Activity, Dumbbell, Info } from 'lucide-react';
import {
  MUSCLE_GROUPS, computeMuscleRecovery, detectPlateaus, detectWeakPoints, computeVolumeByMuscle,
  computeNutritionTrends, generateInsights, muscleGroupForExercise, volumeLandmarks,
  computeTrainingDistribution, computeWeeklyVolume, computeProgressionSuggestions,
  computeRepRangeDistribution, computeMuscleFrequency, computePersonalBestTimeline,
  computeRecoveryHistory, compareLastSessions,
} from '@/lib/performanceAnalytics';
import { estimate1RM } from '@/lib/fitnessScience';
import { cn } from '@/lib/utils';
import PullToRefresh from '@/components/PullToRefresh';
import TrainingDistribution from '@/components/coach/TrainingDistribution';
import DeloadActionCard from '@/components/coach/DeloadActionCard';
import ProgressionSuggestions from '@/components/coach/ProgressionSuggestions';
import RepRangeDistribution from '@/components/coach/RepRangeDistribution';
import MuscleFrequency from '@/components/coach/MuscleFrequency';
import PersonalBestTimeline from '@/components/coach/PersonalBestTimeline';
import RecoveryHistory from '@/components/coach/RecoveryHistory';
import SessionComparison from '@/components/coach/SessionComparison';

const DAY = 86400000;
const INSIGHT_ICONS = { alert: AlertTriangle, flame: Flame, target: Target, trending: TrendingUp, scale: Scale };

export default function Coach() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sets, setSets] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [nutrition, setNutrition] = useState([]);
  const [recovery, setRecovery] = useState(null);
  const [recoveryList, setRecoveryList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);
  const loadAll = async () => {
    try {
      const [goals, sess, st, meas, nut, recs] = await Promise.all([
        base44.entities.Goal.filter({ status: 'active' }, '-created_date', 1),
        base44.entities.WorkoutSession.list('-date', 60),
        base44.entities.WorkoutSet.list('-created_date', 400),
        base44.entities.BodyMeasurement.list('-date', 30),
        base44.entities.NutritionLog.list('-date', 200),
        base44.entities.RecoveryRecord.list('-date', 200),
      ]);
      setGoal(goals[0] || null);
      setSessions(sess || []);
      setSets(st || []);
      setMeasurements(meas || []);
      setNutrition(nut || []);
      setRecovery(recs?.[0] || null);
      setRecoveryList(recs || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const muscleRecovery = useMemo(() => computeMuscleRecovery(sessions, sets, recovery), [sessions, sets, recovery]);
  const monthlyVolume = useMemo(() => computeVolumeByMuscle(sessions, sets, 30), [sessions, sets]);
  const weekVolume = useMemo(() => computeVolumeByMuscle(sessions, sets, 7), [sessions, sets]);
  const prevWeekVolume = useMemo(() => {
    // sets from 7-14 days ago
    const dates = {}; sessions.forEach((s) => { if (s.id && s.date) dates[s.id] = new Date(s.date).getTime(); });
    const cutoff1 = Date.now() - 7 * DAY, cutoff2 = Date.now() - 14 * DAY;
    const vol = {};
    sets.forEach((s) => {
      const t = dates[s.session_id]; if (!t || t < cutoff2 || t >= cutoff1) return;
      const m = muscleGroupForExercise(s.exercise_name); if (!m) return;
      if (!vol[m]) vol[m] = { volume: 0, sets: 0 };
      vol[m].volume += (s.weight_kg || 0) * (s.reps || 0); vol[m].sets += 1;
    });
    return vol;
  }, [sessions, sets]);
  const weakPoints = useMemo(() => detectWeakPoints(monthlyVolume), [monthlyVolume]);
  const landmarks = useMemo(() => volumeLandmarks(weekVolume), [weekVolume]);
  const plateaus = useMemo(() => detectPlateaus(sessions, sets), [sessions, sets]);
  const nutritionTrends = useMemo(() => computeNutritionTrends(nutrition, goal, 7), [nutrition, goal]);
  const weights = useMemo(() => measurements.map((m) => m.weight_kg).filter(Boolean).reverse(), [measurements]);
  const insights = useMemo(() => generateInsights({ muscleRecovery, nutritionTrends, weakPoints, plateaus, goal, weights }), [muscleRecovery, nutritionTrends, weakPoints, plateaus, goal, weights]);

  const recentPRs = useMemo(() => detectRecentPRs(sessions, sets), [sessions, sets]);
  const distribution = useMemo(() => computeTrainingDistribution(sessions, sets, 30), [sessions, sets]);
  const weeklyVolume = useMemo(() => computeWeeklyVolume(sessions, sets, 8), [sessions, sets]);
  const progression = useMemo(() => computeProgressionSuggestions(sessions, sets, 6), [sessions, sets]);
  const repDist = useMemo(() => computeRepRangeDistribution(sets, sessions, 90), [sets, sessions]);
  const freq4 = useMemo(() => computeMuscleFrequency(sessions, sets, 4), [sessions, sets]);
  const freq8 = useMemo(() => computeMuscleFrequency(sessions, sets, 8), [sessions, sets]);
  const freq12 = useMemo(() => computeMuscleFrequency(sessions, sets, 12), [sessions, sets]);
  const pbTimeline = useMemo(() => computePersonalBestTimeline(sessions, sets, measurements, []), [sessions, sets, measurements]);
  const sessionCompare = useMemo(() => compareLastSessions(sessions, sets), [sessions, sets]);

  const consistency = useMemo(() => {
    const completed = sessions.filter((s) => s.status === 'completed' && s.date && Date.now() - new Date(s.date).getTime() < 28 * DAY).length;
    const target = (goal?.days_per_week || 4) * 4;
    return { completed, target, pct: target ? Math.min(100, Math.round((completed / target) * 100)) : 0 };
  }, [sessions, goal]);

  const setMaintenanceMode = async () => {
    if (!goal) return;
    try {
      const updated = await base44.entities.Goal.update(goal.id, { phase: 'Maintenance', primary_goal: 'Maintenance' });
      setGoal({ ...goal, ...updated });
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>;

  const hasData = sessions.length > 0;

  return (
    <PullToRefresh onRefresh={loadAll}>
      <div className="max-w-md mx-auto px-4 pt-4 pb-36">
        <div className="flex items-center gap-3 mb-5">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="min-h-[44px] min-w-[44px] p-2"><ArrowLeft size={18} /></Button>
          <div>
            <p className="text-xs text-muted-foreground tracking-wider uppercase">Analytics</p>
            <h1 className="text-2xl font-bold tracking-tight">Training Insights</h1>
          </div>
        </div>

        <Card className="border-luxury-blue/30 bg-luxury-blue/5 mb-4">
          <div className="flex items-start gap-2.5">
            <Info size={15} className="text-luxury-blue shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">These insights are generated from your logged training, nutrition and body data using fixed rules — not AI. They're training estimates, not medical advice.</p>
          </div>
        </Card>

        <DeloadActionCard weeklyVolume={weeklyVolume} recovery={recovery} />

        <Card className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Training Phase</p>
              <p className="text-[11px] text-muted-foreground">{goal ? `${goal.primary_goal} · ${goal.phase || '—'}` : 'No active goal'}</p>
            </div>
            {goal && goal.phase !== 'Maintenance' ? (
              <Button size="sm" variant="outline" className="glass min-h-[40px]" onClick={setMaintenanceMode}>Switch to Maintenance</Button>
            ) : goal ? (
              <span className="text-[10px] font-semibold text-luxury-blue bg-luxury-blue/10 rounded-full px-2 py-1">MAINTENANCE</span>
            ) : null}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Maintenance mode holds your physique — calories and training balance around your current output. Switch any time.</p>
        </Card>

        {!hasData ? (
          <EmptyState icon={Dumbbell} title="No training data yet" description="Complete a few workouts to unlock insights about your strength, volume, consistency and recovery." action={<Button className="bg-luxury-blue mt-4 min-h-[44px]" onClick={() => navigate('/workout/new')}><Dumbbell size={16} /> Start Workout</Button>} />
        ) : (
          <>
            {/* RECENT PRs */}
            <SectionLabel icon={Trophy}>Recent PRs</SectionLabel>
            {recentPRs.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                {recentPRs.map((pr, i) => (
                  <Card key={i} className="flex items-center gap-3 py-3">
                    <div className="w-9 h-9 rounded-lg bg-luxury-blue/15 text-luxury-blue flex items-center justify-center shrink-0"><Trophy size={17} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{pr.exercise}</p>
                      <p className="text-xs text-muted-foreground">{pr.oldWeight} → <span className="text-luxury-blue font-semibold">{pr.newWeight} kg</span> · +{pr.delta} kg</p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="mb-4"><p className="text-sm text-muted-foreground text-center py-2">No new personal records in your latest session. Keep pushing — they'll show up here automatically.</p></Card>
            )}

            {/* PROGRESSION SUGGESTIONS */}
            <SectionLabel icon={TrendingUp}>Progression Suggestions</SectionLabel>
            <ProgressionSuggestions suggestions={progression} />

            {/* VOLUME BY MUSCLE */}
            <SectionLabel icon={Activity}>Volume This Week</SectionLabel>
            <Card className="mb-4">
              <div className="space-y-2.5">
                {MUSCLE_GROUPS.filter((m) => weekVolume[m]?.sets || prevWeekVolume[m]?.sets).map((m) => {
                  const cur = weekVolume[m]?.volume || 0;
                  const prev = prevWeekVolume[m]?.volume || 0;
                  const delta = prev ? Math.round(((cur - prev) / prev) * 100) : null;
                  return (
                    <div key={m} className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{m}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm tabular-nums text-muted-foreground">{Math.round(cur).toLocaleString()} kg</span>
                        {delta != null && <span className={cn('text-xs font-semibold tabular-nums w-12 text-right', delta > 0 ? 'text-luxury-blue' : delta < 0 ? 'text-luxury-red' : 'text-muted-foreground')}>{delta > 0 ? '+' : ''}{delta}%</span>}
                      </div>
                    </div>
                  );
                })}
                {!MUSCLE_GROUPS.some((m) => weekVolume[m]?.sets) && <p className="text-sm text-muted-foreground text-center py-2">No volume logged this week yet.</p>}
              </div>
            </Card>

            {/* VOLUME LANDMARKS */}
            <SectionLabel icon={Target}>Volume Landmarks</SectionLabel>
            <Card className="mb-4">
              <p className="text-[11px] text-muted-foreground mb-3">Weekly sets per muscle vs estimated MEV (maintenance entry), MAV (growth range) and MRV (recovery ceiling). Heuristic ranges — a training guide, not a prescription.</p>
              <div className="space-y-2">
                {MUSCLE_GROUPS.filter((m) => landmarks[m]?.sets > 0).map((m) => {
                  const l = landmarks[m];
                  const statusColor = l.status === 'Optimal' ? 'text-emerald-400' : l.status === 'Overreaching' ? 'text-luxury-red' : l.status === 'Maintenance' ? 'text-luxury-blue' : 'text-muted-foreground';
                  return (
                    <div key={m} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{m}</span>
                        <span className={cn('text-xs font-semibold shrink-0', statusColor)}>{l.status}</span>
                      </div>
                      <span className="text-[11px] tabular-nums text-muted-foreground">{l.sets} sets · MEV {l.mev}/MAV {l.mav}/MRV {l.mrv}</span>
                    </div>
                  );
                })}
                {!MUSCLE_GROUPS.some((m) => landmarks[m]?.sets > 0) && <p className="text-sm text-muted-foreground text-center py-2">Log workouts to see your volume landmarks.</p>}
              </div>
            </Card>

            {/* TRAINING BALANCE */}
            <SectionLabel icon={Scale}>Training Balance</SectionLabel>
            <TrainingDistribution distribution={distribution} />

            {/* CONSISTENCY */}
            <SectionLabel icon={Target}>Consistency</SectionLabel>
            <Card className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-2xl font-bold tabular-nums">{consistency.completed}<span className="text-base text-muted-foreground"> / {consistency.target}</span></p>
                  <p className="text-xs text-muted-foreground">workouts completed (last 4 weeks)</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums text-luxury-blue">{consistency.pct}%</p>
                  <p className="text-xs text-muted-foreground">adherence</p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                <div className="h-full bg-luxury-blue transition-all" style={{ width: `${consistency.pct}%` }} />
              </div>
            </Card>

            {/* PLATEAUS */}
            {plateaus.length > 0 && (
              <>
                <SectionLabel icon={AlertTriangle}>Possible Plateaus</SectionLabel>
                <div className="space-y-2 mb-4">
                  {plateaus.map((p, i) => (
                    <Card key={i} className="flex items-center gap-3 py-3">
                      <div className="w-9 h-9 rounded-lg bg-luxury-red/15 text-luxury-red flex items-center justify-center shrink-0"><AlertTriangle size={17} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{p.exercise}</p>
                        <p className="text-xs text-muted-foreground">Estimated 1RM flat for ~{p.weeks} weeks ({p.e1rm} kg). Consider a deload or rep-range change.</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* GENERAL INSIGHTS */}
            {insights.length > 0 && (
              <>
                <SectionLabel icon={TrendingUp}>Insights</SectionLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                  {insights.map((ins, i) => {
                    const Icon = INSIGHT_ICONS[ins.icon] || TrendingUp;
                    return (
                      <Card key={i} className="flex items-start gap-3 py-3">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', ins.severity === 'warn' ? 'bg-luxury-red/15 text-luxury-red' : 'bg-luxury-blue/15 text-luxury-blue')}>
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

            {/* SESSION COMPARISON */}
            <SectionLabel icon={TrendingUp}>Last Session vs Previous</SectionLabel>
            <SessionComparison comparison={sessionCompare} />

            {/* RECOVERY HISTORY */}
            <SectionLabel icon={Activity}>Recovery History</SectionLabel>
            <RecoveryHistory records={recoveryList} />

            {/* REP RANGE */}
            <SectionLabel icon={Activity}>Rep-Range Distribution</SectionLabel>
            <RepRangeDistribution dist={repDist} />

            {/* MUSCLE FREQUENCY */}
            <SectionLabel icon={Activity}>Muscle Frequency</SectionLabel>
            <MuscleFrequency freq4={freq4} freq8={freq8} freq12={freq12} />

            {/* PERSONAL BESTS */}
            <SectionLabel icon={Trophy}>Personal Best Timeline</SectionLabel>
            <PersonalBestTimeline events={pbTimeline} />
          </>
        )}
      </div>
    </PullToRefresh>
  );
}

function SectionLabel({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 mt-6 mb-3">
      <Icon size={16} className="text-luxury-blue" />
      <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{children}</h2>
    </div>
  );
}

// Detect PRs from the most recent completed session vs all prior sessions.
function detectRecentPRs(sessions, sets) {
  const dates = {};
  sessions.forEach((s) => { if (s.id && s.date) dates[s.id] = new Date(s.date).getTime(); });
  const sorted = sessions.filter((s) => s.status === 'completed' && dates[s.id]).sort((a, b) => dates[b.id] - dates[a.id]);
  if (!sorted.length) return [];
  const latest = sorted[0];
  const latestTime = dates[latest.id];
  const before = {};
  sets.forEach((s) => { const t = dates[s.session_id]; if (t && t < latestTime && s.exercise_name) before[s.exercise_name] = Math.max(before[s.exercise_name] || 0, s.weight_kg || 0); });
  const now = {};
  sets.filter((s) => s.session_id === latest.id && s.exercise_name).forEach((s) => { now[s.exercise_name] = Math.max(now[s.exercise_name] || 0, s.weight_kg || 0); });
  const prs = [];
  Object.keys(now).forEach((ex) => {
    if (now[ex] > 0 && (!before[ex] || now[ex] > before[ex])) {
      prs.push({ exercise: ex, newWeight: now[ex], oldWeight: before[ex] || 0, delta: +(now[ex] - (before[ex] || 0)).toFixed(1) });
    }
  });
  return prs.sort((a, b) => b.delta - a.delta).slice(0, 6);
}