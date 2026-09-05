import { writable, type Readable } from 'svelte/store';
import { copyToClipboard, type CopyOptions } from './index';

export interface UseClipboardOptions {
  /** How long `copied` stays true before resetting. 0 disables the reset. */
  copiedTimeout?: number;
}

export interface UseClipboardStores {
  /** Copy text (or rich HTML via options); resolves true on success. */
  copy: (content: string, options?: CopyOptions) => Promise<boolean>;
  /** Store: true after a successful copy; auto-resets after copiedTimeout. */
  copied: Readable<boolean>;
  /** Store: the last rejection surfaced by the copy attempt, if any. */
  error: Readable<Error | null>;
  /** Manually clear copied/error state. */
  reset: () => void;
}

/**
 * Svelte adapter over ferry's clipboard APIs — plain svelte/store writables,
 * so it works unchanged across Svelte 3, 4, and 5.
 *
 * ```svelte
 * <script>
 *   import { useClipboard } from 'ferry/svelte';
 *   const { copy, copied } = useClipboard();
 * </script>
 * <button on:click={() => copy('hello')}>{$copied ? 'Copied!' : 'Copy'}</button>
 * ```
 */
export function useClipboard({
  copiedTimeout = 2000,
}: UseClipboardOptions = {}): UseClipboardStores {
  const copied = writable(false);
  const error = writable<Error | null>(null);
  let timer: number | undefined;

  const reset = () => {
    copied.set(false);
    error.set(null);
  };

  const copy = async (content: string, options?: CopyOptions): Promise<boolean> => {
    try {
      await copyToClipboard(content, options);
      copied.set(true);
      error.set(null);
      if (copiedTimeout > 0 && typeof window !== 'undefined') {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => copied.set(false), copiedTimeout);
      }
      return true;
    } catch (err) {
      copied.set(false);
      error.set(err as Error);
      return false;
    }
  };

  return { copy, copied, error, reset };
}
