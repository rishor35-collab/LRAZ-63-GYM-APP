import { useCallback, useEffect, useRef } from 'react';

const KEY = 'lraz_active_workout';
export default function useWorkoutDraft(draft, enabled) {
  const latest = useRef(null);
  latest.current = enabled ? draft : null;
  const flush = useCallback(() => {
    if (!latest.current) return;
    try { localStorage.setItem(KEY, JSON.stringify({ ...latest.current, savedAt: Date.now() })); } catch { /* Keep the active session usable if storage is full. */ }
  }, []);
  useEffect(() => {
    if (!enabled) return;
    const timeout = setTimeout(flush, 250);
    return () => clearTimeout(timeout);
  }, [draft, enabled, flush]);
  useEffect(() => {
    const onHidden = () => { if (document.hidden) flush(); };
    window.addEventListener('pagehide', flush);
    window.addEventListener('blur', flush);
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      flush();
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('blur', flush);
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, [flush]);
  return useCallback(() => {
    latest.current = null;
    localStorage.removeItem(KEY);
  }, []);
}