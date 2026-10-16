import { useCallback, useRef } from 'react';

export default function useLatestCallback(callback) {
  const latest = useRef(callback);
  latest.current = callback;
  return useCallback((...args) => latest.current(...args), []);
}