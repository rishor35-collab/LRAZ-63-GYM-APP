import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Stat, EmptyState } from '@/components/ui/fitness';
import { ArrowLeft, Dumbbell, TrendingUp, Trophy, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import useExerciseHistoryData from '@/hooks/useExerciseHistoryData';

export default function ExerciseHistory() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const name = params.get('name') || '';
  const data = useExerciseHistoryData(name);
  const { points, loading } = data;
  const summary = { totalSets: data.totalSets ?? '—', totalVolume: data.shownVolume, bestE1rm: data.bestE1rm, prCount: data.prCount };
  const chartData = useMemo(() => {
    const byDate = {};
    points.forEach((point) => { byDate[point.date] = Math.max(byDate[point.date] || 0, point.e1rm); });
    return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, e1rm]) => ({ date: date.slice(5), e1rm }));
  }, [points]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-7 h-7 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen safe-pt px-4 pb-36 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"><ArrowLeft size={22} /></button>
        <div>
          <h1 className="font-semibold text-lg leading-tight">{name}</h1>
          <p className="text-[11px] text-muted-foreground">Exercise History</p>
        </div>
      </div>

      {data.error && <p role="alert" className="mb-3 text-sm text-destructive">History could not fully load. <button onClick={() => data.retry()} className="min-h-11 underline">Retry</button></p>}
      {!points.length ? (
        <EmptyState icon={Dumbbell} title="No history yet" description={`You haven't logged any sets of ${name}. Start a workout and add this exercise to build its history.`} />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Card><Stat label="Best e1RM" value={summary.bestE1rm} unit="kg" accent="blue" /></Card>
            <Card><Stat label="Shown Volume" value={summary.totalVolume} unit="kg" accent="red" /></Card>
            <Card><Stat label="Sets Logged" value={summary.totalSets} /></Card>
            <Card><Stat label="PRs" value={summary.prCount} /></Card>
          </div>

          {chartData.length > 1 && (
            <Card className="mb-4">
              <p className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp size={15} className="text-luxury-blue" /> Estimated 1RM Trend</p>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Line isAnimationActive={false} type="monotone" dataKey="e1rm" stroke="hsl(var(--luxury-blue))" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-1">Recent Sets</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {points.map((p, i) => (
              <Card key={i} className="flex items-center gap-3 py-2.5">
                <div className="w-9 h-9 rounded-lg glass flex items-center justify-center shrink-0"><Activity size={15} className="text-luxury-blue" /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{p.weight}kg × {p.reps} reps</p>
                  <p className="text-[11px] text-muted-foreground">{p.date} · {p.volume}kg volume</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gradient-blue">{p.e1rm}kg</p>
                  {p.isPr && <p className="text-[10px] text-luxury-gold flex items-center gap-0.5 justify-end"><Trophy size={10} /> PR</p>}
                </div>
              </Card>
            ))}
          </div>
          {data.hasMore && <Button variant="outline" className="mt-4 w-full" disabled={data.loadingMore} onClick={() => data.loadMore()}>{data.loadingMore ? 'Loading…' : 'Load earlier sets'}</Button>}
        </>
      )}
    </div>
  );
}