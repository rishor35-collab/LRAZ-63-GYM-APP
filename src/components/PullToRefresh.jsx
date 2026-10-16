import React, { useEffect, useRef, useState } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Smooth iOS-style pull-to-refresh.
 * Wraps scrollable page content; triggers onRefresh when swiped down at scroll top.
 */
export default function PullToRefresh({ onRefresh, children, threshold = 70 }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const containerRef = useRef(null);

  useEffect(() => { refreshingRef.current = refreshing; }, [refreshing]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onStart = (e) => {
      if (window.scrollY > 0 || refreshingRef.current) return;
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
    };
    const onMove = (e) => {
      if (!pullingRef.current || refreshingRef.current) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy > 0 && window.scrollY <= 0) {
        e.preventDefault();
        const damped = Math.min(threshold * 1.6, dy * 0.5);
        pullRef.current = damped;
        setPull(damped);
      } else if (dy <= 0 && pullRef.current !== 0) {
        pullRef.current = 0;
        setPull(0);
      }
    };
    const onEnd = async () => {
      if (!pullingRef.current) return;
      pullingRef.current = false;
      if (pullRef.current >= threshold) {
        setRefreshing(true);
        refreshingRef.current = true;
        setPull(threshold);
        pullRef.current = threshold;
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          refreshingRef.current = false;
          setPull(0);
          pullRef.current = 0;
        }
      } else {
        setPull(0);
        pullRef.current = 0;
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [onRefresh, threshold]);

  const pct = Math.min(1, pull / threshold);

  return (
    <div ref={containerRef} className="relative">
      <div
        className="absolute top-0 inset-x-0 flex justify-center pointer-events-none z-10"
        style={{ height: threshold, transform: `translateY(${pull - threshold}px)`, opacity: refreshing ? 1 : pct }}
      >
        <div className="w-9 h-9 rounded-full glass flex items-center justify-center mt-1">
          {refreshing ? (
            <Loader2 size={18} className="text-luxury-blue animate-spin" />
          ) : (
            <ChevronDown size={18} className={cn('text-luxury-blue transition-transform duration-200', pull >= threshold && 'rotate-180')} />
          )}
        </div>
      </div>
      <div
        style={{
          transform: `translateY(${pull}px)`,
          transition: pullingRef.current ? 'none' : 'transform 0.3s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}