import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, EmptyState } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Activity, Plus, ChevronLeft, Flame, Clock, Route, TrendingUp, History, Play } from 'lucide-react';
import { aggregateHistory, formatDuration, formatDistance, ACTIVITIES } from '@/lib/cardioAnalytics';
import PullToRefresh from '@/components/PullToRefresh';

export default function Cardio() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
      const all = await base44.entities.CardioSession.list('-date', 200);
      setSessions(all || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadAll(); }, []);

  const week = useMemo(() => aggregateHistory(sessions, 'week'), [sessions]);
  const recent = useMemo(() => (week.inRange || []).slice(0, 5), [week]);

  return (
    <PullToRefresh onRefresh={loadAll}>
      <div className="max-w-md mx-auto px-4 pt-4 pb-36">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => navigate('/train')} className="flex items-center gap-1 text-sm text-muted-foreground min-h-[44px]"><ChevronLeft size={18} /> Train</button>
          <h1 className="text-2xl font-bold tracking-tight">Cardio</h1>
          <Button size="sm" className="bg-luxury-blue glow-blue min-h-[44px]" onClick={() => navigate('/cardio/history')}><History size={16} /> History</Button>
        </div>

        {/* Start Session CTA */}
        <button onClick={() => navigate('/cardio/session')} className="w-full glass rounded-2xl p-5 flex items-center gap-4 hover:border-primary/40 transition-all min-h-[80px] text-left mb-5">
          <div className="w-14 h-14 rounded-2xl bg-luxury-blue/15 text-luxury-blue flex items-center justify-center shrink-0"><Play size={26} /></div>
          <div className="flex-1">
            <p className="text-base font-semibold">Start Cardio Session</p>
            <p className="text-xs text-muted-foreground mt-0.5">Live timer, HIIT intervals, calorie estimates</p>
          </div>
          <Plus size={20} className="text-muted-foreground shrink-0" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>
        ) : !week.sessions ? (
          <EmptyState icon={Activity} title="No cardio yet" description="Start a session to track time, distance, and calories. Your history and analytics will appear here." />
        ) : (
          <>
            {/* This Week Summary */}
            <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><TrendingUp size={15} className="text-luxury-blue" /> This Week</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <Card><SummaryStat icon={Activity} label="Sessions" value={week.sessions} /></Card>
              <Card><SummaryStat icon={Clock} label="Time" value={formatDuration(week.totalSeconds)} /></Card>
              <Card><SummaryStat icon={Route} label="Distance" value={`${formatDistance(week.totalDistance)} km`} /></Card>
              <Card><SummaryStat icon={Flame} label="Calories" value={Math.round(week.totalCalories)} unit="kcal" accent /></Card>
            </div>

            {/* Activity Breakdown */}
            {week.breakdown.length > 0 && (
              <>
                <p className="text-sm font-semibold mb-2">Activity Breakdown</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-5">
                  {week.breakdown.slice(0, 4).map((b) => {
                    const pct = week.totalSeconds ? Math.round((b.seconds / week.totalSeconds) * 100) : 0;
                    return (
                      <Card key={b.activity} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{b.label}</p>
                            <p className="text-[11px] text-muted-foreground">{b.sessions} sessions · {formatDuration(b.seconds)}</p>
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
              </>
            )}

            {/* Recent Sessions */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Recent Sessions</p>
              <button onClick={() => navigate('/cardio/history')} className="text-xs text-luxury-blue font-medium min-h-[36px]">View all →</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {recent.map((s) => (
                <Card key={s.id} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{s.activity_label}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(s.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })} · {formatDuration(s.duration_seconds)}{s.distance_km ? ` · ${formatDistance(s.distance_km)} km` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-luxury-red tabular-nums">{s.calories || 0}<span className="text-[10px] text-muted-foreground font-normal"> kcal</span></p>
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

function SummaryStat({ icon: Icon, label, value, unit, accent }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 mb-1"><Icon size={13} className="text-muted-foreground" /><span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span></div>
      <span className={`text-2xl font-bold tabular-nums ${accent ? 'text-luxury-red' : ''}`}>{value}{unit && <span className="text-sm text-muted-foreground ml-0.5">{unit}</span>}</span>
    </div>
  );
}