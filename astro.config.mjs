import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://u64.cam',
  integrations: [sitemap({
    filter: (page) => !page.endsWith('/whoop/callback/'),
  })],
  build: {
    inlineStylesheets: 'never',
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark'
    }
  }
});
