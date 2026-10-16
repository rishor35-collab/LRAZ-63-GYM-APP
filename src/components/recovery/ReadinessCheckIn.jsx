import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Check, Moon, Activity, Zap, Brain, Smile, Heart } from 'lucide-react';
import { computeReadinessFromInputs } from '@/lib/performanceAnalytics';
import { Ring } from '@/components/ui/fitness';
import { cn, localDateStr } from '@/lib/utils';

const TODAY = localDateStr();

export default function ReadinessCheckIn({ onClose, onSaved }) {
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(7);
  const [soreness, setSoreness] = useState(3);
  const [stress, setStress] = useState(3);
  const [energy, setEnergy] = useState(7);
  const [mood, setMood] = useState(7);
  const [saving, setSaving] = useState(false);

  const readiness = computeReadinessFromInputs({ sleep_hours: sleepHours, sleep_quality: sleepQuality, soreness_level: soreness, stress_level: stress, energy, mood });

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.RecoveryRecord.create({
        date: TODAY,
        sleep_hours: sleepHours,
        sleep_quality: sleepQuality,
        soreness_level: soreness,
        stress_level: stress,
        energy,
        mood,
        readiness_score: readiness,
        recovery_score: readiness,
        source: 'Manual',
      });
      onSaved?.();
      onClose();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Daily Check-In</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="min-h-[44px] min-w-[44px] p-2"><X size={18} /></Button>
        </div>

        <div className="flex items-center justify-center mb-5">
          <Ring value={readiness} label="Readiness" size={120} color={readiness >= 70 ? 'blue' : readiness >= 40 ? 'gold' : 'red'} />
        </div>

        <div className="space-y-4">
          <div>
            <Label icon={Moon} text="Sleep hours" />
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="12" step="0.5" value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} className="flex-1 accent-luxury-blue" />
              <span className="text-lg font-bold tabular-nums w-12 text-right">{sleepHours}h</span>
            </div>
          </div>
          <Stepper icon={Moon} label="Sleep quality" value={sleepQuality} onChange={setSleepQuality} />
          <Stepper icon={Activity} label="Soreness" value={soreness} onChange={setSoreness} invert />
          <Stepper icon={Brain} label="Stress" value={stress} onChange={setStress} invert />
          <Stepper icon={Zap} label="Energy" value={energy} onChange={setEnergy} />
          <Stepper icon={Smile} label="Mood" value={mood} onChange={setMood} />
        </div>

        <p className="text-[10px] text-muted-foreground mt-4 flex items-start gap-1"><Heart size={11} className="mt-0.5 shrink-0" /> Readiness is an estimate from your inputs — not a medical measurement. Higher sleep, energy and mood raise it; higher soreness and stress lower it.</p>

        <Button onClick={save} disabled={saving} className="w-full mt-4 bg-luxury-blue glow-blue min-h-[48px]">{saving ? 'Saving…' : <><Check size={18} /> Save Check-In</>}</Button>
      </div>
    </div>
  );
}

function Label({ icon: Icon, text }) {
  return <p className="text-xs font-medium flex items-center gap-1.5 mb-2 text-muted-foreground"><Icon size={13} /> {text}</p>;
}

function Stepper({ icon: Icon, label, value, onChange, invert }) {
  const tone = invert ? (value >= 7 ? 'text-luxury-red' : value <= 3 ? 'text-emerald-400' : 'text-foreground') : (value >= 7 ? 'text-emerald-400' : value <= 3 ? 'text-luxury-red' : 'text-foreground');
  return (
    <div>
      <Label icon={Icon} text={label} />
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(Math.max(1, value - 1))} className="w-10 h-10 rounded-xl glass flex items-center justify-center min-h-[44px] text-lg font-bold">−</button>
        <div className="flex-1 flex items-center justify-center gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <button key={i} onClick={() => onChange(i + 1)} className={cn('h-2.5 rounded-full transition-all', i < value ? (invert ? 'bg-luxury-red' : 'bg-luxury-blue') : 'bg-muted/40')} style={{ flex: 1 }} />
          ))}
        </div>
        <button onClick={() => onChange(Math.min(10, value + 1))} className="w-10 h-10 rounded-xl glass flex items-center justify-center min-h-[44px] text-lg font-bold">+</button>
        <span className={cn('text-lg font-bold tabular-nums w-8 text-right', tone)}>{value}</span>
      </div>
    </div>
  );
}