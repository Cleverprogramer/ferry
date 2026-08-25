/** Machine-readable reasons a clipboard operation can fail. */
export type FerryErrorCode =
  | 'UNSUPPORTED'
  | 'PERMISSION_DENIED'
  | 'COPY_FAILED'
  | 'INVALID_PAYLOAD'
  | 'FETCH_FAILED'
  | 'ABORTED';

/**
 * Error thrown/rejected by every ferry API.
 * Carries a stable `code` so callers can branch on failure kinds
 * without matching on message strings.
 */
export class FerryError extends Error {
  readonly code: FerryErrorCode;

  constructor(code: FerryErrorCode, message: string) {
    super(message);
    this.name = 'FerryError';
    this.code = code;
  }
}

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
export interface RichCopyOptions {
  /** Markup written to the text/html slot */
  html?: string;
  /** Plain text written to the text/plain slot */
  text?: string;
  /** Abort the operation before or while it runs */
  signal?: AbortSignal;
}

export type CopyOptions = boolean | RichCopyOptions;

/** Options accepted by read-style APIs. */
export interface ReadOptions {
  /** Abort the operation before or while it runs */
  signal?: AbortSignal;
}

const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) {
    throw new FerryError('ABORTED', 'ferry: the operation was aborted');
  }
};

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
  throwIfAborted(typeof options === 'object' && options !== null ? options.signal : undefined);

  if (!isSupported()) {
    throw new FerryError('UNSUPPORTED', 'ferry: no clipboard support detected in this environment');
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
    throw new FerryError('COPY_FAILED', 'ferry: execCommand("copy") fallback failed');
  }
};

/**
 * Reads the current text content of the clipboard.
 * Requires the async Clipboard API and read permission; rejects with a
 * descriptive Error where reading is unsupported or denied.
 */
export const readText = async (options: ReadOptions = {}): Promise<string> => {
  throwIfAborted(options.signal);

  if (
    typeof navigator === 'undefined' ||
    typeof navigator.clipboard?.readText !== 'function'
  ) {
    throw new FerryError(
      'UNSUPPORTED',
      'ferry: reading the clipboard is not supported in this environment',
    );
  }

  try {
    return await navigator.clipboard.readText();
  } catch {
    throw new FerryError(
      'PERMISSION_DENIED',
      'ferry: clipboard read was blocked by the browser or denied by the user',
    );
  }
};

/**
 * Copies an image to the clipboard via ClipboardItem.
 * Accepts an image Blob directly, or a URL string which is fetched and
 * converted to a Blob automatically. Rejects with a descriptive Error
 * where image copying is unsupported, the payload is not an image,
 * or the browser denies the write.
 */
export const copyImage = async (source: Blob | string, options: ReadOptions = {}): Promise<void> => {
  throwIfAborted(options.signal);

  if (
    typeof navigator === 'undefined' ||
    typeof navigator.clipboard?.write !== 'function' ||
    typeof ClipboardItem === 'undefined'
  ) {
    throw new FerryError('UNSUPPORTED', 'ferry: copying images is not supported in this environment');
  }

  let blob: Blob;
  if (typeof source === 'string') {
    const response = await fetch(source, { signal: options.signal });
    if (!response.ok) {
      throw new FerryError('FETCH_FAILED', `ferry: failed to fetch image from "${source}" (HTTP ${response.status})`);
    }
    blob = await response.blob();
  } else {
    blob = source;
  }

  if (!blob.type.startsWith('image/')) {
    throw new FerryError(
      'INVALID_PAYLOAD',
      `ferry: expected an image blob but received type "${blob.type || 'unknown'}"`,
    );
  }

  try {
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
  } catch {
    throw new FerryError(
      'PERMISSION_DENIED',
      'ferry: the clipboard rejected this image payload or permission was denied',
    );
  }
};

/**
 * Overwrites the clipboard with an empty string, effectively wiping it.
 * Requires the async Clipboard API; rejects where unavailable.
 */
