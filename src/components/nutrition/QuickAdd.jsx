import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import MobileSheet from '@/components/nutrition/MobileSheet';
import { cn } from '@/lib/utils';
import { parseQty } from '@/lib/foodDatabase';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout'];

export default function QuickAdd({ onClose, selectedMeal, setSelectedMeal, addFood }) {
  const [calories, setCalories] = useState('');
  const [name, setName] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const handleAdd = () => {
    const cal = parseQty(calories);
    if (!cal) return;
    addFood({
      name: name.trim() || 'Quick Add',
      calories: cal,
      protein_g: parseQty(protein) || 0,
      carbs_g: parseQty(carbs) || 0,
      fat_g: parseQty(fat) || 0,
      fiber_g: 0, sugar_g: 0, sodium_mg: 0,
      unit: 'serving', quantity: 1,
    }, 1);
    onClose();
  };

  return (
    <MobileSheet onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Quick Add</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"><X size={18} /></button>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Calories *</p>
          <Input type="text" inputMode="decimal" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="0" className="glass h-14 text-2xl text-center tabular-nums font-bold" autoFocus />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Food name (optional)</p>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Snack" className="glass h-11" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Meal</p>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {MEALS.map((m) => (
              <button key={m} onClick={() => setSelectedMeal(m)} className={cn('text-xs px-3 py-1.5 rounded-full border whitespace-nowrap min-h-[36px] flex items-center', selectedMeal === m ? 'border-luxury-blue bg-luxury-blue/15 text-luxury-blue' : 'border-border glass text-muted-foreground')}>{m}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Macros (optional)</p>
          <div className="grid grid-cols-3 gap-2">
            <Input type="text" inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="P g" className="glass h-11 text-center tabular-nums" />
            <Input type="text" inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="C g" className="glass h-11 text-center tabular-nums" />
            <Input type="text" inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="F g" className="glass h-11 text-center tabular-nums" />
          </div>
        </div>
        <Button className="w-full bg-luxury-blue glow-blue min-h-[52px] text-base font-semibold" onClick={handleAdd} disabled={!parseQty(calories)}><Check size={18} /> Add</Button>
      </div>
    </MobileSheet>
  );
}