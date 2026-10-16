import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/fitness';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const ZONES = [
  { name: 'Zone 1', label: 'Very Light', pct: [50, 60], color: 'bg-sky-500', desc: 'Recovery, warm-up' },
  { name: 'Zone 2', label: 'Light', pct: [60, 70], color: 'bg-emerald-500', desc: 'Endurance, fat burn' },
  { name: 'Zone 3', label: 'Moderate', pct: [70, 80], color: 'bg-luxury-gold', desc: 'Aerobic, tempo' },
  { name: 'Zone 4', label: 'Hard', pct: [80, 90], color: 'bg-orange-500', desc: 'Anaerobic threshold' },
  { name: 'Zone 5', label: 'Max', pct: [90, 100], color: 'bg-luxury-red', desc: 'VO2 max, intervals' },
];

export default function HRZones() {
  const navigate = useNavigate();
  const [age, setAge] = useState('');
  const [resting, setResting] = useState('');

  const maxHr = useMemo(() => (age ? Math.round(220 - Number(age)) : null), [age]);

  const zones = useMemo(() => {
    if (!maxHr) return [];
    return ZONES.map((z) => {
      const low = Math.round((z.pct[0] / 100) * maxHr);
      const high = Math.round((z.pct[1] / 100) * maxHr);
      return { ...z, low, high };
    });
  }, [maxHr]);

  return (
    <div className="min-h-screen safe-pt px-4 pb-36 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"><ArrowLeft size={22} /></button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Heart Rate Zones</h1>
          <p className="text-[11px] text-muted-foreground">Determine your training zones</p>
        </div>
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Age</Label><Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="30" className="glass" /></div>
          <div className="flex flex-col gap-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Resting HR (optional)</Label><Input type="number" value={resting} onChange={(e) => setResting(e.target.value)} placeholder="60" className="glass" /></div>
        </div>
        {maxHr && <p className="text-sm text-muted-foreground mt-3">Estimated Max HR: <span className="font-bold text-luxury-blue">{maxHr} bpm</span> <span className="text-[10px]">(220 − age)</span></p>}
      </Card>

      {!zones.length ? (
        <Card className="text-center py-8"><Heart size={28} className="text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">Enter your age to calculate zones.</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {zones.map((z) => (
            <Card key={z.name} className="flex items-center gap-3">
              <div className={cn('w-2.5 h-12 rounded-full shrink-0', z.color)} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{z.name} · {z.label}</p>
                  <p className="text-sm font-bold tabular-nums">{z.low}–{z.high} bpm</p>
                </div>
                <p className="text-[11px] text-muted-foreground">{z.desc}</p>
              </div>
            </Card>
          ))}
          <p className="text-[10px] text-muted-foreground text-center mt-3">Zones use the simple % of max HR method. For precision, use Karvonen (with resting HR) or a lab test. Estimates, not medical guidance.</p>
        </div>
      )}
    </div>
  );
}