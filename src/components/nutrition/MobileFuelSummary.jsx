import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

/**
 * Mobile-only Fuel summary card with a visual calorie ring,
 * inline macro bars, and remaining/over indicator.
 * Deterministic — uses only passed-in totals/goal, no AI.
 */
export default function MobileFuelSummary({ totals, goal, onShowDetails }) {
  const calPct = goal?.calorie_target ? Math.min(100, (totals.calories / goal.calorie_target) * 100) : 0;
  const remaining = Math.max(0, (goal?.calorie_target || 0) - totals.calories);
  const over = totals.calories > (goal?.calorie_target || 0);
  const target = goal?.calorie_target || 0;

  const macros = [
    { label: 'P', value: totals.protein, target: goal?.protein_target_g, bar: 'bg-luxury-red' },
    { label: 'C', value: totals.carbs, target: goal?.carb_target_g, bar: 'bg-luxury-blue' },
    { label: 'F', value: totals.fat, target: goal?.fat_target_g, bar: 'bg-luxury-gold' },
  ];

  const size = 88;
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (calPct / 100) * circ;

  return (
    <div className="glass rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-4">
        {/* Calorie ring */}
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/30" />
            <circle
              cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke}
              strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
              className={cn(over ? 'text-luxury-red' : 'text-luxury-blue', 'transition-all duration-700')}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold tabular-nums leading-none">{Math.round(totals.calories)}</span>
            <span className="text-[8px] text-muted-foreground mt-0.5">/ {target || '—'}</span>
          </div>
        </div>

        {/* Remaining + macros */}
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <p className={cn('text-base font-bold tabular-nums leading-none', over ? 'text-luxury-red' : 'text-luxury-blue')}>
              {over ? '+' : ''}{Math.round(over ? totals.calories - target : remaining)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{over ? 'kcal over target' : 'kcal remaining'}</p>
          </div>
          <div className="space-y-1.5">
            {macros.map((m) => {
              const pct = m.target ? Math.min(100, (m.value / m.target) * 100) : 0;
              return (
                <div key={m.label} className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-muted-foreground w-3">{m.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', m.bar)} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground w-14 text-right">
                    {Math.round(m.value)}{m.target ? `/${Math.round(m.target)}` : ''}g
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <button
        onClick={onShowDetails}
        className="w-full flex items-center justify-center gap-1 mt-3 pt-2.5 border-t border-border/30 text-[11px] text-muted-foreground hover:text-foreground transition-colors min-h-[36px]"
      >
        Nutrition Details <ChevronDown size={13} />
      </button>
    </div>
  );
}