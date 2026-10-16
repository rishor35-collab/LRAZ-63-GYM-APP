import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { X, Dumbbell, Activity, Apple, TrendingUp, Trophy, Scale, Flame, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { computeVolumeByMuscle, computeBestLifts, computeNutritionTrends, detectPlateaus, detectDeload } from '@/lib/performanceAnalytics';
import { formatDuration, formatDistance } from '@/lib/cardioAnalytics';
import { cn } from '@/lib/utils';

const DAY = 86400000;
const WEEK_AGO = Date.now() - 7 * DAY;

export default function WeeklyReview({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const [sessions, sets, cardio, nutrition, recovery, measurements, goal] = await Promise.all([
        base44.entities.WorkoutSession.list('-date', 60),
        base44.entities.WorkoutSet.list('-created_date', 500),
        base44.entities.CardioSession.list('-date', 60),
        base44.entities.NutritionLog.list('-date', 200),
        base44.entities.RecoveryRecord.list('-date', 14),
        base44.entities.BodyMeasurement.list('-date', 30),
        base44.entities.Goal.filter({ status: 'active' }, '-created_date', 1),
      ]);
      setData({ sessions: sessions || [], sets: sets || [], cardio: cardio || [], nutrition: nutrition || [], recovery: recovery || [], measurements: measurements || [], goal: goal?.[0] || null });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const r = useMemo(() => {
    if (!data) return null;
    const wkSessions = data.sessions.filter((s) => s.status === 'completed' && new Date(s.date).getTime() >= WEEK_AGO);
    const wkSets = data.sets.filter((s) => new Date(s.created_date).getTime() >= WEEK_AGO);
    const wkCardio = data.cardio.filter((c) => new Date(c.date).getTime() >= WEEK_AGO);
    const wkNutrition = data.nutrition.filter((n) => new Date(n.date).getTime() >= WEEK_AGO);
    const wkRecovery = data.recovery.filter((rec) => new Date(rec.date).getTime() >= WEEK_AGO);
    const volumeByMuscle = computeVolumeByMuscle(data.sessions, data.sets, 7);
    const totalVolume = wkSessions.reduce((a, s) => a + (s.total_volume_kg || 0), 0);
    const prs = wkSets.filter((s) => s.is_pr).length + wkSessions.reduce((a, s) => a + (s.pr_count || 0), 0);
    const bestLifts = computeBestLifts(wkSets);
    const plateaus = detectPlateaus(data.sessions, data.sets);
    const nut = computeNutritionTrends(data.nutrition, data.goal, 7);
    const cardioSeconds = wkCardio.reduce((a, c) => a + (c.duration_seconds || 0), 0);
    const cardioCalories = wkCardio.reduce((a, c) => a + (c.calories || 0), 0);
    const cardioDistance = wkCardio.reduce((a, c) => a + (c.distance_km || 0), 0);
    const avgReadiness = wkRecovery.length ? Math.round(wkRecovery.reduce((a, rec) => a + (rec.readiness_score || 0), 0) / wkRecovery.length) : null;
    const weights = data.measurements.filter((m) => m.weight_kg && new Date(m.date).getTime() >= WEEK_AGO).sort((a, b) => new Date(a.date) - new Date(b.date));
    const weightChange = weights.length >= 2 ? +(weights[weights.length - 1].weight_kg - weights[0].weight_kg).toFixed(1) : null;
    const topMuscles = Object.entries(volumeByMuscle).filter(([, v]) => v.sets > 0).sort((a, b) => b[1].sets - a[1].sets).slice(0, 4);
    const weekStart = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.getTime(); };
    const wkMap = {};
    data.sessions.filter((s) => s.status === 'completed' && s.date).forEach((s) => { const ws = weekStart(s.date); wkMap[ws] = (wkMap[ws] || 0) + (s.total_volume_kg || 0); });
    const weeklyVolumes = Object.keys(wkMap).sort().map((k) => ({ weekStart: Number(k), volume: wkMap[k] }));
    const deload = detectDeload({ weeklyVolumes, recovery: data.recovery?.[0] });
    return { wkSessions, wkSets, wkCardio, wkNutrition, totalVolume, prs, bestLifts, plateaus, nut, cardioSeconds, cardioCalories, cardioDistance, avgReadiness, weightChange, topMuscles, checkIns: wkRecovery.length, deload };
  }, [data]);

  if (loading) return <div className="fixed inset-0 z-50 flex items-end justify-center"><div className="absolute inset-0 bg-black/60" onClick={onClose} /><div className="relative w-full max-w-md glass-strong rounded-t-3xl p-6 flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div></div>;
  if (!r) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Weekly Review</h3>
            <p className="text-[11px] text-muted-foreground">Last 7 days · {new Date(WEEK_AGO).toLocaleDateString('en', { month: 'short', day: 'numeric' })} – today</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="min-h-[44px] min-w-[44px] p-2"><X size={18} /></Button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Stat icon={Dumbbell} label="Workouts" value={`${r.wkSessions.length}`} />
          <Stat icon={Activity} label="Cardio" value={`${r.wkCardio.length}`} sub={formatDuration(r.cardioSeconds)} />
          <Stat icon={Flame} label="Cardio kcal" value={`${Math.round(r.cardioCalories)}`} accent />
          <Stat icon={TrendingUp} label="Volume" value={`${Math.round(r.totalVolume).toLocaleString()}`} unit="kg" />
          <Stat icon={Trophy} label="PRs" value={`${r.prs}`} accent="blue" />
          <Stat icon={Scale} label="Weight Δ" value={r.weightChange != null ? `${r.weightChange > 0 ? '+' : ''}${r.weightChange}` : '—'} unit="kg" accent={r.weightChange != null ? (r.weightChange < 0 ? 'red' : 'blue') : null} />
        </div>

        <Section icon={Apple} title="Nutrition">
          <Row k="Avg calories" v={r.nut.avgCalories ? `${r.nut.avgCalories} kcal` : '—'} />
          <Row k="Avg protein" v={r.nut.avgProtein ? `${r.nut.avgProtein} g` : '—'} />
          <Row k="Days logged" v={`${r.nut.daysLogged} / 7`} />
          <Row k="Protein goal days" v={`${r.nut.proteinDaysHit} / 7`} />
        </Section>

        <Section icon={CheckCircle2} title="Recovery">
          <Row k="Check-ins" v={`${r.checkIns} / 7`} />
          <Row k="Avg readiness" v={r.avgReadiness != null ? `${r.avgReadiness}` : '—'} />
        </Section>

        {r.topMuscles.length > 0 && (
          <Section icon={Dumbbell} title="Top Trained Muscles">
            {r.topMuscles.map(([m, v]) => <Row key={m} k={m} v={`${v.sets} sets · ${Math.round(v.volume).toLocaleString()} kg`} />)}
          </Section>
        )}

        {r.bestLifts.length > 0 && (
          <Section icon={Trophy} title="Top Lifts This Week">
            {r.bestLifts.slice(0, 3).map((b) => <Row key={b.exercise} k={b.exercise} v={`${Math.round(b.bestE1RM)} kg est 1RM`} />)}
          </Section>
        )}

        {r.deload?.recommended && (
          <div className="glass rounded-xl p-3 mb-3 border-luxury-gold/30">
            <p className="text-xs font-semibold flex items-center gap-1.5 mb-1.5"><AlertTriangle size={14} className="text-luxury-gold" /> Deload {r.deload.severity}</p>
            <ul className="space-y-1">
              {r.deload.reasons.map((reason, i) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-luxury-gold mt-0.5">•</span> {reason}</li>)}
            </ul>
            <p className="text-[10px] text-muted-foreground mt-2">A deload week typically uses ~60% volume and intensity. This is a training suggestion, not medical advice.</p>
          </div>
        )}

        {r.plateaus.length > 0 && (
          <div className="glass rounded-xl p-3 mb-3 flex items-start gap-2">
            <AlertTriangle size={15} className="text-luxury-gold mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground"><span className="text-foreground font-medium">{r.plateaus[0].exercise}</span> estimated 1RM has been flat for ~{r.plateaus[0].weeks} weeks. Consider a deload or rep-range change.</p>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">This is a deterministic summary of your last 7 days. No medical claims — your consistency is what you can control.</p>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, unit, sub, accent }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1"><Icon size={13} className="text-muted-foreground" /><span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span></div>
      <p className={cn('text-xl font-bold tabular-nums', accent === 'red' ? 'text-luxury-red' : accent === 'blue' ? 'text-luxury-blue' : 'text-foreground')}>{value}{unit && <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="glass rounded-xl p-3 mb-3">
      <p className="text-xs font-semibold flex items-center gap-1.5 mb-2"><Icon size={13} className="text-luxury-blue" /> {title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ k, v }) {
  return <div className="flex justify-between text-xs"><span className="text-muted-foreground">{k}</span><span className="font-medium tabular-nums">{v}</span></div>;
}