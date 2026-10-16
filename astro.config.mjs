import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ianskim.com',
  devToolbar: { enabled: false },
  prefetch: { prefetchAll: true },
});
