// Self-contained React hook demo for the playground.
// Bundled by `bun run build:playground` — react + react-dom + ferry/react in one file.
import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { useClipboard } from '../src/use-clipboard';

function Demo() {
  const { copy, copied, error } = useClipboard();

  return h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
    h('button', {
      onClick: () => void copy('copied via useClipboard() 🎣'),
    }, copied ? 'Copied! ✓' : 'Copy via useClipboard()'),
    h('span', {
      style: {
        fontSize: '.8rem',
        color: error ? '#f85149' : '#8b949e',
      },
    },
    error
      ? error.name + ': ' + error.message
      : copied
        ? 'check your clipboard — paste anywhere!'
        : 'state is reactive refs under the hood'),
  );
}

const rootEl = document.getElementById('react-demo-root');
if (rootEl) {
  createRoot(rootEl).render(h(Demo));
}
