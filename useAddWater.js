import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { fitnessSummaryQuery } from '@/lib/fitnessDataCache';
import { recordsChanged } from '@/lib/fitnessInvalidation';

export default function useAddWater(userId, today) {
  const client = useQueryClient(), locked = useRef(false);
  const mutation = useMutation({ mutationFn: ml => base44.entities.NutritionLog.create({ date: today, meal: 'Snack', food_name: 'Water', quantity: ml, unit: 'ml', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0, source: 'Database', logged_at: new Date().toISOString() }),
    onSuccess: (record, ml) => {
      const query = fitnessSummaryQuery('NutritionLog', userId, { query: { date: today, food_name: 'Water' }, groupBy: 'unit', sum: 'quantity' });
      client.setQueryData(query.queryKey, previous => {
        if (!previous) return previous;
        const exists = previous.rows.some(row => row.unit === 'ml');
        const rows = previous.rows.map(row => row.unit === 'ml' ? { ...row, sum_quantity: (row.sum_quantity || 0) + ml, count: (row.count || 0) + 1 } : row);
        return { ...previous, rows: exists ? rows : [...rows, { unit: 'ml', sum_quantity: ml, count: 1 }] };
      });
      recordsChanged('NutritionLog');
    } });
  const add = async ml => {
    if (locked.current) return;
    locked.current = true;
    try { await mutation.mutateAsync(ml); } finally { locked.current = false; }
  };
  return { add, busy: mutation.isPending, error: mutation.error };
}