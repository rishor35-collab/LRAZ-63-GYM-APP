import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fitnessRecordQuery } from '@/lib/fitnessDataCache';
import { queryClientInstance } from '@/lib/query-client';
import homeQueries from '@/lib/homeQueries';

const EMPTY = [];
export default function useHomeData(user, today, visible) {
  const signature = visible.join('|');
  const definitions = useMemo(() => homeQueries(user?.id, today, signature.split('|')), [user?.id, today, signature]);
  const results = useQueries({ queries: definitions.map(definition => ({ ...definition, enabled: !!user?.onboarding_completed })) });
  const resources = Object.fromEntries(definitions.map((definition, index) => [definition.name, results[index]]));
  const value = name => resources[name]?.data;
  const scheduled = value('scheduled')?.[0] || null;
  const programs = useQuery({ ...fitnessRecordQuery('TrainingProgram', user?.id, { id: scheduled?.program_id }, { limit: 1 }), enabled: !!user && visible.includes('today') && !!scheduled?.program_id });
  if (scheduled?.program_id) resources.programs = programs;
  const active = Object.values(resources).filter(Boolean);
  const loading = active.some(r => r.isPending);
  const loadError = active.find(r => r.error)?.error;
  const hasData = active.length > 0 && active.every(r => r.data !== undefined);
  return { goal: value('goal')?.[0] || null, measurements: value('measurements') || EMPTY, nutrition: value('nutrition') || EMPTY,
    sessions: value('sessions') || EMPTY, sets: value('sets') || EMPTY, recovery: value('recovery')?.[0] || null,
    achievements: value('achievements') || EMPTY, scheduled, programs: programs.data || EMPTY, cardio: value('cardio') || EMPTY,
    training: value('training'), resources, loading, error: loadError, hasData,
    reload: () => queryClientInstance.refetchQueries({ predicate: query => query.isActive() && (['fitness-records', 'fitness-summary'].includes(query.queryKey[0]) && query.queryKey[2] === user?.id || query.queryKey[0] === 'widget-training' && query.queryKey[1] === user?.id) }) };
}