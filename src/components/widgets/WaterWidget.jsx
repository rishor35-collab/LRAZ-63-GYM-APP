import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, Ring } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';

const WATER_TARGET = 3000;

export default function WaterWidget({ data, standalone }) {
  const { nutrition, today, loading, reload } = data;
  const [busy, setBusy] = useState(false);

  const waterMl = useMemo(() => {
    return (nutrition || [])
      .filter((l) => l.date === today && l.food_name === 'Water')
      .reduce((a, n) => a + (n.quantity || 0), 0);
  }, [nutrition, today]);

  const pct = Math.min(100, (waterMl / WATER_TARGET) * 100);
  const remaining = Math.max(0, WATER_TARGET - waterMl);

  const addWater = async (ml) => {
    setBusy(true);
    try {
      await base44.entities.NutritionLog.create({
        date: today, meal: 'Snack', food_name: 'Water',
        quantity: ml, unit: 'ml', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0,
        fiber_g: 0, sugar_g: 0, sodium_mg: 0, source: 'Database', logged_at: new Date().toISOString(),
      });
      reload?.();
    } catch (e) { console.error(e); }
    finally { setBusy(false); }
  };

  if (loading) return <Card className={cn('animate-pulse', standalone ? 'min-h-[240px]' : 'min-h-[150px]')} />;

  return (
    <Card className={cn('flex flex-col items-center', standalone && 'min-h-[260px]')}>
      <div className="flex items-center gap-2 mb-2 self-start">
        <div className="w-8 h-8 rounded-lg bg-luxury-blue/15 flex items-center justify-center">
          <Droplets size={16} className="text-luxury-blue" />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Water</span>
      </div>
      <Ring value={pct} size={standalone ? 140 : 96} stroke={standalone ? 12 : 8} label="ml" color="blue" />
      <div className="text-center mt-2">
        <p className="text-lg font-bold tabular-nums">{Math.round(waterMl).toLocaleString()} ml</p>
        <p className="text-[10px] text-muted-foreground">/ {WATER_TARGET.toLocaleString()} · {Math.round(remaining).toLocaleString()} left</p>
      </div>
      {standalone && (
        <div className="grid grid-cols-3 gap-2 w-full mt-4">
          {[250, 500, 750].map((ml) => (
            <Button key={ml} variant="outline" className="glass min-h-[44px]" disabled={busy} onClick={() => addWater(ml)}>
              +{ml}ml
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
}