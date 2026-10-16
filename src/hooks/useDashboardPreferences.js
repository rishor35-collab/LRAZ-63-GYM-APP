import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { normalizeDashboardPreferences } from '@/lib/dashboardWidgets';

export default function useDashboardPreferences() {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = ['dashboard-preferences', user?.id];
  const preference = useQuery({ queryKey: key, enabled: !!user, staleTime: Infinity,
    initialData: () => {
      if (!user) return undefined;
      if (user.dashboard_preferences) return normalizeDashboardPreferences(user.dashboard_preferences);
      try { return normalizeDashboardPreferences(JSON.parse(localStorage.getItem(`lraz_dashboard_${user.id}`) || 'null')); }
      catch { return normalizeDashboardPreferences(); }
    }, queryFn: async () => normalizeDashboardPreferences((await base44.auth.me()).dashboard_preferences) });
  const mutation = useMutation({ mutationFn: async value => {
    if (!user) throw new Error('Please sign in to save your dashboard.');
    const next = normalizeDashboardPreferences(value);
    await base44.auth.updateMe({ dashboard_preferences: next });
    return next;
  }, onSuccess: next => {
    client.setQueryData(key, next);
    try { localStorage.setItem(`lraz_dashboard_${user.id}`, JSON.stringify(next)); } catch { /* Account preferences remain saved. */ }
  } });
  return { preferences: preference.data || normalizeDashboardPreferences(), save: mutation.mutateAsync, saving: mutation.isPending, error: mutation.error, resetError: mutation.reset };
}