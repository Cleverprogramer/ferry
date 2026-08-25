/**
 * Granular control over what lands in each clipboard slot.
 * When omitted, `text` defaults to `content` and `html` defaults to
 * `content` for rich copies (`options === true`).
 */
export interface RichCopyOptions {
  /** Markup written to the text/html slot */
  html?: string;
  /** Plain text written to the text/plain slot */
  text?: string;
}

/** Either the legacy boolean (`true` = rich copy) or per-slot overrides. */
export type CopyOptions = boolean | RichCopyOptions;

/**
 * Detects whether any clipboard strategy is available in the current environment.
 * Safe to call in non-browser (SSR/Node) contexts.
 */
export const isSupported = (): boolean => {
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.writeText === 'function'
  ) {
    return true;
  }
  return typeof document !== 'undefined' && typeof document.execCommand === 'function';
};

/**
 * Copies content to the clipboard.
 * Prefers the async Clipboard API and falls back to a hidden textarea +
 * document.execCommand('copy'). Rejects with an Error when copying fails
 * or the environment offers no clipboard support.
 */
export const copyToClipboard = async (content: string, options: CopyOptions = false): Promise<void> => {
  if (!isSupported()) {
    throw new Error('ferry: no clipboard support detected in this environment');
  }

  const richHtml = options === true;
  const explicit = typeof options === 'object' && options !== null ? options : {};
  const html = explicit.html ?? (richHtml ? content : undefined);
  const text = explicit.text ?? content;

  if (!richHtml && !explicit.html && typeof navigator.clipboard?.writeText === 'function') {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.style.maxHeight = '0';
  textArea.style.height = '0';
  textArea.style.opacity = '0';
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();

  const listener = (e: ClipboardEvent) => {
    e.preventDefault();

    if (e.clipboardData) {
      e.clipboardData.setData('text/html', html as string);
      e.clipboardData.setData('text/plain', text);
    }
  };

  let succeeded = false;
  try {
    document.addEventListener('copy', listener);
    succeeded = document.execCommand('copy');
  } finally {
    document.removeEventListener('copy', listener);
    document.body.removeChild(textArea);
  }

  if (!succeeded) {
    throw new Error('ferry: execCommand("copy") fallback failed');
  }
};

