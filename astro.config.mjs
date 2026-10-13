import { defineConfig } from 'astro/config';
import { devApiPlugin } from './dev-api-plugin.mjs';

export default defineConfig({
  site: 'https://bhavnaspace.com',
  output: 'static',
  compressHTML: true,
  build: {
    format: 'directory',
  },
  vite: {
    plugins: [devApiPlugin()],
  },
});
