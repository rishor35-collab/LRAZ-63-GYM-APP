import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { X, Copy, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/fitness';
import { cn, localDateStr, localDayOffset } from '@/lib/utils';
import MobileSheet from '@/components/nutrition/MobileSheet';

const TODAY = localDateStr();

// Copy meals/foods from a previous day to today. Deterministic — no AI.
export default function CopyMealSheet({ onClose, onCopied }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      // Load last 14 days of logs
      const since = localDayOffset(-14);
      const all = await base44.entities.NutritionLog.filter({ date: { $gte: since } }, '-date', 200);
      setLogs((all || []).filter((l) => (l.date || '') < TODAY));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const byDate = useMemo(() => {
    const map = {};
    for (const l of logs) {
      if (!l.date || l.food_name === 'Water') continue;
      if (!map[l.date]) map[l.date] = { date: l.date, calories: 0, items: [] };
      map[l.date].calories += l.calories || 0;
      map[l.date].items.push(l);
    }
    return map;
  }, [logs]);

  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  const copyDay = async () => {
    if (!selectedDate) return;
    const entries = (byDate[selectedDate].items || []).map((l) => ({
      date: TODAY, meal: l.meal || 'Snack', food_name: l.food_name,
      quantity: l.quantity, unit: l.unit, calories: l.calories,
      protein_g: l.protein_g, carbs_g: l.carbs_g, fat_g: l.fat_g,
      fiber_g: l.fiber_g, sugar_g: l.sugar_g, sodium_mg: l.sodium_mg,
      source: l.source || 'Database', logged_at: new Date().toISOString(),
    }));
    try {
      if (entries.length) await base44.entities.NutritionLog.bulkCreate(entries);
      onCopied();
      onClose();
    } catch (e) { console.error(e); }
  };

  return (
    <MobileSheet onClose={onClose}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Copy from Previous Day</h3>
          <Button variant="ghost" size="sm" onClick={onClose}><X size={18} /></Button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-7 h-7 border-4 border-luxury-blue/30 border-t-luxury-blue rounded-full animate-spin" /></div>
        ) : dates.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No previous days with logged food found.</p>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {dates.map((d) => {
                const day = byDate[d];
                const date = new Date(d + 'T00:00:00');
                return (
                  <button key={d} onClick={() => setSelectedDate(d)} className={cn('w-full text-left p-3 rounded-xl transition-all', selectedDate === d ? 'glass border border-luxury-blue/50 glow-blue' : 'glass')}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{date.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        <p className="text-[11px] text-muted-foreground">{day.items.length} foods · {Math.round(day.calories)} kcal</p>
                      </div>
                      <Calendar size={16} className={cn(selectedDate === d ? 'text-luxury-blue' : 'text-muted-foreground')} />
                    </div>
                    {selectedDate === d && (
                      <div className="mt-2 space-y-1 border-t border-border/30 pt-2">
                        {day.items.slice(0, 6).map((it, i) => (
                          <p key={i} className="text-[11px] text-muted-foreground truncate">{it.food_name} · {it.meal}</p>
                        ))}
                        {day.items.length > 6 && <p className="text-[10px] text-muted-foreground">+{day.items.length - 6} more</p>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <Button className="w-full bg-luxury-blue glow-blue min-h-[44px]" onClick={copyDay} disabled={!selectedDate}><Copy size={16} /> Copy to Today</Button>
          </>
        )}
    </MobileSheet>
  );
}