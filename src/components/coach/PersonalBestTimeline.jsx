import React from 'react';
import { Card } from '@/components/ui/fitness';
import { Dumbbell, Activity, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON = { strength: Dumbbell, cardio: Activity, weight: Scale };
const COLOR = { strength: 'text-luxury-blue bg-luxury-blue/15', cardio: 'text-luxury-red bg-luxury-red/15', weight: 'text-luxury-gold bg-luxury-gold/15' };

// Unified Personal Best timeline across strength, cardio, and weight.
export default function PersonalBestTimeline({ events }) {
  if (!events || !events.length) return null;
  return (
    <Card className="mb-4">
      <p className="text-xs text-muted-foreground mb-3">Personal Best timeline</p>
      <div className="space-y-3">
        {events.slice(0, 20).map((e, i) => {
          const Icon = ICON[e.type] || Dumbbell;
          return (
            <div key={i} className="flex items-center gap-3">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', COLOR[e.type])}><Icon size={15} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{e.label}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums shrink-0">{e.value}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}