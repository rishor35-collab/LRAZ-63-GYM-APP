import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { X, Trash2, Repeat } from 'lucide-react';
import MobileSheet from '@/components/nutrition/MobileSheet';
import { localDateStr } from '@/lib/utils';

const TODAY = localDateStr();

export default function SavedMealsSheet({ onClose, onLogged }) {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { setMeals(await base44.entities.SavedMeal.list('-updated_date', 50) || []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const logMeal = async (meal) => {
    const entries = (meal.items || []).map((item) => ({
      date: TODAY, meal: meal.meal_type || 'Snack', food_name: item.food_name,
      quantity: item.quantity, unit: item.unit, calories: item.calories,
      protein_g: item.protein_g, carbs_g: item.carbs_g, fat_g: item.fat_g,
      fiber_g: item.fiber_g, sugar_g: item.sugar_g, sodium_mg: item.sodium_mg,
      source: 'Database', logged_at: new Date().toISOString(),
    }));
    try { await base44.entities.NutritionLog.bulkCreate(entries); onLogged(); onClose(); }
    catch (e) { console.error(e); }
  };

  const deleteMeal = async (id) => {
    setMeals((m) => m.filter((x) => x.id !== id));
    try { await base44.entities.SavedMeal.delete(id); } catch (e) { load(); console.error(e); }
  };

  return (
    <MobileSheet onClose={onClose}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Saved Meals</h3>
          <Button variant="ghost" size="sm" onClick={onClose}><X size={18} /></Button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-7 h-7 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>
        ) : meals.length ? (
          <div className="space-y-2">
            {meals.map((m) => (
              <Card key={m.id} className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" dir="auto">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground" dir="ltr">{m.meal_type} · {(m.items || []).length} foods · {Math.round(m.total_calories || 0)} kcal · P{Math.round(m.total_protein_g || 0)}</p>
                  </div>
                  <button onClick={() => deleteMeal(m.id)} className="text-muted-foreground hover:text-luxury-red p-1 shrink-0"><Trash2 size={15} /></button>
                </div>
                <Button size="sm" className="w-full bg-luxury-blue glow-blue" onClick={() => logMeal(m)}><Repeat size={14} /> Log to Today</Button>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">No saved meals yet. Build a meal and tap Save to reuse it later.</p>
        )}
    </MobileSheet>
  );
}