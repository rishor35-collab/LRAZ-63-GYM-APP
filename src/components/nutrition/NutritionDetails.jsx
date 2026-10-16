import React from 'react';
import { X, TrendingUp } from 'lucide-react';
import MobileSheet from '@/components/nutrition/MobileSheet';

export default function NutritionDetails({ onClose, totals, goal, weeklyAverages, waterTarget }) {
  const nutrients = [
    { label: 'Calories', value: totals.calories, unit: 'kcal', target: goal?.calorie_target },
    { label: 'Protein', value: totals.protein, unit: 'g', target: goal?.protein_target_g },
    { label: 'Carbs', value: totals.carbs, unit: 'g', target: goal?.carb_target_g },
    { label: 'Fat', value: totals.fat, unit: 'g', target: goal?.fat_target_g },
    { label: 'Fiber', value: totals.fiber, unit: 'g', target: goal?.fiber_target_g },
    { label: 'Sugar', value: totals.sugar, unit: 'g' },
    { label: 'Sodium', value: totals.sodium, unit: 'mg' },
    { label: 'Water', value: totals.water, unit: 'ml', target: waterTarget },
  ];

  return (
    <MobileSheet onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Nutrition Details</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"><X size={18} /></button>
      </div>
      <div className="space-y-2 mb-4">
        {nutrients.map((n) => (
          <div key={n.label} className="flex items-center justify-between p-3 rounded-xl glass">
            <span className="text-sm text-muted-foreground">{n.label}</span>
            <div className="text-right">
              <span className="text-sm font-semibold tabular-nums">{Math.round(n.value)}<span className="text-xs text-muted-foreground"> {n.unit}</span></span>
              {n.target && <span className="text-[10px] text-muted-foreground block">/ {Math.round(n.target)}{n.unit}</span>}
            </div>
          </div>
        ))}
      </div>
      {weeklyAverages && (
        <div className="glass rounded-xl p-3">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-luxury-blue" />
            <p className="text-xs uppercase tracking-wider text-muted-foreground">7-Day Averages · {weeklyAverages.days} days</p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div><p className="text-base font-bold tabular-nums text-luxury-red">{weeklyAverages.calories}</p><p className="text-[9px] text-muted-foreground">kcal</p></div>
            <div><p className="text-base font-bold tabular-nums text-luxury-blue">{weeklyAverages.protein}</p><p className="text-[9px] text-muted-foreground">P g</p></div>
            <div><p className="text-base font-bold tabular-nums">{weeklyAverages.carbs}</p><p className="text-[9px] text-muted-foreground">C g</p></div>
            <div><p className="text-base font-bold tabular-nums">{weeklyAverages.fat}</p><p className="text-[9px] text-muted-foreground">F g</p></div>
          </div>
        </div>
      )}
    </MobileSheet>
  );
}