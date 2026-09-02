import { createApp, h } from 'vue';
import { useClipboard } from '../src/use-clipboard-vue';

// Vue demo for the playground: same contract as the React demo, no JSX,
// render functions so the runtime-only Vue build suffices.
const App = {
  setup() {
    const { copy, copied, error } = useClipboard();
    return () =>
      h('div', null, [
        h(
          'button',
          {
            onClick: () => {
              void copy('copied via useClipboard() 🧩');
            },
          },
          copied.value ? 'Copied!' : 'Copy via useClipboard()',
        ),
        error.value ? h('p', { style: 'color:#f85149' }, error.value.message) : null,
      ]);
  },
};

createApp(App).mount('#vue-demo-root');
