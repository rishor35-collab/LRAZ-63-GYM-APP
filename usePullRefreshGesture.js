import { useEffect, useRef } from 'react';
import useLatestCallback from '@/hooks/useLatestCallback';

export default function usePullRefreshGesture(onRefresh, threshold, setRefreshing) {
  const root = useRef(null), content = useRef(null), indicator = useRef(null);
  const refresh = useLatestCallback(onRefresh);
  useEffect(() => {
    const el = root.current;
    let start = null, pull = 0, busy = false, frame = 0, alive = true;
    const paint = (animate = false) => {
      if (!content.current || !indicator.current) return;
      content.current.style.transition = animate ? 'transform .2s ease-out' : 'none';
      content.current.style.transform = pull ? `translateY(${pull}px)` : '';
      indicator.current.style.transform = `translateY(${pull - threshold}px)`;
      indicator.current.style.opacity = busy ? '1' : String(Math.min(1, pull / threshold));
    };
    const begin = (event) => {
      if (busy || window.scrollY > 0 || event.touches.length !== 1 || event.target.closest('button,a,input,textarea,select,[role="dialog"],.overflow-y-auto,.overflow-x-auto')) return;
      start = event.touches[0].clientY;
    };
    const move = (event) => {
      if (start == null || busy) return;
      const dy = event.touches[0].clientY - start;
      if (dy < 0 || window.scrollY > 0) { start = null; pull = 0; } else pull = Math.min(threshold * 1.6, dy * .5);
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; paint(); });
    };
    const finish = async (event) => {
      if (start == null || busy) return;
      start = null; cancelAnimationFrame(frame); frame = 0;
      if (event.type !== 'touchcancel' && pull >= threshold) {
        busy = true; pull = threshold; setRefreshing(true); paint(true);
        try { await refresh(); } finally { busy = false; pull = 0; if (alive) { setRefreshing(false); paint(true); } }
      } else { pull = 0; paint(true); }
    };
    el.addEventListener('touchstart', begin, { passive: true }); el.addEventListener('touchmove', move, { passive: true });
    el.addEventListener('touchend', finish, { passive: true }); el.addEventListener('touchcancel', finish, { passive: true });
    return () => { alive = false; cancelAnimationFrame(frame); el.removeEventListener('touchstart', begin); el.removeEventListener('touchmove', move); el.removeEventListener('touchend', finish); el.removeEventListener('touchcancel', finish); };
  }, [refresh, threshold, setRefreshing]);
  return { root, content, indicator };
}