import React, { memo } from 'react';
import { useWidgetData } from '@/hooks/useWidgetData';
import WidgetStatus from '@/components/widgets/WidgetStatus';
import TodayWorkoutWidget from '@/components/widgets/TodayWorkoutWidget';
import NutritionWidget from '@/components/widgets/NutritionWidget';
import WaterWidget from '@/components/widgets/WaterWidget';
import StreakWidget from '@/components/widgets/StreakWidget';
import WeightGoalWidget from '@/components/widgets/WeightGoalWidget';
import QuickActionsWidget from '@/components/widgets/QuickActionsWidget';

export const WIDGET_TITLES = { workout: "Today's Workout", nutrition: 'Calories & Macros', water: 'Water Tracker', streak: 'Training Streak', weight: 'Weight Goal', quick: 'Quick Actions' };
const COMPONENTS = { workout: TodayWorkoutWidget, nutrition: NutritionWidget, water: WaterWidget, streak: StreakWidget, weight: WeightGoalWidget, quick: QuickActionsWidget };
function WidgetTile({ type, standalone = false }) {
  const data = useWidgetData(type);
  const Widget = COMPONENTS[type];
  if (!Widget) return null;
  return <WidgetStatus title={WIDGET_TITLES[type]} {...data} onRetry={data.reload}><Widget data={data} standalone={standalone} /></WidgetStatus>;
}
export default memo(WidgetTile);