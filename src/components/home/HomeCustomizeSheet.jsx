import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const CARDS = [
  { id: 'activity', label: "Today's Activity" },
  { id: 'readiness', label: 'Readiness' },
  { id: 'recovery', label: 'Estimated Recovery' },
  { id: 'insights', label: 'Insights' },
  { id: 'bestLifts', label: 'Best Lifts' },
  { id: 'achievements', label: 'Achievements' },
];

// Home dashboard card visibility customizer. Persisted to localStorage.
export default function HomeCustomizeSheet({ config, onChange, onClose }) {
  const toggle = (id) => onChange({ ...config, [id]: !(config[id] !== false) });
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong rounded-t-3xl p-5 pb-8 safe-pb animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Customize Home</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="min-h-[44px] min-w-[44px] p-2"><X size={18} /></Button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Show or hide cards on your dashboard. Core cards (Today, Week, Nutrition, Progress) stay visible.</p>
        <div className="space-y-2">
          {CARDS.map((c) => {
            const visible = config[c.id] !== false;
            return (
              <button key={c.id} onClick={() => toggle(c.id)} className="w-full flex items-center justify-between glass rounded-xl p-3 min-h-[48px]">
                <span className="text-sm font-medium">{c.label}</span>
                <span className={cn('flex items-center gap-1 text-xs font-semibold', visible ? 'text-luxury-blue' : 'text-muted-foreground')}>
                  {visible ? <><Eye size={14} /> Visible</> : <><EyeOff size={14} /> Hidden</>}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}