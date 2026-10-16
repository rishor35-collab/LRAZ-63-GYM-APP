import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Clock, Pencil, Trash2, AlertTriangle, ChevronDown, ChevronUp, Droplets, Zap, ScanLine, Layers, Copy, Utensils, BarChart3 } from 'lucide-react';
import BarcodeScanner from '@/components/nutrition/BarcodeScanner';
import CopyMealSheet from '@/components/nutrition/CopyMealSheet';
import MealBuilder from '@/components/nutrition/MealBuilder';
import SavedMealsSheet from '@/components/nutrition/SavedMealsSheet';
import MyFoodsSheet from '@/components/nutrition/MyFoodsSheet';
import MobileFuelSummary from '@/components/nutrition/MobileFuelSummary';
import AddFoodPage from '@/components/nutrition/AddFoodPage';
import QuickAdd from '@/components/nutrition/QuickAdd';
import NutritionDetails from '@/components/nutrition/NutritionDetails';
import MobileSheet from '@/components/nutrition/MobileSheet';
import { cn, localDateStr, localDayOffset } from '@/lib/utils';
import PullToRefresh from '@/components/PullToRefresh';
import { toast } from '@/components/ui/use-toast';
import { getNutritionFeedback } from '@/lib/feedbackMessages';
import { FOODS, foodFactor, parseQty, isPer100g, defaultQty, foodItemToFood } from '@/lib/foodDatabase';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout'];
const WATER_TARGET_ML = 3000;

