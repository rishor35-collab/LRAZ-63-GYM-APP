import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X, Check } from 'lucide-react';
import { cn, localDateStr } from '@/lib/utils';
import { FOODS, FOOD_CATEGORIES } from '@/lib/foodDatabase';
import MobileSheet from '@/components/nutrition/MobileSheet';

// Deterministic food picker — searches the built-in local database. No AI, no credits.
export default function FoodScanner({ selectedMeal, onLogged, onClose }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [picked, setPicked] = useState(null);
  const [qty, setQty] = useState(1);
  const [saving, setSaving] = useState(false);

  const results = useMemo(() => {
    const q = search.toLowerCase().trim();
    return FOODS.filter((f) => {
      if (category !== 'All' && f.category !== category) return false;
      if (q && !f.name.toLowerCase().includes(q)) return false;
      return true;
    }).slice(0, 40);
  }, [search, category]);

  const confirm = async () => {
    setSaving(true);
    try {
      const factor = Number(qty) || 1;
      const today = localDateStr();
      await base44.entities.NutritionLog.create({
        date: today, meal: selectedMeal, food_name: picked.name,
        quantity: factor * (picked.quantity || 1), unit: picked.unit || 'serving',
        calories: Math.round((picked.calories || 0) * factor),
        protein_g: +((picked.protein_g || 0) * factor).toFixed(1),
        carbs_g: +((picked.carbs_g || 0) * factor).toFixed(1),
        fat_g: +((picked.fat_g || 0) * factor).toFixed(1),
        fiber_g: +((picked.fiber_g || 0) * factor).toFixed(1),
        sodium_mg: Math.round((picked.sodium_mg || 0) * factor),
        source: 'Database', is_ai_estimated: false, logged_at: new Date().toISOString(),
      });
      onLogged();
      onClose();
    } catch (e) { setSaving(false); }
  };

  return (
    <MobileSheet onClose={onClose}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Quick Add Food</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="min-h-[44px] min-w-[44px] p-2"><X size={18} /></Button>
        </div>

        {!picked && (
          <>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search the food database…" className="pl-9 glass" autoFocus />
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3">
              {FOOD_CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={cn('text-xs px-3 py-1.5 rounded-full border whitespace-nowrap min-h-[36px]', category === c ? 'border-luxury-blue bg-luxury-blue/15 text-luxury-blue' : 'border-border glass text-muted-foreground')}>{c}</button>
              ))}
            </div>
            <div className="space-y-1.5">
              {results.map((f, i) => (
                <button key={i} onClick={() => setPicked(f)} className="w-full text-left p-3 rounded-xl glass hover:bg-muted/30 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-[11px] text-muted-foreground">{f.category} · {f.quantity}{f.unit}</p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-luxury-red shrink-0">{f.calories}<span className="text-[10px] text-muted-foreground"> kcal</span></span>
                </button>
              ))}
              {!results.length && <p className="text-sm text-muted-foreground text-center py-8">No foods found. Try a different search or category.</p>}
            </div>
          </>
        )}

        {picked && (
          <div className="space-y-3 animate-fade-up">
            <div className="rounded-xl glass p-3">
              <p className="font-semibold text-sm">{picked.name}</p>
              <p className="text-[11px] text-muted-foreground mb-2">{picked.category} · per {picked.quantity}{picked.unit}</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <Macro label="kcal" value={Math.round(picked.calories || 0)} accent="red" />
                <Macro label="P" value={Math.round(picked.protein_g || 0)} accent="blue" />
                <Macro label="C" value={Math.round(picked.carbs_g || 0)} />
                <Macro label="F" value={Math.round(picked.fat_g || 0)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Servings</span>
              <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="glass h-9 w-20 text-center tabular-nums" />
            </div>
            <p className="text-[10px] text-muted-foreground">Values from the built-in food database (USDA-equivalent averages). Estimates for tracking, not clinical values.</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 glass" onClick={() => setPicked(null)}>Back</Button>
              <Button className="flex-1 bg-luxury-red glow-red" onClick={confirm} disabled={saving}>{saving ? 'Saving…' : <><Check size={16} /> Log It</>}</Button>
            </div>
          </div>
        )}
    </MobileSheet>
  );
}

function Macro({ label, value, accent }) {
  return (
    <div className="flex flex-col">
      <span className={cn('text-base font-bold tabular-nums', accent === 'red' ? 'text-luxury-red' : accent === 'blue' ? 'text-luxury-blue' : 'text-foreground')}>{value}</span>
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}