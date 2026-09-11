import { get } from 'svelte/store';
import { useClipboard } from '../src/use-clipboard-svelte';

// Svelte demo for the playground: same contract as the React and Vue demos,
// driven by plain DOM + stores (no Svelte compiler in the bundle).
const { copy, copied, error } = useClipboard();

const render = () => {
  const button = document.querySelector<HTMLButtonElement>('#svelte-demo-root button');
  if (!button) return;
  button.textContent = get(copied) ? 'Copied!' : 'Copy via useClipboard()';
  const old = document.querySelector('#svelte-demo-root p');
  const err = get(error);
  if (err && !old) {
    const p = document.createElement('p');
    p.style.color = '#f85149';
    p.textContent = err.message;
    document.querySelector('#svelte-demo-root')?.appendChild(p);
  } else if (!err && old) {
    old.remove();
  }
};

const mount = () => {
  const root = document.querySelector('#svelte-demo-root');
  if (!root) return;
  const button = document.createElement('button');
  button.addEventListener('click', () => {
    void copy('copied via useClipboard() 🧡').then(render);
  });
  root.appendChild(button);
  render();
  copied.subscribe(render);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
