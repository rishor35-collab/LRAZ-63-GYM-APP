import React, { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardioElapsed, cardioIntervalPhase } from '@/lib/cardioSessionClock';
import { getActivity, estimateCalories, computeSpeed, computePace, formatDuration, formatPace } from '@/lib/cardioAnalytics';

export default function CardioLivePanel({ session, weight, children }) {
  const [, update] = useState(0);
  useEffect(() => {
    if (!session.runningSince) return;
    const tick = () => { if (!document.hidden) update((value) => value + 1); };
    const timer = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [session.runningSince]);
  const elapsed = cardioElapsed(session), activity = getActivity(session.activity);
  const phase = cardioIntervalPhase(elapsed, session.interval);
  const distance = Number(session.metrics?.distance);
  const speed = distance ? computeSpeed(distance, elapsed) : null;
  const pace = distance ? computePace(elapsed, distance) : null;
  const stats = [
    activity.metrics.includes('speed') && speed != null && ['Avg Speed', speed.toFixed(1), 'km/h'],
    activity.metrics.includes('pace') && pace != null && ['Avg Pace', formatPace(pace), '/km'],
    activity.metrics.includes('calories') && ['Est. Calories', estimateCalories(session.activity, elapsed, weight, session.metrics?.incline ? Number(session.metrics.incline) : null), 'kcal'],
  ].filter(Boolean);
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-20 h-20 rounded-full luxury-gradient border border-luxury-blue/40 flex items-center justify-center mb-6">{session.runningSince ? <Pause size={32} className="text-foreground" /> : <Play size={32} className="text-foreground" />}</div>
      {phase && phase.phase !== 'Done' && <div className={cn('glass rounded-2xl px-4 py-3 mb-4 w-full max-w-xs text-center', phase.phase === 'Work' ? 'border-luxury-red/40' : 'border-luxury-blue/40')}>
        <p className={cn('text-xs font-bold uppercase tracking-widest', phase.phase === 'Work' ? 'text-luxury-red' : 'text-luxury-blue')}>{phase.phase} · Round {phase.round}/{session.interval.rounds}</p>
        <p className="text-2xl font-bold tabular-nums">{formatDuration(Math.ceil(phase.remaining))}</p>
      </div>}
      {phase?.phase === 'Done' && <div className="glass rounded-2xl px-4 py-2 mb-4 text-center"><p className="text-xs font-bold uppercase tracking-widest text-luxury-teal">Intervals Complete</p></div>}
      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{session.runningSince ? 'In Progress' : 'Paused'}</p>
      <p className="text-6xl font-bold tabular-nums tracking-tight">{formatDuration(elapsed)}</p>
      {children}
      <div className="grid grid-cols-2 gap-3 w-full mt-4">{stats.map(([label, value, unit]) => <div key={label} className="glass rounded-xl p-3 text-center">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={cn('text-xl font-bold tabular-nums', label === 'Est. Calories' && 'text-luxury-red')}>{value}<span className="text-xs text-muted-foreground ml-0.5">{unit}</span></p>
      </div>)}</div>
    </div>
  );
}