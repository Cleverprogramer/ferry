import * as ferry from './index';

// CDN entry point: exposes the whole API as a single global for <script> tag usage.
const scope = globalThis as unknown as Record<string, unknown>;
scope.Ferry = ferry;
