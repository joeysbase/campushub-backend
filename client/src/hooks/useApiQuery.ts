import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../api/campushubApi';

export interface ApiQuery<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/** The outcome of the most recent request that finished, and which request it was. */
interface SettledRequest<T> {
  fetcher: () => Promise<T>;
  reloadCount: number;
  data: T | undefined;
  error: string | null;
}

/**
 * Runs `fetcher` whenever its identity changes (wrap it in useCallback) or
 * `reload` is called. Loading means "the latest request hasn't settled yet", so
 * it's derived rather than stored. Responses from superseded requests are
 * ignored, so a slow old request can't overwrite newer data.
 */
export const useApiQuery = <T>(fetcher: () => Promise<T>, initialData: T): ApiQuery<T> => {
  const [settled, setSettled] = useState<SettledRequest<T> | null>(null);
  const [reloadCount, setReloadCount] = useState<number>(0);

  useEffect(() => {
    let ignore = false;

    const run = async (): Promise<void> => {
      try {
        const data = await fetcher();
        if (!ignore) setSettled({ fetcher, reloadCount, data, error: null });
      } catch (err: unknown) {
        if (ignore) return;
        // Keep showing the last good data alongside the error.
        setSettled((previous) => ({
          fetcher,
          reloadCount,
          data: previous?.data,
          error: getApiErrorMessage(err),
        }));
      }
    };
    void run();

    return () => {
      ignore = true;
    };
  }, [fetcher, reloadCount]);

  const reload = useCallback((): void => setReloadCount((count) => count + 1), []);

  const isCurrent = settled?.fetcher === fetcher && settled.reloadCount === reloadCount;
  return {
    data: settled?.data ?? initialData,
    isLoading: !isCurrent,
    error: isCurrent ? settled.error : null,
    reload,
  };
};
