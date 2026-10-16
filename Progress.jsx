import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, Ring, Stat, ConfidenceBadge, EmptyState, Pill } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from 'recharts';
import { TrendingUp, Plus, X, Ruler, Award, Activity, Scale, Flame, Route, Clock, Trophy, Flag, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProgressPhotos from '@/components/progress/ProgressPhotos';
import MeasurementHistory from '@/components/progress/MeasurementHistory';
import PRTimeline from '@/components/progress/PRTimeline';
import { rollingAverage, trendDirection, weeklyRateOfChange, dataConfidence, calcBMI, navyBodyFat, fatMassLeanMass, calcFFMI, waistToHeight } from '@/lib/fitnessScience';
import { cn } from '@/lib/utils';
import { getChartColors } from '@/lib/chartTheme';
import { ActionSelect } from '@/components/ui/action-select';
import { syncProfileFromMeasurement } from '@/lib/profileSync';
import { weeklyAggregates, detectCardioPRs, performanceComparison, formatDuration, formatDistance, formatPace } from '@/lib/cardioAnalytics';
import PullToRefresh from '@/components/PullToRefresh';

export default function Progress() {
  const { user } = useAuth();
  const [tab, setTab] = useState('body');
  const [measurements, setMeasurements] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [cardio, setCardio] = useState([]);
  const [sets, setSets] = useState([]);

  useEffect(() => { loadAll(); }, []);
  const loadAll = async () => {
    try {
      const [m, w, a, c, st] = await Promise.all([
        base44.entities.BodyMeasurement.list('-date', 200),
        base44.entities.WorkoutSession.list('-date', 60),
        base44.entities.Achievement.list('-created_date', 50),
        base44.entities.CardioSession.list('-date', 200),
        base44.entities.WorkoutSet.list('-created_date', 500),
      ]);
      setMeasurements(m || []);
      setWorkouts(w || []);
      setAchievements(a || []);
      setCardio(c || []);
      setSets(st || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const sorted = useMemo(() => [...measurements].reverse(), [measurements]);
  const weights = sorted.map((m) => m.weight_kg).filter(Boolean);
  const latest = measurements[0];
  const trend = trendDirection(weights);
  const rate = weeklyRateOfChange(weights);
  const confidence = dataConfidence(weights.length);

  const chartData = useMemo(() => sorted.map((m, i) => ({
    date: new Date(m.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    weight: m.weight_kg, bf: m.body_fat_percent, waist: m.waist_cm,
    avg7: rollingAverage(weights.slice(0, i + 1), 7),
  })), [sorted, weights]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>;

  return (
    <PullToRefresh onRefresh={loadAll}>
    <div className="max-w-md mx-auto px-4 pt-6 pb-36">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-muted-foreground tracking-wider uppercase">Analytics</p>
          <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/goal-journey" className="min-h-[44px] px-3 rounded-md text-sm font-medium border border-input bg-transparent glass flex items-center gap-1.5 hover:bg-accent"><Flag size={15} className="text-luxury-blue" /> Journey</Link>
          <Button size="sm" className="bg-luxury-blue glow-blue min-h-[44px]" onClick={() => setLogging(true)}><Plus size={16} /> Log</Button>
        </div>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        <Pill active={tab === 'body'} onClick={() => setTab('body')}>Body</Pill>
        <Pill active={tab === 'performance'} onClick={() => setTab('performance')}>Performance</Pill>
        <Pill active={tab === 'awards'} onClick={() => setTab('awards')}>Awards</Pill>
        <Pill active={tab === 'cardio'} onClick={() => setTab('cardio')}>Cardio</Pill>
        <Pill active={tab === 'photos'} onClick={() => setTab('photos')}><Camera size={12} className="mr-1" />Photos</Pill>
      </div>

      {tab === 'body' && (
        <BodyTab chartData={chartData} latest={latest} weights={weights} trend={trend} rate={rate} confidence={confidence} user={user} measurements={measurements} onRefresh={loadAll} />
      )}
      {tab === 'performance' && <PerformanceTab workouts={workouts} sets={sets} />}
      {tab === 'awards' && <AwardsTab achievements={achievements} />}
      {tab === 'cardio' && <CardioTab cardio={cardio} />}
      {tab === 'photos' && <ProgressPhotos />}

      {logging && <LogMeasurementSheet onClose={() => setLogging(false)} onSaved={(entry) => setMeasurements((m) => [entry, ...m])} user={user} />}
    </div>
    </PullToRefresh>
  );
}

function BodyTab({ chartData, latest, weights, trend, rate, confidence, user, measurements, onRefresh }) {
  const c = getChartColors();
  const bmi = latest && user ? calcBMI(latest.weight_kg, user.height_cm) : null;
  const fm = latest ? fatMassLeanMass(latest.weight_kg, latest.body_fat_percent) : null;
  const ffmi = latest && user ? calcFFMI(latest.weight_kg, latest.body_fat_percent, user.height_cm) : null;
  const wth = latest && user ? waistToHeight(latest.waist_cm, user.height_cm) : null;

  return (
    <div className="space-y-4">
      <Card className="luxury-gradient border border-luxury-blue/30">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-white">Weight Trend</p>
          <ConfidenceBadge level={confidence} />
        </div>
        <div className="flex items-end gap-4 mb-3">
          <div>
            <p className="text-3xl font-bold text-white tabular-nums">{latest?.weight_kg || '—'}<span className="text-base text-white/60 ml-1">kg</span></p>
            <p className="text-xs text-white/60">{trend === 'decreasing' ? '↓ decreasing' : trend === 'increasing' ? '↑ increasing' : '— stable'}</p>
          </div>
          {rate != null && <Stat label="Weekly Δ" value={`${rate > 0 ? '+' : ''}${rate}`} unit="kg" accent="red" />}
        </div>
        <div className="h-32 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.gold} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={c.gold} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: c.text }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: c.text }} axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip contentStyle={{ background: c.tooltipBg, border: '1px solid ' + c.tooltipBorder, borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="weight" stroke={c.gold} strokeWidth={2} fill="url(#wgrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card><Stat label="Body Fat" value={latest?.body_fat_percent ?? '—'} unit="%" accent="red" sub={latest?.body_fat_method || 'no data'} /></Card>
        <Card><Stat label="Fat Mass" value={fm?.fatMass ?? '—'} unit="kg" accent="blue" /></Card>
        <Card><Stat label="Lean Mass" value={fm?.leanMass ?? '—'} unit="kg" /></Card>
        <Card><Stat label="BMI" value={bmi ?? '—'} /></Card>
        <Card><Stat label="FFMI" value={ffmi ?? '—'} sub="estimate" /></Card>
        <Card><Stat label="W:H Ratio" value={wth ?? '—'} sub="waist/height" /></Card>
      </div>

      {latest?.body_fat_is_estimate && (
        <Card className="border-luxury-gold/30 bg-luxury-gold/5">
          <p className="text-xs text-luxury-gold leading-relaxed">
            <strong>Estimate notice:</strong> Body-fat values from circumference formulas or visual estimation are approximations, not clinical measurements. For accuracy, use DEXA, Bod Pod, or hydrostatic weighing.
          </p>
        </Card>
      )}

      <Card>
        <p className="text-sm font-semibold mb-3">Composition Trend</p>
        <div className="h-32 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: c.text }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: c.text }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: c.tooltipBg, border: '1px solid ' + c.tooltipBorder, borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="bf" stroke={c.green} strokeWidth={2} dot={false} name="Body Fat %" />
              <Line type="monotone" dataKey="waist" stroke={c.gold} strokeWidth={2} dot={false} name="Waist cm" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <MeasurementHistory measurements={measurements} onRefresh={onRefresh} />
    </div>
  );
}

function PerformanceTab({ workouts, sets }) {
  const c = getChartColors();
  const completed = workouts.filter((w) => w.status === 'completed');
  const totalVolume = completed.reduce((a, w) => a + (w.total_volume_kg || 0), 0);
  const totalPRs = completed.reduce((a, w) => a + (w.pr_count || 0), 0);
  const topE1RM = Math.max(0, ...completed.map((w) => w.estimated_1rm_top_set || 0));

  const chartData = completed.slice(0, 12).reverse().map((w) => ({
    date: new Date(w.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    volume: w.total_volume_kg || 0,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><Stat label="Sessions" value={completed.length} accent="blue" /></Card>
        <Card><Stat label="Total Volume" value={Math.round(totalVolume)} unit="kg" accent="red" /></Card>
        <Card><Stat label="PRs" value={totalPRs} /></Card>
      </div>
      <Card>
        <p className="text-sm font-semibold mb-3">Training Volume</p>
        {chartData.length ? (
          <div className="h-40 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs><linearGradient id="vgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c.green} stopOpacity={0.5} /><stop offset="100%" stopColor={c.green} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: c.text }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: c.text }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: c.tooltipBg, border: '1px solid ' + c.tooltipBorder, borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="volume" stroke={c.green} strokeWidth={2} fill="url(#vgrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyState icon={Activity} title="No sessions yet" description="Log a workout to see performance trends." />}
      </Card>
      <Card>
        <div className="flex items-center justify-between">
          <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Top Estimated 1RM</p><p className="text-2xl font-bold text-luxury-red tabular-nums">{Math.round(topE1RM)}<span className="text-sm text-muted-foreground ml-1">kg</span></p></div>
          <Scale size={32} className="text-muted-foreground" />
        </div>
      </Card>

      <PRTimeline sessions={workouts} sets={sets} />
    </div>
  );
}

function AwardsTab({ achievements }) {
  if (!achievements.length) return <EmptyState icon={Award} title="No achievements yet" description="Train, log, and stay consistent to unlock badges." />;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {achievements.map((a) => (
        <Card key={a.id} className={cn('flex flex-col items-center text-center', a.unlocked && 'border-luxury-red/40')}>
          <div className={cn('w-14 h-14 rounded-full flex items-center justify-center mb-2', a.unlocked ? 'bg-luxury-red/15 text-luxury-red glow-red' : 'bg-muted/30 text-muted-foreground')}>
            <Award size={26} />
          </div>
          <p className="text-sm font-semibold">{a.title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{a.description}</p>
          <div className="w-full h-1.5 rounded-full bg-muted/30 mt-2 overflow-hidden">
            <div className="h-full bg-luxury-red transition-all" style={{ width: `${a.progress_percent || 0}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{a.unlocked ? `+${a.xp_reward} XP · Unlocked` : `${Math.round(a.progress_percent || 0)}%`}</p>
        </Card>
      ))}
    </div>
  );
}

function CardioTab({ cardio }) {
  const c = getChartColors();
  const weeks = useMemo(() => weeklyAggregates(cardio, 12), [cardio]);
  const prs = useMemo(() => detectCardioPRs(cardio), [cardio]);
  const runComp = useMemo(() => performanceComparison(cardio, 'running'), [cardio]);
  const chartData = weeks.map((w) => ({ label: w.label, minutes: Math.round(w.seconds / 60), distance: +w.distance.toFixed(2), calories: Math.round(w.calories), sessions: w.sessions }));

  if (!cardio.length) return <EmptyState icon={Activity} title="No cardio yet" description="Start a cardio session to see time, distance, calories and PR trends here." />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><Stat label="Sessions" value={cardio.length} accent="blue" /></Card>
        <Card><Stat label="Total Time" value={formatDuration(cardio.reduce((a, s) => a + (s.duration_seconds || 0), 0))} /></Card>
        <Card><Stat label="Calories" value={Math.round(cardio.reduce((a, s) => a + (s.calories || 0), 0))} unit="kcal" accent="red" /></Card>
      </div>

      <Card>
        <p className="text-sm font-semibold mb-3">Cardio Time (weekly minutes)</p>
        <div className="h-40 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs><linearGradient id="cgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c.gold} stopOpacity={0.5} /><stop offset="100%" stopColor={c.gold} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: c.text }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: c.text }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: c.tooltipBg, border: '1px solid ' + c.tooltipBorder, borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="minutes" stroke={c.gold} strokeWidth={2} fill="url(#cgrad)" name="Minutes" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold mb-3">Distance (km per week)</p>
        <div className="h-40 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: c.text }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: c.text }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: c.tooltipBg, border: '1px solid ' + c.tooltipBorder, borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="distance" stroke={c.green} strokeWidth={2} dot={false} name="Distance km" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold mb-3">Cardio Calories (per week)</p>
        <div className="h-40 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs><linearGradient id="ccal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c.green} stopOpacity={0.5} /><stop offset="100%" stopColor={c.green} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: c.text }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: c.text }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: c.tooltipBg, border: '1px solid ' + c.tooltipBorder, borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="calories" stroke={c.green} strokeWidth={2} fill="url(#ccal)" name="Calories" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Calorie values are estimated (MET × weight × time) unless recorded from a machine or wearable. Estimates are not measurements.</p>
      </Card>

      {runComp && (
        <Card className="border-luxury-blue/30">
          <p className="text-sm font-semibold mb-2">Running Performance</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div><p className="text-[10px] uppercase text-muted-foreground">First 5K pace</p><p className="text-lg font-bold tabular-nums">{formatPace(runComp.firstPace)}/km</p><p className="text-[10px] text-muted-foreground">{formatDistance(runComp.firstDistance)} km</p></div>
            <div><p className="text-[10px] uppercase text-muted-foreground">Current pace</p><p className="text-lg font-bold tabular-nums text-luxury-blue">{formatPace(runComp.currentPace)}/km</p><p className="text-[10px] text-muted-foreground">{formatDistance(runComp.currentDistance)} km</p></div>
          </div>
          <p className="text-xs mt-2 text-muted-foreground">{runComp.faster ? `${formatPace(Math.abs(runComp.improvement))}/km faster than your first session` : `${formatPace(Math.abs(runComp.improvement))}/km slower than your first session`}. Comparison uses average pace per session.</p>
        </Card>
      )}

      {prs.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3"><Trophy size={16} className="text-luxury-gold" /><p className="text-sm font-semibold">Cardio Personal Records</p></div>
          <div className="space-y-2">
            {prs.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div><p className="text-sm font-medium">{p.label}</p><p className="text-[10px] text-muted-foreground">{p.activity || ''}{p.date ? ` · ${new Date(p.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}` : ''}</p></div>
                <span className="text-sm font-bold tabular-nums text-gradient-blue">{p.display}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function LogMeasurementSheet({ onClose, onSaved, user }) {
  const [form, setForm] = useState({ weight_kg: '', body_fat_percent: '', body_fat_method: 'Calipers', waist_cm: '', hip_cm: '', neck_cm: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const data = { date: new Date().toISOString(), ...form };
      ['weight_kg', 'body_fat_percent', 'waist_cm', 'hip_cm', 'neck_cm'].forEach((k) => (data[k] = data[k] ? Number(data[k]) : undefined));
      // Auto-estimate body fat from Navy method if waist/neck available and no BF entered
      if (!data.body_fat_percent && data.waist_cm && data.neck_cm && user?.height_cm) {
        const est = navyBodyFat({ sex: user.sex, heightCm: user.height_cm, neckCm: data.neck_cm, waistCm: data.waist_cm, hipCm: data.hip_cm });
        if (est) { data.body_fat_percent = est; data.body_fat_method = 'Circumference Estimate'; data.body_fat_is_estimate = true; data.body_fat_confidence = 'Moderate'; }
      } else if (data.body_fat_percent) {
        data.body_fat_is_estimate = !['DEXA', 'Bod Pod', 'Hydrostatic'].includes(data.body_fat_method);
        data.body_fat_confidence = data.body_fat_is_estimate ? 'Moderate' : 'High';
      }
      // Optimistic: append immediately, persist behind the scenes
      onSaved({ ...data, id: `tmp-${Date.now()}` });
      onClose();
      await base44.entities.BodyMeasurement.create(data);
      await syncProfileFromMeasurement(data, user);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Ruler size={18} className="text-luxury-blue" /><h3 className="font-semibold text-lg">Log Measurement</h3></div>
          <Button variant="ghost" size="sm" onClick={onClose} className="min-h-[44px]"><X size={18} /></Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Weight (kg)"><Input type="number" value={form.weight_kg} onChange={(e) => set('weight_kg', e.target.value)} placeholder="82.0" /></Field>
          <Field label="Body Fat (%)"><Input type="number" value={form.body_fat_percent} onChange={(e) => set('body_fat_percent', e.target.value)} placeholder="optional" /></Field>
          <Field label="Waist (cm)"><Input type="number" value={form.waist_cm} onChange={(e) => set('waist_cm', e.target.value)} placeholder="optional" /></Field>
          <Field label="Neck (cm)"><Input type="number" value={form.neck_cm} onChange={(e) => set('neck_cm', e.target.value)} placeholder="optional" /></Field>
          <Field label="Hip (cm)"><Input type="number" value={form.hip_cm} onChange={(e) => set('hip_cm', e.target.value)} placeholder="optional" /></Field>
          <Field label="BF Method">
            <ActionSelect
              value={form.body_fat_method}
              options={['DEXA', 'Bod Pod', 'Hydrostatic', 'Calipers', 'BIA', 'Circumference Estimate', 'Visual Estimate', 'User Entered']}
              onChange={(v) => set('body_fat_method', v)}
            />
          </Field>
        </div>
        <Field label="Notes"><Input value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="morning, fasted…" /></Field>
        <p className="text-[10px] text-muted-foreground mt-3">Leave body fat blank to auto-estimate from circumferences (Navy method). Estimates are clearly labeled and never replace a measured value.</p>
        <Button onClick={save} disabled={saving || !form.weight_kg} className="w-full mt-4 bg-luxury-blue glow-blue min-h-[44px]">{saving ? 'Saving…' : 'Save Measurement'}</Button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (<div className="flex flex-col gap-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>{children}</div>);
}