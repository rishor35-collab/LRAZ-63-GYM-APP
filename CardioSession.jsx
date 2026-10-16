import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, Square, ChevronLeft, Check, X, Activity, Bike, Waves, Mountain, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACTIVITIES, getActivity, estimateCalories, computeSpeed, computePace, formatDuration, formatPace, formatDistance, aggregateHistory, computeTimeInZone } from '@/lib/cardioAnalytics';
import { createPost, refreshMyTrainingStats } from '@/lib/activityFeed';
import { getCardioFeedback } from '@/lib/feedbackMessages';

const STORAGE_KEY = 'lraz_active_cardio';

function actIcon(id) {
  const g = getActivity(id).group;
  if (g === 'Bike') return Bike;
  if (g === 'Swim' || g === 'Row') return Waves;
  if (g === 'Walk' && id === 'hiking') return Mountain;
  if (g === 'Jump' || g === 'Ropes') return Timer;
  return Activity;
}

// Deterministic HIIT phase from elapsed time and interval config.
function intervalPhase(elapsed, interval) {
  if (!interval) return null;
  const cycle = interval.workSec + interval.restSec;
  const total = cycle * interval.rounds;
  if (elapsed >= total) return { phase: 'Done', round: interval.rounds, remaining: 0, total };
  const round = Math.floor(elapsed / cycle) + 1;
  const within = elapsed % cycle;
  const isWork = within < interval.workSec;
  const remaining = isWork ? interval.workSec - within : cycle - within;
  return { phase: isWork ? 'Work' : 'Rest', round, remaining, total };
}

