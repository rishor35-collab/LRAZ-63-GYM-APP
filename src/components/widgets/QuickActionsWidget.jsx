import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/fitness';
import { Dumbbell, Activity, Plus, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QuickActionsWidget({ data, standalone }) {
  const navigate = useNavigate();
  const actions = [
    { icon: Dumbbell, label: 'Workout', path: '/workout/new', color: 'text-luxury-blue', bg: 'bg-luxury-blue/15' },
    { icon: Activity, label: 'Cardio', path: '/cardio', color: 'text-luxury-red', bg: 'bg-luxury-red/15' },
    { icon: Plus, label: 'Log Food', path: '/nutrition', color: 'text-luxury-blue', bg: 'bg-luxury-blue/15' },
    { icon: Scale, label: 'Weight', path: '/progress', color: 'text-luxury-gold', bg: 'bg-luxury-gold/15' },
  ];
  return (
    <Card className={cn('flex flex-col', standalone && 'min-h-[260px]')}>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Quick Actions</span>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.path)}
            className={cn('flex flex-col items-center gap-1.5 glass rounded-xl py-3 min-h-[64px]')}
          >
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', a.bg)}>
              <a.icon size={18} className={a.color} />
            </div>
            <span className="text-[10px] text-muted-foreground">{a.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}