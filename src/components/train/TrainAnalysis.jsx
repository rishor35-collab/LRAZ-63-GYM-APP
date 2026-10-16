import React, { useEffect, useMemo, useState } from 'react';
import { Card, Stat, EmptyState } from '@/components/ui/fitness';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Activity, TrendingUp, Dumbbell, Trophy, Clock, Flame, Calendar, Zap } from 'lucide-react';
import { loadWorkoutData, groupSetsBySession, muscleGroupVolume, weeklyVolumeTrend, topExercisesByVolume, workoutFrequency, trainingConsistency, prProgression, durationTrend, cardioVsTraining } from '@/lib/workoutData';
import { getAllExercises } from '@/lib/exerciseDatabase';

const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 };

export default function TrainAnalysis() {
  const [data, setData] = useState(null);
  const [exMap, setExMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [d, exercises] = await Promise.all([loadWorkoutData(), getAllExercises()]);
        if (!alive) return;
        setData(d);
        const map = {};
        exercises.forEach((e) => { map[e.name] = e; });
        setExMap(map);
      } catch (e) { console.error(e); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const setsBySession = useMemo(() => (data ? groupSetsBySession(data.sets) : {}), [data]);

  const analytics = useMemo(() => {
    if (!data) return null;
    const allCompletedSets = data.sets.filter((s) => s.completed);
    const totalVolume = allCompletedSets.reduce((a, s) => a + (Number(s.weight_kg) || 0) * (Number(s.reps) || 0), 0);
    const totalSets = allCompletedSets.length;
    const totalReps = allCompletedSets.reduce((a, s) => a + (Number(s.reps) || 0), 0);
    const consistency = trainingConsistency(data.sessions);
    const frequency = workoutFrequency(data.sessions);
    const weekly = weeklyVolumeTrend(data.sessions, setsBySession);
    const muscleVol = muscleGroupVolume(allCompletedSets, exMap);
    const topEx = topExercisesByVolume(allCompletedSets);
    const prs = prProgression(data.sets, setsBySession);
    const durations = durationTrend(data.sessions);
    const cardioTrain = cardioVsTraining(data.sessions, data.cardio);
    const totalDuration = data.sessions.reduce((a, s) => a + (s.duration_minutes || 0), 0);
    const avgDuration = data.sessions.length ? Math.round(totalDuration / data.sessions.length) : 0;
    return { totalVolume: Math.round(totalVolume), totalSets, totalReps, consistency, frequency, weekly, muscleVol, topEx, prs, durations, cardioTrain, totalDuration, avgDuration, sessionCount: data.sessions.length, prCount: prs.length };
  }, [data, setsBySession, exMap]);

  if (loading) return <div className="py-20 text-center text-muted-foreground text-sm">Loading analysis…</div>;
  if (!analytics || analytics.sessionCount === 0) {
    return <EmptyState icon={Activity} title="No data to analyze yet" description="Complete a few workouts and your training analysis will appear here with volume, frequency, PRs, and trends." />;
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><Stat label="Total Volume" value={analytics.totalVolume} unit="kg" accent="blue" /></Card>
        <Card><Stat label="Workouts" value={analytics.sessionCount} /></Card>
        <Card><Stat label="Total Sets" value={analytics.totalSets} /></Card>
        <Card><Stat label="Total Reps" value={analytics.totalReps} /></Card>
        <Card><Stat label="PRs" value={analytics.prCount} accent="gold" /></Card>
        <Card><Stat label="Current Streak" value={analytics.consistency.streak} unit="days" accent="red" /></Card>
        <Card><Stat label="Avg Duration" value={analytics.avgDuration} unit="min" /></Card>
        <Card><Stat label="Days Trained" value={analytics.consistency.totalDays} /></Card>
      </div>

      {/* Weekly volume trend */}
      {analytics.weekly.some((w) => w.volume > 0) && (
        <Card>
          <p className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp size={15} className="text-luxury-blue" /> Weekly Volume (12 weeks)</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.weekly}>
                <defs><linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--luxury-blue))" stopOpacity={0.4} /><stop offset="100%" stopColor="hsl(var(--luxury-blue))" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval={1} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area isAnimationActive={false} type="monotone" dataKey="volume" stroke="hsl(var(--luxury-blue))" strokeWidth={2} fill="url(#volGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Workout frequency */}
      {analytics.frequency.some((w) => w.sessions > 0) && (
        <Card>
          <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Calendar size={15} className="text-luxury-blue" /> Workout Frequency (8 weeks)</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.frequency}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar isAnimationActive={false} dataKey="sessions" fill="hsl(var(--luxury-blue))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Muscle group volume */}
      {analytics.muscleVol.length > 0 && (
        <Card>
          <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Dumbbell size={15} className="text-luxury-blue" /> Muscle Group Volume</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.muscleVol} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis type="category" dataKey="group" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={70} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar isAnimationActive={false} dataKey="volume" fill="hsl(var(--luxury-red))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Top exercises */}
      {analytics.topEx.length > 0 && (
        <Card>
          <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Zap size={15} className="text-luxury-blue" /> Top Exercises by Volume</p>
          <div className="space-y-2">
            {analytics.topEx.map((e, i) => {
              const max = analytics.topEx[0].volume || 1;
              return (
                <div key={e.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="truncate">{i + 1}. {e.name}</span>
                    <span className="text-muted-foreground tabular-nums shrink-0 ml-2">{e.volume}kg · {e.sets} sets</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                    <div className="h-full bg-luxury-blue rounded-full" style={{ width: `${(e.volume / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* PR progression */}
      {analytics.prs.length > 0 && (
        <Card>
          <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Trophy size={15} className="text-luxury-gold" /> PR History ({analytics.prs.length})</p>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {analytics.prs.slice().reverse().slice(0, 20).map((pr, i) => (
              <div key={i} className="flex items-center gap-2 text-xs py-1.5 border-b border-border/30 last:border-0">
                <Trophy size={12} className="text-luxury-gold shrink-0" />
                <span className="font-medium truncate flex-1" dir="auto">{pr.exercise}</span>
                <span className="tabular-nums">{pr.weight}kg × {pr.reps}</span>
                <span className="text-muted-foreground tabular-nums shrink-0">{pr.date}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Duration trend */}
      {analytics.durations.length > 1 && (
        <Card>
          <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Clock size={15} className="text-luxury-blue" /> Workout Duration Trend</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.durations}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line isAnimationActive={false} type="monotone" dataKey="duration" stroke="hsl(var(--luxury-gold))" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Cardio vs Training */}
      {analytics.cardioTrain.some((w) => w.training > 0 || w.cardio > 0) && (
        <Card>
          <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Flame size={15} className="text-luxury-red" /> Cardio vs Training (min/week)</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.cardioTrain}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar isAnimationActive={false} dataKey="training" fill="hsl(var(--luxury-blue))" radius={[4, 4, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="cardio" fill="hsl(var(--luxury-red))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}