export const clear = async (): Promise<void> => {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.clipboard?.writeText !== 'function'
  ) {
    throw new FerryError(
      'UNSUPPORTED',
      'ferry: clearing the clipboard is not supported in this environment',
    );
  }

  try {
    await navigator.clipboard.writeText('');
  } catch {
    throw new FerryError(
      'PERMISSION_DENIED',
      'ferry: the clipboard could not be cleared because the write was denied',
    );
  }
};

/**
 * Serializes a value to JSON and copies it.
 * Pass `pretty = true` for 2-space indented output.
 * Throws INVALID_PAYLOAD for values JSON cannot represent (e.g. BigInt).
 */
export const copyJson = async (value: unknown, pretty = false): Promise<void> => {
  let json: string;
  try {
    json = pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value);
  } catch (err) {
    throw new FerryError('INVALID_PAYLOAD', `ferry: value is not JSON-serializable (${(err as Error).message})`);
  }

  return copyToClipboard(json);
};

/**
 * Copies an Element's markup (outerHTML) as rich HTML content, so pasting
 * into rich editors preserves formatting while plain editors get the tags.
 */
export const copyElement = async (element: Element): Promise<void> => {
  if (
    typeof element !== 'object' ||
    element === null ||
    typeof (element as Element).outerHTML !== 'string'
  ) {
    throw new FerryError(
      'INVALID_PAYLOAD',
      'ferry: copyElement expects a DOM Element',
    );
  }

  return copyToClipboard(element.outerHTML);
};

/**
 * Returns the first image payload found on the clipboard as a Blob.
 * Requires the async Clipboard API with read access; rejects with
 * INVALID_PAYLOAD when no image is present and PERMISSION_DENIED or
 * UNSUPPORTED where reading fails or is unavailable.
 */
export const readImage = async (options: ReadOptions = {}): Promise<Blob> => {
    throwIfAborted(options.signal);

  if (
    typeof navigator === 'undefined' ||
    typeof navigator.clipboard?.read !== 'function' ||
    typeof ClipboardItem === 'undefined'
  ) {
    throw new FerryError(
      'UNSUPPORTED',
      'ferry: reading images from the clipboard is not supported in this environment',
    );
  }

  let items: ClipboardItem[];
  try {
    items = await navigator.clipboard.read();
  } catch {
    throw new FerryError(
      'PERMISSION_DENIED',
      'ferry: clipboard read was blocked by the browser or denied by the user',
    );
  }

  for (const item of items) {
    const imageType = item.types.find((type) => type.startsWith('image/'));
    if (imageType) {
      return item.getType(imageType);
    }
  }

  throw new FerryError('INVALID_PAYLOAD', 'ferry: the clipboard does not contain an image');
};

/**
 * Collects non-plain-text clipboard entries (images, HTML payloads, custom
 * formats) and returns them as File objects, named clipboard-N.ext.
 * Returns an empty array when the clipboard holds only plain text.
 */
export const readFiles = async (options: ReadOptions = {}): Promise<File[]> => {
    throwIfAborted(options.signal);

  if (
    typeof navigator === 'undefined' ||
    typeof navigator.clipboard?.read !== 'function' ||
    typeof ClipboardItem === 'undefined'
  ) {
    throw new FerryError(
      'UNSUPPORTED',
      'ferry: reading files from the clipboard is not supported in this environment',
    );
  }

  let items: ClipboardItem[];
  try {
    items = await navigator.clipboard.read();
  } catch {
    throw new FerryError(
      'PERMISSION_DENIED',
      'ferry: clipboard read was blocked by the browser or denied by the user',
    );
  }

  const files: File[] = [];
  for (const item of items) {
    for (const type of item.types) {
      if (type === 'text/plain') continue;
      const blob = await item.getType(type);
      const ext = type.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'bin';
      files.push(new File([blob], `clipboard-${files.length + 1}.${ext}`, { type }));
    }
  }

  return files;
};

