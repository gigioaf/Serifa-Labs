// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// IMPORTANT: `site` feeds the canonical URL, Open Graph tags, JSON-LD and the
// sitemap. It must match the production domain and the Sitemap host in
// public/robots.txt.
export default defineConfig({
  site: 'https://serifalabs.com',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  // Zero JS by default: no prefetch, no framework runtime. The only client
  // JavaScript is the GSAP effects island (see src/scripts/*).
  prefetch: false,
});
