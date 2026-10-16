import React from 'react';
import { X, Activity, Bike, Waves, Mountain, Timer } from 'lucide-react';
import { ACTIVITIES } from '@/lib/cardioAnalytics';

function actIcon(id) {
  const a = ACTIVITIES.find((x) => x.id === id);
  const g = a?.group;
  if (g === 'Bike') return Bike;
  if (g === 'Swim' || g === 'Row') return Waves;
  if (g === 'Walk' && id === 'hiking') return Mountain;
  if (g === 'Jump' || g === 'Ropes') return Timer;
  return Activity;
}

// Activity picker for adding ad-hoc cardio to a workout. Same catalog as Cardio Session.
export default function CardioPickerSheet({ open, onClose, onPick }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md glass-strong rounded-t-3xl border-t border-border max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <p className="font-semibold">Add cardio</p>
          <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6 grid grid-cols-2 gap-2">
          {ACTIVITIES.map((a) => {
            const Icon = actIcon(a.id);
            return (
              <button key={a.id} onClick={() => onPick(a)} className="glass rounded-2xl p-3 flex items-center gap-2 text-left min-h-[52px] active:scale-[0.99] transition-transform">
                <div className="w-9 h-9 rounded-lg bg-luxury-red/15 text-luxury-red flex items-center justify-center shrink-0"><Icon size={16} /></div>
                <span className="text-sm font-medium leading-tight">{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}