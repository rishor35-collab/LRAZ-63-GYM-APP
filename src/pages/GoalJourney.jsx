import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, Ring, EmptyState, ConfidenceBadge } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Target, TrendingUp, Activity, Dumbbell, Apple, Scale, Heart, Info, Flag, Calendar } from 'lucide-react';
import { computeJourney, fmtKg, fmtDur, fmtDate } from '@/lib/goalJourney';
import { formatDistance } from '@/lib/cardioAnalytics';
import { cn } from '@/lib/utils';
import { getGoalFeedback } from '@/lib/feedbackMessages';

export default function GoalJourney() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const [goals, measurements, workouts, sets, cardio, nutrition, scheduled, programs] = await Promise.all([
        base44.entities.Goal.filter({ status: 'active' }, '-created_date', 1),
        base44.entities.BodyMeasurement.list('-date', 500),
        base44.entities.WorkoutSession.list('-date', 500),
        base44.entities.WorkoutSet.list('-created_date', 1000),
        base44.entities.CardioSession.list('-date', 500),
        base44.entities.NutritionLog.list('-date', 1000),
        base44.entities.ScheduledWorkout.list('-date', 500),
        base44.entities.TrainingProgram.list('-created_date', 50),
      ]);
      const goal = goals[0];
      const activeProgram = (programs || []).find((p) => p.days_per_week);
      setData(computeJourney({
        goal, measurements: measurements || [], workouts: workouts || [], sets: sets || [],
        cardio: cardio || [], nutrition: nutrition || [], scheduled: scheduled || [],
        programDaysPerWeek: activeProgram?.days_per_week,
      }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>;
  if (!data || !data.goal) return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-36">
      <Header onBack={() => navigate('/progress')} />
      <EmptyState icon={Target} title="No active goal" description="Set a goal with a target weight in Profile → Goals & Targets to see your journey and contribution report." action={<Button className="bg-luxury-blue glow-blue mt-4 min-h-[44px]" onClick={() => navigate('/profile')}>Set a Goal</Button>} />
    </div>
  );

  const j = data;
  const lossLabel = j.isLoss ? 'Lost' : j.isGain ? 'Gained' : 'Change';

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-36">
      <Header onBack={() => navigate('/progress')} />

      {/* Weight goal overview */}
      <Card className="mb-4 luxury-gradient border border-luxury-blue/30">
        <div className="flex items-center gap-4">
          <Ring value={j.progressPct} label="progress" size={104} color="blue" />
          <div className="flex-1 space-y-1.5">
            <Row label="Starting" value={fmtKg(j.startWeight)} />
            <Row label="Current" value={fmtKg(j.currentWeight)} accent />
            <Row label="Goal" value={fmtKg(j.targetWeight)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/10">
          <div><p className="text-[10px] uppercase tracking-wider text-white/50">{lossLabel}</p><p className="text-lg font-bold text-white tabular-nums">{j.change != null ? `${j.change > 0 ? '+' : ''}${(Math.round(j.change * 10) / 10).toFixed(1)} kg` : '—'}</p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-white/50">Remaining</p><p className="text-lg font-bold text-luxury-red tabular-nums">{j.remaining != null ? fmtKg(j.remaining) : '—'}</p></div>
        </div>
      </Card>

      {/* Status + why */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold">Goal Status</p>
          <StatusBadge status={j.status} />
        </div>
        <p className="text-xs text-muted-foreground">{j.statusReason || 'Set a target weight and target date for a status estimate.'}</p>
        <p className="text-[10px] text-muted-foreground mt-2 flex items-start gap-1"><Info size={11} className="mt-0.5 shrink-0" /> Status compares your recent weight trend to your selected rate preference. This is not medical advice.</p>
      </Card>

      {(() => { const fb = getGoalFeedback({ progressPct: j.progressPct, status: j.status }); return fb ? <Card className="mb-4 border-luxury-blue/20 bg-luxury-blue/5"><p className="text-sm font-semibold mb-1">{fb.title}</p><p className="text-xs text-muted-foreground leading-relaxed">{fb.message}</p></Card> : null; })()}

      {/* Trend + projection */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">7-Day Trend</p>
          <p className="text-xl font-bold tabular-nums">{j.trendWt != null ? fmtKg(j.trendWt) : '—'}</p>
          <p className="text-[10px] text-muted-foreground">Smooths daily water fluctuation</p>
        </Card>
        <Card>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Weekly Rate</p>
          <p className="text-xl font-bold tabular-nums">{j.rate ? `${j.rate > 0 ? '+' : ''}${(Math.round(j.rate * 100) / 100).toFixed(2)} kg` : '—'}</p>
          <p className="text-[10px] text-muted-foreground">4-week recent average</p>
        </Card>
      </div>

      {j.projectedDate && (
        <Card className="mb-4 border-luxury-blue/30">
          <p className="text-sm font-semibold flex items-center gap-2"><Calendar size={15} className="text-luxury-blue" /> Projected Goal Date</p>
          <p className="text-2xl font-bold mt-1">{fmtDate(j.projectedDate)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Based on your recent trend of ~{Math.abs(j.rate).toFixed(2)} kg/week. <span className="text-luxury-gold">This is a projection, not a guarantee.</span></p>
        </Card>
      )}

      {/* Weight timeline */}
      {j.weightTimeline.length > 0 && (
        <Card className="mb-4">
          <p className="text-sm font-semibold mb-3">Weight Timeline</p>
          <div className="space-y-1.5">
            <TimelineRow label="Start" value={fmtKg(j.startWeight)} date={fmtDate(j.start)} />
            {j.weightTimeline.slice(1, -1).map((p, i) => (
              <TimelineRow key={i} label="" value={fmtKg(p.weight_kg)} date={fmtDate(p.date)} muted />
            ))}
            {j.currentWeight !== j.startWeight && <TimelineRow label="Current" value={fmtKg(j.currentWeight)} date={fmtDate(j.now)} accent />}
            <TimelineRow label="Goal" value={fmtKg(j.targetWeight)} date="Target" goal />
          </div>
        </Card>
      )}

      {/* What contributed — trust-safe */}
      <Card className="mb-4">
        <p className="text-sm font-semibold mb-1">Activities During Your Goal Period</p>
        <p className="text-[11px] text-muted-foreground mb-3">Everything you consistently did between {fmtKg(j.startWeight)} and {fmtKg(j.currentWeight)}. Weight change is influenced by many factors — these are activities associated with the period, not causes.</p>

        <Contrib icon={Activity} title="Cardio" rows={[
          ['Sessions', `${j.cardio.sessions}`],
          ['Total time', fmtDur(j.cardio.totalSeconds)],
          ['Distance', `${formatDistance(j.cardio.distance)} km`],
          ['Calories', `${Math.round(j.cardio.calories)} kcal`],
          ['Source', j.cardio.rec > 0 && j.cardio.est > 0 ? 'est + recorded' : j.cardio.est > 0 ? 'estimated' : 'recorded'],
          ['Avg / week', `${(Math.round(j.cardio.avgPerWeek * 10) / 10).toFixed(1)} sessions`],
        ]} />

        <Contrib icon={Dumbbell} title="Strength Training" rows={[
          ['Workouts', `${j.strength.workouts}`],
          ['Exercises', `${j.strength.exercises}`],
          ['Total sets', `${j.strength.sets}`],
          ['Total volume', `${Math.round(j.strength.volume).toLocaleString()} kg`],
          ['PRs', `${j.strength.prs}`],
          ['Adherence', `${Math.round(j.strength.adherence * 100)}%`],
        ]} />

        <Contrib icon={Apple} title="Nutrition" rows={[
          ['Avg daily calories', `${Math.round(j.nutrition.avgCalories)} kcal`],
          ['Avg protein', `${Math.round(j.nutrition.avgProtein)} g`],
          ['Logging days', `${j.nutrition.loggingDays} / ${j.totalDays}`],
          ['Protein goal days', `${j.nutrition.proteinGoalDays} / ${j.totalDays}`],
          ['Target adherence', `${Math.round(j.nutrition.adherence * 100)}%`],
        ]} />

        <Contrib icon={Scale} title="Body Weight" rows={[
          ['Start', fmtKg(j.body.start)],
          ['Finish', fmtKg(j.body.finish)],
          ['Change', j.change != null ? `${j.change > 0 ? '+' : ''}${(Math.round(j.change * 10) / 10).toFixed(1)} kg` : '—'],
          ['Weight entries', `${j.body.entries}`],
        ]} />
      </Card>

      {/* What you did — habits */}
      <Card className="mb-4">
        <p className="text-sm font-semibold mb-3">Habits You Performed</p>
        <p className="text-[11px] text-muted-foreground mb-3">These are the habits you consistently performed during your goal period.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <HabitRow icon={Dumbbell} label="Strength Training" value={`${j.habits.strengthSessions} sessions`} />
          <HabitRow icon={Activity} label="Cardio" value={`${j.habits.cardioSessions} sessions`} />
          <HabitRow icon={Apple} label="Nutrition Tracking" value={`${j.habits.nutritionTracking.done} / ${j.habits.nutritionTracking.total} days`} />
          <HabitRow icon={Heart} label="Protein Goal" value={`${j.habits.proteinGoal.done} / ${j.habits.proteinGoal.total} days`} />
          <HabitRow icon={Scale} label="Daily Weight Logs" value={`${j.habits.weightLogs} entries`} />
        </div>
      </Card>

      <Card className="mb-4 border-luxury-gold/20">
        <p className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5"><Info size={13} className="mt-0.5 shrink-0 text-luxury-gold" /> LRAZ 63 does not claim any single activity caused a specific amount of weight change. Weight is affected by nutrition, training, sleep, stress, hydration, hormones, and more. This report documents what you did — your consistency is what you can control.</p>
      </Card>

      <Button variant="outline" className="w-full glass min-h-[44px]" onClick={() => navigate('/progress')}><ChevronLeft size={16} /> Back to Progress</Button>
    </div>
  );
}

function Header({ onBack }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground min-h-[44px]"><ChevronLeft size={18} /> Progress</button>
      <h1 className="text-lg font-semibold">Goal Journey</h1>
      <Flag size={18} className="text-luxury-blue" />
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-white/60">{label}</span>
      <span className={cn('text-sm font-semibold tabular-nums', accent ? 'text-luxury-red' : 'text-white')}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { 'Ahead': 'text-emerald-400 bg-emerald-500/10', 'On Track': 'text-luxury-blue bg-luxury-blue/10', 'Slightly Behind': 'text-luxury-gold bg-luxury-gold/10', 'Needs Attention': 'text-luxury-red bg-luxury-red/10' };
  return <span className={cn('text-[11px] font-medium px-2.5 py-1 rounded-full', map[status] || map['On Track'])}>{status}</span>;
}

function TimelineRow({ label, value, date, muted, accent, goal }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn('w-2 h-2 rounded-full', goal ? 'bg-luxury-blue' : accent ? 'bg-luxury-red' : 'bg-muted-foreground/50')} />
      <div className="flex-1 flex justify-between items-center">
        <span className={cn('text-xs', goal ? 'text-luxury-blue font-medium' : muted ? 'text-muted-foreground' : 'text-foreground')}>{label || date}</span>
        <span className={cn('text-sm font-semibold tabular-nums', goal ? 'text-luxury-blue' : accent ? 'text-luxury-red' : muted ? 'text-muted-foreground' : 'text-foreground')}>{value}</span>
      </div>
      {label && <span className="text-[10px] text-muted-foreground w-16 text-right">{date}</span>}
    </div>
  );
}

function Contrib({ icon: Icon, title, rows }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-xs font-semibold flex items-center gap-1.5 mb-2"><Icon size={13} className="text-luxury-blue" /> {title}</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pl-5">
        {rows.map(([k, v], i) => (
          <div key={i} className="flex justify-between text-xs gap-2 min-w-0">
            <span className="text-muted-foreground truncate">{k}</span>
            <span className="font-medium tabular-nums shrink-0">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HabitRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2"><Icon size={14} className="text-muted-foreground" /><span className="text-sm">{label}</span></div>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}