export default function CardioSession() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [tick, setTick] = useState(0);
  const [weight, setWeight] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [saved, setSaved] = useState(null);
  const [weekTotals, setWeekTotals] = useState(null);
  const [showIntervals, setShowIntervals] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setSession(JSON.parse(raw)); } catch (e) {}
    base44.entities.BodyMeasurement.list('-date', 1).then((m) => { setWeight(m?.[0]?.weight_kg || user?.weight_kg || null); }).catch(() => setWeight(user?.weight_kg || null));
  }, []);

  useEffect(() => {
    if (!session?.runningSince) return;
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, [session?.runningSince]);

  const persist = (s) => { setSession(s); if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); else localStorage.removeItem(STORAGE_KEY); };

  const elapsed = useMemo(() => {
    if (!session) return 0;
    return (session.baseElapsed || 0) + (session.runningSince ? (Date.now() - session.runningSince) / 1000 : 0);
  }, [session, tick]);

  const activity = session ? getActivity(session.activity) : null;
  const liveCalories = useMemo(() => activity ? estimateCalories(session.activity, elapsed, weight, session.metrics?.incline ? Number(session.metrics.incline) : null) : 0, [session, elapsed, weight]);
  const speed = useMemo(() => activity && session.metrics?.distance ? computeSpeed(Number(session.metrics.distance), elapsed) : null, [session, elapsed, activity]);
  const pace = useMemo(() => activity && session.metrics?.distance ? computePace(elapsed, Number(session.metrics.distance)) : null, [session, elapsed, activity]);
  const phase = useMemo(() => intervalPhase(elapsed, session?.interval), [elapsed, session?.interval]);

  const startSession = (act) => {
    persist({ activity: act.id, activityLabel: act.label, runningSince: Date.now(), baseElapsed: 0, metrics: {} });
  };

  const togglePause = () => {
    if (session.runningSince) persist({ ...session, runningSince: null, baseElapsed: elapsed });
    else persist({ ...session, runningSince: Date.now() });
  };

  const setMetric = (k, v) => persist({ ...session, metrics: { ...session.metrics, [k]: v } });
  const applyInterval = (interval) => { persist({ ...session, interval }); setShowIntervals(false); };

  const finish = () => {
    if (session.runningSince) persist({ ...session, runningSince: null, baseElapsed: elapsed });
    setFinishing(true);
  };

  const saveSession = async (finalData) => {
    const duration = Math.round(finalData.duration_seconds ?? elapsed);
    const record = {
      date: new Date().toISOString(),
      activity: session.activity,
      activity_label: session.activityLabel,
      duration_seconds: duration,
      distance_km: finalData.distance ? Number(finalData.distance) : undefined,
      calories: finalData.calories,
      calorie_source: finalData.calSource,
      avg_speed_kmh: speed ?? undefined,
      avg_pace_sec_per_km: pace ?? undefined,
      incline_percent: session.metrics?.incline ? Number(session.metrics.incline) : undefined,
      resistance_level: session.metrics?.resistance ? Number(session.metrics.resistance) : undefined,
      steps: session.metrics?.steps ? Number(session.metrics.steps) : undefined,
      floors: session.metrics?.floors ? Number(session.metrics.floors) : undefined,
      heart_rate_avg: finalData.avgHr ? Number(finalData.avgHr) : undefined,
      notes: finalData.notes || undefined,
      interval_config: session.interval || undefined,
      session_type: 'standalone',
    };
    const created = await base44.entities.CardioSession.create(record);
    createPost('cardio', `${session.activityLabel} · ${formatDuration(duration)}`,
      `${Math.round(record.calories || 0)} kcal${record.distance_km ? ` · ${record.distance_km} km` : ''}`,
      { summary: [{ label: 'Duration', value: formatDuration(duration) }, { label: 'Calories', value: Math.round(record.calories || 0) }, { label: 'Distance', value: record.distance_km ? record.distance_km + 'km' : '—' }] },
    ).catch(() => {});
    refreshMyTrainingStats().catch(() => {});
    persist(null);
    setFinishing(false);
    const all = await base44.entities.CardioSession.list('-date', 200);
    setWeekTotals(aggregateHistory(all || [], 'week'));
    setSaved({ ...record, id: created?.id });
  };

  if (saved) return <SessionSummary saved={saved} weekTotals={weekTotals} onDone={() => navigate('/cardio')} onAnother={() => { setSaved(null); setSession(null); }} />;
  if (!session) return <ActivityPicker onPick={startSession} onBack={() => navigate('/cardio')} />;

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-36 min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/cardio')} className="flex items-center gap-1 text-sm text-muted-foreground min-h-[44px]"><ChevronLeft size={18} /> Cancel</button>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{session.activityLabel}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full luxury-gradient border border-luxury-blue/40 flex items-center justify-center mb-6">
          {session.runningSince ? <Pause size={32} className="text-white" /> : <Play size={32} className="text-white" />}
        </div>
        {phase && phase.phase !== 'Done' && (
          <div className={cn('glass rounded-2xl px-4 py-3 mb-4 w-full max-w-xs text-center', phase.phase === 'Work' ? 'border-luxury-red/40' : 'border-luxury-blue/40')}>
            <p className={cn('text-xs font-bold uppercase tracking-widest', phase.phase === 'Work' ? 'text-luxury-red' : 'text-luxury-blue')}>{phase.phase} · Round {phase.round}/{session.interval.rounds}</p>
            <p className="text-2xl font-bold tabular-nums">{formatDuration(Math.ceil(phase.remaining))}</p>
          </div>
        )}
        {phase && phase.phase === 'Done' && (
          <div className="glass rounded-2xl px-4 py-2 mb-4 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Intervals Complete</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{session.runningSince ? 'In Progress' : 'Paused'}</p>
        <p className="text-6xl font-bold tabular-nums tracking-tight">{formatDuration(elapsed)}</p>

        <div className="grid grid-cols-2 gap-3 w-full mt-8">
          {activity.metrics.includes('distance') && <MetricField label="Distance (km)" value={session.metrics?.distance || ''} onChange={(v) => setMetric('distance', v)} />}
          {activity.metrics.includes('incline') && <MetricField label="Incline (%)" value={session.metrics?.incline || ''} onChange={(v) => setMetric('incline', v)} />}
          {(activity.metrics.includes('resistance') || activity.metrics.includes('level')) && <MetricField label="Level / Resistance" value={session.metrics?.resistance || ''} onChange={(v) => setMetric('resistance', v)} />}
          {activity.metrics.includes('steps') && <MetricField label="Steps" value={session.metrics?.steps || ''} onChange={(v) => setMetric('steps', v)} />}
          {activity.metrics.includes('floors') && <MetricField label="Floors" value={session.metrics?.floors || ''} onChange={(v) => setMetric('floors', v)} />}
        </div>

        <div className="grid grid-cols-2 gap-3 w-full mt-4">
          {activity.metrics.includes('speed') && speed != null && <LiveStat label="Avg Speed" value={`${(Math.round(speed * 10) / 10).toFixed(1)}`} unit="km/h" />}
          {activity.metrics.includes('pace') && pace != null && <LiveStat label="Avg Pace" value={formatPace(pace)} unit="/km" />}
          {activity.metrics.includes('calories') && <LiveStat label="Est. Calories" value={liveCalories} unit="kcal" accent />}
        </div>
      </div>

      <Button variant="outline" className="glass min-h-[48px] text-sm mb-3" onClick={() => setShowIntervals(true)}>
        <Timer size={16} /> {session.interval ? `Intervals: ${session.interval.workSec}s work / ${session.interval.restSec}s rest × ${session.interval.rounds}` : 'Configure HIIT Intervals'}
      </Button>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Button variant="outline" className="glass min-h-[52px] text-base" onClick={togglePause}>
          {session.runningSince ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Resume</>}
        </Button>
        <Button className="bg-luxury-red glow-red min-h-[52px] text-base" onClick={finish}><Square size={16} /> Finish</Button>
      </div>

      {finishing && (
        <FinishSheet duration={elapsed} activity={activity} distance={session.metrics?.distance} speed={speed} pace={pace}
          estimatedCalories={liveCalories} onClose={() => setFinishing(false)} onSave={saveSession} />
      )}
      {showIntervals && (
        <IntervalConfig current={session.interval} onApply={applyInterval} onClear={() => { persist({ ...session, interval: null }); setShowIntervals(false); }} onClose={() => setShowIntervals(false)} />
      )}
    </div>
  );
}