export default function Nutrition() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [logs, setLogs] = useState([]);
  const [weekLogs, setWeekLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState('Breakfast');
  const [buildingMeal, setBuildingMeal] = useState(false);
  const [viewingSaved, setViewingSaved] = useState(false);
  const [viewingMyFoods, setViewingMyFoods] = useState(false);
  const [copyingFrom, setCopyingFrom] = useState(false);
  const [barcodeScanning, setBarcodeScanning] = useState(false);
  const [customFoods, setCustomFoods] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [savedMeals, setSavedMeals] = useState([]);
  const [showAddFood, setShowAddFood] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const today = localDateStr();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const weekAgo = localDayOffset(-7);
      const [g, weekData, cf, favs, sm] = await Promise.all([
        base44.entities.Goal.filter({ status: 'active' }, '-created_date', 1),
        base44.entities.NutritionLog.filter({ date: { $gte: weekAgo } }, '-date', 300),
        base44.entities.FoodItem.filter({ is_custom: true }, '-created_date', 200),
        base44.entities.Favorite.filter({ type: 'food' }, '-created_date', 100),
        base44.entities.SavedMeal.filter({}, '-created_date', 100),
      ]);
      setGoal(g[0] || null);
      setWeekLogs(weekData || []);
      setLogs((weekData || []).filter((l) => l.date === today));
      setCustomFoods((cf || []).map(foodItemToFood));
      setFavorites(favs || []);
      setSavedMeals(sm || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const waterEntries = useMemo(() => logs.filter((l) => l.food_name === 'Water'), [logs]);
  const foodLogs = useMemo(() => logs.filter((l) => l.food_name !== 'Water'), [logs]);

  const totals = useMemo(() => ({
    calories: foodLogs.reduce((a, n) => a + (n.calories || 0), 0),
    protein: foodLogs.reduce((a, n) => a + (n.protein_g || 0), 0),
    carbs: foodLogs.reduce((a, n) => a + (n.carbs_g || 0), 0),
    fat: foodLogs.reduce((a, n) => a + (n.fat_g || 0), 0),
    fiber: foodLogs.reduce((a, n) => a + (n.fiber_g || 0), 0),
    sugar: foodLogs.reduce((a, n) => a + (n.sugar_g || 0), 0),
    sodium: foodLogs.reduce((a, n) => a + (n.sodium_mg || 0), 0),
    water: waterEntries.reduce((a, n) => a + (n.quantity || 0), 0),
  }), [foodLogs, waterEntries]);

  const weeklyAverages = useMemo(() => {
    const days = {};
    weekLogs.filter((l) => l.food_name !== 'Water').forEach((l) => {
      if (!days[l.date]) days[l.date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      days[l.date].calories += l.calories || 0;
      days[l.date].protein += l.protein_g || 0;
      days[l.date].carbs += l.carbs_g || 0;
      days[l.date].fat += l.fat_g || 0;
    });
    const dayCount = Object.keys(days).length;
    if (!dayCount) return null;
    const sum = Object.values(days).reduce((a, d) => ({
      calories: a.calories + d.calories, protein: a.protein + d.protein,
      carbs: a.carbs + d.carbs, fat: a.fat + d.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    return {
      calories: Math.round(sum.calories / dayCount), protein: Math.round(sum.protein / dayCount),
      carbs: Math.round(sum.carbs / dayCount), fat: Math.round(sum.fat / dayCount), days: dayCount,
    };
  }, [weekLogs]);

  const addFood = async (food, qtyRaw) => {
    const qty = parseQty(qtyRaw) || defaultQty(food);
    const factor = foodFactor(food, qty);
    const storedQty = isPer100g(food) ? +(qty * 100).toFixed(1) : qty;
    const entry = {
      date: today, meal: selectedMeal, food_name: food.name,
      quantity: storedQty, unit: food.unit || 'serving',
      calories: Math.round((food.calories || 0) * factor),
      protein_g: +((food.protein_g || 0) * factor).toFixed(1),
      carbs_g: +((food.carbs_g || 0) * factor).toFixed(1),
      fat_g: +((food.fat_g || 0) * factor).toFixed(1),
      fiber_g: +((food.fiber_g || 0) * factor).toFixed(1),
      sugar_g: +((food.sugar_g || 0) * factor).toFixed(1),
      sodium_mg: Math.round((food.sodium_mg || 0) * factor),
      source: food._custom ? 'User Entered' : 'Database', logged_at: new Date().toISOString(),
    };
    const tempId = `tmp-${Date.now()}`;
    const newEntry = { ...entry, id: tempId };
    setLogs((l) => [...l, newEntry]);
    setWeekLogs((w) => [...w, newEntry]);
    try {
      const created = await base44.entities.NutritionLog.create(entry);
      const realId = created?.id || created?._id;
      if (realId && realId !== tempId) {
        setLogs((l) => l.map((x) => x.id === tempId ? { ...x, id: realId } : x));
        setWeekLogs((w) => w.map((x) => x.id === tempId ? { ...x, id: realId } : x));
      }
      const newCals = totals.calories + (entry.calories || 0);
      const newPro = totals.protein + (entry.protein_g || 0);
      const fb = getNutritionFeedback({ calories: newCals, calorieTarget: goal?.calorie_target, protein: newPro, proteinTarget: goal?.protein_target_g });
      if (fb) toast({ title: fb.title, description: fb.message });
    } catch (e) {
      setLogs((l) => l.filter((x) => x.id !== tempId));
      setWeekLogs((w) => w.filter((x) => x.id !== tempId));
      console.error(e);
    }
  };

  const addWater = async (ml) => {
    const entry = {
      date: today, meal: 'Snack', food_name: 'Water',
      quantity: ml, unit: 'ml', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0,
      fiber_g: 0, sugar_g: 0, sodium_mg: 0, source: 'Database', logged_at: new Date().toISOString(),
    };
    const tempId = `tmp-${Date.now()}`;
    const newEntry = { ...entry, id: tempId };
    setLogs((l) => [...l, newEntry]);
    setWeekLogs((w) => [...w, newEntry]);
    try {
      const created = await base44.entities.NutritionLog.create(entry);
      const realId = created?.id || created?._id;
      if (realId && realId !== tempId) {
        setLogs((l) => l.map((x) => x.id === tempId ? { ...x, id: realId } : x));
        setWeekLogs((w) => w.map((x) => x.id === tempId ? { ...x, id: realId } : x));
      }
    } catch (e) {
      setLogs((l) => l.filter((x) => x.id !== tempId));
      setWeekLogs((w) => w.filter((x) => x.id !== tempId));
      console.error(e);
    }
  };

  const deleteLog = async (id) => {
    setLogs((l) => l.filter((x) => x.id !== id));
    setWeekLogs((w) => w.filter((x) => x.id !== id));
    setConfirmDelete(null);
    try { await base44.entities.NutritionLog.delete(id); } catch (e) { loadAll(); console.error(e); }
  };

  const saveEdit = async (updated) => {
    setLogs((l) => l.map((x) => x.id === updated.id ? { ...x, ...updated } : x));
    setWeekLogs((w) => w.map((x) => x.id === updated.id ? { ...x, ...updated } : x));
    setEditing(null);
    try { await base44.entities.NutritionLog.update(updated.id, updated); } catch (e) { loadAll(); console.error(e); }
  };

  const toggleFavorite = async (food) => {
    const existing = favorites.find((f) => f.ref_id === food.name);
    if (existing) {
      setFavorites((favs) => favs.filter((f) => f.id !== existing.id));
      try { await base44.entities.Favorite.delete(existing.id); } catch (e) { console.error(e); }
    } else {
      const rec = await base44.entities.Favorite.create({
        type: 'food', ref_id: food.name, name: food.name,
        subtitle: food.category || '', created_at: new Date().toISOString(),
      });
      setFavorites((favs) => [...favs, rec]);
    }
  };

  const mealsByType = useMemo(() => {
    const map = {};
    MEALS.forEach((m) => (map[m] = []));
    foodLogs.forEach((l) => { if (map[l.meal]) map[l.meal].push(l); });
    return map;
  }, [foodLogs]);

  const recentFoods = useMemo(() => {
    const seen = new Set();
    const result = [];
    [...weekLogs].reverse().filter((l) => l.food_name !== 'Water').forEach((l) => {
      if (!seen.has(l.food_name)) {
        seen.add(l.food_name);
        const food = [...customFoods, ...FOODS].find((f) => f.name === l.food_name);
        if (food) result.push(food);
      }
    });
    return result.slice(0, 20);
  }, [weekLogs, customFoods]);

  const logSavedMeal = async (meal) => {
    const items = meal.items || [];
    const entries = items.map((item) => ({
      date: today, meal: selectedMeal, food_name: item.food_name,
      quantity: item.quantity, unit: item.unit || 'serving',
      calories: item.calories || 0, protein_g: item.protein_g || 0,
      carbs_g: item.carbs_g || 0, fat_g: item.fat_g || 0,
      fiber_g: item.fiber_g || 0, sugar_g: item.sugar_g || 0,
      sodium_mg: item.sodium_mg || 0, source: 'Recipe', logged_at: new Date().toISOString(),
    }));
    const tempEntries = entries.map((e, i) => ({ ...e, id: `tmp-${Date.now()}-${i}` }));
    setLogs((l) => [...l, ...tempEntries]);
    setWeekLogs((w) => [...w, ...tempEntries]);
    try {
      await base44.entities.NutritionLog.bulkCreate(entries);
    } catch (e) {
      setLogs((l) => l.filter((x) => !tempEntries.find((t) => t.id === x.id)));
      setWeekLogs((w) => w.filter((x) => !tempEntries.find((t) => t.id === x.id)));
      console.error(e);
    }
  };

  useEffect(() => {
    if (expandedMeal === null && !loading) {
      const firstWithFood = MEALS.find((m) => mealsByType[m].length > 0);
      setExpandedMeal(firstWithFood || 'Breakfast');
    }
  }, [loading, mealsByType, expandedMeal]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>;

  return (
    <>
      <div className="max-w-md mx-auto">
        <PullToRefresh onRefresh={loadAll}>
          <div className="px-4 pt-6 pb-28">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                <h1 className="text-3xl font-bold tracking-tight">Fuel</h1>
              </div>
              <button onClick={() => navigate('/nutrition/history')} className="glass rounded-xl p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Clock size={18} />
              </button>
            </div>

            {/* Summary — calorie ring + macro bars */}
            <MobileFuelSummary totals={totals} goal={goal} onShowDetails={() => setShowDetails(true)} />

            {/* Primary action grid — 4 big touch targets */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <button onClick={() => setShowAddFood(true)} className="flex flex-col items-center justify-center gap-1 rounded-xl py-3 min-h-[72px] bg-luxury-blue text-white glow-blue active:scale-95 transition-transform">
                <Plus size={20} /><span className="text-[10px] font-medium">Add Food</span>
              </button>
              <button onClick={() => setShowQuickAdd(true)} className="flex flex-col items-center justify-center gap-1 rounded-xl py-3 min-h-[72px] glass active:scale-95 transition-transform">
                <Zap size={20} className="text-luxury-gold" /><span className="text-[10px] font-medium">Quick Cal</span>
              </button>
              <button onClick={() => setBarcodeScanning(true)} className="flex flex-col items-center justify-center gap-1 rounded-xl py-3 min-h-[72px] glass active:scale-95 transition-transform">
                <ScanLine size={20} className="text-luxury-blue" /><span className="text-[10px] font-medium">Scan</span>
              </button>
              <button onClick={() => setViewingSaved(true)} className="flex flex-col items-center justify-center gap-1 rounded-xl py-3 min-h-[72px] glass active:scale-95 transition-transform">
                <Layers size={20} className="text-luxury-red" /><span className="text-[10px] font-medium">Meals</span>
              </button>
            </div>

            {/* Water tracker */}
            <WaterTracker entries={waterEntries} total={totals.water} target={WATER_TARGET_ML} onAdd={addWater} onDelete={deleteLog} />

            {/* Meal sections — list-based entries */}
            <div className="space-y-2 mt-3">
              {MEALS.map((meal) => (
                <MealSection key={meal} meal={meal} logs={mealsByType[meal]}
                  expanded={expandedMeal === meal}
                  onToggle={() => setExpandedMeal(expandedMeal === meal ? null : meal)}
                  onAdd={() => { setSelectedMeal(meal); setShowAddFood(true); }}
                  confirmDelete={confirmDelete} onConfirmDelete={setConfirmDelete} onDelete={deleteLog} onEdit={setEditing} />
              ))}
            </div>

            {/* Secondary actions */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={() => setCopyingFrom(true)} className="flex items-center gap-2 glass rounded-xl px-3 py-3 min-h-[48px] text-sm font-medium active:scale-95 transition-transform">
                <Copy size={16} className="text-muted-foreground" /><span>Copy Day</span>
              </button>
              <button onClick={() => setViewingMyFoods(true)} className="flex items-center gap-2 glass rounded-xl px-3 py-3 min-h-[48px] text-sm font-medium active:scale-95 transition-transform">
                <Utensils size={16} className="text-muted-foreground" /><span>My Foods</span>
              </button>
              <button onClick={() => setBuildingMeal(true)} className="flex items-center gap-2 glass rounded-xl px-3 py-3 min-h-[48px] text-sm font-medium active:scale-95 transition-transform">
                <Layers size={16} className="text-muted-foreground" /><span>Build Meal</span>
              </button>
              <button onClick={() => setShowDetails(true)} className="flex items-center gap-2 glass rounded-xl px-3 py-3 min-h-[48px] text-sm font-medium active:scale-95 transition-transform">
                <BarChart3 size={16} className="text-muted-foreground" /><span>Details</span>
              </button>
            </div>
          </div>
        </PullToRefresh>
      </div>

      {/* Shared sheets & modals */}
      {showAddFood && <AddFoodPage onClose={() => setShowAddFood(false)} selectedMeal={selectedMeal} setSelectedMeal={setSelectedMeal}
        customFoods={customFoods} favorites={favorites} toggleFavorite={toggleFavorite} addFood={addFood}
        recentFoods={recentFoods} savedMeals={savedMeals} onLogSavedMeal={logSavedMeal}
        onScan={() => { setShowAddFood(false); setBarcodeScanning(true); }}
        onQuickAdd={() => { setShowAddFood(false); setShowQuickAdd(true); }}
        onBuildMeal={() => { setShowAddFood(false); setBuildingMeal(true); }}
        onCopyDay={() => { setShowAddFood(false); setCopyingFrom(true); }}
        onCreateFood={() => { setShowAddFood(false); setViewingMyFoods(true); }} />}
      {showQuickAdd && <QuickAdd onClose={() => setShowQuickAdd(false)} selectedMeal={selectedMeal} setSelectedMeal={setSelectedMeal} addFood={addFood} />}
      {showDetails && <NutritionDetails onClose={() => setShowDetails(false)} totals={totals} goal={goal} weeklyAverages={weeklyAverages} waterTarget={WATER_TARGET_ML} />}
      {barcodeScanning && <BarcodeScanner selectedMeal={selectedMeal} onLogged={loadAll} onClose={() => setBarcodeScanning(false)} />}
      {editing && <EditMealSheet log={editing} onClose={() => setEditing(null)} onSave={saveEdit} />}
      {buildingMeal && <MealBuilder onClose={() => setBuildingMeal(false)} selectedMeal={selectedMeal} setSelectedMeal={setSelectedMeal} onLogged={loadAll} customFoods={customFoods} />}
      {viewingSaved && <SavedMealsSheet onClose={() => setViewingSaved(false)} onLogged={loadAll} />}
      {viewingMyFoods && <MyFoodsSheet onClose={() => setViewingMyFoods(false)} onChanged={loadAll} />}
      {copyingFrom && <CopyMealSheet onClose={() => setCopyingFrom(false)} onCopied={loadAll} />}
    </>
  );
}

function WaterTracker({ entries, total, target, onAdd, onDelete }) {
  const [custom, setCustom] = useState('');
  const pct = Math.min(100, (total / target) * 100);
  const addCustom = () => { const ml = parseInt(custom, 10); if (ml > 0) { onAdd(ml); setCustom(''); } };
  return (
    <div className="glass rounded-xl p-3 mb-3">
      <div className="flex items-center gap-3 mb-2">
        <Droplets size={18} className="text-luxury-blue shrink-0" />
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold">{Math.round(total)}<span className="text-xs text-muted-foreground"> / {target} ml</span></span>
            {entries.length > 0 && <span className="text-[10px] text-muted-foreground">{entries.length} entries</span>}
          </div>
          <div className="w-full h-1.5 rounded-full bg-muted/30 mt-1 overflow-hidden">
            <div className="h-full bg-luxury-blue transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-2">
        {[250, 500, 750].map((ml) => (
          <button key={ml} onClick={() => onAdd(ml)} className="glass rounded-lg py-2.5 text-xs font-medium min-h-[44px] hover:bg-luxury-blue/10 transition-all">+{ml}ml</button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input type="number" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Custom ml" className="glass h-11 flex-1 text-center text-sm tabular-nums" inputMode="numeric" />
        <Button size="sm" className="bg-luxury-blue glow-blue px-4 min-h-[44px]" onClick={addCustom} disabled={!custom}><Plus size={16} /> Add</Button>
      </div>
    </div>
  );
}

const MealSection = React.memo(function MealSection({ meal, logs, expanded, onToggle, onAdd, confirmDelete, onConfirmDelete, onDelete, onEdit }) {
  const totalCal = logs.reduce((a, l) => a + (l.calories || 0), 0);
  return (
    <div className="glass rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-3 min-h-[52px]">
        <div className="flex items-center gap-2">
          {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
          <span className="text-sm font-semibold">{meal}</span>
          {logs.length > 0 && <span className="text-xs text-muted-foreground">{logs.length} {logs.length === 1 ? 'food' : 'foods'}</span>}
        </div>
        <span className="text-sm font-bold tabular-nums">{Math.round(totalCal)} <span className="text-[10px] text-muted-foreground">kcal</span></span>
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-1.5">
          {logs.length ? logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/20">
              {confirmDelete === log.id ? (
                <div className="flex items-center gap-2 w-full">
                  <AlertTriangle size={14} className="text-luxury-red shrink-0" />
                  <p className="text-xs text-muted-foreground flex-1 truncate" dir="auto">Delete <span className="text-foreground font-medium">{log.food_name}</span>?</p>
                  <button onClick={() => onDelete(log.id)} className="text-xs font-medium text-luxury-red px-2.5 py-1 rounded-lg bg-luxury-red/10 min-h-[36px]">Delete</button>
                  <button onClick={() => onConfirmDelete(null)} className="text-xs text-muted-foreground px-2 py-1 min-h-[36px]">Cancel</button>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" dir="auto">{log.food_name}</p>
                    <p className="text-[11px] text-muted-foreground" dir="ltr">{log.quantity}{log.unit} · P{log.protein_g} C{log.carbs_g} F{log.fat_g}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-sm font-semibold text-luxury-blue tabular-nums">{Math.round(log.calories)}</span>
                    <button onClick={() => onEdit(log)} className="text-muted-foreground hover:text-luxury-blue p-1.5 tap-min"><Pencil size={14} /></button>
                    <button onClick={() => onConfirmDelete(log.id)} className="text-muted-foreground hover:text-luxury-red p-1.5 tap-min"><Trash2 size={14} /></button>
                  </div>
                </>
              )}
            </div>
          )) : (
            <p className="text-xs text-muted-foreground py-2 text-center">Nothing logged yet</p>
          )}
          <button onClick={onAdd} className="w-full flex items-center justify-center gap-1 py-2 text-xs text-luxury-blue min-h-[40px]">
            <Plus size={14} /> Add food
          </button>
        </div>
      )}
    </div>
  );
});

function EditMealSheet({ log, onClose, onSave }) {
  const origQty = log.quantity ?? 1;
  const [form, setForm] = useState({
    food_name: log.food_name || '',
    meal: log.meal || 'Snack',
    quantity: log.quantity ?? 1,
    unit: log.unit || 'serving',
    calories: log.calories ?? 0,
    protein_g: log.protein_g ?? 0,
    carbs_g: log.carbs_g ?? 0,
    fat_g: log.fat_g ?? 0,
    fiber_g: log.fiber_g ?? 0,
    sugar_g: log.sugar_g ?? 0,
    sodium_mg: log.sodium_mg ?? 0,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const changeQty = (val) => {
    const q = parseQty(val);
    const factor = origQty ? q / origQty : 1;
    setForm((f) => ({
      ...f, quantity: q,
      calories: Math.round((log.calories ?? 0) * factor),
      protein_g: +((log.protein_g ?? 0) * factor).toFixed(1),
      carbs_g: +((log.carbs_g ?? 0) * factor).toFixed(1),
      fat_g: +((log.fat_g ?? 0) * factor).toFixed(1),
      fiber_g: +((log.fiber_g ?? 0) * factor).toFixed(1),
      sugar_g: +((log.sugar_g ?? 0) * factor).toFixed(1),
      sodium_mg: Math.round((log.sodium_mg ?? 0) * factor),
    }));
  };
  return (
    <MobileSheet onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Edit Food</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"><X size={18} /></button>
      </div>
      <div className="space-y-3">
        <Input value={form.food_name} onChange={(e) => set('food_name', e.target.value)} placeholder="Food name" className="glass h-11" />
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {MEALS.map((m) => (
            <button key={m} onClick={() => set('meal', m)} className={cn('text-xs px-3 py-1.5 rounded-full border whitespace-nowrap min-h-[36px] flex items-center', form.meal === m ? 'border-luxury-blue bg-luxury-blue/15 text-luxury-blue' : 'border-border glass text-muted-foreground')}>{m}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-[10px] uppercase text-muted-foreground">Qty</Label><Input type="text" inputMode="decimal" value={form.quantity} onChange={(e) => changeQty(e.target.value)} className="glass h-11 tabular-nums" /></div>
          <div><Label className="text-[10px] uppercase text-muted-foreground">Unit</Label><Input value={form.unit} onChange={(e) => set('unit', e.target.value)} className="glass h-11" /></div>
        </div>
        <p className="text-[10px] text-muted-foreground">Changing quantity auto-scales calories and macros.</p>
        <div className="grid grid-cols-4 gap-2">
          <div><Label className="text-[10px] uppercase text-muted-foreground">Kcal</Label><Input type="number" value={form.calories} onChange={(e) => set('calories', Number(e.target.value))} className="glass h-11 text-center text-xs tabular-nums" /></div>
          <div><Label className="text-[10px] uppercase text-muted-foreground">P g</Label><Input type="number" value={form.protein_g} onChange={(e) => set('protein_g', Number(e.target.value))} className="glass h-11 text-center text-xs tabular-nums" /></div>
          <div><Label className="text-[10px] uppercase text-muted-foreground">C g</Label><Input type="number" value={form.carbs_g} onChange={(e) => set('carbs_g', Number(e.target.value))} className="glass h-11 text-center text-xs tabular-nums" /></div>
          <div><Label className="text-[10px] uppercase text-muted-foreground">F g</Label><Input type="number" value={form.fat_g} onChange={(e) => set('fat_g', Number(e.target.value))} className="glass h-11 text-center text-xs tabular-nums" /></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><Label className="text-[10px] uppercase text-muted-foreground">Fiber g</Label><Input type="number" value={form.fiber_g} onChange={(e) => set('fiber_g', Number(e.target.value))} className="glass h-11 text-center text-xs tabular-nums" /></div>
          <div><Label className="text-[10px] uppercase text-muted-foreground">Sugar g</Label><Input type="number" value={form.sugar_g} onChange={(e) => set('sugar_g', Number(e.target.value))} className="glass h-11 text-center text-xs tabular-nums" /></div>
          <div><Label className="text-[10px] uppercase text-muted-foreground">Sodium mg</Label><Input type="number" value={form.sodium_mg} onChange={(e) => set('sodium_mg', Number(e.target.value))} className="glass h-11 text-center text-xs tabular-nums" /></div>
        </div>
        <Button className="w-full bg-luxury-blue glow-blue min-h-[48px] text-base font-semibold" onClick={() => onSave({ id: log.id, ...form })}>Save Changes</Button>
      </div>
    </MobileSheet>
  );
}