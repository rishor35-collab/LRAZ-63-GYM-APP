import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, localDateStr } from '@/lib/utils';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function dayStatus(entry, target) {
  if (!entry) return 'none';
  const calTarget = target?.calorie_target || 0;
  const proTarget = target?.protein_target_g || 0;
  const calRatio = calTarget ? entry.calories / calTarget : 0;
  const proRatio = proTarget ? entry.protein / proTarget : 0;
  if (calRatio >= 0.85 && calRatio <= 1.15 && proRatio >= 0.85) return 'good';
  if (calRatio >= 0.6) return 'close';
  return 'far';
}

const STATUS_CLASS = {
  good: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  close: 'bg-luxury-gold/15 text-luxury-gold border-luxury-gold/30',
  far: 'bg-luxury-red/15 text-luxury-red border-luxury-red/30',
  none: 'bg-muted/20 text-muted-foreground border-border/40',
};

export default function NutritionCalendar({ byDate, target, selectedDate, onSelect }) {
  const [view, setView] = useState(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dateStr = (d) => localDateStr(new Date(year, month, d));
  const monthName = view.toLocaleString('default', { month: 'long' });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setView(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg glass min-h-[40px] min-w-[40px] flex items-center justify-center"><ChevronLeft size={16} /></button>
        <p className="text-sm font-semibold">{monthName} {year}</p>
        <button onClick={() => setView(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg glass min-h-[40px] min-w-[40px] flex items-center justify-center"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {DOW.map((d, i) => <div key={i} className="text-center text-[10px] text-muted-foreground font-medium">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const ds = dateStr(d);
          const status = dayStatus(byDate[ds], target);
          const selected = ds === selectedDate;
          return (
            <button key={i} onClick={() => onSelect(ds)}
              className={cn('aspect-square rounded-lg border text-xs font-medium flex items-center justify-center min-h-[40px] transition-all',
                STATUS_CLASS[status], selected && 'ring-2 ring-luxury-blue')}>
              {d}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[10px] text-muted-foreground">
        <Legend color="bg-emerald-400" label="On target" />
        <Legend color="bg-luxury-gold" label="Close" />
        <Legend color="bg-luxury-red" label="Far" />
        <Legend color="bg-muted-foreground/40" label="No data" />
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return <div className="flex items-center gap-1"><span className={cn('w-2 h-2 rounded-full', color)} /> {label}</div>;
}