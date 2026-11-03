import { useState } from 'react';
import { getApiErrorMessage } from '../api/campushubApi';

export interface ApiMutation<TInput, TResult> {
  /** Runs the action. Resolves to the result, or to null on failure (see `error`); never rejects. */
  run: (input: TInput) => Promise<TResult | null>;
  /** The input of the request in flight, or null when idle (e.g. which row is being cancelled). */
  pendingInput: TInput | null;
  isPending: boolean;
  error: string | null;
  clearError: () => void;
}

export interface ApiMutationCallbacks<TResult> {
  onSuccess?: (result: TResult) => void;
  /** Called after success or failure. */
  onSettled?: () => void;
}

/** Pending and error state for a write (create, cancel, ...), with errors turned into messages. */
export const useApiMutation = <TInput, TResult>(
  action: (input: TInput) => Promise<TResult>,
  { onSuccess, onSettled }: ApiMutationCallbacks<TResult> = {},
): ApiMutation<TInput, TResult> => {
  const [pendingInput, setPendingInput] = useState<TInput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (input: TInput): Promise<TResult | null> => {
    setPendingInput(input);
    setError(null);
    try {
      const result = await action(input);
      onSuccess?.(result);
      return result;
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
      return null;
    } finally {
      setPendingInput(null);
      onSettled?.();
    }
  };

  return {
    run,
    pendingInput,
    isPending: pendingInput !== null,
    error,
    clearError: () => setError(null),
  };
};