function ActivityPicker({ onPick, onBack }) {
  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-36">
      <div className="flex items-center justify-between mb-5">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground min-h-[44px]"><ChevronLeft size={18} /> Back</button>
        <h1 className="text-lg font-semibold">Start Cardio</h1>
        <span className="w-12" />
      </div>
      <p className="text-xs text-muted-foreground mb-4">Choose an activity. Your session is saved locally so navigation won't lose it.</p>
      <div className="grid grid-cols-2 gap-3">
        {ACTIVITIES.map((a) => {
          const Icon = actIcon(a.id);
          return (
            <button key={a.id} onClick={() => onPick(a)} className="glass rounded-2xl p-4 flex flex-col items-start gap-2 hover:border-luxury-blue/40 transition-all min-h-[88px] text-left">
              <div className="w-10 h-10 rounded-xl bg-luxury-blue/15 text-luxury-blue flex items-center justify-center"><Icon size={20} /></div>
              <span className="text-sm font-medium leading-tight">{a.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MetricField({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="—" className="glass text-lg font-semibold tabular-nums h-12" />
    </div>
  );
}

function LiveStat({ label, value, unit, accent }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('text-xl font-bold tabular-nums', accent && 'text-luxury-red')}>{value}{unit && <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>}</p>
    </div>
  );
}

function FinishSheet({ duration, activity, distance, speed, pace, estimatedCalories, onClose, onSave }) {
  const [calSource, setCalSource] = useState('Estimated');
  const [calOverride, setCalOverride] = useState('');
  const [durationMin, setDurationMin] = useState((duration / 60).toFixed(1));
  const [distanceVal, setDistanceVal] = useState(distance || '');
  const [avgHr, setAvgHr] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const finalCalories = calSource === 'Estimated' ? estimatedCalories : (calOverride ? Number(calOverride) : 0);

  const save = async () => {
    setSaving(true);
    try { await onSave({ distance: distanceVal, duration_seconds: Math.round((Number(durationMin) || 0) * 60), calSource, calories: finalCalories, avgHr, notes }); }
    catch (e) { console.error(e); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong rounded-t-3xl p-5 max-h-[88vh] overflow-y-auto animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Finish Session</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="min-h-[44px] min-w-[44px] p-2"><X size={18} /></Button>
        </div>
        <div className="glass rounded-2xl p-4 mb-4 text-center">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{activity.label}</p>
          <p className="text-4xl font-bold tabular-nums mt-1">{formatDuration(duration)}</p>
          {distance && <p className="text-sm text-muted-foreground mt-1">{formatDistance(Number(distance))} km{speed != null ? ` · ${(Math.round(speed * 10) / 10).toFixed(1)} km/h` : ''}{pace != null ? ` · ${formatPace(pace)}/km` : ''}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Time (min)</Label>
            <Input type="number" inputMode="decimal" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} placeholder={(duration / 60).toFixed(1)} className="glass text-lg font-semibold h-12" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Distance (km)</Label>
            <Input type="number" inputMode="decimal" value={distanceVal} onChange={(e) => setDistanceVal(e.target.value)} placeholder={distance || '0'} className="glass text-lg font-semibold h-12" />
          </div>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Calories</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {['Estimated', 'Recorded', 'Manual'].map((s) => (
            <button key={s} onClick={() => setCalSource(s)} className={cn('text-xs px-2 py-2 rounded-xl border min-h-[40px]', calSource === s ? 'border-luxury-blue bg-luxury-blue/15 text-luxury-blue' : 'border-border glass text-muted-foreground')}>{s}</button>
          ))}
        </div>
        {calSource === 'Estimated' ? (
          <div className="glass rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">MET × weight × time</span>
            <span className="text-lg font-bold tabular-nums text-luxury-red">{estimatedCalories} kcal</span>
          </div>
        ) : (
          <Input type="number" value={calOverride} onChange={(e) => setCalOverride(e.target.value)} placeholder={String(estimatedCalories)} className="glass text-lg font-semibold h-12" />
        )}
        <p className="text-[10px] text-muted-foreground mt-2">{calSource === 'Estimated' ? 'Calculated from MET values, body weight and duration. An estimate, not a measurement.' : calSource === 'Recorded' ? 'From a cardio machine or wearable. More accurate than estimates.' : 'Manually entered by you.'}</p>
        <div className="flex flex-col gap-1.5 mt-3"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Avg Heart Rate (bpm)</Label><Input type="number" value={avgHr} onChange={(e) => setAvgHr(e.target.value)} placeholder="Optional" className="glass" /></div>
        <div className="flex flex-col gap-1.5 mt-3"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Notes</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional session notes" /></div>
        <Button onClick={save} disabled={saving} className="w-full mt-4 bg-luxury-blue glow-blue min-h-[48px]">{saving ? 'Saving…' : <><Check size={18} /> Save Session</>}</Button>
      </div>
    </div>
  );
}

function SessionSummary({ saved, weekTotals, onDone, onAnother }) {
  const zones = useMemo(() => computeTimeInZone([saved], null), [saved]);
  return (
    <div className="max-w-md mx-auto px-4 pt-10 pb-36 min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-luxury-blue/15 text-luxury-blue flex items-center justify-center mb-5 glow-blue"><Check size={40} /></div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Session Complete</p>
        <h1 className="text-2xl font-bold mt-1">{saved.activity_label}</h1>
        <p className="text-5xl font-bold tabular-nums mt-4">{formatDuration(saved.duration_seconds)}</p>
        {saved.distance_km && <p className="text-lg text-muted-foreground mt-1">{formatDistance(saved.distance_km)} km</p>}
        <p className="text-xl font-bold text-luxury-red mt-3">{saved.calories} kcal <span className="text-xs text-muted-foreground font-normal lowercase">{saved.calorie_source}</span></p>
        <p className="text-sm text-foreground/80 mt-4 max-w-xs leading-relaxed">{getCardioFeedback({ durationSeconds: saved.duration_seconds, calories: saved.calories, distanceKm: saved.distance_km, activityLabel: saved.activity_label })?.message}</p>
        {saved.heart_rate_avg && <p className="text-lg font-semibold text-luxury-blue mt-2">{saved.heart_rate_avg} bpm <span className="text-xs text-muted-foreground font-normal">avg HR</span></p>}
        {saved.heart_rate_avg && zones.total > 0 && (
          <div className="glass rounded-2xl p-4 mt-5 w-full max-w-sm text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Time in Zones · estimated</p>
            <div className="space-y-1.5">
              {zones.zones.filter((z) => z.seconds > 0).map((z) => (
                <div key={z.zone} className="flex items-center gap-2">
                  <span className="text-[10px] w-24 text-muted-foreground shrink-0">{z.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden"><div className="h-full bg-luxury-blue" style={{ width: `${zones.total ? Math.round(z.seconds / zones.total * 100) : 0}%` }} /></div>
                  <span className="text-[10px] tabular-nums w-12 text-right shrink-0">{formatDuration(z.seconds)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {weekTotals && (
        <div className="glass rounded-2xl p-5 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">This Week</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-xl font-bold tabular-nums">{formatDuration(weekTotals.totalSeconds)}</p><p className="text-[10px] text-muted-foreground uppercase">Cardio</p></div>
            <div><p className="text-xl font-bold tabular-nums text-luxury-red">{Math.round(weekTotals.totalCalories)}</p><p className="text-[10px] text-muted-foreground uppercase">kcal</p></div>
            <div><p className="text-xl font-bold tabular-nums">{weekTotals.sessions}</p><p className="text-[10px] text-muted-foreground uppercase">Sessions</p></div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="glass min-h-[48px]" onClick={onAnother}>Another</Button>
        <Button className="bg-luxury-blue glow-blue min-h-[48px]" onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}

function IntervalConfig({ current, onApply, onClear, onClose }) {
  const [work, setWork] = useState(current?.workSec?.toString() || '30');
  const [rest, setRest] = useState(current?.restSec?.toString() || '30');
  const [rounds, setRounds] = useState(current?.rounds?.toString() || '8');
  const total = ((Number(work) || 0) + (Number(rest) || 0)) * (Number(rounds) || 0);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong rounded-t-3xl p-5 pb-8 safe-pb animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">HIIT Intervals</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="min-h-[44px] min-w-[44px] p-2"><X size={18} /></Button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Set work/rest intervals. The timer cues each phase and counts rounds.</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="flex flex-col gap-1"><Label className="text-[10px] uppercase">Work (s)</Label><Input type="number" inputMode="numeric" value={work} onChange={(e) => setWork(e.target.value)} className="glass text-lg font-semibold h-12 text-center" /></div>
          <div className="flex flex-col gap-1"><Label className="text-[10px] uppercase">Rest (s)</Label><Input type="number" inputMode="numeric" value={rest} onChange={(e) => setRest(e.target.value)} className="glass text-lg font-semibold h-12 text-center" /></div>
          <div className="flex flex-col gap-1"><Label className="text-[10px] uppercase">Rounds</Label><Input type="number" inputMode="numeric" value={rounds} onChange={(e) => setRounds(e.target.value)} className="glass text-lg font-semibold h-12 text-center" /></div>
        </div>
        <div className="glass rounded-xl p-3 mb-4 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total time</p>
          <p className="text-2xl font-bold tabular-nums">{formatDuration(total)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {current ? <Button variant="outline" className="glass min-h-[48px]" onClick={onClear}>Clear</Button> : <div />}
          <Button className="bg-luxury-blue glow-blue min-h-[48px]" onClick={() => onApply({ workSec: Number(work) || 30, restSec: Number(rest) || 30, rounds: Number(rounds) || 8 })}>Apply Intervals</Button>
        </div>
      </div>
    </div>
  );
}