import { useSyncExternalStore } from 'react';
import { localDateStr } from '@/lib/utils';

let day = localDateStr(), timer;
const listeners = new Set();
function update() {
  const next = localDateStr();
  if (next !== day) { day = next; listeners.forEach(listener => listener()); }
  clearTimeout(timer);
  if (listeners.size) { const midnight = new Date(); midnight.setHours(24, 0, 0, 0); timer = setTimeout(update, midnight.getTime() - Date.now() + 100); }
}
function visible() { if (!document.hidden) update(); }
function subscribe(listener) {
  listeners.add(listener);
  if (listeners.size === 1) { update(); document.addEventListener('visibilitychange', visible); }
  return () => { listeners.delete(listener); if (!listeners.size) { clearTimeout(timer); document.removeEventListener('visibilitychange', visible); } };
}
const snapshot = () => day;
export default function useLocalDay() { return useSyncExternalStore(subscribe, snapshot, snapshot); }