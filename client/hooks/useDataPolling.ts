import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to poll data at regular intervals for real-time sync.
 */
export function useDataPolling(
  fetchFn: () => void,
  intervalMs: number = 5000,
  enabled: boolean = true,
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchFnRef = useRef(fetchFn);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      fetchFnRef.current();
    }, intervalMs);
  }, [intervalMs]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }
    return stopPolling;
  }, [enabled, startPolling, stopPolling]);

  return { startPolling, stopPolling };
}
