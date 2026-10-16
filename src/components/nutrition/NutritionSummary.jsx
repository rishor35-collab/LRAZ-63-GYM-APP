import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export default function NutritionSummary({ totals, goal, onShowDetails }) {
  const calPct = goal?.calorie_target ? Math.min(100, (totals.calories / goal.calorie_target) * 100) : 0;
  const remaining = Math.max(0, (goal?.calorie_target || 0) - totals.calories);
  const over = totals.calories > (goal?.calorie_target || 0);

  const macros = [
    { label: 'Protein', value: totals.protein, target: goal?.protein_target_g, bar: 'bg-luxury-red' },
    { label: 'Carbs', value: totals.carbs, target: goal?.carb_target_g, bar: 'bg-luxury-blue' },
    { label: 'Fat', value: totals.fat, target: goal?.fat_target_g, bar: 'bg-luxury-gold' },
  ];

  return (
    <div className="glass rounded-2xl p-3.5 mb-3">
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-2xl font-bold tabular-nums leading-none">{Math.round(totals.calories)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">/ {goal?.calorie_target || '—'} kcal</p>
        </div>
        <div className="text-right">
          <p className={cn('text-base font-semibold tabular-nums', over ? 'text-luxury-red' : 'text-luxury-blue')}>
            {over ? '+' : ''}{Math.round(over ? totals.calories - (goal?.calorie_target || 0) : remaining)}
          </p>
          <p className="text-[10px] text-muted-foreground">{over ? 'over' : 'left'}</p>
        </div>
      </div>
      <div className="w-full h-2 rounded-full bg-muted/30 mb-3 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', over ? 'bg-luxury-red' : 'bg-luxury-blue')} style={{ width: `${Math.min(100, calPct)}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {macros.map((m) => {
          const pct = m.target ? Math.min(100, (m.value / m.target) * 100) : 0;
          return (
            <div key={m.label} className="flex flex-col">
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm font-bold tabular-nums">{Math.round(m.value)}</span>
                <span className="text-[10px] text-muted-foreground">/ {m.target ? Math.round(m.target) : '—'}g</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted/30 overflow-hidden mt-1">
                <div className={cn('h-full rounded-full transition-all', m.bar)} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{m.label}</span>
            </div>
          );
        })}
      </div>
      <button onClick={onShowDetails} className="w-full flex items-center justify-center gap-1 mt-2.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors min-h-[36px]">
        Details <ChevronDown size={13} />
      </button>
    </div>
  );
}