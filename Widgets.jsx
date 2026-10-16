import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWidgetData } from '@/hooks/useWidgetData';
import TodayWorkoutWidget from '@/components/widgets/TodayWorkoutWidget';
import NutritionWidget from '@/components/widgets/NutritionWidget';
import WaterWidget from '@/components/widgets/WaterWidget';
import StreakWidget from '@/components/widgets/StreakWidget';
import WeightGoalWidget from '@/components/widgets/WeightGoalWidget';
import QuickActionsWidget from '@/components/widgets/QuickActionsWidget';
import { Smartphone, ArrowLeft } from 'lucide-react';

const WIDGETS = [
  { type: 'workout', component: TodayWorkoutWidget },
  { type: 'nutrition', component: NutritionWidget },
  { type: 'water', component: WaterWidget },
  { type: 'streak', component: StreakWidget },
  { type: 'weight', component: WeightGoalWidget },
  { type: 'quick', component: QuickActionsWidget },
];

export default function Widgets() {
  const data = useWidgetData();
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-36">
      <div className="flex items-center gap-3 mb-4 animate-fade-up">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl glass flex items-center justify-center min-h-[44px] min-w-[44px]">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Widgets</h1>
          <p className="text-xs text-muted-foreground">Quick-glance views for your home screen</p>
        </div>
      </div>

      <div className="glass rounded-xl p-3 mb-4 flex items-start gap-3">
        <Smartphone size={18} className="text-luxury-blue mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Install LRAZ 63 as a PWA (Add to Home Screen) to access these widgets as app shortcuts. Each widget opens as a standalone, lightweight view.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {WIDGETS.map(({ type, component: Widget }) => (
          <Link key={type} to={`/widget/${type}`} className="block">
            <Widget data={data} />
          </Link>
        ))}
      </div>
    </div>
  );
}