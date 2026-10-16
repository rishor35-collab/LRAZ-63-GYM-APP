import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, Pill } from '@/components/ui/fitness';
import { Calendar, TrendingUp, Sparkles, ArrowLeft, Repeat, Flame, Bookmark, Check, Trash2, AlertTriangle, X, Pencil } from 'lucide-react';
import NutritionCalendar from '@/components/nutrition/NutritionCalendar';
import EditNutritionLogSheet from '@/components/nutrition/EditNutritionLogSheet';
import { cn, localDateStr, localDayOffset } from '@/lib/utils';
import PullToRefresh from '@/components/PullToRefresh';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts';

const TODAY = localDateStr();
const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout'];

export default function NutritionHistory() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeleteRecent, setConfirmDeleteRecent] = useState(null);
  const [editingLog, setEditingLog] = useState(null);

  const onLogSaved = () => { setEditingLog(null); loadAll(); };

  const deleteLog = async (id) => {
    setLogs((l) => l.filter((x) => x.id !== id));
    setConfirmDelete(null);
    try { await base44.entities.NutritionLog.delete(id); } catch (e) { loadAll(); console.error(e); }
  };

  const deleteRecentFood = async (f) => {
    setConfirmDeleteRecent(null);
    setLogs((l) => l.filter((x) => x.food_name !== f.food_name));
    try { await base44.entities.NutritionLog.deleteMany({ food_name: f.food_name }); } catch (e) { loadAll(); console.error(e); }
  };

  useEffect(() => { loadAll(); }, []);
  const loadAll = async () => {
    try {
      const [g, l, s] = await Promise.all([
        base44.entities.Goal.filter({ status: 'active' }, '-created_date', 1),
        base44.entities.NutritionLog.list('-date', 500),
        base44.entities.WorkoutSession.list('-date', 60),
      ]);
      setGoal(g[0] || null);
      setLogs(l || []);
      setSessions(s || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const byDate = useMemo(() => {
    const map = {};
    for (const l of logs) {
      if (!l.date) continue;
      if (!map[l.date]) map[l.date] = { date: l.date, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, meals: [] };
      map[l.date].calories += l.calories || 0;
      map[l.date].protein += l.protein_g || 0;
      map[l.date].carbs += l.carbs_g || 0;
      map[l.date].fat += l.fat_g || 0;
      map[l.date].fiber += l.fiber_g || 0;
      map[l.date].meals.push(l);
    }
    return map;
  }, [logs]);

  const trainingDays = useMemo(() => new Set(sessions.filter((s) => s.status === 'completed').map((s) => (s.date || '').slice(0, 10))), [sessions]);

  const periodDays = useMemo(() => {
    const n = period === 'week' ? 7 : 30;
    const days = [];
    for (let i = n - 1; i >= 0; i--) days.push(localDayOffset(-i));
    return days;
  }, [period]);

  const summary = useMemo(() => {
    const entries = periodDays.map((d) => byDate[d]).filter(Boolean);
    if (!entries.length) return { daysLogged: 0 };
    const avg = (k) => Math.round(entries.reduce((a, e) => a + e[k], 0) / entries.length);
    const calTarget = goal?.calorie_target || 0;
    const proTarget = goal?.protein_target_g || 0;
    const calHit = calTarget ? entries.filter((e) => e.calories >= calTarget * 0.85 && e.calories <= calTarget * 1.15).length : 0;
    const proHit = proTarget ? entries.filter((e) => e.protein >= proTarget * 0.85).length : 0;
    return {
      daysLogged: entries.length, avgCalories: avg('calories'), avgProtein: avg('protein'),
      avgCarbs: avg('carbs'), avgFat: avg('fat'),
      calAdherence: calTarget ? Math.round((calHit / entries.length) * 100) : null,
      proteinAdherence: proTarget ? Math.round((proHit / entries.length) * 100) : null,
    };
  }, [periodDays, byDate, goal]);

  const chartData = useMemo(() => periodDays.map((d) => {
    const e = byDate[d];
    return { date: d.slice(5), calories: e ? Math.round(e.calories) : 0, protein: e ? Math.round(e.protein) : 0 };
  }), [periodDays, byDate]);

  const insights = useMemo(() => {
    const out = [];
    const last7 = periodDays.slice(-7).map((d) => byDate[d]).filter(Boolean);
    const prev7 = [];
    for (let i = 7; i < 14; i++) { const d = localDayOffset(-i); if (byDate[d]) prev7.push(byDate[d]); }
    if (last7.length && prev7.length) {
      const a = last7.reduce((s, e) => s + e.protein, 0) / last7.length;
      const b = prev7.reduce((s, e) => s + e.protein, 0) / prev7.length;
      const diff = Math.round(a - b);
      if (Math.abs(diff) >= 5) out.push({ icon: Flame, title: 'Protein trend', body: `Average protein ${diff > 0 ? 'increased' : 'decreased'} from ${Math.round(b)}g to ${Math.round(a)}g vs last week.` });
    }
    if (summary.proteinAdherence != null) {
      out.push({ icon: Sparkles, title: 'Protein adherence', body: `You hit your protein target on ${Math.round((summary.proteinAdherence / 100) * summary.daysLogged)} of ${summary.daysLogged} logged days (${summary.proteinAdherence}%).` });
    }
    const tCals = [], rCals = [];
    for (const d of periodDays) { const e = byDate[d]; if (!e) continue; (trainingDays.has(d) ? tCals : rCals).push(e.calories); }
    if (tCals.length >= 2 && rCals.length >= 2) {
      const tAvg = Math.round(tCals.reduce((a, b) => a + b, 0) / tCals.length);
      const rAvg = Math.round(rCals.reduce((a, b) => a + b, 0) / rCals.length);
      const diff = tAvg - rAvg;
      if (Math.abs(diff) >= 50) out.push({ icon: TrendingUp, title: 'Training vs rest days', body: `You eat ${diff > 0 ? '+' : ''}${diff} kcal on training days vs rest days (avg ${tAvg} vs ${rAvg}).` });
    }
    const ranked = periodDays.map((d) => byDate[d]).filter(Boolean).sort((a, b) => b.calories - a.calories);
    if (ranked.length >= 2) out.push({ icon: Calendar, title: 'Daily range', body: `Highest day ${Math.round(ranked[0].calories)} kcal vs lowest ${Math.round(ranked[ranked.length - 1].calories)} kcal.` });
    return out.slice(0, 4);
  }, [periodDays, byDate, summary, trainingDays]);

  const recentFoods = useMemo(() => {
    const cutoff = localDayOffset(-30);
    const map = {};
    for (const l of logs) {
      if (!l.food_name || l.food_name === 'Water' || (l.date || '') < cutoff) continue;
      const cur = map[l.food_name] || { food_name: l.food_name, _count: 0, last: l };
      cur._count += 1;
      if ((l.logged_at || '') > (cur.last.logged_at || '')) cur.last = l;
      map[l.food_name] = cur;
    }
    return Object.values(map).sort((a, b) => b._count - a._count).slice(0, 30).map((x) => ({ ...x.last, _count: x._count }));
  }, [logs]);

  const addAgain = async (log) => {
    const entry = {
      date: TODAY, meal: log.meal || 'Snack', food_name: log.food_name, quantity: log.quantity, unit: log.unit,
      calories: log.calories, protein_g: log.protein_g, carbs_g: log.carbs_g, fat_g: log.fat_g, fiber_g: log.fiber_g,
      source: log.source || 'Database', logged_at: new Date().toISOString(),
    };
    try { await base44.entities.NutritionLog.create(entry); loadAll(); } catch (e) { console.error(e); }
  };

  const [savedIds, setSavedIds] = useState(new Set());
  const saveAsMeal = async (log) => {
    try {
      await base44.entities.SavedMeal.create({
        name: log.food_name,
        meal_type: log.meal || 'Snack',
        items: [{
          food_name: log.food_name, quantity: log.quantity, unit: log.unit,
          calories: log.calories, protein_g: log.protein_g, carbs_g: log.carbs_g,
          fat_g: log.fat_g, fiber_g: log.fiber_g, sugar_g: log.sugar_g, sodium_mg: log.sodium_mg,
        }],
        total_calories: Math.round(log.calories || 0),
        total_protein_g: +(log.protein_g || 0).toFixed(1),
      });
      setSavedIds((s) => new Set(s).add(log.id || log.food_name));
    } catch (e) { console.error(e); }
  };

  const dayDetail = byDate[selectedDate];
  const dayMeals = useMemo(() => {
    const map = {};
    MEAL_ORDER.forEach((m) => (map[m] = []));
    (dayDetail?.meals || []).filter((l) => l.food_name !== 'Water').forEach((l) => { if (map[l.meal]) map[l.meal].push(l); });
    return map;
  }, [dayDetail]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>;

  return (
    <PullToRefresh onRefresh={loadAll}>
      <div className="max-w-md mx-auto px-4 pt-4 pb-36">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate('/nutrition')} className="p-2 rounded-lg glass min-h-[44px] min-w-[44px] flex items-center justify-center"><ArrowLeft size={18} /></button>
          <div>
            <p className="text-xs text-muted-foreground tracking-wider uppercase">Nutrition</p>
            <h1 className="text-2xl font-bold tracking-tight">History</h1>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Pill active={period === 'week'} onClick={() => setPeriod('week')}>Week</Pill>
          <Pill active={period === 'month'} onClick={() => setPeriod('month')}>Month</Pill>
        </div>

        <Card className="mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">{period === 'week' ? 'Last 7 days' : 'Last 30 days'} · {summary.daysLogged || 0} days logged</p>
          {summary.daysLogged ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryStat label="Avg Calories" value={summary.avgCalories} target={goal?.calorie_target} unit="kcal" />
              <SummaryStat label="Avg Protein" value={summary.avgProtein} target={goal?.protein_target_g} unit="g" />
              <SummaryStat label="Avg Carbs" value={summary.avgCarbs} target={goal?.carb_target_g} unit="g" />
              <SummaryStat label="Avg Fat" value={summary.avgFat} target={goal?.fat_target_g} unit="g" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No nutrition data for this period yet.</p>
          )}
          {summary.proteinAdherence != null && (
            <div className="mt-3 flex gap-2">
              <AdherenceChip label="Calorie adherence" value={summary.calAdherence} />
              <AdherenceChip label="Protein adherence" value={summary.proteinAdherence} />
            </div>
          )}
        </Card>

        {chartData.some((d) => d.calories > 0) && (
          <Card className="mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Calorie trend</p>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                  <defs>
                    <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--luxury-blue))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--luxury-blue))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} labelStyle={{ color: 'hsl(var(--muted-foreground))' }} />
                  <Area type="monotone" dataKey="calories" stroke="hsl(var(--luxury-blue))" strokeWidth={2} fill="url(#calGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-3 flex items-center gap-2"><Calendar size={15} className="text-luxury-blue" /> Calendar</h2>
        <Card className="mb-4">
          <NutritionCalendar byDate={byDate} target={goal} selectedDate={selectedDate} onSelect={setSelectedDate} />
        </Card>

        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-3">{new Date(selectedDate).toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
        <Card className="mb-4">
          {dayDetail ? (
            <>
              <div className="grid grid-cols-4 gap-2 text-center mb-3">
                <DayMini label="Cal" value={Math.round(dayDetail.calories)} unit="kcal" />
                <DayMini label="Protein" value={Math.round(dayDetail.protein)} unit="g" />
                <DayMini label="Carbs" value={Math.round(dayDetail.carbs)} unit="g" />
                <DayMini label="Fat" value={Math.round(dayDetail.fat)} unit="g" />
              </div>
              <div className="space-y-3">
                {MEAL_ORDER.filter((m) => dayMeals[m].length).map((meal) => (
                  <div key={meal}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{meal}</p>
                    {dayMeals[meal].map((l) => (
                      <div key={l.id} className="py-1.5 border-t border-border/30 first:border-t-0">
                        {confirmDelete === l.id ? (
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={14} className="text-luxury-red shrink-0" />
                            <p className="text-xs text-muted-foreground flex-1 truncate" dir="auto">Delete <span className="text-foreground font-medium">{l.food_name}</span>?</p>
                            <button onClick={() => deleteLog(l.id)} className="text-xs font-medium text-luxury-red px-2.5 py-1 rounded-lg bg-luxury-red/10 min-h-[32px]">Delete</button>
                            <button onClick={() => setConfirmDelete(null)} className="text-xs text-muted-foreground px-2 py-1 min-h-[32px]">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate" dir="auto">{l.food_name}</p>
                              <p className="text-[11px] text-muted-foreground" dir="ltr">{l.quantity}{l.unit} · P{l.protein_g} C{l.carbs_g} F{l.fat_g}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <span className="text-sm font-semibold text-luxury-blue tabular-nums">{Math.round(l.calories)}</span>
                              <button onClick={() => setEditingLog(l)} className="text-muted-foreground hover:text-luxury-blue p-1.5 tap-min" title="Edit"><Pencil size={13} /></button>
                              <button onClick={() => setConfirmDelete(l.id)} className="text-muted-foreground hover:text-luxury-red p-1.5 tap-min"><Trash2 size={13} /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No food logged on this day.</p>
          )}
        </Card>

        {insights.length > 0 && (
          <>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-3 flex items-center gap-2"><Sparkles size={15} className="text-luxury-blue" /> Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {insights.map((ins, i) => {
                const Icon = ins.icon;
                return (
                  <Card key={i} className="flex items-start gap-3 py-3">
                    <div className="w-8 h-8 rounded-lg bg-luxury-blue/15 text-luxury-blue flex items-center justify-center shrink-0"><Icon size={15} /></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{ins.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{ins.body}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {recentFoods.length > 0 && (
          <>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-3 flex items-center gap-2"><Repeat size={15} className="text-luxury-blue" /> All Foods You've Logged</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {recentFoods.map((f, i) => (
                <Card key={i} className="p-2.5">
                  {confirmDeleteRecent === f.food_name ? (
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-luxury-red shrink-0" />
                      <p className="text-xs text-muted-foreground flex-1 truncate" dir="auto">Delete all <span className="text-foreground font-medium">{f.food_name}</span> from history?</p>
                      <button onClick={() => deleteRecentFood(f)} className="text-xs font-medium text-luxury-red px-2.5 py-1 rounded-lg bg-luxury-red/10 min-h-[36px]">Delete</button>
                      <button onClick={() => setConfirmDeleteRecent(null)} className="text-xs text-muted-foreground px-2 py-1 min-h-[36px]">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" dir="auto">{f.food_name}</p>
                        <p className="text-[11px] text-muted-foreground" dir="ltr">{Math.round(f.calories)} kcal · P{Math.round(f.protein_g)} · {f._count}×</p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 ml-1">
                        <button onClick={() => saveAsMeal(f)} className="text-muted-foreground hover:text-luxury-blue p-1.5 tap-min" title={savedIds.has(f.id || f.food_name) ? 'Saved' : 'Save as meal'}>
                          {savedIds.has(f.id || f.food_name) ? <Check size={14} className="text-emerald-400" /> : <Bookmark size={14} />}
                        </button>
                        <button onClick={() => addAgain(f)} className="text-muted-foreground hover:text-luxury-blue p-1.5 tap-min" title="Log again"><Repeat size={14} /></button>
                        <button onClick={() => setConfirmDeleteRecent(f.food_name)} className="text-muted-foreground hover:text-luxury-red p-1.5 tap-min" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
      {editingLog && <EditNutritionLogSheet log={editingLog} onClose={() => setEditingLog(null)} onSaved={onLogSaved} />}
    </PullToRefresh>
  );
}

function SummaryStat({ label, value, target, unit }) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xl font-bold tabular-nums">{value}<span className="text-xs text-muted-foreground ml-0.5">{unit}</span></p>
      {target && <p className="text-[10px] text-muted-foreground">/ {Math.round(target)}{unit} · {Math.round(pct)}%</p>}
    </div>
  );
}

function AdherenceChip({ label, value }) {
  const color = value >= 80 ? 'text-emerald-400' : value >= 60 ? 'text-luxury-gold' : 'text-luxury-red';
  return (
    <div className="flex-1 rounded-lg bg-muted/20 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('text-lg font-bold tabular-nums', color)}>{value}%</p>
    </div>
  );
}

function DayMini({ label, value, unit }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-base font-bold tabular-nums">{value}</span>
      <span className="text-[9px] text-muted-foreground">{unit}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
}