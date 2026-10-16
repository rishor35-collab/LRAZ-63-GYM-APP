import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, Stat, EmptyState } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowLeft, Dumbbell, Flame, Activity, Apple, Heart, Trophy, TrendingUp, ListChecks } from 'lucide-react';
import { estimate1RM } from '@/lib/fitnessScience';

const monthStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = (d) => d.toLocaleDateString('en', { month: 'long', year: 'numeric' });
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

export default function MonthlyReport() {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState(new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const prefix = monthStr(cursor);
    try {
      const [workouts, cardio, nutrition, recovery, meas, habits, logs, sets] = await Promise.all([
        base44.entities.WorkoutSession.list('-date', 500),
        base44.entities.CardioSession.list('-date', 500),
        base44.entities.NutritionLog.list('-date', 1000),
        base44.entities.RecoveryRecord.list('-date', 200),
        base44.entities.BodyMeasurement.list('-date', 200),
        base44.entities.Habit.list('-created_date', 100),
        base44.entities.HabitLog.list('-date', 400),
        base44.entities.WorkoutSet.list('-created_date', 2000),
      ]);
      const inMonth = (dateStr) => (dateStr || '').startsWith(prefix);

      const mWorkouts = (workouts || []).filter((w) => w.status === 'completed' && inMonth(w.date));
      const mCardio = (cardio || []).filter((c) => inMonth(c.date));
      const mNutrition = (nutrition || []).filter((n) => inMonth(n.date));
      const mRecovery = (recovery || []).filter((r) => inMonth(r.date));
      const mMeas = (meas || []).filter((m) => inMonth(m.date)).sort((a, b) => new Date(a.date) - new Date(b.date));
      const mLogs = (logs || []).filter((l) => inMonth(l.date));

      const totalVolume = mWorkouts.reduce((a, w) => a + (w.total_volume_kg || 0), 0);
      const prCount = mWorkouts.reduce((a, w) => a + (w.pr_count || 0), 0);
      const cardioSeconds = mCardio.reduce((a, c) => a + (c.duration_seconds || 0), 0);
      const cardioCals = mCardio.reduce((a, c) => a + (c.calories || 0), 0);

      // nutrition avg per day
      const byDay = {};
      mNutrition.forEach((n) => { const d = (n.date || '').slice(0, 10); if (!byDay[d]) byDay[d] = { cals: 0, protein: 0 }; byDay[d].cals += n.calories || 0; byDay[d].protein += n.protein_g || 0; });
      const dayCount = Object.keys(byDay).length || 1;
      const avgCals = Object.values(byDay).reduce((a, d) => a + d.cals, 0) / dayCount;
      const avgProtein = Object.values(byDay).reduce((a, d) => a + d.protein, 0) / dayCount;

      const avgReadiness = mRecovery.length ? mRecovery.reduce((a, r) => a + (r.readiness_score || 0), 0) / mRecovery.length : null;
      const weightChange = mMeas.length > 1 ? (mMeas[mMeas.length - 1].weight_kg - mMeas[0].weight_kg) : null;

      // habit completion
      const habitCount = (habits || []).length;
      const dim = daysInMonth(cursor.getFullYear(), cursor.getMonth());
      const habitRate = habitCount ? Math.min(100, Math.round((mLogs.length / (habitCount * dim)) * 100)) : null;

      // top exercises by volume this month (from sets)
      const setMap = {};
      (sets || []).forEach((s) => {
        if (!inMonth(s.created_date)) return;
        const vol = (s.weight_kg || 0) * (s.reps || 0);
        if (!setMap[s.exercise_name]) setMap[s.exercise_name] = { vol: 0, topE1rm: 0 };
        setMap[s.exercise_name].vol += vol;
        setMap[s.exercise_name].topE1rm = Math.max(setMap[s.exercise_name].topE1rm, estimate1RM(s.weight_kg, s.reps));
      });
      const topExercises = Object.entries(setMap).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.vol - a.vol).slice(0, 5);

      setData({ mWorkouts: mWorkouts.length, totalVolume: Math.round(totalVolume), prCount, cardioCount: mCardio.length, cardioMinutes: Math.round(cardioSeconds / 60), cardioCals: Math.round(cardioCals), avgCals: Math.round(avgCals), avgProtein: Math.round(avgProtein), avgReadiness: avgReadiness ? Math.round(avgReadiness) : null, weightChange, habitRate, topExercises });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [cursor]);

  const shift = (n) => { const d = new Date(cursor); d.setMonth(d.getMonth() + n); setCursor(d); };

  return (
    <div className="min-h-screen safe-pt px-4 pb-36 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"><ArrowLeft size={22} /></button>
        <h1 className="font-semibold text-lg">Monthly Report</h1>
        <div className="w-11" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => shift(-1)} className="min-h-[44px]"><ChevronLeft size={18} /></Button>
        <span className="font-semibold">{monthLabel(cursor)}</span>
        <Button variant="ghost" size="sm" onClick={() => shift(1)} className="min-h-[44px]"><ChevronRight size={18} /></Button>
      </div>

      {loading ? <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div> : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card><Stat label="Workouts" value={data.mWorkouts} accent="blue" /></Card>
            <Card><Stat label="Total Volume" value={data.totalVolume} unit="kg" accent="red" /></Card>
            <Card><Stat label="PRs Hit" value={data.prCount} /></Card>
            <Card><Stat label="Cardio Sessions" value={data.cardioCount} /></Card>
            <Card><Stat label="Cardio Time" value={data.cardioMinutes} unit="min" accent="blue" /></Card>
            <Card><Stat label="Cardio Calories" value={data.cardioCals} unit="kcal" accent="red" /></Card>
          </div>

          <Card>
            <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Apple size={15} className="text-luxury-blue" /> Nutrition Averages</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Stat label="Avg Daily Cals" value={data.avgCals} unit="kcal" accent="red" />
              <Stat label="Avg Daily Protein" value={data.avgProtein} unit="g" accent="blue" />
            </div>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><Heart size={12} /> Avg Readiness</p>
              <p className="text-2xl font-bold tabular-nums">{data.avgReadiness ?? '—'}</p>
            </Card>
            <Card>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><TrendingUp size={12} /> Weight Δ</p>
              <p className="text-2xl font-bold tabular-nums">{data.weightChange != null ? `${data.weightChange > 0 ? '+' : ''}${data.weightChange.toFixed(1)}` : '—'}<span className="text-sm text-muted-foreground ml-1">kg</span></p>
            </Card>
          </div>

          {data.habitRate != null && (
            <Card>
              <p className="text-sm font-semibold mb-1 flex items-center gap-2"><ListChecks size={15} className="text-luxury-blue" /> Habit Consistency</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 rounded-full bg-muted/30 overflow-hidden"><div className="h-full bg-luxury-blue" style={{ width: `${data.habitRate}%` }} /></div>
                <span className="text-sm font-bold tabular-nums">{data.habitRate}%</span>
              </div>
            </Card>
          )}

          {data.topExercises.length > 0 && (
            <Card>
              <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Dumbbell size={15} className="text-luxury-blue" /> Top Exercises (by volume)</p>
              <div className="space-y-2">
                {data.topExercises.map((e, i) => (
                  <div key={e.name} className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <span className="text-sm font-medium flex-1 truncate">{e.name}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">{Math.round(e.vol)}kg</span>
                    <span className="text-xs font-bold tabular-nums text-gradient-blue w-12 text-right">{Math.round(e.topE1rm)}kg</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {data.mWorkouts === 0 && data.cardioCount === 0 && (
            <EmptyState icon={Activity} title="No activity this month" description="Log workouts or cardio to see your monthly performance report." />
          )}

          <p className="text-[10px] text-muted-foreground text-center">All values are computed deterministically from your logged data. Estimates are labeled, never presented as measurements.</p>
        </div>
      )}
    </div>
  );
}