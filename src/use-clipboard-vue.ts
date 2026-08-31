import { ref, type Ref } from 'vue';
import { copyToClipboard, type CopyOptions } from './index';

export interface UseClipboardOptions {
  /** How long `copied` stays true before resetting. 0 disables the reset. */
  copiedTimeout?: number;
}

export interface UseClipboardReturn {
  /** Copy text (or rich HTML via options); resolves true on success. */
  copy: (content: string, options?: CopyOptions) => Promise<boolean>;
  /** Reactive: true after a successful copy; auto-resets after copiedTimeout. */
  copied: Ref<boolean>;
  /** Reactive: the last rejection surfaced by the copy attempt, if any. */
  error: Ref<Error | null>;
  /** Manually clear copied/error state. */
  reset: () => void;
}

/**
 * Vue adapter over ferry's clipboard APIs.
 *
 * ```vue
 * <script setup>
 * import { useClipboard } from 'ferry/vue';
 * const { copy, copied, error } = useClipboard();
 * </script>
 * <template>
 *   <button @click="copy('hello')">{{ copied ? 'Copied!' : 'Copy' }}</button>
 * </template>
 * ```
 */
export function useClipboard({
  copiedTimeout = 2000,
}: UseClipboardOptions = {}): UseClipboardReturn {
  const copied = ref(false);
  const error = ref<Error | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const reset = () => {
    copied.value = false;
    error.value = null;
  };

  const copy = async (content: string, options?: CopyOptions): Promise<boolean> => {
    try {
      await copyToClipboard(content, options);
      copied.value = true;
      error.value = null;
      if (copiedTimeout > 0 && typeof window !== 'undefined') {
        clearTimeout(timer);
        timer = setTimeout(() => (copied.value = false), copiedTimeout);
      }
      return true;
    } catch (err) {
      copied.value = false;
      error.value = err as Error;
      return false;
    }
  };

  return { copy, copied, error, reset };
}
