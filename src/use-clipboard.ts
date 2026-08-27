import { useCallback, useEffect, useRef, useState } from 'react';
import { copyToClipboard, type CopyOptions } from './index';

export interface UseClipboardOptions {
  /** How long `copied` stays true before resetting. 0 disables the reset. */
  copiedTimeout?: number;
}

export interface UseClipboardResult {
  /** Copy text (or rich HTML via options); resolves true on success. */
  copy: (content: string, options?: CopyOptions) => Promise<boolean>;
  /** True after a successful copy; auto-resets after copiedTimeout. */
  copied: boolean;
  /** The last rejection surfaced by the copy attempt, if any. */
  error: Error | null;
  /** Manually clear copied/error state. */
  reset: () => void;
}

/**
 * React adapter over ferry's clipboard APIs.
 *
 * ```tsx
 * const { copy, copied, error } = useClipboard();
 * <button onClick={() => copy('hello')}>{copied ? 'Copied!' : 'Copy'}</button>
 * ```
 */
export function useClipboard({
  copiedTimeout = 2000,
}: UseClipboardOptions = {}): UseClipboardResult {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') window.clearTimeout(timerRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
  }, []);

  const copy = useCallback(
    async (content: string, options?: CopyOptions): Promise<boolean> => {
      try {
        await copyToClipboard(content, options);
        setCopied(true);
        setError(null);
        if (copiedTimeout > 0 && typeof window !== 'undefined') {
          window.clearTimeout(timerRef.current);
          timerRef.current = window.setTimeout(() => setCopied(false), copiedTimeout);
        }
        return true;
      } catch (err) {
        setCopied(false);
        setError(err as Error);
        return false;
      }
    },
    [copiedTimeout],
  );

  return { copy, copied, error, reset };
}
