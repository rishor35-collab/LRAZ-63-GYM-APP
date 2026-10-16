import { base44 } from '@/api/base44Client';
import { queryClientInstance } from '@/lib/query-client';
import { recordsChanged } from '@/lib/fitnessInvalidation';
export { recordsChanged } from '@/lib/fitnessInvalidation';
import { computeReadinessFromInputs } from '@/lib/performanceAnalytics';
import { getActivity } from '@/lib/cardioAnalytics';
import { syncProfileFromMeasurement } from '@/lib/profileSync';

export async function syncLatestMeasurement(user) {
  if (!user) return false;
  const page = await base44.entities.BodyMeasurement.filter({ created_by_id: user.id, weight_kg: { $gt: 0 } }, { sort: '-date', limit: 1, fields: ['weight_kg', 'date'] });
  const latest = page.items[0];
  if (!latest || latest.weight_kg === user.weight_kg) return false;
  await syncProfileFromMeasurement(latest, user);
  return true;
}

export function fieldValue(record, field) {
  const value = record[field.key];
  if (value == null) return '';
  if (field.type !== 'datetime-local') return String(value);
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
export function recordPatch(record, fields, form) {
  const data = {}, unset = {};
  fields.forEach(field => {
    const value = form[field.key];
    if (value === fieldValue(record, field)) return;
    if (value === '' && !field.required) { unset[field.key] = ''; return; }
    data[field.key] = field.type === 'number' ? Number(value) : field.type === 'datetime-local' ? new Date(value).toISOString() : value;
  });
  return { data, unset };
}
export async function updateRecord(entity, record, patch) {
  const { data, unset } = patch;
  const next = { ...record, ...data };
  Object.keys(unset).forEach(key => delete next[key]);
  if (entity === 'RecoveryRecord') { data.readiness_score = computeReadinessFromInputs(next); data.recovery_score = data.readiness_score; }
  if (entity === 'BodyMeasurement' && ('weight_kg' in data || 'body_fat_percent' in data || 'weight_kg' in unset || 'body_fat_percent' in unset)) {
    if (next.weight_kg > 0 && next.body_fat_percent != null) {
      data.fat_mass_kg = +(next.weight_kg * next.body_fat_percent / 100).toFixed(2);
      data.lean_mass_kg = +(next.weight_kg - data.fat_mass_kg).toFixed(2);
    } else { unset.fat_mass_kg = ''; unset.lean_mass_kg = ''; }
    if (next.weight_kg > 0) data.weight_lbs = +(next.weight_kg * 2.2046226218).toFixed(2); else unset.weight_lbs = '';
  }
  if (entity === 'CardioSession') {
    if (data.activity) data.activity_label = getActivity(data.activity).label;
    data.avg_speed_kmh = next.duration_seconds > 0 && next.distance_km > 0 ? next.distance_km * 3600 / next.duration_seconds : 0;
    data.avg_pace_sec_per_km = next.distance_km > 0 ? next.duration_seconds / next.distance_km : 0;
  }
  if (Object.keys(data).length) await base44.entities[entity].update(record.id, data);
  if (Object.keys(unset).length) await base44.entities[entity].updateMany({ id: record.id }, { $unset: unset });
  recordsChanged(entity);
}