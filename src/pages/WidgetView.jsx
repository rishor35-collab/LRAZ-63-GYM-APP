import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWidgetData } from '@/hooks/useWidgetData';
import TodayWorkoutWidget from '@/components/widgets/TodayWorkoutWidget';
import NutritionWidget from '@/components/widgets/NutritionWidget';
import WaterWidget from '@/components/widgets/WaterWidget';
import StreakWidget from '@/components/widgets/StreakWidget';
import WeightGoalWidget from '@/components/widgets/WeightGoalWidget';
import QuickActionsWidget from '@/components/widgets/QuickActionsWidget';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const WIDGET_MAP = {
  workout: { component: TodayWorkoutWidget, title: "Today's Workout" },
  nutrition: { component: NutritionWidget, title: "Calories & Macros" },
  water: { component: WaterWidget, title: "Water Tracker" },
  streak: { component: StreakWidget, title: "Training Streak" },
  weight: { component: WeightGoalWidget, title: "Weight Goal" },
  quick: { component: QuickActionsWidget, title: "Quick Actions" },
};

export default function WidgetView() {
  const { type } = useParams();
  const navigate = useNavigate();
  const data = useWidgetData();
  const config = WIDGET_MAP[type];

  if (!config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">Widget not found.</p>
        <Link to="/" className="text-luxury-blue text-sm font-medium">Open App</Link>
      </div>
    );
  }

  const Widget = config.component;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 safe-pt">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl glass flex items-center justify-center min-h-[44px] min-w-[44px]">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-sm font-semibold">{config.title}</h1>
        <Link to="/" className="w-10 h-10 rounded-xl glass flex items-center justify-center min-h-[44px] min-w-[44px]">
          <ExternalLink size={16} />
        </Link>
      </header>
      <main className="flex-1 px-4 pb-4 safe-pb flex items-center justify-center">
        <div className="w-full max-w-sm">
          <Widget data={data} standalone />
        </div>
      </main>
    </div>
  );
}