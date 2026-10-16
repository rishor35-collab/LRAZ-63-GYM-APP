import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { Scale, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WeightGoalWidget({ data, standalone }) {
  const navigate = useNavigate();
  const { measurements, goal, user, loading } = data;

  const { current, start, target, pct } = useMemo(() => {
    const weights = (measurements || []).map((m) => m.weight_kg).filter(Boolean);
    const current = weights[weights.length - 1] || user?.weight_kg;
    const start = weights[0];
    const target = goal?.target_weight_kg;
    let pct = 0;
    if (current != null && target != null && start != null && start !== target) {
      pct = Math.min(100, Math.max(0, ((current - start) / (target - start)) * 100));
    }
    return { current, start, target, pct };
  }, [measurements, goal, user]);

  if (loading) return <Card className={cn('animate-pulse', standalone ? 'min-h-[240px]' : 'min-h-[150px]')} />;

  return (
    <Card className={cn('flex flex-col', standalone && 'min-h-[260px]')}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-luxury-gold/15 flex items-center justify-center">
          <Scale size={16} className="text-luxury-gold" />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Weight Goal</span>
      </div>
      {current != null ? (
        <>
          <div className="flex items-end justify-between">
            <div>
              <p className={cn('font-bold tabular-nums', standalone ? 'text-3xl' : 'text-xl')}>
                {current}<span className="text-sm text-muted-foreground ml-1">kg</span>
              </p>
              <p className="text-[10px] text-muted-foreground">current</p>
            </div>
            {target != null && (
              <div className="text-right">
                <p className="text-lg font-bold tabular-nums text-muted-foreground">
                  {target}<span className="text-xs text-muted-foreground ml-1">kg</span>
                </p>
                <p className="text-[10px] text-muted-foreground">target</p>
              </div>
            )}
          </div>
          {target != null && start != null && (
            <>
              <div className="h-2 rounded-full bg-muted/40 overflow-hidden mt-3">
                <div className="h-full bg-luxury-gold transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 text-center">{Math.round(pct)}% to goal</p>
            </>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">No weight logged yet. Add your first measurement to start tracking.</p>
      )}
      <Button variant="outline" className={cn('w-full mt-auto glass', standalone ? 'mt-4' : 'mt-3')} onClick={() => navigate('/progress')}>
        <Plus size={16} /> Log Weight
      </Button>
    </Card>
  );
}