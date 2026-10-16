export const DASHBOARD_WIDGETS = [
  { id: 'summary', label: 'Daily Summary', category: 'Overview', wide: true },
  { id: 'shortcuts', label: 'Dashboard Shortcuts', category: 'Actions', wide: true },
  { id: 'today', label: "Today's Training", category: 'Training', wide: true, resources: ['sessions', 'sets', 'recovery', 'scheduled', 'programs'] },
  { id: 'activity', label: "Today's Activity", category: 'Activity', resources: ['sessions', 'cardio'] },
  { id: 'cardio', label: 'Cardio Summary', category: 'Activity', resources: ['cardio'] },
  { id: 'readiness', label: 'Readiness', category: 'Recovery', resources: ['sessions', 'sets', 'recovery'] },
  { id: 'week', label: 'This Week', category: 'Training', resources: ['training'] },
  { id: 'nutrition', label: 'Nutrition Summary', category: 'Nutrition', resources: ['goal', 'nutrition'] },
  { id: 'progress', label: 'Progress Summary', category: 'Progress', resources: ['goal', 'measurements', 'sessions', 'sets'] },
  { id: 'recovery', label: 'Estimated Recovery', category: 'Recovery', resources: ['sessions', 'sets', 'recovery'] },
  { id: 'insights', label: 'Insights', category: 'Coaching', wide: true, resources: ['goal', 'measurements', 'sessions', 'sets', 'recovery', 'nutrition'] },
  { id: 'bestLifts', label: 'Best Lifts', category: 'Training', wide: true, resources: ['sets'] },
  { id: 'achievements', label: 'Achievements', category: 'Progress', wide: true, resources: ['achievements'] },
  { id: 'workout', label: "Today's Workout Widget", category: 'Training', type: 'workout' },
  { id: 'calories', label: 'Calories & Macros Widget', category: 'Nutrition', type: 'nutrition' },
  { id: 'water', label: 'Water Tracker', category: 'Nutrition', type: 'water' },
  { id: 'streak', label: 'Training Streak', category: 'Training', type: 'streak' },
  { id: 'weight', label: 'Weight Goal', category: 'Progress', type: 'weight' },
  { id: 'quick', label: 'Quick Actions Widget', category: 'Actions', type: 'quick' },
];
export const WIDGET_BY_ID = Object.fromEntries(DASHBOARD_WIDGETS.map(widget => [widget.id, widget]));
export function normalizeDashboardPreferences(value) {
  const saved = Array.isArray(value?.items) ? value.items : [];
  const seen = new Set();
  const items = saved.filter(item => item && WIDGET_BY_ID[item.id] && !seen.has(item.id) && seen.add(item.id)).map(item => ({ id: item.id, added: item.added !== false, enabled: item.enabled !== false, size: item.size === 'compact' ? 'compact' : 'standard' }));
  DASHBOARD_WIDGETS.forEach(widget => { if (!seen.has(widget.id)) items.push({ id: widget.id, added: !widget.type, enabled: true, size: widget.type ? 'compact' : 'standard' }); });
  return { version: 1, items };
}
export const activeDashboardIds = preferences => preferences.items.filter(item => item.added && item.enabled).map(item => item.id);