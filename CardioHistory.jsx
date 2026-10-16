import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, Pill, EmptyState } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Activity, Plus, ChevronLeft, Flame, Clock, Route, TrendingUp } from 'lucide-react';
import { aggregateHistory, formatDuration, formatDistance, formatPace, ACTIVITIES } from '@/lib/cardioAnalytics';
import PullToRefresh from '@/components/PullToRefresh';

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: '3m', label: '3M' },
  { id: '6m', label: '6M' },
  { id: '1y', label: '1Y' },
  { id: 'all', label: 'All' },
];

export default function CardioHistory() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [range, setRange] = useState('month');
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
      const all = await base44.entities.CardioSession.list('-date', 500);
      setSessions(all || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadAll(); }, []);

  const agg = useMemo(() => aggregateHistory(sessions, range), [sessions, range]);
  const calLabel = agg.recordedCalories > 0 && agg.estimatedCalories > 0 ? 'est/recorded' : agg.estimatedCalories > 0 ? 'estimated' : 'recorded';

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>;

  return (
    <PullToRefresh onRefresh={loadAll}>
      <div className="max-w-md mx-auto px-4 pt-4 pb-36">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => navigate('/cardio')} className="flex items-center gap-1 text-sm text-muted-foreground min-h-[44px]"><ChevronLeft size={18} /> Cardio</button>
          <h1 className="text-2xl font-bold tracking-tight">Cardio History</h1>
          <Button size="sm" className="bg-luxury-blue glow-blue min-h-[44px]" onClick={() => navigate('/cardio/session')}><Plus size={16} /> Start</Button>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 md:flex-wrap">
          {RANGES.map((r) => <Pill key={r.id} active={range === r.id} onClick={() => setRange(r.id)}>{r.label}</Pill>)}
        </div>

        {!agg.sessions ? (
          <EmptyState icon={Activity} title="No cardio yet" description="Start a cardio session to see your history and analytics here." action={<Button className="bg-luxury-blue glow-blue mt-4 min-h-[44px]" onClick={() => navigate('/cardio/session')}><Plus size={16} /> Start Cardio</Button>} />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Card><SummaryStat icon={Activity} label="Sessions" value={agg.sessions} /></Card>
              <Card><SummaryStat icon={Clock} label="Total Time" value={formatDuration(agg.totalSeconds)} /></Card>
              <Card><SummaryStat icon={Route} label="Distance" value={`${formatDistance(agg.totalDistance)} km`} /></Card>
              <Card><SummaryStat icon={Flame} label="Calories" value={Math.round(agg.totalCalories)} unit="kcal" accent sub={calLabel} /></Card>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Card><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Duration</p><p className="text-lg font-bold tabular-nums">{formatDuration(agg.avgDuration)}</p></Card>
              <Card><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Distance</p><p className="text-lg font-bold tabular-nums">{formatDistance(agg.avgDistance)}<span className="text-xs text-muted-foreground"> km</span></p></Card>
            </div>

            <p className="text-sm font-semibold mb-2">Activity Breakdown</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {agg.breakdown.map((b) => {
                const pct = agg.totalSeconds ? Math.round((b.seconds / agg.totalSeconds) * 100) : 0;
                return (
                  <Card key={b.activity} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{b.label}</p>
                        <p className="text-[11px] text-muted-foreground">{b.sessions} sessions · {formatDuration(b.seconds)}{b.distance > 0 ? ` · ${formatDistance(b.distance)} km` : ''}</p>
                      </div>
                      <span className="text-xs font-bold text-luxury-blue tabular-nums">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted/30 mt-2 overflow-hidden">
                      <div className="h-full bg-luxury-blue transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </Card>
                );
              })}
            </div>

            <p className="text-sm font-semibold mb-2">Recent Sessions</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {agg.inRange.slice(0, 20).map((s) => (
                <Card key={s.id} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{s.activity_label}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(s.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })} · {formatDuration(s.duration_seconds)}{s.distance_km ? ` · ${formatDistance(s.distance_km)} km` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-luxury-red tabular-nums">{s.calories || 0}<span className="text-[10px] text-muted-foreground font-normal"> kcal</span></p>
                    <p className="text-[9px] text-muted-foreground uppercase">{(s.calorie_source || 'estimated').slice(0, 4)}</p>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </PullToRefresh>
  );
}

function SummaryStat({ icon: Icon, label, value, unit, accent, sub }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 mb-1"><Icon size={13} className="text-muted-foreground" /><span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span></div>
      <span className={`text-2xl font-bold tabular-nums ${accent ? 'text-luxury-red' : ''}`}>{value}{unit && <span className="text-sm text-muted-foreground ml-0.5">{unit}</span>}</span>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </div>
  );
}