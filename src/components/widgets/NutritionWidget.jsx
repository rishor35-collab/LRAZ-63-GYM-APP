import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Ring } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Flame, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NutritionWidget({ data, standalone }) {
  const navigate = useNavigate();
  const { goal, nutrition, today, loading } = data;

  const totals = useMemo(() => {
    const foodLogs = (nutrition || []).filter((l) => l.date === today && l.food_name !== 'Water');
    return foodLogs.reduce((acc, n) => ({
      calories: acc.calories + (n.calories || 0),
      protein: acc.protein + (n.protein_g || 0),
      carbs: acc.carbs + (n.carbs_g || 0),
      fat: acc.fat + (n.fat_g || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [nutrition, today]);

  const target = goal?.calorie_target || 2000;
  const remaining = Math.max(0, Math.round(target - totals.calories));
  const pct = Math.min(100, (totals.calories / target) * 100);

  if (loading) return <Card className={cn('animate-pulse', standalone ? 'min-h-[240px]' : 'min-h-[150px]')} />;

  return (
    <Card className={cn('flex flex-col items-center', standalone && 'min-h-[260px]')}>
      <div className="flex items-center gap-2 mb-2 self-start">
        <div className="w-8 h-8 rounded-lg bg-luxury-red/15 flex items-center justify-center">
          <Flame size={16} className="text-luxury-red" />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Calories</span>
      </div>
      <Ring value={pct} size={standalone ? 140 : 96} stroke={standalone ? 12 : 8} label="kcal" />
      <div className="text-center mt-2">
        <p className="text-lg font-bold tabular-nums">{Math.round(totals.calories).toLocaleString()}</p>
        <p className="text-[10px] text-muted-foreground">/ {Math.round(target).toLocaleString()} · {remaining.toLocaleString()} left</p>
      </div>
      <div className="flex gap-3 mt-2 text-center">
        <div><p className="text-sm font-bold text-luxury-blue">{Math.round(totals.protein)}g</p><p className="text-[9px] text-muted-foreground">Protein</p></div>
        <div><p className="text-sm font-bold">{Math.round(totals.carbs)}g</p><p className="text-[9px] text-muted-foreground">Carbs</p></div>
        <div><p className="text-sm font-bold">{Math.round(totals.fat)}g</p><p className="text-[9px] text-muted-foreground">Fat</p></div>
      </div>
      <Button variant="outline" className={cn('w-full mt-auto glass', standalone ? 'mt-4' : 'mt-3')} onClick={() => navigate('/nutrition')}>
        <Plus size={16} /> Log Food
      </Button>
    </Card>
  );
}