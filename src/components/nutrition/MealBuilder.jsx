import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, Pill } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Search, Trash2, Save, Check } from 'lucide-react';
import { FOODS, FOOD_CATEGORIES, foodFactor, parseQty, isPer100g, defaultQty } from '@/lib/foodDatabase';
import { cn, localDateStr } from '@/lib/utils';
import MobileSheet from '@/components/nutrition/MobileSheet';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout'];
const TODAY = localDateStr();

export default function MealBuilder({ onClose, selectedMeal, setSelectedMeal, onLogged, customFoods }) {
  const [tray, setTray] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [mealName, setMealName] = useState('');
  const [saving, setSaving] = useState(false);
  const [logging, setLogging] = useState(false);
  const [done, setDone] = useState(false);

  const allFoods = useMemo(() => [...(customFoods || []), ...FOODS], [customFoods]);
  const filtered = useMemo(() => {
    let list = category === 'All' ? allFoods : allFoods.filter((f) => f.category === category);
    if (search) list = list.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
    return list.slice(0, 40);
  }, [search, category, allFoods]);

  const totals = useMemo(() => tray.reduce((a, t) => ({
    calories: a.calories + t.calories, protein: a.protein + t.protein_g,
    carbs: a.carbs + t.carbs_g, fat: a.fat + t.fat_g, fiber: a.fiber + t.fiber_g,
    sugar: a.sugar + t.sugar_g, sodium: a.sodium + t.sodium_mg,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }), [tray]);

  const addToTray = (food) => {
    const dq = defaultQty(food);
    setTray((t) => [...t, { ...food, _id: Date.now() + Math.random(), qty: dq, calories: food.calories, protein_g: food.protein_g, carbs_g: food.carbs_g, fat_g: food.fat_g, fiber_g: food.fiber_g, sugar_g: food.sugar_g, sodium_mg: food.sodium_mg }]);
  };

  const updateQty = (id, qtyRaw) => {
    const qty = parseQty(qtyRaw);
    setTray((t) => t.map((item) => {
      if (item._id !== id) return item;
      const base = allFoods.find((f) => f.name === item.name);
      if (!base || !qty) return { ...item, qty: qtyRaw, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0 };
      const factor = foodFactor(base, qty);
      return { ...item, qty: qtyRaw, calories: Math.round((base.calories || 0) * factor), protein_g: +((base.protein_g || 0) * factor).toFixed(1), carbs_g: +((base.carbs_g || 0) * factor).toFixed(1), fat_g: +((base.fat_g || 0) * factor).toFixed(1), fiber_g: +((base.fiber_g || 0) * factor).toFixed(1), sugar_g: +((base.sugar_g || 0) * factor).toFixed(1), sodium_mg: Math.round((base.sodium_mg || 0) * factor) };
    }));
  };

  const removeItem = (id) => setTray((t) => t.filter((i) => i._id !== id));

  const buildEntries = () => tray.map((item) => {
    const base = allFoods.find((f) => f.name === item.name) || item;
    const qty = parseQty(item.qty);
    const factor = foodFactor(base, qty);
    const storedQty = isPer100g(base) ? +(qty * 100).toFixed(1) : qty;
    return {
      date: TODAY, meal: selectedMeal, food_name: base.name, quantity: storedQty, unit: base.unit,
      calories: Math.round((base.calories || 0) * factor), protein_g: +((base.protein_g || 0) * factor).toFixed(1),
      carbs_g: +((base.carbs_g || 0) * factor).toFixed(1), fat_g: +((base.fat_g || 0) * factor).toFixed(1),
      fiber_g: +((base.fiber_g || 0) * factor).toFixed(1), sugar_g: +((base.sugar_g || 0) * factor).toFixed(1),
      sodium_mg: Math.round((base.sodium_mg || 0) * factor), source: base._custom ? 'User Entered' : 'Database', logged_at: new Date().toISOString(),
    };
  });

  const logToToday = async () => {
    if (!tray.length) return;
    setLogging(true);
    try {
      await base44.entities.NutritionLog.bulkCreate(buildEntries());
      setDone(true);
      setTimeout(() => { onLogged(); onClose(); }, 700);
    } catch (e) { console.error(e); setLogging(false); }
  };

  const saveMeal = async () => {
    if (!tray.length || !mealName.trim()) return;
    setSaving(true);
    try {
      const items = buildEntries().map(({ date, meal, source, logged_at, ...rest }) => rest);
      await base44.entities.SavedMeal.create({
        name: mealName.trim(), meal_type: selectedMeal, items,
        total_calories: Math.round(totals.calories), total_protein_g: +totals.protein.toFixed(1),
      });
      setDone(true);
      setTimeout(() => { onLogged(); onClose(); }, 700);
    } catch (e) { console.error(e); setSaving(false); }
  };

  return (
    <MobileSheet onClose={onClose}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Build a Meal</h3>
          <Button variant="ghost" size="sm" onClick={onClose}><X size={18} /></Button>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
          {MEALS.map((m) => <Pill key={m} active={selectedMeal === m} onClick={() => setSelectedMeal(m)}>{m}</Pill>)}
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
          {FOOD_CATEGORIES.map((c) => <Pill key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Pill>)}
        </div>

        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search foods…" className="pl-9" />
        </div>

        <div className="space-y-1.5 mb-4">
          {filtered.map((f, i) => (
            <button key={i} onClick={() => addToTray(f)} className="w-full text-left p-2.5 rounded-xl glass hover:bg-muted/30 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{f.name}{f._custom && <span className="text-[9px] text-luxury-blue ml-1">★</span>}</p>
                <p className="text-[11px] text-muted-foreground">{isPer100g(f) ? 'Per 100g' : `${f.quantity}${f.unit}`} · {f.calories} kcal · P{f.protein_g} C{f.carbs_g} F{f.fat_g}</p>
              </div>
              <Plus size={16} className="text-luxury-blue shrink-0 ml-2" />
            </button>
          ))}
          {!filtered.length && <p className="text-center text-sm text-muted-foreground py-4">No matches.</p>}
        </div>

        {tray.length > 0 && (
          <>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Meal Tray ({tray.length})</p>
            <div className="space-y-2 mb-4">
              {tray.map((item) => (
                <Card key={item._id} className="p-2.5 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">{Math.round(item.calories)} kcal · P{item.protein_g}</p>
                  </div>
                  <Input type="text" inputMode="decimal" value={item.qty} onChange={(e) => updateQty(item._id, e.target.value)} className="h-10 w-16 glass text-center text-xs tabular-nums min-w-0" />
                  <span className="text-[10px] text-muted-foreground w-8">{item.unit}</span>
                  <button onClick={() => removeItem(item._id)} className="text-muted-foreground hover:text-luxury-red p-1"><Trash2 size={14} /></button>
                </Card>
              ))}
            </div>

            <Card className="mb-4 grid grid-cols-4 gap-2 text-center">
              <TrayStat label="Cal" value={Math.round(totals.calories)} />
              <TrayStat label="Protein" value={Math.round(totals.protein)} unit="g" />
              <TrayStat label="Carbs" value={Math.round(totals.carbs)} unit="g" />
              <TrayStat label="Fat" value={Math.round(totals.fat)} unit="g" />
            </Card>

            <Input value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="Meal name (to save as reusable)" className="glass h-10 mb-3" />

            <div className="flex gap-2">
              <Button className="flex-1 bg-luxury-blue glow-blue min-h-[44px]" onClick={logToToday} disabled={logging || done}>
                {done ? <><Check size={16} /> Logged</> : logging ? 'Logging…' : 'Log to Today'}
              </Button>
              <Button variant="outline" className="glass min-h-[44px]" onClick={saveMeal} disabled={saving || done || !mealName.trim()}>
                {done ? <Check size={16} /> : <><Save size={15} /> Save</>}
              </Button>
            </div>
          </>
        )}
        {tray.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">Add foods to start building your meal.</p>}
    </MobileSheet>
  );
}

function TrayStat({ label, value, unit }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-base font-bold tabular-nums">{value}{unit && <span className="text-[10px] text-muted-foreground ml-0.5">{unit}</span>}</span>
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
}